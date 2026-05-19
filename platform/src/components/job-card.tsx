import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn, relativeDate } from "@/lib/utils";
import type { JobWithStats } from "@/types";

interface JobCardProps {
  job: JobWithStats;
}

export function JobCard({ job }: JobCardProps) {
  const hasCandidates = job.candidate_count > 0;
  const score = job.avg_score;

  return (
    <Link
      href={`/vagas/${job.id}`}
      className="group relative block bg-ink-100 border border-border/60 p-6 hover:bg-ink-50 hover:border-amber-dim/60 transition-all"
    >
      {/* Top: status + arrow */}
      <div className="flex items-start justify-between mb-5">
        <StatusBadge analyzed={hasCandidates} />
        <ArrowUpRight
          size={16}
          className="text-cream-muted/60 group-hover:text-amber group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all"
        />
      </div>

      {/* Title */}
      <h3 className="font-display text-[20px] font-bold text-cream tracking-[-0.02em] line-clamp-2 leading-tight group-hover:text-amber transition-colors">
        {job.title}
      </h3>

      {/* Description */}
      <p className="text-[13px] text-cream-text/60 mt-2 line-clamp-2 leading-relaxed min-h-[2.6em]">
        {job.description}
      </p>

      {/* Stats row */}
      <div className="mt-5 pt-5 border-t border-border/40 grid grid-cols-2 gap-4">
        <Stat
          label="Candidatos"
          value={job.candidate_count.toString().padStart(2, "0")}
          accent={hasCandidates}
        />
        <Stat
          label="Score médio"
          value={score !== null ? `${score}` : "—"}
          suffix={score !== null ? "/100" : undefined}
          accent={score !== null && score >= 70}
        />
      </div>

      {/* Progress bar (só se tiver score) */}
      {score !== null && (
        <div className="mt-4 h-1 bg-border/60 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-dim to-amber animate-bar-grow"
            style={
              {
                "--w": `${score}%`,
                width: `${score}%`,
              } as React.CSSProperties
            }
          />
        </div>
      )}

      {/* Footer date */}
      <div className="mt-5 font-mono text-[10px] tracking-[0.1em] uppercase text-cream-muted/70">
        {job.last_analysis_at ? (
          <>Última análise · {relativeDate(job.last_analysis_at)}</>
        ) : (
          <>Criada · {relativeDate(job.created_at)}</>
        )}
      </div>

      {/* Hover scan line */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

function StatusBadge({ analyzed }: { analyzed: boolean }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] uppercase",
        analyzed ? "text-amber" : "text-cream-muted/70"
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          analyzed
            ? "bg-amber animate-pulse-amber"
            : "bg-cream-muted/40"
        )}
      />
      {analyzed ? "Analisado" : "Aguardando upload"}
    </div>
  );
}

function Stat({
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
    <div>
      <div className="font-mono text-[9px] tracking-[0.14em] uppercase text-cream-muted mb-1.5">
        {label}
      </div>
      <div className="flex items-baseline gap-0.5">
        <span
          className={cn(
            "font-display text-[24px] font-black leading-none tracking-[-0.02em]",
            accent ? "text-cream" : "text-cream/40"
          )}
        >
          {value}
        </span>
        {suffix && (
          <span className="font-mono text-[10px] text-cream-muted">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
