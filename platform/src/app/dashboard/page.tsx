import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import type { Job } from "@/types";

type JobWithCount = Job & { candidates: { count: number }[] };

async function getJobs(userId: string): Promise<Job[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("jobs")
    .select("*, candidates(count)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((job: JobWithCount) => ({
    ...job,
    candidate_count: job.candidates?.[0]?.count ?? 0,
  }));
}

async function getStats(userId: string) {
  const supabase = createClient();

  const { count: totalCandidates } = await supabase
    .from("candidates")
    .select("id, jobs!inner(user_id)", { count: "exact", head: true })
    .eq("jobs.user_id", userId);

  const { data: scoreRows } = await supabase
    .from("candidates")
    .select("score, jobs!inner(user_id)")
    .eq("jobs.user_id", userId)
    .not("score", "is", null);

  const scores = (scoreRows ?? [])
    .map((r) => r.score as number | null)
    .filter((s): s is number => s !== null);

  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;

  const topScore = scores.length > 0 ? Math.max(...scores) : null;

  return {
    totalCandidates: totalCandidates ?? 0,
    avgScore,
    topScore,
  };
}

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [jobs, stats] = await Promise.all([
    getJobs(user.id),
    getStats(user.id),
  ]);

  const hasJobs = jobs.length > 0;

  return (
    <div className="min-h-screen bg-background relative">
      {/* Glow ambiente + grid sutil no topo */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] tl-glow" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] tl-grid-bg opacity-40" />

      {/* ───── HEADER ───── */}
      <header className="relative z-10 border-b border-border/60 backdrop-blur-md bg-background/60">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <Image
              src="/talentlens-mark-512.png"
              alt="TalentLens"
              width={32}
              height={32}
              priority
              className="rounded-sm group-hover:scale-105 transition-transform"
            />
            <span className="font-display text-[20px] font-black text-cream tracking-tight">
              Talent<span className="text-amber italic">Lens</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-[12px] text-cream-muted font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-signal-green animate-pulse-amber" />
              <span>IA online</span>
            </div>
            <div className="hidden md:block text-[13px] text-cream-muted">
              {user.email}
            </div>
            <form action="/api/auth/signout" method="POST">
              <Button variant="ghost" size="sm" type="submit">
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* ───── MAIN ───── */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-24">
        {/* Eyebrow + Display title */}
        <div className="animate-fade-up">
          <span className="tl-tag">Centro de comando</span>
          <h1 className="font-display text-[44px] sm:text-[56px] font-black text-cream leading-[1.02] tracking-[-0.03em] mt-6">
            Suas vagas, ranqueadas
            <br />
            <span className="italic text-amber">por inteligência.</span>
          </h1>
          <p className="text-cream-text/70 text-[15px] mt-5 max-w-xl leading-relaxed">
            Crie vagas, faça upload dos currículos e deixe a IA encontrar os
            melhores candidatos em segundos.
          </p>
        </div>

        {/* ───── LIVE STATS ───── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border/60 mt-12 border border-border/60">
          <StatTile
            label="Vagas ativas"
            value={jobs.length.toString().padStart(2, "0")}
            accent={hasJobs}
          />
          <StatTile
            label="Candidatos analisados"
            value={stats.totalCandidates.toString().padStart(2, "0")}
            accent={stats.totalCandidates > 0}
          />
          <StatTile
            label="Score médio"
            value={stats.avgScore !== null ? `${stats.avgScore}` : "—"}
            suffix={stats.avgScore !== null ? "/100" : undefined}
            accent={stats.avgScore !== null && stats.avgScore >= 70}
          />
          <StatTile
            label="Melhor match"
            value={stats.topScore !== null ? `${stats.topScore}` : "—"}
            suffix={stats.topScore !== null ? "/100" : undefined}
            accent={stats.topScore !== null && stats.topScore >= 80}
          />
        </div>

        {/* ───── JOBS SECTION ───── */}
        <section className="mt-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-cream-muted">
                / Vagas
              </span>
              <h2 className="font-display text-[28px] font-black text-cream tracking-[-0.02em] mt-2">
                {hasJobs ? "Em andamento" : "Pronto para começar"}
              </h2>
            </div>

            {hasJobs && (
              <Button variant="amber" size="lg" asChild>
                <Link href="/jobs/new" className="flex items-center gap-2">
                  <span className="text-base leading-none">+</span>
                  Nova vaga
                </Link>
              </Button>
            )}
          </div>

          {hasJobs ? (
            <div className="grid gap-px bg-border/60 border border-border/60">
              {jobs.map((job, idx) => (
                <JobRow key={job.id} job={job} index={idx} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </section>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STAT TILE
   ───────────────────────────────────────────── */
function StatTile({
  label,
  value,
  suffix,
  accent = false,
}: {
  label: string;
  value: string;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-ink-100 px-6 py-7 relative group hover:bg-ink-50 transition-colors">
      <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-cream-muted mb-3">
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className={`font-display text-[40px] font-black leading-none tracking-[-0.03em] ${
            accent ? "text-amber" : "text-cream/40"
          }`}
        >
          {value}
        </span>
        {suffix && (
          <span className="font-mono text-[12px] text-cream-muted">
            {suffix}
          </span>
        )}
      </div>
      {accent && (
        <div className="absolute top-3 right-3 w-1 h-1 rounded-full bg-amber animate-pulse-amber" />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   JOB ROW
   ───────────────────────────────────────────── */
function JobRow({ job, index }: { job: Job; index: number }) {
  const count = job.candidate_count ?? 0;
  const hasCands = count > 0;

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group bg-ink-100 hover:bg-ink-50 transition-all relative block"
    >
      <div className="px-6 py-6 flex items-center gap-6">
        <div className="font-mono text-[11px] text-cream-muted w-8">
          {(index + 1).toString().padStart(2, "0")}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-display text-[18px] font-bold text-cream tracking-[-0.01em] truncate group-hover:text-amber transition-colors">
            {job.title}
          </h3>
          <p className="text-[13px] text-cream-muted mt-1 line-clamp-1">
            {job.description}
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-3 shrink-0">
          {hasCands ? (
            <>
              <div className="font-mono text-[11px] tracking-wider text-cream-muted">
                {count.toString().padStart(2, "0")} {count === 1 ? "candidato" : "candidatos"}
              </div>
              <div className="w-1 h-1 rounded-full bg-amber" />
              <div className="font-mono text-[11px] tracking-wider text-amber">
                Analisado
              </div>
            </>
          ) : (
            <div className="font-mono text-[11px] tracking-wider text-cream-muted/60 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-cream-muted/40" />
              Aguardando currículos
            </div>
          )}
        </div>

        <div className="hidden lg:block font-mono text-[11px] text-cream-muted/60 shrink-0">
          {new Date(job.created_at).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
          })}
        </div>

        <div className="text-cream-muted group-hover:text-amber group-hover:translate-x-1 transition-all">
          →
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

/* ─────────────────────────────────────────────
   EMPTY STATE — produto vivo, mesmo sem dados
   ───────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="relative border border-border/60 bg-ink-100 overflow-hidden">
      <div className="tl-scan" />

      <div className="grid md:grid-cols-[1.3fr_1fr]">
        <div className="p-10 md:p-12 relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2.5 h-2.5 rounded-full bg-amber animate-pulse-amber" />
            <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-amber">
              IA pronta — aguardando comando
            </span>
          </div>

          <h3 className="font-display text-[32px] font-black text-cream leading-[1.05] tracking-[-0.02em] mb-4">
            Crie sua primeira vaga
            <br />
            <span className="italic text-amber">e veja a mágica.</span>
          </h3>

          <p className="text-[14px] text-cream-text/70 leading-relaxed mb-8 max-w-md">
            Em menos de 60 segundos você terá um ranking inteligente dos
            candidatos com pontuações, pontos fortes e alertas — gerado pela
            Claude.
          </p>

          <Button variant="amber" size="lg" asChild>
            <Link href="/jobs/new" className="flex items-center gap-2">
              <span className="text-base leading-none">+</span>
              Criar primeira vaga
            </Link>
          </Button>
        </div>

        <div className="border-t md:border-t-0 md:border-l border-border/60 bg-ink p-10 md:p-12 relative overflow-hidden">
          {/* Logo grande como marca d'água, com glow pulsante */}
          <div className="pointer-events-none absolute -top-6 -right-6 opacity-[0.07] group-hover:opacity-10 transition-opacity">
            <Image
              src="/talentlens-mark-512.png"
              alt=""
              width={180}
              height={180}
              aria-hidden
            />
          </div>
          <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-amber/10 blur-3xl animate-pulse-amber" />

          <div className="relative font-mono text-[10px] tracking-[0.14em] uppercase text-cream-muted mb-6">
            Como funciona
          </div>

          <ol className="relative space-y-5">
            <FlowStep
              num="01"
              title="Descreva a vaga"
              text="Cargo, requisitos, descrição."
            />
            <FlowStep
              num="02"
              title="Upload dos PDFs"
              text="Solte até dezenas de currículos."
            />
            <FlowStep
              num="03"
              title="Ranking instantâneo"
              text="Score, pontos fortes e alertas."
              highlight
            />
          </ol>

          <div className="mt-8 pt-6 border-t border-border/60">
            <div className="flex items-center gap-2 text-[11px] font-mono text-cream-muted/70">
              <span className="w-1 h-1 rounded-full bg-signal-green" />
              Claude Sonnet 4.6 conectada
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlowStep({
  num,
  title,
  text,
  highlight = false,
}: {
  num: string;
  title: string;
  text: string;
  highlight?: boolean;
}) {
  return (
    <li className="flex gap-4">
      <div
        className={`font-mono text-[11px] pt-1 ${
          highlight ? "text-amber" : "text-cream-muted"
        }`}
      >
        {num}
      </div>
      <div>
        <div
          className={`font-display text-[15px] font-bold ${
            highlight ? "text-amber" : "text-cream"
          }`}
        >
          {title}
        </div>
        <div className="text-[12px] text-cream-muted mt-0.5">{text}</div>
      </div>
    </li>
  );
}
