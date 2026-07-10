# HireLens / TalentLens — Contexto do Projeto

## Estrutura de Branches
- `main` → branch principal com o projeto completo: landing page (`landing/`), agente de IA (`backend/`) e plataforma (`platform/`)
- `mvp` → espelho da `main` (mantida sincronizada por histórico; trabalho novo vai na `main`)

Desde 2026-07-09 a `platform/` faz parte da `main` por decisão deliberada — não removê-la nem escondê-la. Ver a seção "Arquitetura" do README raiz para o papel de cada camada e o plano de consolidação (plataforma consumirá a API Python; o `backend/` é o único motor de IA).

## Stack da Plataforma
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
- **Auth + DB**: Supabase (projeto: `nqlqlqkgevqzguvbuxpt`)
- **IA**: Anthropic API — modelo `claude-sonnet-4-6`
- **PDF**: pdf-parse (importado via `require()` por incompatibilidade ESM)

## Backend Python — Agente de IA (`backend/`)
API FastAPI que analisa aderência currículo × vaga: embeddings (OpenAI `text-embedding-3-small`) → similaridade de cosseno (numpy) → parecer estruturado via LLM (`gpt-4o-mini`).

**Decisão de arquitetura: o backend do agente de IA é Python/FastAPI. Não migrar nem portar para Node/TypeScript.**

```bash
cd backend
.venv\Scripts\activate
uvicorn main:app --reload
```
- Env: `backend/.env` com `OPENAI_API_KEY` (não vai para o git)
- O FastAPI serve tudo: landing em `/`, interface do agente em `/app` (arquivos em `backend/static/`), API em `POST /analisar`, `POST /embeddings`, `GET /health` — docs em `http://localhost:8000/docs`
- Nunca montar a raiz do repo como StaticFiles (vazaria `backend/.env`) — a landing é servida por whitelist de arquivos
- Testes: `cd backend && pytest` (OpenAI mockada, sem custo); CI roda a suíte a cada push
- CORS restrito por padrão à landing publicada; origens extras via env `CORS_ORIGENS`
- Detalhes em `backend/README.md`

## Rodar Localmente (plataforma Next.js)
```bash
cd platform
npm run dev
```
Acesse em `http://localhost:3000`.

## Variáveis de Ambiente
Arquivo: `platform/.env.local` (não vai para o git)
```
NEXT_PUBLIC_SUPABASE_URL=https://nqlqlqkgevqzguvbuxpt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<chave anon do Supabase>
ANTHROPIC_API_KEY=<chave da Anthropic>
```

## Banco de Dados
Rodar o SQL em `platform/supabase/migrations/001_initial.sql` no Supabase SQL Editor antes de usar.
Tabelas: `jobs` e `candidates`, ambas com RLS habilitado.

## Rotas da Plataforma
| Rota | Tipo | Descrição |
|---|---|---|
| `/login` | Client | Auth email/senha |
| `/dashboard` | Server | Visão geral das vagas do usuário |
| `/vagas` | Server | Lista de vagas |
| `/vagas/new` | Client | Criar nova vaga |
| `/vagas/[id]` | Server | Detalhe da vaga + upload + ranking |
| `/api/jobs` | API | CRUD de vagas |
| `/api/analyze` | API | Upload PDF → extração → Claude → salva candidato |
| `/api/auth/signout` | API | Logout |

## Observações Técnicas
- `pdf-parse` deve ser importado com `require()`, não `import` (problema ESM)
- Componentes com `useRouter` ou interatividade precisam de `"use client"` em arquivo separado (não misturar com Server Components)
- Após upload de currículo, usar `router.refresh()` para re-renderizar o Server Component com os novos dados
