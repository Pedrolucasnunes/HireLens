-- Memória vetorial de análises: cada análise concluída é armazenada com o
-- embedding do currículo, permitindo recuperar análises similares como
-- contexto de calibração para pareceres futuros (RAG).
-- Rodar no SQL Editor do projeto Supabase (usado só como Postgres gerenciado).

create extension if not exists vector;

create table if not exists analises (
  id uuid default gen_random_uuid() primary key,
  vaga_texto text not null,
  curriculo_texto text not null,
  curriculo_embedding vector(1536) not null,
  score integer not null,
  parecer jsonb not null,
  created_at timestamptz default now() not null
);

create index if not exists analises_curriculo_embedding_idx
  on analises using ivfflat (curriculo_embedding vector_cosine_ops);

create or replace function buscar_similares(query_embedding vector(1536), limite int default 3)
returns table (
  vaga_texto text,
  parecer jsonb,
  score int,
  similaridade float
)
language sql stable
as $$
  select vaga_texto, parecer, score,
         1 - (curriculo_embedding <=> query_embedding) as similaridade
  from analises
  order by curriculo_embedding <=> query_embedding
  limit limite;
$$;
