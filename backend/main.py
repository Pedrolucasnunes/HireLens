"""
TalentLens — agente de IA para triagem de currículos.

Fluxo: currículo + vaga → embeddings → similaridade de cosseno →
LLM gera parecer estruturado → score + parecer + pontos fortes/fracos.
"""

import json
import os
from pathlib import Path

import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from openai import OpenAI
from pydantic import BaseModel, Field

load_dotenv()

MODELO_EMBEDDINGS = "text-embedding-3-small"
MODELO_LLM = "gpt-4o-mini"

app = FastAPI(
    title="TalentLens — Agente de Triagem de Currículos",
    description="Analisa a aderência de um currículo a uma vaga usando embeddings e LLM.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schemas ──────────────────────────────────────────────────────────


class EntradaAnalise(BaseModel):
    curriculo: str = Field(min_length=30, description="Texto do currículo")
    vaga: str = Field(min_length=30, description="Descrição da vaga")


class ResultadoAnalise(BaseModel):
    score: float = Field(description="Similaridade currículo × vaga (0 a 100)")
    parecer: str
    pontos_fortes: list[str]
    pontos_fracos: list[str]
    recomendacao: str


class EntradaEmbedding(BaseModel):
    texto: str = Field(min_length=1)


# ── IA ───────────────────────────────────────────────────────────────


def cliente_openai() -> OpenAI:
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY não configurada. Crie backend/.env a partir do .env.example.",
        )
    return OpenAI()


def gerar_embeddings(textos: list[str]) -> list[np.ndarray]:
    resposta = cliente_openai().embeddings.create(model=MODELO_EMBEDDINGS, input=textos)
    return [np.array(item.embedding) for item in resposta.data]


def similaridade_cosseno(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


PROMPT_PARECER = """Você é um recrutador técnico experiente. Avalie a aderência do currículo à vaga.

Responda APENAS com JSON válido neste formato:
{
  "parecer": "análise objetiva em 2 a 4 frases",
  "pontos_fortes": ["..."],
  "pontos_fracos": ["..."],
  "recomendacao": "Avançar para entrevista" | "Avaliar com ressalvas" | "Não avançar"
}

Considere requisitos técnicos, experiência e senioridade. Seja específico: cite evidências do currículo."""


def gerar_parecer(curriculo: str, vaga: str, score: float) -> dict:
    resposta = cliente_openai().chat.completions.create(
        model=MODELO_LLM,
        response_format={"type": "json_object"},
        temperature=0.3,
        messages=[
            {"role": "system", "content": PROMPT_PARECER},
            {
                "role": "user",
                "content": (
                    f"Similaridade semântica entre currículo e vaga (embeddings, 0 a 100): {score}\n\n"
                    f"## Vaga\n{vaga}\n\n## Currículo\n{curriculo}"
                ),
            },
        ],
    )
    return json.loads(resposta.choices[0].message.content)


# ── Endpoints ────────────────────────────────────────────────────────


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analisar", response_model=ResultadoAnalise)
def analisar(entrada: EntradaAnalise):
    try:
        emb_curriculo, emb_vaga = gerar_embeddings([entrada.curriculo, entrada.vaga])
        score = round(similaridade_cosseno(emb_curriculo, emb_vaga) * 100, 1)
        parecer = gerar_parecer(entrada.curriculo, entrada.vaga, score)
    except HTTPException:
        raise
    except Exception as erro:
        raise HTTPException(status_code=502, detail=f"Falha na chamada de IA: {erro}") from erro

    return ResultadoAnalise(
        score=score,
        parecer=parecer.get("parecer", ""),
        pontos_fortes=parecer.get("pontos_fortes", []),
        pontos_fracos=parecer.get("pontos_fracos", []),
        recomendacao=parecer.get("recomendacao", ""),
    )


@app.post("/embeddings")
def embeddings(entrada: EntradaEmbedding):
    try:
        vetor = gerar_embeddings([entrada.texto])[0]
    except HTTPException:
        raise
    except Exception as erro:
        raise HTTPException(status_code=502, detail=f"Falha na chamada de IA: {erro}") from erro

    return {"modelo": MODELO_EMBEDDINGS, "dimensoes": len(vetor), "embedding": vetor.tolist()}


# Interface de demonstração servida em / — montada por último para
# que as rotas da API definidas acima tenham precedência.
app.mount("/", StaticFiles(directory=Path(__file__).parent / "static", html=True), name="static")
