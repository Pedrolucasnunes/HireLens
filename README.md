# TalentLens

![CI](https://github.com/Pedrolucasnunes/TalentLens/actions/workflows/ci.yml/badge.svg)
![Python](https://img.shields.io/badge/python-3.13-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.139-teal)
![License](https://img.shields.io/badge/license-MIT-green)

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

## Demonstração

<!-- SCREENSHOT: interface do agente em /app, mostrando currículo + vaga + parecer gerado -->

## Arquitetura

| Camada | Stack | Papel |
|---|---|---|
| `backend/` | Python + FastAPI + OpenAI | **Motor de IA** — análise de aderência currículo × vaga (embeddings, similaridade, parecer via LLM) |
| `landing/` | HTML/CSS/JS | Landing page de validação |

O FastAPI serve tudo em um único servidor: landing page em `/`, interface do agente em `/app` e a API (`/analisar`, `/embeddings`).

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

## Status

MVP em desenvolvimento ativo. Próximo passo: recuperação de análises anteriores como contexto do parecer (RAG com armazenamento vetorial).
