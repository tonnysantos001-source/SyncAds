"""
============================================
SYNCADS OMNIBRAIN - CONTEXT MANAGER
============================================
Gerenciador de Contexto para Conversas Multi-turn

Responsável por:
- Persistir contexto entre mensagens
- Manter histórico de execuções
- Armazenar variáveis de sessão
- Gerenciar dados intermediários
- Permitir continuidade em conversas longas

Autor: SyncAds AI Team
Versão: 1.0.0
Data: 2025-01-15
============================================
"""

import asyncio
import json
import logging
from abc import ABC, abstractmethod
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from ..types import ConversationContext, ExecutionResult, TaskInput

logger = logging.getLogger("omnibrain.context")


# ============================================
# STORAGE INTERFACE
# ============================================


class ContextStorage(ABC):
    """Interface abstrata para storage de contexto"""

    @abstractmethod
    async def save(self, conversation_id: str, context: ConversationContext) -> bool:
        """Salva contexto"""
        pass

    @abstractmethod
    async def load(self, conversation_id: str) -> Optional[ConversationContext]:
        """Carrega contexto"""
        pass

    @abstractmethod
    async def delete(self, conversation_id: str) -> bool:
        """Deleta contexto"""
        pass

    @abstractmethod
    async def exists(self, conversation_id: str) -> bool:
        """Verifica se contexto existe"""
        pass

    @abstractmethod
    async def list_conversations(self, user_id: str) -> List[str]:
        """Lista conversas de um usuário"""
        pass


# ============================================
# IN-MEMORY STORAGE
# ============================================


class InMemoryStorage(ContextStorage):
    """Storage em memória (para desenvolvimento/testes)"""

    def __init__(self):
        self.storage: Dict[str, ConversationContext] = {}
        self.user_conversations: Dict[str, List[str]] = defaultdict(list)
        logger.info("InMemoryStorage initialized")

    async def save(self, conversation_id: str, context: ConversationContext) -> bool:
        try:
            self.storage[conversation_id] = context

            # Adicionar à lista do usuário
            if (
                context.user_id
                and conversation_id not in self.user_conversations[context.user_id]
            ):
                self.user_conversations[context.user_id].append(conversation_id)

            return True
        except Exception as e:
            logger.error(f"Error saving context: {e}")
            return False

    async def load(self, conversation_id: str) -> Optional[ConversationContext]:
        return self.storage.get(conversation_id)

    async def delete(self, conversation_id: str) -> bool:
        if conversation_id in self.storage:
            context = self.storage[conversation_id]
            del self.storage[conversation_id]

            # Remover da lista do usuário
            if context.user_id:
                try:
                    self.user_conversations[context.user_id].remove(conversation_id)
                except ValueError:
                    pass

            return True
        return False

    async def exists(self, conversation_id: str) -> bool:
        return conversation_id in self.storage

    async def list_conversations(self, user_id: str) -> List[str]:
        return self.user_conversations.get(user_id, [])

    def clear_all(self):
        """Limpa todo o storage (útil para testes)"""
        self.storage.clear()
        self.user_conversations.clear()


# ============================================
# REDIS STORAGE (OPCIONAL)
# ============================================


class RedisStorage(ContextStorage):
    """Storage em Redis (para produção)"""

    def __init__(self, redis_client=None):
        self.redis = redis_client
        self.prefix = "omnibrain:context:"
        self.user_prefix = "omnibrain:user_conversations:"
        logger.info("RedisStorage initialized")

    async def save(self, conversation_id: str, context: ConversationContext) -> bool:
        if not self.redis:
            logger.warning("Redis not available, skipping save")
            return False

        try:
            # Serializar context
            data = self._serialize_context(context)

            # Salvar no Redis
            key = f"{self.prefix}{conversation_id}"
            await self.redis.set(key, data, ex=86400)  # 24 horas

            # Adicionar à lista do usuário
            if context.user_id:
                user_key = f"{self.user_prefix}{context.user_id}"
                await self.redis.sadd(user_key, conversation_id)
                await self.redis.expire(user_key, 86400)

            return True
        except Exception as e:
            logger.error(f"Error saving to Redis: {e}")
            return False

    async def load(self, conversation_id: str) -> Optional[ConversationContext]:
        if not self.redis:
            return None

        try:
            key = f"{self.prefix}{conversation_id}"
            data = await self.redis.get(key)

            if data:
                return self._deserialize_context(data)
        except Exception as e:
            logger.error(f"Error loading from Redis: {e}")

        return None

    async def delete(self, conversation_id: str) -> bool:
        if not self.redis:
            return False

        try:
            key = f"{self.prefix}{conversation_id}"
            result = await self.redis.delete(key)
            return result > 0
        except Exception as e:
            logger.error(f"Error deleting from Redis: {e}")
            return False

    async def exists(self, conversation_id: str) -> bool:
        if not self.redis:
            return False

        try:
            key = f"{self.prefix}{conversation_id}"
            return await self.redis.exists(key) > 0
        except Exception as e:
            logger.error(f"Error checking existence in Redis: {e}")
            return False

    async def list_conversations(self, user_id: str) -> List[str]:
        if not self.redis:
            return []

        try:
            user_key = f"{self.user_prefix}{user_id}"
            conversations = await self.redis.smembers(user_key)
            return list(conversations) if conversations else []
        except Exception as e:
            logger.error(f"Error listing conversations from Redis: {e}")
            return []

    def _serialize_context(self, context: ConversationContext) -> str:
        """Serializa contexto para JSON"""
        data = {
            "conversation_id": context.conversation_id,
            "user_id": context.user_id,
            "messages": context.messages,
            "executions": [
                self._serialize_execution(exec) for exec in context.executions
            ],
            "variables": context.variables,
            "intermediate_results": context.intermediate_results,
            "created_at": context.created_at.isoformat(),
            "updated_at": context.updated_at.isoformat(),
            "metadata": context.metadata,
        }
        return json.dumps(data)

    def _deserialize_context(self, data: str) -> ConversationContext:
        """Deserializa contexto de JSON"""
        obj = json.loads(data)
        return ConversationContext(
            conversation_id=obj["conversation_id"],
            user_id=obj["user_id"],
            messages=obj.get("messages", []),
            executions=[],  # Simplificado
            variables=obj.get("variables", {}),
            intermediate_results=obj.get("intermediate_results", {}),
            created_at=datetime.fromisoformat(obj["created_at"]),
            updated_at=datetime.fromisoformat(obj["updated_at"]),
            metadata=obj.get("metadata", {}),
        )

    def _serialize_execution(self, result: ExecutionResult) -> dict:
        """Serializa resultado de execução"""
        return {
            "status": result.status.value,
            "library_used": result.library_used,
            "execution_time": result.execution_time,
            "output": str(result.output)[:1000],  # Limitar tamanho
        }


# ============================================
# CONTEXT MANAGER
# ============================================


class ContextManager:
    """
    Gerenciador central de contexto de conversas

    Funcionalidades:
    - Criar e recuperar contextos
    - Adicionar mensagens e execuções
    - Armazenar variáveis e resultados intermediários
    - Limpar contextos antigos
    - Suportar múltiplos backends (memória, Redis)
    """

    def __init__(self, storage: Optional[ContextStorage] = None):
        self.storage = storage or InMemoryStorage()
        self._cleanup_task = None
        logger.info(f"ContextManager initialized with {type(self.storage).__name__}")

    async def get_or_create_context(
        self, conversation_id: str, user_id: str
    ) -> ConversationContext:
        """Recupera contexto existente ou cria novo"""
        context = await self.storage.load(conversation_id)

        if context:
            logger.debug(f"Loaded existing context: {conversation_id}")
            return context

        # Criar novo contexto
        context = ConversationContext(conversation_id=conversation_id, user_id=user_id)

        await self.storage.save(conversation_id, context)
        logger.info(f"Created new context: {conversation_id}")

        return context

    async def add_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        """Adiciona mensagem ao contexto"""
        context = await self.storage.load(conversation_id)

        if not context:
            logger.warning(f"Context not found: {conversation_id}")
            return

        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata or {},
        }

        context.messages.append(message)
        context.updated_at = datetime.now()

        await self.storage.save(conversation_id, context)
        logger.debug(f"Added message to {conversation_id}: {role}")

    async def add_execution(
        self, conversation_id: str, result: ExecutionResult
    ) -> bool:
        """Adiciona resultado de execução ao contexto"""
        context = await self.storage.load(conversation_id)

        if not context:
            logger.warning(f"Context not found: {conversation_id}")
            return False

        context.executions.append(result)
        context.updated_at = datetime.now()

        # Armazenar output em intermediate_results se for relevante
        if result.status.value == "success" and result.output:
            execution_id = f"exec_{len(context.executions)}"
            context.intermediate_results[execution_id] = result.output

        await self.storage.save(conversation_id, context)
        logger.debug(f"Added execution to {conversation_id}")
        return True

    async def set_variable(self, conversation_id: str, key: str, value: Any) -> bool:
        """Define variável de contexto"""
        context = await self.storage.load(conversation_id)

        if not context:
            logger.warning(f"Context not found: {conversation_id}")
            return False

        context.variables[key] = value
        context.updated_at = datetime.now()

        await self.storage.save(conversation_id, context)
        logger.debug(f"Set variable in {conversation_id}: {key}")
        return True

    async def get_variable(
        self, conversation_id: str, key: str, default: Any = None
    ) -> Any:
        """Recupera variável de contexto"""
        context = await self.storage.load(conversation_id)

        if not context:
            return default

        return context.variables.get(key, default)

    async def get_last_result(self, conversation_id: str) -> Optional[ExecutionResult]:
        """Recupera último resultado de execução"""
        context = await self.storage.load(conversation_id)

        if not context or not context.executions:
            return None

        return context.executions[-1]

    async def get_conversation_history(
        self, conversation_id: str, limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Recupera histórico de mensagens"""
        context = await self.storage.load(conversation_id)

        if not context:
            return []

        return context.messages[-limit:]

    async def clear_context(self, conversation_id: str) -> bool:
        """Limpa contexto específico"""
        return await self.storage.delete(conversation_id)

    async def list_user_conversations(self, user_id: str) -> List[str]:
        """Lista todas as conversas de um usuário"""
        return await self.storage.list_conversations(user_id)

    async def cleanup_old_contexts(self, max_age_hours: int = 24):
        """Remove contextos antigos"""
        logger.info(f"Cleaning up contexts older than {max_age_hours}h")

        # Para InMemoryStorage
        if isinstance(self.storage, InMemoryStorage):
            cutoff = datetime.now() - timedelta(hours=max_age_hours)
            to_delete = []

            for conv_id, context in self.storage.storage.items():
                if context.updated_at < cutoff:
                    to_delete.append(conv_id)

            for conv_id in to_delete:
                await self.storage.delete(conv_id)

            logger.info(f"Cleaned up {len(to_delete)} old contexts")

    async def start_cleanup_task(self, interval_hours: int = 6):
        """Inicia tarefa de limpeza periódica"""
        if self._cleanup_task:
            logger.warning("Cleanup task already running")
            return

        async def cleanup_loop():
            while True:
                try:
                    await asyncio.sleep(interval_hours * 3600)
                    await self.cleanup_old_contexts()
                except Exception as e:
                    logger.error(f"Error in cleanup task: {e}")

        self._cleanup_task = asyncio.create_task(cleanup_loop())
        logger.info(f"Started cleanup task (interval: {interval_hours}h)")

    async def stop_cleanup_task(self):
        """Para tarefa de limpeza"""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
            self._cleanup_task = None
            logger.info("Stopped cleanup task")

    async def get_context_summary(self, conversation_id: str) -> Dict[str, Any]:
        """Retorna resumo do contexto"""
        context = await self.storage.load(conversation_id)

        if not context:
            return {"exists": False}

        return {
            "exists": True,
            "conversation_id": context.conversation_id,
            "user_id": context.user_id,
            "message_count": len(context.messages),
            "execution_count": len(context.executions),
            "variables_count": len(context.variables),
            "intermediate_results_count": len(context.intermediate_results),
            "created_at": context.created_at.isoformat(),
            "updated_at": context.updated_at.isoformat(),
            "age_hours": (datetime.now() - context.created_at).total_seconds() / 3600,
        }


# ============================================
# HELPER FUNCTIONS
# ============================================


def create_context_manager(
    storage_type: str = "memory", redis_client=None
) -> ContextManager:
    """
    Factory para criar ContextManager

    Args:
        storage_type: "memory" ou "redis"
        redis_client: Cliente Redis (opcional)
    """
    if storage_type == "redis" and redis_client:
        storage = RedisStorage(redis_client)
    else:
        storage = InMemoryStorage()

    return ContextManager(storage)


# ============================================
# EXPORTS
# ============================================


__all__ = [
    "ContextStorage",
    "InMemoryStorage",
    "RedisStorage",
    "ContextManager",
    "create_context_manager",
]
