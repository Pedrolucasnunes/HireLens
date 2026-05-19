import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeResume } from "@/lib/anthropic";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const jobId = formData.get("job_id") as string | null;

  if (!file || !jobId) {
    return NextResponse.json({ error: "Arquivo e job_id são obrigatórios." }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Apenas PDFs são suportados." }, { status: 400 });
  }

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .single();

  if (!job) return NextResponse.json({ error: "Vaga não encontrada." }, { status: 404 });

  const buffer = Buffer.from(await file.arrayBuffer());
  let resumeText: string;

  try {
    const parsed = await pdfParse(buffer);
    resumeText = parsed.text;
  } catch {
    return NextResponse.json({ error: "Não foi possível ler o PDF." }, { status: 422 });
  }

  if (!resumeText.trim()) {
    return NextResponse.json({ error: "PDF sem texto extraível." }, { status: 422 });
  }

  let analysis;
  try {
    analysis = await analyzeResume(job.title, job.description, resumeText);
  } catch {
    return NextResponse.json({ error: "Erro na análise com IA." }, { status: 500 });
  }

  const { score, ...rest } = analysis;

  const { data: candidate, error } = await supabase
    .from("candidates")
    .insert({
      job_id: jobId,
      filename: file.name,
      resume_text: resumeText.slice(0, 10000),
      score,
      analysis: rest,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(candidate, { status: 201 });
}
