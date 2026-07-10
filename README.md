# TalentLens

Triagem de currículos com IA: o agente analisa a aderência entre um currículo e uma vaga e gera um parecer estruturado com score, pontos fortes/fracos e recomendação.

## Como funciona

```
Currículo (texto) + Descrição da vaga (texto)
        ↓
Embeddings dos dois textos (OpenAI text-embedding-3-small)
        ↓
Similaridade semântica (cosine similarity, numpy)
        ↓
LLM (gpt-4o-mini) recebe textos + score → parecer estruturado
        ↓
{ score, parecer, pontos_fortes, pontos_fracos, recomendacao }
```

## Arquitetura

O repositório tem três camadas, cada uma com um papel definido:

| Camada | Stack | Papel |
|---|---|---|
| `backend/` | Python + FastAPI + OpenAI | **Motor de IA** — análise de aderência currículo × vaga (embeddings, similaridade, parecer via LLM) |
| `platform/` | Next.js 14 + TypeScript + Supabase | **Camada de produto** — autenticação, dashboard, gestão de vagas, upload de currículos em PDF |
| raiz (`index.html`, `script.js`, `styles.css`) | HTML/CSS/JS | Landing page de validação |

O FastAPI serve landing (`/`), interface do agente (`/app`) e API (`/analisar`, `/embeddings`) em um único servidor.

### Estado atual e plano de consolidação

Hoje existe uma redundância deliberada: a `platform/` tem sua própria chamada à API da Anthropic (Claude) para analisar currículos, enquanto o `backend/` faz a mesma análise de forma independente via OpenAI. Isso é resultado da ordem de construção — a plataforma nasceu primeiro como produto completo; o agente Python nasceu depois como motor de IA dedicado.

O plano de consolidação: a `platform/` deixará de ter lógica de IA própria e passará a consumir a API do `backend/`. O Python se torna o único "cérebro" de IA do projeto; a plataforma fica responsável apenas por autenticação, banco de dados e interface. Duas stacks, uma fronteira clara: produto em Next.js, inteligência em Python.

## Rodar o agente

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
copy .env.example .env        # preencher OPENAI_API_KEY
uvicorn main:app --reload
```

Docs interativas em `http://localhost:8000/docs`. Detalhes e exemplos em [backend/README.md](backend/README.md).

## Rodar a plataforma

```bash
cd platform
npm install
npm run dev
```

Requer `platform/.env.local` com as chaves do Supabase e da Anthropic (ver `platform/README.md`) e a migration de `platform/supabase/migrations/` aplicada no projeto Supabase. Acesse em `http://localhost:3000`.

## Status

MVP em desenvolvimento ativo. Próximos passos: recuperação de análises anteriores como contexto do parecer (RAG com armazenamento vetorial) e interface web integrada à API.
