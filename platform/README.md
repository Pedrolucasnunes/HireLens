# TalentLens — Plataforma

Camada de produto do TalentLens: autenticação, dashboard de vagas, upload de currículos em PDF e análise com IA (Claude). Construída com Next.js 14 (App Router), Tailwind CSS, shadcn/ui e Supabase (auth + banco).

Este é o produto completo do TalentLens — complementar ao agente de IA em Python que vive em [`backend/`](../backend/README.md). O papel de cada camada e o plano de consolidação estão na seção [Arquitetura do README raiz](../README.md#arquitetura).

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse em `http://localhost:3000`.

### Variáveis de ambiente

Crie um `.env.local` a partir do [`.env.example`](.env.example):

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave `anon public` do Supabase (Settings → API) |
| `ANTHROPIC_API_KEY` | Chave da API da Anthropic (análise de currículos) |

### Banco de dados (obrigatório antes de usar)

Rode o SQL de [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql) no **SQL Editor** do Supabase. Ele cria as tabelas `jobs` e `candidates`, ambas com RLS habilitado.

Para login por e-mail/senha sem fricção em dev, desative **Confirm email** em Authentication → Sign In / Providers → Email.

## Rotas principais

| Rota | Tipo | Descrição |
|---|---|---|
| `/login` | Client | Auth e-mail/senha via Supabase |
| `/dashboard` | Server | Visão geral das vagas do usuário |
| `/vagas` | Server | Lista de vagas |
| `/vagas/new` | Client | Criar nova vaga |
| `/vagas/[id]` | Server | Detalhe da vaga + upload de currículos + ranking |
| `/api/jobs` | API | CRUD de vagas |
| `/api/analyze` | API | Upload PDF → extração → Claude → salva candidato |
| `/api/auth/signout` | API | Logout |

## Notas técnicas

- `pdf-parse` é importado via `require()` (incompatibilidade ESM)
- Componentes interativos (`useRouter` etc.) ficam em arquivos separados com `"use client"`
- Após upload de currículo, `router.refresh()` re-renderiza o Server Component com os dados novos
