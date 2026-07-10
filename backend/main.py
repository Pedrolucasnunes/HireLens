"""
TalentLens — agente de IA para triagem de currículos.

Fluxo: currículo + vaga → embeddings → similaridade de cosseno →
recupera análises anteriores similares (memória vetorial, se configurada) →
LLM gera parecer estruturado → score + parecer + pontos fortes/fracos →
análise salva na memória para calibrar pareceres futuros.
"""

import json
import os
from pathlib import Path

import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from openai import OpenAI
from pydantic import BaseModel, Field

import memoria

load_dotenv()

MODELO_EMBEDDINGS = "text-embedding-3-small"
MODELO_LLM = "gpt-4o-mini"

app = FastAPI(
    title="TalentLens — Agente de Triagem de Currículos",
    description="Analisa a aderência de um currículo a uma vaga usando embeddings e LLM.",
    version="0.1.0",
)

# Origens permitidas para CORS — por padrão, só a landing publicada.
# Em dev, sobrescreva via env: CORS_ORIGENS=http://localhost:3000,...
# (chamadas same-origin — landing e /app servidos por este servidor — não precisam de CORS)
CORS_ORIGENS = os.getenv("CORS_ORIGENS", "https://hire-lens-rust.vercel.app").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGENS,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schemas ──────────────────────────────────────────────────────────


class EntradaAnalise(BaseModel):
    curriculo: str = Field(min_length=30, max_length=20_000, description="Texto do currículo")
    vaga: str = Field(min_length=30, max_length=20_000, description="Descrição da vaga")


class ResultadoAnalise(BaseModel):
    score: float = Field(description="Similaridade currículo × vaga (0 a 100)")
    parecer: str
    pontos_fortes: list[str]
    pontos_fracos: list[str]
    recomendacao: str


class EntradaEmbedding(BaseModel):
    texto: str = Field(min_length=1, max_length=20_000)


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


def formatar_contexto(analises: list[dict]) -> str:
    """Seção de calibração do prompt com pareceres de currículos similares já analisados."""
    linhas = [
        "## Calibração — análises anteriores de currículos parecidos",
        "Use como referência de rigor e consistência; não copie o conteúdo:",
    ]
    for analise in analises:
        parecer = analise.get("parecer") or {}
        linhas.append(
            f"- Vaga: {analise.get('vaga_texto', '')[:200]} | Score: {analise.get('score')} | "
            f"Parecer: {parecer.get('parecer', '')} | Recomendação: {parecer.get('recomendacao', '')}"
        )
    return "\n".join(linhas)


def gerar_parecer(curriculo: str, vaga: str, score: float, contexto: list[dict] | None = None) -> dict:
    conteudo = (
        f"Similaridade semântica entre currículo e vaga (embeddings, 0 a 100): {score}\n\n"
        f"## Vaga\n{vaga}\n\n## Currículo\n{curriculo}"
    )
    if contexto:
        conteudo += "\n\n" + formatar_contexto(contexto)

    resposta = cliente_openai().chat.completions.create(
        model=MODELO_LLM,
        response_format={"type": "json_object"},
        temperature=0.3,
        messages=[
            {"role": "system", "content": PROMPT_PARECER},
            {"role": "user", "content": conteudo},
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
        contexto = memoria.buscar_contexto_similar(emb_curriculo.tolist())
        parecer = gerar_parecer(entrada.curriculo, entrada.vaga, score, contexto)
    except HTTPException:
        raise
    except Exception as erro:
        raise HTTPException(status_code=502, detail=f"Falha na chamada de IA: {erro}") from erro

    # Alimenta a memória vetorial para calibrar análises futuras.
    # Tolerante a falha: sem banco configurado, vira um no-op.
    memoria.salvar_analise(
        vaga=entrada.vaga,
        curriculo=entrada.curriculo,
        embedding_curriculo=emb_curriculo.tolist(),
        score=round(score),
        parecer=parecer,
    )

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


# ── Frontend ─────────────────────────────────────────────────────────
# Um único servidor: landing page em /, interface do agente em /app,
# API nas rotas acima. Registrado por último para a API ter precedência.

DIR_LANDING = Path(__file__).resolve().parent.parent / "landing"

# Somente estes arquivos da landing são expostos — manter a whitelist
# em vez de montar diretórios fora de backend/ como StaticFiles.
ARQUIVOS_LANDING = {"script.js", "styles.css", "talentlens-mark-512.png"}


@app.get("/", include_in_schema=False)
def landing():
    return FileResponse(DIR_LANDING / "index.html")


app.mount("/app", StaticFiles(directory=Path(__file__).parent / "static", html=True), name="app")


@app.get("/{arquivo}", include_in_schema=False)
def assets_landing(arquivo: str):
    if arquivo in ARQUIVOS_LANDING:
        return FileResponse(DIR_LANDING / arquivo)
    raise HTTPException(status_code=404, detail="Não encontrado")
