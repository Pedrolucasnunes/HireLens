import type { LucideIcon } from "lucide-react";

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function ComingSoon({ icon: Icon, title, description }: ComingSoonProps) {
  return (
    <div className="min-h-[calc(100vh-68px)] md:min-h-screen relative flex items-center justify-center px-6">
      {/* Ambient layers */}
      <div className="pointer-events-none absolute inset-0 tl-glow opacity-60" />
      <div className="pointer-events-none absolute inset-0 tl-grid-bg opacity-30" />

      <div className="relative max-w-md w-full text-center">
        {/* Icon with glow */}
        <div className="relative inline-flex mx-auto mb-8">
          <div className="absolute -inset-6 rounded-full bg-amber/10 blur-2xl animate-pulse-amber" />
          <div className="relative w-16 h-16 rounded-sm border border-amber-dim bg-ink-100 flex items-center justify-center">
            <Icon size={26} className="text-amber" />
          </div>
        </div>

        <span className="tl-tag">Em breve</span>

        <h1 className="font-display text-[36px] sm:text-[42px] font-black text-cream leading-[1.05] tracking-[-0.03em] mt-6">
          {title}
        </h1>

        <p className="text-[14px] text-cream-text/70 leading-relaxed mt-4 max-w-sm mx-auto">
          {description}
        </p>

        {/* Scan line */}
        <div className="relative w-32 mx-auto mt-10 h-px bg-border overflow-hidden">
          <div className="absolute inset-y-0 w-full bg-gradient-to-r from-transparent via-amber to-transparent animate-scan-x" />
        </div>

        <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-cream-muted/70 mt-6">
          / Você será avisado quando estiver pronto
        </p>
      </div>
    </div>
  );
}
