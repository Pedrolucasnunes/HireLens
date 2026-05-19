"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/job-card";
import { cn } from "@/lib/utils";
import type { JobWithStats } from "@/types";

type SortKey = "recent" | "candidates" | "score";
type StatusKey = "all" | "analyzed" | "waiting";

interface JobsListProps {
  jobs: JobWithStats[];
}

export function JobsList({ jobs }: JobsListProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [status, setStatus] = useState<StatusKey>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = jobs;

    if (q) {
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q)
      );
    }

    if (status === "analyzed") {
      result = result.filter((j) => j.candidate_count > 0);
    } else if (status === "waiting") {
      result = result.filter((j) => j.candidate_count === 0);
    }

    const sorted = [...result];
    if (sort === "recent") {
      sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sort === "candidates") {
      sorted.sort((a, b) => b.candidate_count - a.candidate_count);
    } else if (sort === "score") {
      sorted.sort((a, b) => (b.avg_score ?? -1) - (a.avg_score ?? -1));
    }

    return sorted;
  }, [jobs, query, sort, status]);

  if (jobs.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-cream-muted"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar vaga por título ou descrição..."
            className="w-full bg-ink-100 border border-border text-cream text-[14px] pl-9 pr-3 py-2.5 rounded-sm placeholder:text-cream-muted/60 focus:outline-none focus:border-amber-dim transition-colors"
          />
        </div>

        {/* Sort */}
        <Select<SortKey>
          value={sort}
          onChange={setSort}
          options={[
            { value: "recent", label: "Recentes" },
            { value: "candidates", label: "Mais candidatos" },
            { value: "score", label: "Maior score" },
          ]}
        />

        {/* Status */}
        <Select<StatusKey>
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "Todos" },
            { value: "analyzed", label: "Analisadas" },
            { value: "waiting", label: "Aguardando" },
          ]}
        />
      </div>

      {/* Results count */}
      <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-cream-muted mb-4">
        {filtered.length === jobs.length
          ? `${jobs.length.toString().padStart(2, "0")} ${jobs.length === 1 ? "vaga" : "vagas"}`
          : `${filtered.length.toString().padStart(2, "0")} de ${jobs.length} ${jobs.length === 1 ? "vaga" : "vagas"}`}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <NoResults />
      )}
    </>
  );
}

/* ─────────────────────────────────────────────
   SELECT
   ───────────────────────────────────────────── */
function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="relative shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={cn(
          "appearance-none bg-ink-100 border border-border text-cream text-[13px]",
          "pl-3 pr-9 py-2.5 rounded-sm cursor-pointer min-w-[160px]",
          "focus:outline-none focus:border-amber-dim transition-colors"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-ink-100 text-cream">
            {o.label}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-cream-muted"
        width="10"
        height="6"
        viewBox="0 0 10 6"
        fill="none"
      >
        <path
          d="M1 1L5 5L9 1"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────
   EMPTY STATE — primeira vaga
   ───────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="relative border border-border/60 bg-ink-100 overflow-hidden">
      <div className="tl-scan" />

      <div className="grid md:grid-cols-[1.3fr_1fr]">
        <div className="p-10 md:p-14 relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2.5 h-2.5 rounded-full bg-amber animate-pulse-amber" />
            <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-amber">
              IA pronta — aguardando primeira vaga
            </span>
          </div>

          <h3 className="font-display text-[34px] font-black text-cream leading-[1.05] tracking-[-0.02em] mb-4">
            Sua primeira vaga
            <br />
            <span className="italic text-amber">em 60 segundos.</span>
          </h3>

          <p className="text-[14px] text-cream-text/70 leading-relaxed mb-8 max-w-md">
            Descreva a vaga, solte os currículos em PDF e a IA gera o ranking
            com score, pontos fortes e alertas para cada candidato.
          </p>

          <Button variant="amber" size="lg" asChild>
            <Link href="/vagas/new" className="flex items-center gap-2">
              <span className="text-base leading-none">+</span>
              Criar primeira vaga
            </Link>
          </Button>
        </div>

        <div className="border-t md:border-t-0 md:border-l border-border/60 bg-ink p-10 md:p-12 relative overflow-hidden">
          <div className="pointer-events-none absolute -top-6 -right-6 opacity-[0.07]">
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
            <FlowStep num="01" title="Descreva a vaga" text="Cargo, requisitos e descrição." />
            <FlowStep num="02" title="Upload dos PDFs" text="Solte dezenas de currículos." />
            <FlowStep num="03" title="Ranking instantâneo" text="Score + pontos fortes + alertas." highlight />
          </ol>

          <div className="relative mt-8 pt-6 border-t border-border/60">
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
        className={cn(
          "font-mono text-[11px] pt-1",
          highlight ? "text-amber" : "text-cream-muted"
        )}
      >
        {num}
      </div>
      <div>
        <div
          className={cn(
            "font-display text-[15px] font-bold",
            highlight ? "text-amber" : "text-cream"
          )}
        >
          {title}
        </div>
        <div className="text-[12px] text-cream-muted mt-0.5">{text}</div>
      </div>
    </li>
  );
}

/* ─────────────────────────────────────────────
   NO RESULTS (filtro vazio)
   ───────────────────────────────────────────── */
function NoResults() {
  return (
    <div className="border border-dashed border-border/60 bg-ink-100/50 p-12 text-center">
      <p className="font-display text-[18px] font-bold text-cream mb-2">
        Nenhuma vaga encontrada
      </p>
      <p className="text-[13px] text-cream-muted">
        Tente ajustar os filtros ou termo de busca.
      </p>
    </div>
  );
}
