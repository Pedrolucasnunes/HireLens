import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { JobsList } from "@/components/jobs-list";
import { AIInsightBar } from "@/components/ai-insight-bar";
import type { Job, JobWithStats } from "@/types";

type JobJoined = Job & {
  candidates: { count: number }[];
};

async function getJobsWithStats(userId: string): Promise<JobWithStats[]> {
  const supabase = createClient();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*, candidates(count)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!jobs || jobs.length === 0) return [];

  // Buscar todos os candidatos do usuário em uma query
  const { data: candidates } = await supabase
    .from("candidates")
    .select("job_id, score, created_at")
    .in(
      "job_id",
      jobs.map((j) => j.id)
    );

  const byJob = new Map<string, { score: number | null; created_at: string }[]>();
  (candidates ?? []).forEach((c) => {
    const arr = byJob.get(c.job_id) ?? [];
    arr.push({ score: c.score, created_at: c.created_at });
    byJob.set(c.job_id, arr);
  });

  return (jobs as JobJoined[]).map((job) => {
    const list = byJob.get(job.id) ?? [];
    const scores = list
      .map((c) => c.score)
      .filter((s): s is number => s !== null);
    const avg =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;
    const last =
      list.length > 0
        ? list
            .map((c) => c.created_at)
            .sort()
            .reverse()[0]
        : null;

    return {
      ...job,
      candidate_count: job.candidates?.[0]?.count ?? 0,
      avg_score: avg,
      last_analysis_at: last,
    };
  });
}

async function getInsightStats(userId: string) {
  const supabase = createClient();

  const { data: rows } = await supabase
    .from("candidates")
    .select("score, jobs!inner(user_id)")
    .eq("jobs.user_id", userId)
    .not("score", "is", null);

  const scores = (rows ?? [])
    .map((r) => r.score as number | null)
    .filter((s): s is number => s !== null);

  return {
    candidatesProcessed: rows?.length ?? 0,
    topScore: scores.length > 0 ? Math.max(...scores) : null,
    avgScore:
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null,
  };
}

export default async function VagasPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [jobs, insights] = await Promise.all([
    getJobsWithStats(user.id),
    getInsightStats(user.id),
  ]);

  return (
    <div className="relative">
      {/* Ambient glow + grid */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] tl-glow" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] tl-grid-bg opacity-30" />

      <div className="relative max-w-6xl mx-auto px-6 lg:px-10 pt-12 lg:pt-16 pb-24">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 animate-fade-up">
          <div>
            <span className="tl-tag">Vagas</span>
            <h1 className="font-display text-[40px] sm:text-[52px] font-black text-cream leading-[1.02] tracking-[-0.03em] mt-5">
              Gerencie suas vagas
              <br />
              <span className="italic text-amber">com inteligência.</span>
            </h1>
            <p className="text-cream-text/70 text-[15px] mt-4 max-w-xl leading-relaxed">
              Crie, acompanhe e compare suas vagas em um só lugar. A IA já está
              triando os candidatos.
            </p>
          </div>

          {jobs.length > 0 && (
            <Button variant="amber" size="lg" asChild>
              <Link href="/vagas/new" className="flex items-center gap-2">
                <span className="text-base leading-none">+</span>
                Nova vaga
              </Link>
            </Button>
          )}
        </div>

        {/* AI INSIGHT BAR */}
        <div className="mb-10">
          <AIInsightBar
            candidatesProcessed={insights.candidatesProcessed}
            topScore={insights.topScore}
            avgScore={insights.avgScore}
          />
        </div>

        {/* JOBS LIST (filter + grid + empty state) */}
        <JobsList jobs={jobs} />
      </div>
    </div>
  );
}
