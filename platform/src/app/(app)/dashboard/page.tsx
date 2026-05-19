import Link from "next/link";
import Image from "next/image";
import { Plus, Upload, ArrowUpRight, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ActivityFeed, type ActivityItem } from "@/components/activity-feed";
import { cn } from "@/lib/utils";

type StatsResult = {
  jobsCount: number;
  candidatesCount: number;
  avgScore: number | null;
  topScore: number | null;
  topMatch: { name: string; score: number; jobId: string; jobTitle: string } | null;
};

async function getStats(userId: string): Promise<StatsResult> {
  const supabase = createClient();

  const { count: jobsCount } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const { data: candidates } = await supabase
    .from("candidates")
    .select("id, name, filename, score, job_id, jobs!inner(id, user_id, title)")
    .eq("jobs.user_id", userId)
    .not("score", "is", null)
    .order("score", { ascending: false })
    .limit(1);

  const { count: candidatesCount } = await supabase
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

  const avg =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;
  const top = scores.length > 0 ? Math.max(...scores) : null;

  let topMatch: StatsResult["topMatch"] = null;
  const c = candidates?.[0];
  if (c && c.score !== null) {
    const jobInfo = Array.isArray(c.jobs) ? c.jobs[0] : c.jobs;
    topMatch = {
      name: (c.name as string | null) ?? (c.filename as string).replace(".pdf", ""),
      score: c.score as number,
      jobId: c.job_id as string,
      jobTitle: (jobInfo?.title as string) ?? "vaga",
    };
  }

  return {
    jobsCount: jobsCount ?? 0,
    candidatesCount: candidatesCount ?? 0,
    avgScore: avg,
    topScore: top,
    topMatch,
  };
}

async function getActivity(userId: string): Promise<ActivityItem[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("candidates")
    .select(
      "id, name, filename, score, created_at, job_id, jobs!inner(id, user_id, title)"
    )
    .eq("jobs.user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  return (data ?? []).map((c) => {
    const jobInfo = Array.isArray(c.jobs) ? c.jobs[0] : c.jobs;
    return {
      candidateId: c.id as string,
      candidateName:
        (c.name as string | null) ??
        (c.filename as string).replace(".pdf", ""),
      score: c.score as number | null,
      jobId: c.job_id as string,
      jobTitle: (jobInfo?.title as string) ?? "vaga",
      createdAt: c.created_at as string,
    };
  });
}

async function getResumeJobId(userId: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("jobs")
    .select("id, candidates(count)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  // Primeira vaga sem candidatos
  const candidate = (data ?? []).find(
    (j) => (j.candidates?.[0]?.count ?? 0) === 0
  );
  return (candidate?.id as string | undefined) ?? null;
}

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [stats, activity, resumeJobId] = await Promise.all([
    getStats(user.id),
    getActivity(user.id),
    getResumeJobId(user.id),
  ]);

  const userName = user.email?.split("@")[0] ?? "lá";
  const hasData = stats.candidatesCount > 0;

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] tl-glow" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] tl-grid-bg opacity-30" />

      <div className="relative max-w-6xl mx-auto px-6 lg:px-10 pt-12 lg:pt-16 pb-24">
        {/* HEADER */}
        <div className="animate-fade-up">
          <span className="tl-tag">Visão geral</span>
          <h1 className="font-display text-[40px] sm:text-[52px] font-black text-cream leading-[1.02] tracking-[-0.03em] mt-5">
            Olá, <span className="italic text-amber">{userName}</span>.
          </h1>
          <p className="text-cream-text/70 text-[15px] mt-4 max-w-xl leading-relaxed">
            {hasData
              ? "A IA está triando seus candidatos. Aqui está o que aconteceu desde a última visita."
              : "Tudo pronto. Crie uma vaga para a IA começar a triagem."}
          </p>
        </div>

        {/* TOP MATCH ALERT */}
        {stats.topMatch && stats.topMatch.score >= 85 && (
          <TopMatchAlert match={stats.topMatch} />
        )}

        {/* KPI TILES */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border/60 mt-10 border border-border/60">
          <KPITile
            label="Vagas ativas"
            value={stats.jobsCount.toString().padStart(2, "0")}
            accent={stats.jobsCount > 0}
          />
          <KPITile
            label="Candidatos analisados"
            value={stats.candidatesCount.toString().padStart(2, "0")}
            accent={stats.candidatesCount > 0}
          />
          <KPITile
            label="Score médio"
            value={stats.avgScore !== null ? `${stats.avgScore}` : "—"}
            suffix={stats.avgScore !== null ? "/100" : undefined}
            accent={stats.avgScore !== null && stats.avgScore >= 70}
          />
          <KPITile
            label="Melhor match"
            value={stats.topScore !== null ? `${stats.topScore}` : "—"}
            suffix={stats.topScore !== null ? "/100" : undefined}
            accent={stats.topScore !== null && stats.topScore >= 80}
          />
        </div>

        {/* BODY: activity feed + quick actions */}
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-10 mt-16">
          {/* Activity */}
          <section>
            <div className="flex items-end justify-between mb-5">
              <div>
                <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-cream-muted">
                  / Atividade da IA
                </span>
                <h2 className="font-display text-[22px] font-black text-cream tracking-[-0.02em] mt-1.5">
                  Últimas análises
                </h2>
              </div>
              {activity.length > 0 && (
                <Link
                  href="/vagas"
                  className="text-[12px] font-mono text-cream-muted hover:text-amber transition-colors flex items-center gap-1"
                >
                  Ver todas <ArrowUpRight size={12} />
                </Link>
              )}
            </div>
            <ActivityFeed items={activity} />
          </section>

          {/* Quick actions */}
          <aside>
            <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-cream-muted mb-1.5">
              / Ações rápidas
            </div>
            <h2 className="font-display text-[22px] font-black text-cream tracking-[-0.02em] mb-5">
              Próximos passos
            </h2>
            <div className="space-y-3">
              <QuickAction
                href="/vagas/new"
                icon={Plus}
                title="Nova vaga"
                description="Crie uma vaga e suba currículos."
                primary
              />
              {resumeJobId && (
                <QuickAction
                  href={`/vagas/${resumeJobId}`}
                  icon={Upload}
                  title="Continuar análise"
                  description="Você tem uma vaga sem candidatos."
                />
              )}
              <QuickAction
                href="/vagas"
                icon={ArrowUpRight}
                title="Ver todas as vagas"
                description="Gerencie e compare seus rankings."
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TOP MATCH ALERT
   ───────────────────────────────────────────── */
function TopMatchAlert({
  match,
}: {
  match: NonNullable<StatsResult["topMatch"]>;
}) {
  return (
    <Link
      href={`/vagas/${match.jobId}`}
      className="group relative mt-10 block bg-ink-100 border border-amber-dim/60 p-5 sm:p-6 overflow-hidden hover:border-amber transition-colors"
    >
      {/* Glow */}
      <div className="pointer-events-none absolute -top-12 -left-12 w-48 h-48 rounded-full bg-amber/15 blur-3xl animate-pulse-amber" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber to-transparent" />

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
        {/* Logo + Sparkles */}
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-sm border border-amber-dim bg-ink flex items-center justify-center">
            <Image
              src="/talentlens-mark-512.png"
              alt=""
              width={32}
              height={32}
              aria-hidden
            />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber flex items-center justify-center">
            <Sparkles size={11} className="text-ink" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-amber mb-1">
            Match excepcional encontrado
          </div>
          <h3 className="font-display text-[20px] font-bold text-cream tracking-[-0.01em]">
            {match.name} marcou{" "}
            <span className="text-amber">{match.score}/100</span>
          </h3>
          <p className="text-[13px] text-cream-text/70 mt-1">
            Para a vaga{" "}
            <span className="text-cream font-medium">{match.jobTitle}</span>
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2 font-mono text-[11px] text-cream-muted group-hover:text-amber transition-colors">
          Ver candidato <ArrowUpRight size={14} />
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────
   KPI TILE
   ───────────────────────────────────────────── */
function KPITile({
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
    <div className="bg-ink-100 px-6 py-7 relative hover:bg-ink-50 transition-colors">
      <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-cream-muted mb-3">
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className={cn(
            "font-display text-[40px] font-black leading-none tracking-[-0.03em]",
            accent ? "text-amber" : "text-cream/40"
          )}
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
   QUICK ACTION CARD
   ───────────────────────────────────────────── */
function QuickAction({
  href,
  icon: Icon,
  title,
  description,
  primary = false,
}: {
  href: string;
  icon: typeof Plus;
  title: string;
  description: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-start gap-3 p-4 border transition-all",
        primary
          ? "bg-amber/5 border-amber-dim hover:bg-amber/10 hover:border-amber"
          : "bg-ink-100 border-border/60 hover:bg-ink-50 hover:border-amber-dim/60"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-sm flex items-center justify-center shrink-0 border",
          primary
            ? "bg-amber text-ink border-amber"
            : "bg-ink border-border text-cream-muted group-hover:text-amber group-hover:border-amber-dim"
        )}
      >
        <Icon size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "font-display text-[15px] font-bold tracking-[-0.01em]",
            primary ? "text-amber" : "text-cream group-hover:text-amber"
          )}
        >
          {title}
        </div>
        <div className="text-[12px] text-cream-muted mt-0.5">{description}</div>
      </div>
      <ArrowUpRight
        size={14}
        className="text-cream-muted/60 group-hover:text-amber group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all shrink-0 mt-1"
      />
    </Link>
  );
}
