"""
Memória vetorial de análises (RAG) — recuperação e armazenamento no Postgres.

Usa Supabase apenas como Postgres gerenciado com a extensão pgvector
(migration em supabase/migrations/001_analises_vetoriais.sql).

Tudo aqui é tolerante a falha por design: se o banco não estiver configurado
(SUPABASE_URL/SUPABASE_SERVICE_KEY ausentes) ou uma chamada falhar, as funções
retornam um valor neutro e apenas logam um aviso — a ausência da memória nunca
pode quebrar o endpoint principal.
"""

import logging
import os

from supabase import Client, create_client

logger = logging.getLogger(__name__)

_cliente_cache: Client | None = None


def _cliente() -> Client | None:
    """Cliente Supabase, ou None se o banco não estiver configurado."""
    global _cliente_cache
    if _cliente_cache is not None:
        return _cliente_cache

    url = os.getenv("SUPABASE_URL")
    chave = os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not chave:
        return None

    try:
        _cliente_cache = create_client(url, chave)
    except Exception as erro:
        logger.warning("Não foi possível conectar à memória vetorial: %s", erro)
        return None
    return _cliente_cache


def buscar_contexto_similar(embedding_curriculo: list[float], limite: int = 3) -> list[dict]:
    """Retorna análises anteriores de currículos similares, ou [] se o banco
    não estiver configurado, a busca falhar ou não houver histórico."""
    cliente = _cliente()
    if cliente is None:
        return []

    try:
        resposta = cliente.rpc(
            "buscar_similares",
            {"query_embedding": embedding_curriculo, "limite": limite},
        ).execute()
        return resposta.data or []
    except Exception as erro:
        logger.warning("Busca de análises similares falhou (seguindo sem contexto): %s", erro)
        return []


def salvar_analise(
    vaga: str,
    curriculo: str,
    embedding_curriculo: list[float],
    score: int,
    parecer: dict,
) -> None:
    """Salva a análise para servir de contexto a buscas futuras.
    Falha silenciosamente (só loga) se o banco não estiver configurado."""
    cliente = _cliente()
    if cliente is None:
        return

    try:
        cliente.table("analises").insert(
            {
                "vaga_texto": vaga,
                "curriculo_texto": curriculo,
                "curriculo_embedding": embedding_curriculo,
                "score": score,
                "parecer": parecer,
            }
        ).execute()
    except Exception as erro:
        logger.warning("Falha ao salvar análise na memória vetorial: %s", erro)
