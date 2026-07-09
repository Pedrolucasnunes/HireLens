# TalentLens — Backend (agente de IA)

API em Python (FastAPI) que analisa a aderência de um currículo a uma vaga:

```
currículo + vaga → embeddings (text-embedding-3-small) → similaridade de cosseno (numpy)
                 → LLM (gpt-4o-mini) gera parecer estruturado
                 → score + parecer + pontos fortes/fracos + recomendação
```

## Rodar localmente

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
copy .env.example .env        # e preencher OPENAI_API_KEY
uvicorn main:app --reload
```

O servidor serve tudo em um lugar só:

| Rota | O que é |
|---|---|
| `/` | Landing page |
| `/app` | Interface do agente (colar vaga + currículo → análise) |
| `/docs` | Docs interativas da API (Swagger) |

## Endpoints da API

| Endpoint | Entrada | Saída |
|---|---|---|
| `POST /analisar` | `{curriculo, vaga}` | `{score, parecer, pontos_fortes, pontos_fracos, recomendacao}` |
| `POST /embeddings` | `{texto}` | `{modelo, dimensoes, embedding}` |
| `GET /health` | — | `{status: "ok"}` |

### Exemplo

```bash
curl -X POST http://localhost:8000/analisar \
  -H "Content-Type: application/json" \
  -d '{"curriculo": "Desenvolvedor Python com 3 anos de experiência em FastAPI e PostgreSQL...", "vaga": "Vaga para desenvolvedor backend Python pleno com FastAPI..."}'
```

O `score` é a similaridade de cosseno entre os embeddings do currículo e da vaga, em escala 0–100. O parecer é gerado pelo LLM recebendo os dois textos e o score como contexto.
