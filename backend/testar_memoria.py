"""
Diagnóstico local da memória vetorial — NÃO faz parte da API.

Confirma que o backend/.env está preenchido, que a migration foi rodada e que
o agente consegue salvar e recuperar análises no Postgres. Não gasta chamada
da OpenAI: usa um vetor aleatório de 1536 dimensões só para exercitar a conexão.

Rodar: cd backend && python testar_memoria.py
"""

import logging
import os
import random
import sys

# Console do Windows pode usar cp1252, que não imprime ✅/❌.
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from dotenv import load_dotenv

load_dotenv()

import memoria  # noqa: E402 — importado depois do load_dotenv de propósito

# Os avisos de falha do memoria.py saem como WARNING — garantir que apareçam.
logging.basicConfig(level=logging.WARNING, format="%(levelname)s %(message)s")


def main() -> int:
    if not (os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_SERVICE_KEY")):
        print("❌ SUPABASE_URL/SUPABASE_SERVICE_KEY faltando no backend/.env")
        print("   Copie o .env.example para .env e preencha (Settings → API no Supabase).")
        return 1

    embedding = [random.uniform(-1.0, 1.0) for _ in range(1536)]

    print("1/2 Salvando análise fictícia de teste...")
    memoria.salvar_analise(
        vaga="[TESTE] Vaga fictícia do diagnóstico da memória vetorial",
        curriculo="[TESTE] Currículo fictício do diagnóstico da memória vetorial",
        embedding_curriculo=embedding,
        score=50,
        parecer={
            "parecer": "Registro fictício criado pelo diagnóstico testar_memoria.py.",
            "recomendacao": "Avaliar com ressalvas",
        },
    )

    print("2/2 Buscando análises similares ao mesmo embedding...")
    resultados = memoria.buscar_contexto_similar(embedding)

    if resultados:
        similaridade = resultados[0].get("similaridade") or 0.0
        print(
            f"✅ Memória vetorial funcionando — {len(resultados)} resultado(s); "
            f"similaridade do mais próximo: {similaridade:.3f}"
        )
        return 0

    print(
        "❌ Nada retornado. Causas prováveis: migration não rodada no projeto, "
        "chaves erradas ou banco inacessível — veja os avisos (WARNING) acima."
    )
    return 1


if __name__ == "__main__":
    sys.exit(main())
