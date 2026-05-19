import Link from "next/link";
import { cn, relativeDate } from "@/lib/utils";

export type ActivityItem = {
  candidateId: string;
  candidateName: string;
  score: number | null;
  jobId: string;
  jobTitle: string;
  createdAt: string;
};

interface ActivityFeedProps {
  items: ActivityItem[];
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <div className="border border-border/60 bg-ink-100/50 p-8 text-center">
        <p className="text-[13px] text-cream-muted">
          Sem análises ainda. Suba currículos em uma vaga para ver a atividade
          aqui.
        </p>
      </div>
    );
  }

  return (
    <ul className="relative space-y-px">
      {items.map((item, i) => (
        <ActivityRow key={item.candidateId} item={item} isLast={i === items.length - 1} />
      ))}
    </ul>
  );
}

function ActivityRow({ item, isLast }: { item: ActivityItem; isLast: boolean }) {
  const score = item.score ?? 0;
  const highMatch = score >= 85;

  return (
    <li className="relative">
      <Link
        href={`/vagas/${item.jobId}`}
        className="group flex items-center gap-4 px-4 py-3.5 bg-ink-100 hover:bg-ink-50 border border-border/60 transition-colors"
      >
        {/* Timeline dot */}
        <div className="relative shrink-0">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              highMatch ? "bg-amber animate-pulse-amber" : "bg-cream-muted/60"
            )}
          />
          {!isLast && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-px h-[24px] bg-border/60" />
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-cream truncate group-hover:text-amber transition-colors">
            <span className="font-medium">{item.candidateName}</span>{" "}
            <span className="text-cream-muted">analisado para</span>{" "}
            <span className="font-medium">{item.jobTitle}</span>
          </div>
          <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-cream-muted/70 mt-0.5">
            {relativeDate(item.createdAt)}
          </div>
        </div>

        {/* Score */}
        <div className="shrink-0 text-right">
          <div
            className={cn(
              "font-display text-[20px] font-black leading-none tracking-tight",
              highMatch ? "text-amber" : "text-cream"
            )}
          >
            {score}
          </div>
          <div className="font-mono text-[9px] tracking-[0.14em] uppercase text-cream-muted mt-1">
            /100
          </div>
        </div>
      </Link>
    </li>
  );
}
