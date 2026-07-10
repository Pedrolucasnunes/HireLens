"""
Testes dos endpoints do agente.

Todas as chamadas à OpenAI são simuladas (monkeypatch) — nenhum teste
consome API de verdade nem exige OPENAI_API_KEY configurada.

Rodar: cd backend && pytest -v
"""

import json
from types import SimpleNamespace

from fastapi.testclient import TestClient

import main

client = TestClient(main.app)

CURRICULO = "Desenvolvedora Python com três anos de experiência em FastAPI e PostgreSQL."
VAGA = "Vaga para pessoa desenvolvedora backend Python pleno com FastAPI e SQL."

PARECER_SIMULADO = {
    "parecer": "Boa aderência técnica à vaga.",
    "pontos_fortes": ["Experiência com FastAPI", "Domínio de SQL"],
    "pontos_fracos": ["Sem experiência com IA"],
    "recomendacao": "Avançar para entrevista",
}


def cliente_falso(embeddings: list[list[float]], parecer: dict = PARECER_SIMULADO):
    """Cliente OpenAI simulado: devolve embeddings fixos e um parecer fixo."""

    def criar_embeddings(model, input):
        dados = [SimpleNamespace(embedding=vetor) for vetor in embeddings[: len(input)]]
        return SimpleNamespace(data=dados)

    def criar_chat(**kwargs):
        conteudo = json.dumps(parecer)
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=conteudo))])

    return SimpleNamespace(
        embeddings=SimpleNamespace(create=criar_embeddings),
        chat=SimpleNamespace(completions=SimpleNamespace(create=criar_chat)),
    )


# ── /health e frontend ───────────────────────────────────────────────


def test_health():
    resposta = client.get("/health")
    assert resposta.status_code == 200
    assert resposta.json() == {"status": "ok"}


def test_landing_servida_na_raiz():
    resposta = client.get("/")
    assert resposta.status_code == 200
    assert "text/html" in resposta.headers["content-type"]


def test_interface_do_agente_em_app():
    resposta = client.get("/app/")
    assert resposta.status_code == 200
    assert "text/html" in resposta.headers["content-type"]


def test_arquivos_fora_da_whitelist_dao_404():
    assert client.get("/README.md").status_code == 404
    assert client.get("/main.py").status_code == 404


# ── /analisar ────────────────────────────────────────────────────────


def test_analisar_vetores_identicos_score_100(monkeypatch):
    monkeypatch.setattr(main, "cliente_openai", lambda: cliente_falso([[1.0, 0.0], [1.0, 0.0]]))
    resposta = client.post("/analisar", json={"curriculo": CURRICULO, "vaga": VAGA})
    assert resposta.status_code == 200
    dados = resposta.json()
    assert dados["score"] == 100.0
    assert dados["parecer"] == PARECER_SIMULADO["parecer"]
    assert dados["pontos_fortes"] == PARECER_SIMULADO["pontos_fortes"]
    assert dados["pontos_fracos"] == PARECER_SIMULADO["pontos_fracos"]
    assert dados["recomendacao"] == PARECER_SIMULADO["recomendacao"]


def test_analisar_vetores_ortogonais_score_0(monkeypatch):
    monkeypatch.setattr(main, "cliente_openai", lambda: cliente_falso([[1.0, 0.0], [0.0, 1.0]]))
    resposta = client.post("/analisar", json={"curriculo": CURRICULO, "vaga": VAGA})
    assert resposta.status_code == 200
    assert resposta.json()["score"] == 0.0


def test_analisar_valida_texto_curto():
    resposta = client.post("/analisar", json={"curriculo": "abc", "vaga": "xyz"})
    assert resposta.status_code == 422


def test_analisar_valida_texto_excessivo():
    resposta = client.post("/analisar", json={"curriculo": "a" * 20_001, "vaga": VAGA})
    assert resposta.status_code == 422


def test_analisar_sem_chave_retorna_erro_claro(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    resposta = client.post("/analisar", json={"curriculo": CURRICULO, "vaga": VAGA})
    assert resposta.status_code == 500
    assert "OPENAI_API_KEY" in resposta.json()["detail"]


# ── /embeddings ──────────────────────────────────────────────────────


def test_embeddings(monkeypatch):
    monkeypatch.setattr(main, "cliente_openai", lambda: cliente_falso([[0.1, 0.2, 0.3]]))
    resposta = client.post("/embeddings", json={"texto": "Engenharia de software"})
    assert resposta.status_code == 200
    dados = resposta.json()
    assert dados["modelo"] == main.MODELO_EMBEDDINGS
    assert dados["dimensoes"] == 3
    assert dados["embedding"] == [0.1, 0.2, 0.3]
