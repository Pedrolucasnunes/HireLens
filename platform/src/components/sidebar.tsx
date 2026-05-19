"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutGrid,
  Briefcase,
  LineChart,
  Users,
  Settings,
  Menu,
  X,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Vagas", href: "/vagas", icon: Briefcase },
  { label: "Análises", href: "/analises", icon: LineChart },
  { label: "Candidatos", href: "/candidatos", icon: Users },
  { label: "Configurações", href: "/configuracoes", icon: Settings },
];

interface SidebarProps {
  userEmail: string;
}

export function Sidebar({ userEmail }: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar com hamburger */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/talentlens-mark-512.png"
            alt="TalentLens"
            width={26}
            height={26}
            className="rounded-sm"
          />
          <span className="font-display text-[17px] font-black text-cream tracking-tight">
            Talent<span className="text-amber italic">Lens</span>
          </span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="w-9 h-9 flex items-center justify-center text-cream-text hover:text-cream"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-background/85 backdrop-blur-sm"
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 z-50 h-screen w-[244px] shrink-0",
          "bg-ink-100 border-r border-border/60",
          "flex flex-col",
          "transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Header logo */}
        <div className="px-5 h-[68px] flex items-center justify-between border-b border-border/60">
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 group"
          >
            <Image
              src="/talentlens-mark-512.png"
              alt="TalentLens"
              width={30}
              height={30}
              priority
              className="rounded-sm group-hover:scale-105 transition-transform"
            />
            <span className="font-display text-[19px] font-black text-cream tracking-tight">
              Talent<span className="text-amber italic">Lens</span>
            </span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
            className="md:hidden w-8 h-8 flex items-center justify-center text-cream-muted hover:text-cream"
          >
            <X size={16} />
          </button>
        </div>

        {/* Status IA */}
        <div className="px-5 py-3 border-b border-border/60">
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] uppercase text-cream-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-signal-green animate-pulse-amber" />
            <span>IA online</span>
            <span className="ml-auto text-cream-muted/60">Claude 4.6</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-5 mb-2 font-mono text-[10px] tracking-[0.14em] uppercase text-cream-muted/60">
            / Navegação
          </div>
          <ul className="space-y-0.5 px-2">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </ul>
        </nav>

        {/* User footer */}
        <div className="border-t border-border/60 p-4">
          <div className="text-[12px] text-cream-muted truncate mb-3" title={userEmail}>
            {userEmail}
          </div>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-sm border border-border text-[13px] text-cream-text hover:border-cream-dim hover:text-cream transition-colors"
            >
              <LogOut size={14} />
              Sair
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

function NavLink({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "relative flex items-center gap-3 px-3 py-2.5 rounded-sm text-[14px] transition-all",
          isActive
            ? "bg-amber/5 text-cream"
            : "text-cream-muted hover:bg-ink-50 hover:text-cream"
        )}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2px] bg-amber" />
        )}
        <Icon
          size={16}
          className={cn(
            "transition-colors",
            isActive ? "text-amber" : "text-cream-muted/80 group-hover:text-cream"
          )}
        />
        <span className={cn("font-medium", isActive && "tracking-tight")}>
          {item.label}
        </span>
      </Link>
    </li>
  );
}
