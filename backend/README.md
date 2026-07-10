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

Resposta:

```json
{
  "score": 78.4,
  "parecer": "O candidato tem boa aderência técnica à vaga, com experiência sólida em FastAPI e PostgreSQL, o stack principal pedido. A senioridade declarada é compatível com a posição de nível pleno.",
  "pontos_fortes": [
    "Experiência direta com o stack pedido (FastAPI, PostgreSQL)",
    "Histórico de projetos em produção"
  ],
  "pontos_fracos": [
    "Não menciona experiência com filas ou processamento assíncrono"
  ],
  "recomendacao": "Avançar para entrevista"
}
```

O `score` é a similaridade de cosseno entre os embeddings do currículo e da vaga, em escala 0–100. O parecer é gerado pelo LLM recebendo os dois textos e o score como contexto.

## Testes

```bash
pip install -r requirements-dev.txt
pytest -v
```

As chamadas à OpenAI são simuladas nos testes — nada de custo de API nem chave necessária. O CI (GitHub Actions) roda a suíte a cada push.

## Configuração

| Variável | Obrigatória | Descrição |
|---|---|---|
| `OPENAI_API_KEY` | sim | Chave da OpenAI (embeddings + parecer) |
| `CORS_ORIGENS` | não | Origens permitidas para CORS, separadas por vírgula. Padrão: só a landing publicada. Same-origin (landing e `/app` servidos pelo próprio FastAPI) não precisa de CORS. |
