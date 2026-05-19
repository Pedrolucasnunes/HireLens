import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Job } from "@/types";

async function getJobs(userId: string): Promise<Job[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("jobs")
    .select("*, candidates(count)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((job: Job & { candidates: { count: number }[] }) => ({
    ...job,
    candidate_count: job.candidates?.[0]?.count ?? 0,
  }));
}

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const jobs = await getJobs(user.id);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">TalentLens</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <form action="/api/auth/signout" method="POST">
              <Button variant="outline" size="sm" type="submit">Sair</Button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Vagas</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {jobs.length === 0
                ? "Nenhuma vaga ainda. Crie a primeira."
                : `${jobs.length} vaga${jobs.length > 1 ? "s" : ""} ativa${jobs.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <Button asChild>
            <Link href="/jobs/new">+ Nova vaga</Link>
          </Button>
        </div>

        {jobs.length === 0 ? (
          <div className="border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">Sem vagas cadastradas</p>
            <p className="text-sm mb-4">Crie uma vaga e faça upload dos currículos para começar a análise.</p>
            <Button asChild variant="outline">
              <Link href="/jobs/new">Criar primeira vaga</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{job.title}</CardTitle>
                      <Badge variant="secondary">
                        {job.candidate_count} candidato{job.candidate_count !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {job.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Criada em {new Date(job.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
