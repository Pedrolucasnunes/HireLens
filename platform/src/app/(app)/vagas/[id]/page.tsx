import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CandidateCard } from "@/components/candidate-card";
import { MiniStat } from "@/components/mini-stat";
import { UploadSection } from "./upload-section";
import { relativeDate } from "@/lib/utils";
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
  if (!user) return null;

  const result = await getJobWithCandidates(params.id, user.id);
  if (!result) notFound();

  const { job, candidates } = result;
  const scores = candidates
    .map((c) => c.score)
    .filter((s): s is number => s !== null);
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;
  const topScore = scores.length > 0 ? Math.max(...scores) : null;

  return (
    <div className="relative min-h-full">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] tl-glow" />

      <div className="relative max-w-5xl mx-auto px-6 lg:px-10 pt-10 lg:pt-12 pb-24">
        {/* Back */}
        <Link
          href="/vagas"
          className="inline-flex items-center gap-1.5 text-[12px] font-mono text-cream-muted hover:text-amber transition-colors mb-8"
        >
          <ArrowLeft size={13} />
          Voltar para Vagas
        </Link>

        {/* Header */}
        <div className="animate-fade-up mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-cream-muted">
              Vaga
            </span>
            <span className="w-1 h-1 rounded-full bg-cream-muted" />
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-cream-muted">
              Criada {relativeDate(job.created_at)}
            </span>
          </div>
          <h1 className="font-display text-[36px] sm:text-[44px] font-black text-cream leading-[1.05] tracking-[-0.02em]">
            {job.title}
          </h1>
          <p className="text-cream-text/70 text-[14px] mt-4 leading-relaxed whitespace-pre-line max-w-3xl">
            {job.description}
          </p>
        </div>

        {/* Mini stats */}
        {candidates.length > 0 && (
          <div className="grid grid-cols-3 gap-px bg-border/60 mb-10 border border-border/60">
            <MiniStat label="Candidatos" value={candidates.length.toString().padStart(2, "0")} />
            <MiniStat
              label="Score médio"
              value={avgScore !== null ? `${avgScore}` : "—"}
              suffix={avgScore !== null ? "/100" : undefined}
              accent={avgScore !== null && avgScore >= 70}
            />
            <MiniStat
              label="Top match"
              value={topScore !== null ? `${topScore}` : "—"}
              suffix={topScore !== null ? "/100" : undefined}
              accent={topScore !== null && topScore >= 80}
            />
          </div>
        )}

        {/* Body */}
        <div className="grid md:grid-cols-[1fr_320px] gap-8 items-start">
          {/* Candidates */}
          <div>
            <div className="flex items-baseline justify-between mb-5">
              <div>
                <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-cream-muted">
                  / Ranking
                </span>
                <h2 className="font-display text-[22px] font-black text-cream tracking-[-0.02em] mt-1.5">
                  Candidatos analisados
                </h2>
              </div>
              {candidates.length > 0 && (
                <span className="font-mono text-[11px] text-cream-muted">
                  {candidates.length.toString().padStart(2, "0")}{" "}
                  {candidates.length === 1 ? "candidato" : "candidatos"}
                </span>
              )}
            </div>

            {candidates.length === 0 ? (
              <EmptyCandidates />
            ) : (
              <div className="space-y-3">
                {candidates.map((candidate, i) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    rank={i + 1}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Upload */}
          <aside className="md:sticky md:top-6">
            <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-cream-muted mb-1.5">
              / Upload
            </div>
            <h2 className="font-display text-[18px] font-black text-cream tracking-[-0.01em] mb-4">
              Currículos em PDF
            </h2>
            <UploadSection jobId={job.id} />
          </aside>
        </div>
      </div>
    </div>
  );
}

function EmptyCandidates() {
  return (
    <div className="relative border border-dashed border-border bg-ink-100/40 p-10 text-center overflow-hidden">
      <div className="tl-scan" />
      <div className="relative inline-flex mb-4">
        <div className="w-12 h-12 rounded-sm border border-border bg-ink flex items-center justify-center">
          <FileText size={20} className="text-cream-muted" />
        </div>
      </div>
      <p className="font-display text-[18px] font-bold text-cream mb-1">
        Sem candidatos ainda
      </p>
      <p className="text-[13px] text-cream-muted">
        Solte currículos em PDF na área ao lado para iniciar a análise.
      </p>
    </div>
  );
}
