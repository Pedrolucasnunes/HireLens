import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Candidate } from "@/types";

const RECOMMENDATION_LABEL = {
  hire: { label: "Contratar", variant: "success" as const },
  maybe: { label: "Talvez", variant: "warning" as const },
  pass: { label: "Não contratar", variant: "destructive" as const },
};

interface CandidateCardProps {
  candidate: Candidate;
  rank: number;
  /** Título da vaga — exibido apenas em listas globais, fora do contexto de uma vaga */
  jobTitle?: string;
}

export function CandidateCard({ candidate, rank, jobTitle }: CandidateCardProps) {
  const analysis = candidate.analysis;
  const score = candidate.score ?? 0;
  const rec = analysis?.recommendation ? RECOMMENDATION_LABEL[analysis.recommendation] : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <span className="text-2xl font-bold text-muted-foreground/40 tabular-nums w-8 shrink-0">
            {String(rank).padStart(2, "0")}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold truncate">
                {candidate.name ?? candidate.filename.replace(".pdf", "")}
              </p>
              {rec && <Badge variant={rec.variant}>{rec.label}</Badge>}
              {jobTitle && (
                <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[240px]">
                  / {jobTitle}
                </span>
              )}
            </div>
            {analysis?.summary && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {analysis.summary}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <span className="text-2xl font-bold">{score}</span>
            <span className="text-muted-foreground text-sm">/100</span>
          </div>
        </div>
        <div className="ml-12">
          <Progress value={score} className="h-1.5" />
        </div>
      </CardHeader>

      {analysis && (
        <CardContent className="ml-12 space-y-3">
          {analysis.strengths?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Pontos fortes
              </p>
              <ul className="space-y-0.5">
                {analysis.strengths.map((s, i) => (
                  <li key={i} className="text-sm flex items-start gap-1.5">
                    <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.concerns?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Pontos de atenção
              </p>
              <ul className="space-y-0.5">
                {analysis.concerns.map((c, i) => (
                  <li key={i} className="text-sm flex items-start gap-1.5">
                    <span className="text-amber-500 shrink-0 mt-0.5">!</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
