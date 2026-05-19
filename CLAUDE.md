# HireLens / TalentLens — Contexto do Projeto

## Estrutura de Branches
- `main` → landing page de validação (arquivo estático: `index.html`, `script.js`, `styles.css`)
- `mvp` → landing page + plataforma completa (`platform/`)

Nunca commitar código da plataforma direto na `main`.

## Stack da Plataforma
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
- **Auth + DB**: Supabase (projeto: `lvuxstpmbumxqolvamlo`)
- **IA**: Anthropic API — modelo `claude-sonnet-4-6`
- **PDF**: pdf-parse (importado via `require()` por incompatibilidade ESM)

## Rodar Localmente
```bash
cd platform
npm run dev
```
Acesse em `http://localhost:3000`.

## Variáveis de Ambiente
Arquivo: `platform/.env.local` (não vai para o git)
```
NEXT_PUBLIC_SUPABASE_URL=https://lvuxstpmbumxqolvamlo.supabase.co
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
| `/dashboard` | Server | Lista de vagas do usuário |
| `/jobs/new` | Client | Criar nova vaga |
| `/jobs/[id]` | Server | Detalhe da vaga + upload + ranking |
| `/api/jobs` | API | CRUD de vagas |
| `/api/analyze` | API | Upload PDF → extração → Claude → salva candidato |
| `/api/auth/signout` | API | Logout |

## Observações Técnicas
- `pdf-parse` deve ser importado com `require()`, não `import` (problema ESM)
- Componentes com `useRouter` ou interatividade precisam de `"use client"` em arquivo separado (não misturar com Server Components)
- Após upload de currículo, usar `router.refresh()` para re-renderizar o Server Component com os novos dados
