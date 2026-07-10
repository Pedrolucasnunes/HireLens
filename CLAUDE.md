# TalentLens — Contexto do Projeto

## Estrutura
- `landing/` → landing page de validação (HTML/CSS/JS puro, sem build)
- `backend/` → agente de IA em Python/FastAPI
- Branch única: `main`. A tag `platform-era-2026-07` marca o último estado que continha a antiga plataforma Next.js (`platform/`), removida do repositório em 2026-07-10 por decisão deliberada de consolidação em Python puro — não trazê-la de volta.

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

## Deploy
- Landing publicada na Vercel; `vercel.json` na raiz aponta o `outputDirectory` para `landing/`
- O formulário da landing chama uma Edge Function de um projeto Supabase antigo que não existe mais — captura de e-mails em produção está quebrada (pendência conhecida)
