import { cn } from "@/lib/utils";

export function MiniStat({
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
    <div className="bg-ink-100 px-5 py-5">
      <div className="font-mono text-[9px] tracking-[0.14em] uppercase text-cream-muted mb-2">
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className={cn(
            "font-display text-[28px] font-black leading-none tracking-[-0.03em]",
            accent ? "text-amber" : "text-cream"
          )}
        >
          {value}
        </span>
        {suffix && (
          <span className="font-mono text-[11px] text-cream-muted">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
