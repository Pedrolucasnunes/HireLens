import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CandidateCard } from "@/components/candidate-card";
import { UploadSection } from "./upload-section";
import type { Job, Candidate } from "@/types";

async function getJobWithCandidates(jobId: string, userId: string) {
  const supabase = createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", userId)
    .single();

  if (!job) return null;

  const { data: candidates } = await supabase
    .from("candidates")
    .select("*")
    .eq("job_id", jobId)
    .order("score", { ascending: false });

  return { job: job as Job, candidates: (candidates ?? []) as Candidate[] };
}

export default async function JobPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const result = await getJobWithCandidates(params.id, user.id);
  if (!result) notFound();

  const { job, candidates } = result;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground text-sm">
            ← Dashboard
          </Link>
          <span className="text-sm text-muted-foreground">{user.email}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="text-muted-foreground text-sm mt-2 whitespace-pre-line line-clamp-3">
            {job.description}
          </p>
        </div>

        <div className="grid md:grid-cols-[1fr_300px] gap-8 items-start">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">
                Candidatos{" "}
                <span className="text-muted-foreground font-normal">({candidates.length})</span>
              </h2>
            </div>

            {candidates.length === 0 ? (
              <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                <p className="font-medium mb-1">Sem candidatos ainda</p>
                <p className="text-sm">Faça upload dos currículos em PDF ao lado.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {candidates.map((candidate, i) => (
                  <CandidateCard key={candidate.id} candidate={candidate} rank={i + 1} />
                ))}
              </div>
            )}
          </div>

          <div className="sticky top-6">
            <h2 className="font-semibold mb-3">Upload de currículos</h2>
            <UploadSection jobId={job.id} />
          </div>
        </div>
      </main>
    </div>
  );
}
