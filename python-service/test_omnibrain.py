"""
Teste rápido do Omnibrain Engine v1.5.0

Testa:
- Inicialização
- Tarefa simples
- Cache
- Métricas
"""

import asyncio
import sys
from pathlib import Path

# Adicionar app ao path
sys.path.insert(0, str(Path(__file__).parent / "app"))

from omnibrain import create_omnibrain_engine
from omnibrain.types import TaskInput, ExecutionStatus
from omnibrain.observability.metrics import get_metrics


async def test_engine():
    print("🧪 Teste do Omnibrain Engine v1.5.0\n")
    print("=" * 60)
    
    # 1. Inicializar engine
    print("\n1️⃣ Inicializando engine...")
    engine = create_omnibrain_engine()
    print(f"   ✅ Engine criado")
    print(f"   ✅ Componentes: {sum([1 for c in [engine.task_classifier, engine.library_selector, engine.code_generator, engine.executor, engine.validator, engine.retry_engine] if c])}/6")
    print(f"   ✅ Sistemas: Context={engine.context_manager is not None}, Planner={engine.task_planner is not None}, Cache={engine.cache_manager is not None}")
    print(f"   ✅ Profiles carregados: {len(engine.profile_loader.profiles_cache)}")
    
    # 2. Tarefa simples
    print("\n2️⃣ Executando tarefa simples...")
    task1 = TaskInput(command="Liste os números de 1 a 10")
    result1 = await engine.execute(task1)
    
    print(f"   Status: {result1.status.value}")
    print(f"   Biblioteca: {result1.library_used}")
    print(f"   Tempo: {result1.execution_time:.2f}s")
    print(f"   Tentativas: {result1.attempts}")
    
    # 3. Testar cache (mesma tarefa)
    print("\n3️⃣ Testando cache (mesma tarefa)...")
    result2 = await engine.execute(task1)
    print(f"   ✅ Cache funcionou!" if result2 == result1 else "   ⚠️ Cache miss")
    
    # 4. Métricas
    print("\n4️⃣ Métricas coletadas:")
    metrics = get_metrics()
    print(f"   Execuções: {metrics['counters'].get('omnibrain_task_executions_total{status=started}', 0)}")
    print(f"   Cache hits: {metrics['counters'].get('omnibrain_task_executions_total{status=cache_hit}', 0)}")
    print(f"   Uptime: {metrics['uptime_seconds']:.1f}s")
    
    # 5. Statistics
    if engine.cache_manager:
        cache_stats = engine.cache_manager.get_statistics()
        print(f"\n5️⃣ Cache stats:")
        print(f"   Hit rate: {cache_stats.get('hit_rate', 0)}%")
        print(f"   Size: {cache_stats.get('size', 0)}")
    
    print("\n" + "=" * 60)
    print("✅ TESTES COMPLETOS\n")
    
    return True


if __name__ == "__main__":
    success = asyncio.run(test_engine())
    sys.exit(0 if success else 1)
