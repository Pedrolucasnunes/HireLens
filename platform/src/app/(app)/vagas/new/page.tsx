"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NewJobPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Erro ao criar vaga.");
      setLoading(false);
      return;
    }

    router.push(`/vagas/${data.id}`);
  }

  return (
    <div className="relative min-h-full">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[360px] tl-glow" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[360px] tl-grid-bg opacity-30" />

      <div className="relative max-w-2xl mx-auto px-6 lg:px-10 pt-10 lg:pt-14 pb-24">
        {/* Back */}
        <Link
          href="/vagas"
          className="inline-flex items-center gap-1.5 text-[12px] font-mono text-cream-muted hover:text-amber transition-colors mb-8"
        >
          <ArrowLeft size={13} />
          Voltar para Vagas
        </Link>

        {/* Header */}
        <div className="animate-fade-up mb-10">
          <span className="tl-tag">Nova vaga</span>
          <h1 className="font-display text-[36px] sm:text-[44px] font-black text-cream leading-[1.05] tracking-[-0.03em] mt-5">
            Descreva a vaga
            <br />
            <span className="italic text-amber">e deixe a IA cuidar.</span>
          </h1>
          <p className="text-cream-text/70 text-[14px] mt-4 max-w-lg leading-relaxed">
            Quanto mais detalhada a descrição, mais precisa a triagem dos
            candidatos.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="relative bg-ink-100 border border-border/60 p-7 sm:p-9 space-y-6"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber/40 to-transparent" />

          {/* Title */}
          <div className="space-y-2">
            <label
              htmlFor="title"
              className="block font-mono text-[10px] tracking-[0.14em] uppercase text-cream-muted"
            >
              Título da vaga
            </label>
            <input
              id="title"
              type="text"
              placeholder="Ex: Designer de Produto Sênior"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-ink border border-border text-cream text-[15px] px-4 py-3 rounded-sm placeholder:text-cream-muted/60 focus:outline-none focus:border-amber-dim transition-colors"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label
              htmlFor="description"
              className="block font-mono text-[10px] tracking-[0.14em] uppercase text-cream-muted"
            >
              Descrição e requisitos
            </label>
            <textarea
              id="description"
              placeholder="Responsabilidades, skills técnicas, soft skills, senioridade, localização, formato (remoto/híbrido/presencial)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={10}
              className="w-full bg-ink border border-border text-cream text-[14px] px-4 py-3 rounded-sm placeholder:text-cream-muted/60 focus:outline-none focus:border-amber-dim transition-colors resize-y leading-relaxed"
            />
            <p className="flex items-center gap-1.5 text-[11px] text-cream-muted/70">
              <Sparkles size={11} className="text-amber" />
              Dica: a IA considera contexto sutil — mencione cultura, stack e
              tipo de problema.
            </p>
          </div>

          {error && (
            <div className="border border-destructive/50 bg-destructive/10 text-destructive text-[13px] px-3 py-2.5 rounded-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
            <Button variant="outline" asChild type="button">
              <Link href="/vagas">Cancelar</Link>
            </Button>
            <Button
              variant="amber"
              size="lg"
              type="submit"
              disabled={loading}
              className={cn(loading && "opacity-70 pointer-events-none")}
            >
              {loading ? "Criando..." : "Criar vaga"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
