"""
Testes dos endpoints do agente.

Todas as chamadas à OpenAI são simuladas (monkeypatch) — nenhum teste
consome API de verdade nem exige OPENAI_API_KEY configurada.

Rodar: cd backend && pytest -v
"""

import json
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

import main

# Referências diretas às funções reais de memoria.py (a fixture autouse abaixo
# substitui os atributos do módulo; estas apontam para as originais).
from memoria import buscar_contexto_similar as buscar_real
from memoria import salvar_analise as salvar_real

client = TestClient(main.app)


@pytest.fixture(autouse=True)
def memoria_neutra(monkeypatch):
    """Nenhum teste toca banco de verdade: memória vetorial neutra por padrão.
    Testes específicos sobrescrevem com seus próprios fakes."""
    monkeypatch.setattr(main.memoria, "buscar_contexto_similar", lambda embedding, limite=3: [])
    monkeypatch.setattr(main.memoria, "salvar_analise", lambda **kwargs: None)

CURRICULO = "Desenvolvedora Python com três anos de experiência em FastAPI e PostgreSQL."
VAGA = "Vaga para pessoa desenvolvedora backend Python pleno com FastAPI e SQL."

PARECER_SIMULADO = {
    "parecer": "Boa aderência técnica à vaga.",
    "pontos_fortes": ["Experiência com FastAPI", "Domínio de SQL"],
    "pontos_fracos": ["Sem experiência com IA"],
    "recomendacao": "Avançar para entrevista",
}


def cliente_falso(
    embeddings: list[list[float]],
    parecer: dict = PARECER_SIMULADO,
    capturas: dict | None = None,
):
    """Cliente OpenAI simulado: devolve embeddings fixos e um parecer fixo.
    Se `capturas` for passado, registra os kwargs da chamada de chat (inclui o prompt)."""

    def criar_embeddings(model, input):
        dados = [SimpleNamespace(embedding=vetor) for vetor in embeddings[: len(input)]]
        return SimpleNamespace(data=dados)

    def criar_chat(**kwargs):
        if capturas is not None:
            capturas["chat"] = kwargs
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


# ── Memória de análises (RAG) ────────────────────────────────────────

CONTEXTO_SIMILAR = [
    {
        "vaga_texto": "Vaga anterior para backend Python sênior.",
        "score": 81,
        "similaridade": 0.92,
        "parecer": {
            "parecer": "Candidato com forte base em APIs Python.",
            "recomendacao": "Avançar para entrevista",
        },
    }
]


def test_analisar_inclui_contexto_similar_no_prompt(monkeypatch):
    capturas = {}
    monkeypatch.setattr(
        main, "cliente_openai", lambda: cliente_falso([[1.0, 0.0], [1.0, 0.0]], capturas=capturas)
    )
    monkeypatch.setattr(main.memoria, "buscar_contexto_similar", lambda embedding, limite=3: CONTEXTO_SIMILAR)

    resposta = client.post("/analisar", json={"curriculo": CURRICULO, "vaga": VAGA})

    assert resposta.status_code == 200
    prompt_usuario = capturas["chat"]["messages"][1]["content"]
    assert "Calibração" in prompt_usuario
    assert "Candidato com forte base em APIs Python." in prompt_usuario
    assert "Vaga anterior para backend Python sênior." in prompt_usuario


def test_analisar_sem_historico_funciona_normalmente(monkeypatch):
    capturas = {}
    monkeypatch.setattr(
        main, "cliente_openai", lambda: cliente_falso([[1.0, 0.0], [1.0, 0.0]], capturas=capturas)
    )
    monkeypatch.setattr(main.memoria, "buscar_contexto_similar", lambda embedding, limite=3: [])

    resposta = client.post("/analisar", json={"curriculo": CURRICULO, "vaga": VAGA})

    assert resposta.status_code == 200
    assert resposta.json()["score"] == 100.0
    assert "Calibração" not in capturas["chat"]["messages"][1]["content"]


def test_analisar_salva_na_memoria_apos_sucesso(monkeypatch):
    salvas = []
    monkeypatch.setattr(main, "cliente_openai", lambda: cliente_falso([[1.0, 0.0], [1.0, 0.0]]))
    monkeypatch.setattr(main.memoria, "salvar_analise", lambda **kwargs: salvas.append(kwargs))

    resposta = client.post("/analisar", json={"curriculo": CURRICULO, "vaga": VAGA})

    assert resposta.status_code == 200
    assert len(salvas) == 1
    salva = salvas[0]
    assert salva["vaga"] == VAGA
    assert salva["curriculo"] == CURRICULO
    assert salva["embedding_curriculo"] == [1.0, 0.0]
    assert salva["score"] == 100 and isinstance(salva["score"], int)
    assert salva["parecer"] == PARECER_SIMULADO


def test_memoria_sem_banco_configurado_degrada_graciosamente(monkeypatch):
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_SERVICE_KEY", raising=False)
    assert buscar_real([0.1, 0.2]) == []
    assert salvar_real(vaga="v", curriculo="c", embedding_curriculo=[0.1], score=50, parecer={}) is None


# ── /embeddings ──────────────────────────────────────────────────────


def test_embeddings(monkeypatch):
    monkeypatch.setattr(main, "cliente_openai", lambda: cliente_falso([[0.1, 0.2, 0.3]]))
    resposta = client.post("/embeddings", json={"texto": "Engenharia de software"})
    assert resposta.status_code == 200
    dados = resposta.json()
    assert dados["modelo"] == main.MODELO_EMBEDDINGS
    assert dados["dimensoes"] == 3
    assert dados["embedding"] == [0.1, 0.2, 0.3]
