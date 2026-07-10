import Link from "next/link";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CandidateCard } from "@/components/candidate-card";
import { MiniStat } from "@/components/mini-stat";
import type { Candidate } from "@/types";

type CandidateWithJob = Candidate & {
  jobs: { id: string; title: string; user_id: string };
};

async function getAllCandidates(userId: string): Promise<CandidateWithJob[]> {
  const supabase = createClient();

  const { data } = await supabase
    .from("candidates")
    .select("*, jobs!inner(id, title, user_id)")
    .eq("jobs.user_id", userId)
    .order("score", { ascending: false, nullsFirst: false });

  return (data ?? []) as CandidateWithJob[];
}

export default async function CandidatosPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const candidates = await getAllCandidates(user.id);

  const scores = candidates
    .map((c) => c.score)
    .filter((s): s is number => s !== null);
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;
  const topScore = scores.length > 0 ? Math.max(...scores) : null;

  return (
    <div className="relative">
      {/* Ambient glow + grid */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] tl-glow" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] tl-grid-bg opacity-30" />

      <div className="relative max-w-5xl mx-auto px-6 lg:px-10 pt-12 lg:pt-16 pb-24">
        {/* HEADER */}
        <div className="animate-fade-up mb-10">
          <span className="tl-tag">Candidatos</span>
          <h1 className="font-display text-[40px] sm:text-[52px] font-black text-cream leading-[1.02] tracking-[-0.03em] mt-5">
            Todos os candidatos,
            <br />
            <span className="italic text-amber">ranqueados pela IA.</span>
          </h1>
          <p className="text-cream-text/70 text-[15px] mt-4 max-w-xl leading-relaxed">
            A visão agregada de todas as suas vagas — os melhores matches
            primeiro, independente de onde chegaram.
          </p>
        </div>

        {/* Mini stats */}
        {candidates.length > 0 && (
          <div className="grid grid-cols-3 gap-px bg-border/60 mb-10 border border-border/60">
            <MiniStat
              label="Candidatos"
              value={candidates.length.toString().padStart(2, "0")}
            />
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

        {/* Ranking */}
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-cream-muted">
              / Ranking global
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
                jobTitle={candidate.jobs.title}
              />
            ))}
          </div>
        )}
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
          <Users size={20} className="text-cream-muted" />
        </div>
      </div>
      <p className="font-display text-[18px] font-bold text-cream mb-1">
        Nenhum candidato analisado ainda
      </p>
      <p className="text-[13px] text-cream-muted">
        Envie currículos em PDF em alguma vaga para vê-los ranqueados aqui.
      </p>
      <Link
        href="/vagas"
        className="inline-block font-mono text-[12px] text-amber hover:text-amber/80 transition-colors mt-4"
      >
        Ir para Vagas →
      </Link>
    </div>
  );
}
