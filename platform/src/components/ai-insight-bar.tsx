import { Sparkles } from "lucide-react";

interface AIInsightBarProps {
  candidatesProcessed: number;
  topScore: number | null;
  avgScore: number | null;
}

export function AIInsightBar({
  candidatesProcessed,
  topScore,
  avgScore,
}: AIInsightBarProps) {
  const hasActivity = candidatesProcessed > 0;

  return (
    <div className="relative bg-ink-100 border border-border/60 px-5 py-3.5 flex items-center gap-4 overflow-hidden">
      {/* Scan line decorativa */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber/40 to-transparent" />

      {/* Status dot */}
      <div className="relative shrink-0">
        <div
          className={
            hasActivity
              ? "w-2 h-2 rounded-full bg-signal-green animate-pulse-amber"
              : "w-2 h-2 rounded-full bg-cream-muted/50"
          }
        />
      </div>

      {/* Label */}
      <div className="flex items-center gap-2 shrink-0">
        <Sparkles size={13} className="text-amber" />
        <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-amber">
          {hasActivity ? "IA trabalhando" : "IA pronta"}
        </span>
      </div>

      <div className="h-3 w-px bg-border shrink-0" />

      {/* Metrics */}
      <div className="flex items-center gap-x-5 gap-y-1 flex-wrap text-[11px] font-mono text-cream-text/80">
        <Metric
          label="Currículos processados"
          value={candidatesProcessed.toString().padStart(2, "0")}
        />
        <span className="text-cream-muted/40">•</span>
        <Metric
          label="Top match"
          value={topScore !== null ? `${topScore}/100` : "—"}
          accent={topScore !== null && topScore >= 85}
        />
        <span className="text-cream-muted/40">•</span>
        <Metric
          label="Score médio"
          value={avgScore !== null ? `${avgScore}/100` : "—"}
        />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-cream-muted">{label}:</span>
      <span className={accent ? "text-amber font-medium" : "text-cream"}>
        {value}
      </span>
    </span>
  );
}
