"""
============================================
SYNCADS OMNIBRAIN - CACHE MANAGER
============================================
Sistema de Cache para Resultados de Execução

Responsável por:
- Cachear resultados de execuções
- Evitar re-execuções desnecessárias
- Suporte a múltiplos backends (memória, Redis)
- TTL configurável
- Invalidação de cache
- Estatísticas de uso
- Limpeza automática

Autor: SyncAds AI Team
Versão: 1.0.0
Data: 2025-01-15
============================================
"""

import asyncio
import hashlib
import json
import logging
import pickle
from abc import ABC, abstractmethod
from collections import OrderedDict
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

logger = logging.getLogger("omnibrain.cache")


# ============================================
# CACHE KEY GENERATOR
# ============================================


class CacheKeyGenerator:
    """Gera chaves únicas para cache"""

    @staticmethod
    def generate(command: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Gera chave única baseada em comando e contexto

        Args:
            command: Comando do usuário
            context: Contexto adicional

        Returns:
            Hash MD5 como chave
        """
        # Normalizar comando
        normalized_command = command.strip().lower()

        # Incluir contexto relevante
        context_str = ""
        if context:
            # Apenas campos relevantes para cache
            relevant_fields = ["files", "options", "task_type"]
            relevant_context = {
                k: v for k, v in context.items() if k in relevant_fields
            }
            context_str = json.dumps(relevant_context, sort_keys=True)

        # Gerar hash
        content = f"{normalized_command}:{context_str}"
        return hashlib.md5(content.encode()).hexdigest()


# ============================================
# CACHE BACKEND INTERFACE
# ============================================


class CacheBackend(ABC):
    """Interface abstrata para backends de cache"""

    @abstractmethod
    async def get(self, key: str) -> Optional[Any]:
        """Recupera valor do cache"""
        pass

    @abstractmethod
    async def set(self, key: str, value: Any, ttl: int) -> bool:
        """Armazena valor no cache"""
        pass

    @abstractmethod
    async def delete(self, key: str) -> bool:
        """Remove valor do cache"""
        pass

    @abstractmethod
    async def exists(self, key: str) -> bool:
        """Verifica se chave existe"""
        pass

    @abstractmethod
    async def clear(self) -> bool:
        """Limpa todo o cache"""
        pass

    @abstractmethod
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas"""
        pass


# ============================================
# IN-MEMORY BACKEND (LRU)
# ============================================


class InMemoryBackend(CacheBackend):
    """Backend em memória com LRU"""

    def __init__(self, max_size: int = 1000):
        self.cache = OrderedDict()
        self.max_size = max_size
        self.hits = 0
        self.misses = 0
        logger.info(f"InMemoryBackend initialized (max_size: {max_size})")

    async def get(self, key: str) -> Optional[Any]:
        """Recupera do cache"""
        if key not in self.cache:
            self.misses += 1
            return None

        entry = self.cache[key]

        # Verificar TTL
        if datetime.now() > entry["expires_at"]:
            del self.cache[key]
            self.misses += 1
            return None

        # Move para o fim (LRU)
        self.cache.move_to_end(key)
        self.hits += 1
        return entry["value"]

    async def set(self, key: str, value: Any, ttl: int) -> bool:
        """Armazena no cache"""
        try:
            # Remover mais antigo se exceder tamanho
            if len(self.cache) >= self.max_size:
                oldest_key = next(iter(self.cache))
                del self.cache[oldest_key]
                logger.debug(f"Evicted oldest key: {oldest_key}")

            self.cache[key] = {
                "value": value,
                "expires_at": datetime.now() + timedelta(seconds=ttl),
                "created_at": datetime.now(),
            }

            return True
        except Exception as e:
            logger.error(f"Error setting cache: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """Remove do cache"""
        if key in self.cache:
            del self.cache[key]
            return True
        return False

    async def exists(self, key: str) -> bool:
        """Verifica existência"""
        if key not in self.cache:
            return False

        entry = self.cache[key]
        if datetime.now() > entry["expires_at"]:
            del self.cache[key]
            return False

        return True

    async def clear(self) -> bool:
        """Limpa tudo"""
        self.cache.clear()
        self.hits = 0
        self.misses = 0
        return True

    def get_stats(self) -> Dict[str, Any]:
        """Estatísticas"""
        total_requests = self.hits + self.misses
        hit_rate = (self.hits / total_requests * 100) if total_requests > 0 else 0

        return {
            "backend": "in_memory",
            "size": len(self.cache),
            "max_size": self.max_size,
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": round(hit_rate, 2),
        }


# ============================================
# REDIS BACKEND
# ============================================


class RedisBackend(CacheBackend):
    """Backend Redis"""

    def __init__(self, redis_client=None, prefix: str = "omnibrain:cache:"):
        self.redis = redis_client
        self.prefix = prefix
        self.hits = 0
        self.misses = 0
        logger.info("RedisBackend initialized")

    async def get(self, key: str) -> Optional[Any]:
        """Recupera do Redis"""
        if not self.redis:
            return None

        try:
            full_key = f"{self.prefix}{key}"
            data = await self.redis.get(full_key)

            if data:
                self.hits += 1
                return pickle.loads(data)
            else:
                self.misses += 1
                return None

        except Exception as e:
            logger.error(f"Redis get error: {e}")
            self.misses += 1
            return None

    async def set(self, key: str, value: Any, ttl: int) -> bool:
        """Armazena no Redis"""
        if not self.redis:
            return False

        try:
            full_key = f"{self.prefix}{key}"
            data = pickle.dumps(value)
            await self.redis.setex(full_key, ttl, data)
            return True

        except Exception as e:
            logger.error(f"Redis set error: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """Remove do Redis"""
        if not self.redis:
            return False

        try:
            full_key = f"{self.prefix}{key}"
            result = await self.redis.delete(full_key)
            return result > 0

        except Exception as e:
            logger.error(f"Redis delete error: {e}")
            return False

    async def exists(self, key: str) -> bool:
        """Verifica existência no Redis"""
        if not self.redis:
            return False

        try:
            full_key = f"{self.prefix}{key}"
            return await self.redis.exists(full_key) > 0

        except Exception as e:
            logger.error(f"Redis exists error: {e}")
            return False

    async def clear(self) -> bool:
        """Limpa cache (pattern match)"""
        if not self.redis:
            return False

        try:
            pattern = f"{self.prefix}*"
            keys = await self.redis.keys(pattern)
            if keys:
                await self.redis.delete(*keys)
            return True

        except Exception as e:
            logger.error(f"Redis clear error: {e}")
            return False

    def get_stats(self) -> Dict[str, Any]:
        """Estatísticas"""
        total_requests = self.hits + self.misses
        hit_rate = (self.hits / total_requests * 100) if total_requests > 0 else 0

        return {
            "backend": "redis",
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": round(hit_rate, 2),
            "connected": self.redis is not None,
        }


# ============================================
# CACHE MANAGER
# ============================================


class CacheManager:
    """
    Gerenciador central de cache

    Features:
    - Cache de resultados de execução
    - TTL configurável
    - Múltiplos backends
    - Invalidação por padrão
    - Estatísticas
    """

    def __init__(
        self,
        backend: Optional[CacheBackend] = None,
        default_ttl: int = 3600,
        enable_cache: bool = True,
    ):
        self.backend = backend or InMemoryBackend()
        self.default_ttl = default_ttl
        self.enable_cache = enable_cache
        self.key_generator = CacheKeyGenerator()

        logger.info(
            f"CacheManager initialized (backend: {type(self.backend).__name__}, "
            f"ttl: {default_ttl}s, enabled: {enable_cache})"
        )

    async def get_cached_result(
        self, command: str, context: Optional[Dict[str, Any]] = None
    ) -> Optional[Any]:
        """
        Recupera resultado cacheado

        Args:
            command: Comando do usuário
            context: Contexto adicional

        Returns:
            Resultado cacheado ou None
        """
        if not self.enable_cache:
            return None

        key = self.key_generator.generate(command, context)
        result = await self.backend.get(key)

        if result:
            logger.info(f"Cache hit for command: {command[:50]}...")
        else:
            logger.debug(f"Cache miss for command: {command[:50]}...")

        return result

    async def cache_result(
        self,
        command: str,
        result: Any,
        context: Optional[Dict[str, Any]] = None,
        ttl: Optional[int] = None,
    ) -> bool:
        """
        Cacheia resultado

        Args:
            command: Comando do usuário
            result: Resultado a cachear
            context: Contexto adicional
            ttl: TTL em segundos (usa default se None)

        Returns:
            True se cacheado com sucesso
        """
        if not self.enable_cache:
            return False

        key = self.key_generator.generate(command, context)
        ttl = ttl or self.default_ttl

        success = await self.backend.set(key, result, ttl)

        if success:
            logger.debug(f"Cached result for command: {command[:50]}...")

        return success

    async def invalidate_cache(
        self, command: str, context: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Invalida cache específico

        Args:
            command: Comando a invalidar
            context: Contexto

        Returns:
            True se removido
        """
        key = self.key_generator.generate(command, context)
        return await self.backend.delete(key)

    async def clear_all(self) -> bool:
        """Limpa todo o cache"""
        success = await self.backend.clear()
        if success:
            logger.info("Cache cleared completely")
        return success

    def get_statistics(self) -> Dict[str, Any]:
        """Retorna estatísticas do cache"""
        stats = self.backend.get_stats()
        stats["enabled"] = self.enable_cache
        stats["default_ttl"] = self.default_ttl
        return stats

    def disable(self):
        """Desabilita cache"""
        self.enable_cache = False
        logger.info("Cache disabled")

    def enable(self):
        """Habilita cache"""
        self.enable_cache = True
        logger.info("Cache enabled")


# ============================================
# SINGLETON
# ============================================


_cache_manager_instance: Optional[CacheManager] = None


def get_cache_manager() -> CacheManager:
    """Retorna instância singleton"""
    global _cache_manager_instance
    if _cache_manager_instance is None:
        _cache_manager_instance = CacheManager()
    return _cache_manager_instance


def create_cache_manager(
    backend_type: str = "memory", redis_client=None, **kwargs
) -> CacheManager:
    """
    Factory para criar CacheManager

    Args:
        backend_type: "memory" ou "redis"
        redis_client: Cliente Redis (se backend_type="redis")
        **kwargs: Argumentos adicionais para CacheManager
    """
    if backend_type == "redis" and redis_client:
        backend = RedisBackend(redis_client)
    else:
        backend = InMemoryBackend(max_size=kwargs.get("max_size", 1000))

    return CacheManager(backend=backend, **kwargs)


# ============================================
# EXPORTS
# ============================================


__all__ = [
    "CacheManager",
    "CacheBackend",
    "InMemoryBackend",
    "RedisBackend",
    "CacheKeyGenerator",
    "get_cache_manager",
    "create_cache_manager",
]
