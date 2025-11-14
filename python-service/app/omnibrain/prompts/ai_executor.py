"""
============================================
SYNCADS OMNIBRAIN - AI PROMPT EXECUTOR
============================================
Executor de Prompts com IA (OpenAI/Anthropic)

Responsável por:
- Executar prompts com modelos de IA
- Suporte a OpenAI (GPT-4, GPT-3.5)
- Suporte a Anthropic (Claude)
- Retry automático
- Fallback entre provedores
- Parse de respostas JSON
- Rate limiting
- Cache de respostas

Autor: SyncAds AI Team
Versão: 1.0.0
Data: 2025-01-15
============================================
"""

import asyncio
import hashlib
import json
import logging
import os
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Union

from . import get_prompt, get_system_message, render_prompt

logger = logging.getLogger("omnibrain.prompts.ai_executor")


# ============================================
# CONFIGURATION
# ============================================


class AIProvider(Enum):
    """Provedores de IA suportados"""

    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    FALLBACK = "fallback"


class ModelName(Enum):
    """Modelos disponíveis"""

    # OpenAI
    GPT_4 = "gpt-4"
    GPT_4_TURBO = "gpt-4-turbo-preview"
    GPT_35_TURBO = "gpt-3.5-turbo"

    # Anthropic
    CLAUDE_3_OPUS = "claude-3-opus-20240229"
    CLAUDE_3_SONNET = "claude-3-sonnet-20240229"
    CLAUDE_3_HAIKU = "claude-3-haiku-20240307"


# ============================================
# CACHE MANAGER
# ============================================


class PromptCache:
    """Cache simples para respostas de prompts"""

    def __init__(self, ttl_seconds: int = 3600):
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.ttl = ttl_seconds

    def _generate_key(self, prompt_name: str, variables: Dict[str, Any]) -> str:
        """Gera chave única para cache"""
        content = f"{prompt_name}:{json.dumps(variables, sort_keys=True)}"
        return hashlib.md5(content.encode()).hexdigest()

    def get(self, prompt_name: str, variables: Dict[str, Any]) -> Optional[str]:
        """Recupera resposta do cache"""
        key = self._generate_key(prompt_name, variables)
        entry = self.cache.get(key)

        if not entry:
            return None

        # Verificar TTL
        if datetime.now() > entry["expires_at"]:
            del self.cache[key]
            return None

        logger.debug(f"Cache hit for {prompt_name}")
        return entry["response"]

    def set(self, prompt_name: str, variables: Dict[str, Any], response: str):
        """Armazena resposta no cache"""
        key = self._generate_key(prompt_name, variables)
        self.cache[key] = {
            "response": response,
            "expires_at": datetime.now() + timedelta(seconds=self.ttl),
        }
        logger.debug(f"Cached response for {prompt_name}")

    def clear(self):
        """Limpa todo o cache"""
        self.cache.clear()


# ============================================
# AI CLIENT WRAPPERS
# ============================================


class OpenAIClient:
    """Wrapper para OpenAI API"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")

        if not self.api_key:
            logger.warning("OpenAI API key not found")
            self.client = None
        else:
            try:
                from openai import AsyncOpenAI

                self.client = AsyncOpenAI(api_key=self.api_key)
                logger.info("OpenAI client initialized")
            except ImportError:
                logger.error("openai package not installed")
                self.client = None

    async def complete(
        self,
        system_message: str,
        user_message: str,
        model: str = "gpt-4-turbo-preview",
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> str:
        """Executa completion"""
        if not self.client:
            raise RuntimeError("OpenAI client not available")

        try:
            response = await self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_message},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )

            return response.choices[0].message.content

        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise


class AnthropicClient:
    """Wrapper para Anthropic API"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")

        if not self.api_key:
            logger.warning("Anthropic API key not found")
            self.client = None
        else:
            try:
                import anthropic

                self.client = anthropic.AsyncAnthropic(api_key=self.api_key)
                logger.info("Anthropic client initialized")
            except ImportError:
                logger.error("anthropic package not installed")
                self.client = None

    async def complete(
        self,
        system_message: str,
        user_message: str,
        model: str = "claude-3-sonnet-20240229",
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> str:
        """Executa completion"""
        if not self.client:
            raise RuntimeError("Anthropic client not available")

        try:
            response = await self.client.messages.create(
                model=model,
                system=system_message,
                messages=[{"role": "user", "content": user_message}],
                temperature=temperature,
                max_tokens=max_tokens,
            )

            return response.content[0].text

        except Exception as e:
            logger.error(f"Anthropic API error: {e}")
            raise


# ============================================
# AI PROMPT EXECUTOR
# ============================================


class AIPromptExecutor:
    """
    Executor principal de prompts com IA

    Features:
    - Multi-provider (OpenAI, Anthropic)
    - Retry automático
    - Fallback entre provedores
    - Cache de respostas
    - Parse de JSON
    - Rate limiting
    """

    def __init__(
        self,
        primary_provider: AIProvider = AIProvider.OPENAI,
        enable_cache: bool = True,
        cache_ttl: int = 3600,
        max_retries: int = 3,
    ):
        self.primary_provider = primary_provider
        self.max_retries = max_retries

        # Inicializar clients
        self.openai_client = OpenAIClient()
        self.anthropic_client = AnthropicClient()

        # Cache
        self.cache = PromptCache(ttl_seconds=cache_ttl) if enable_cache else None

        # Estatísticas
        self.stats = {
            "total_requests": 0,
            "cache_hits": 0,
            "openai_requests": 0,
            "anthropic_requests": 0,
            "errors": 0,
        }

        logger.info(f"AIPromptExecutor initialized (primary: {primary_provider.value})")

    async def execute_prompt(
        self,
        prompt_name: str,
        variables: Optional[Dict[str, Any]] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        use_cache: bool = True,
    ) -> str:
        """
        Executa prompt com IA

        Args:
            prompt_name: Nome do prompt (ex: "task_analysis")
            variables: Variáveis para renderizar no prompt
            model: Modelo específico (opcional)
            temperature: Temperatura (0-1)
            max_tokens: Máximo de tokens
            use_cache: Usar cache de respostas

        Returns:
            Resposta da IA (string)
        """
        self.stats["total_requests"] += 1
        variables = variables or {}

        # Verificar cache
        if use_cache and self.cache:
            cached = self.cache.get(prompt_name, variables)
            if cached:
                self.stats["cache_hits"] += 1
                return cached

        # Renderizar prompt
        user_message = render_prompt(prompt_name, **variables)
        system_message = get_system_message(prompt_name)

        if not system_message:
            system_message = "You are a helpful AI assistant."

        # Executar com retry e fallback
        response = await self._execute_with_retry(
            system_message, user_message, model, temperature, max_tokens
        )

        # Cachear resposta
        if use_cache and self.cache:
            self.cache.set(prompt_name, variables, response)

        return response

    async def _execute_with_retry(
        self,
        system_message: str,
        user_message: str,
        model: Optional[str],
        temperature: float,
        max_tokens: int,
    ) -> str:
        """Executa com retry e fallback"""

        providers_to_try = [self.primary_provider]

        # Adicionar fallback
        if self.primary_provider == AIProvider.OPENAI:
            providers_to_try.append(AIProvider.ANTHROPIC)
        else:
            providers_to_try.append(AIProvider.OPENAI)

        last_error = None

        for provider in providers_to_try:
            for attempt in range(1, self.max_retries + 1):
                try:
                    response = await self._execute_with_provider(
                        provider,
                        system_message,
                        user_message,
                        model,
                        temperature,
                        max_tokens,
                    )

                    logger.info(
                        f"Prompt executed successfully with {provider.value} (attempt {attempt})"
                    )
                    return response

                except Exception as e:
                    last_error = e
                    logger.warning(
                        f"{provider.value} failed (attempt {attempt}/{self.max_retries}): {e}"
                    )

                    # Aguardar antes de retry
                    if attempt < self.max_retries:
                        await asyncio.sleep(2**attempt)  # Exponential backoff

            # Provider falhou, tentar próximo
            logger.info(f"Switching to fallback provider")

        # Todos falharam
        self.stats["errors"] += 1
        raise RuntimeError(f"All AI providers failed. Last error: {last_error}")

    async def _execute_with_provider(
        self,
        provider: AIProvider,
        system_message: str,
        user_message: str,
        model: Optional[str],
        temperature: float,
        max_tokens: int,
    ) -> str:
        """Executa com provedor específico"""

        if provider == AIProvider.OPENAI:
            if not self.openai_client.client:
                raise RuntimeError("OpenAI client not available")

            self.stats["openai_requests"] += 1
            model = model or ModelName.GPT_4_TURBO.value

            return await self.openai_client.complete(
                system_message, user_message, model, temperature, max_tokens
            )

        elif provider == AIProvider.ANTHROPIC:
            if not self.anthropic_client.client:
                raise RuntimeError("Anthropic client not available")

            self.stats["anthropic_requests"] += 1
            model = model or ModelName.CLAUDE_3_SONNET.value

            return await self.anthropic_client.complete(
                system_message, user_message, model, temperature, max_tokens
            )

        else:
            raise ValueError(f"Unknown provider: {provider}")

    async def execute_and_parse_json(
        self,
        prompt_name: str,
        variables: Optional[Dict[str, Any]] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Executa prompt e faz parse do JSON na resposta

        Útil para prompts que retornam dados estruturados
        """
        response = await self.execute_prompt(prompt_name, variables, **kwargs)

        # Tentar extrair JSON do response
        try:
            # Buscar JSON em code blocks
            import re

            json_match = re.search(
                r"```(?:json)?\s*(\{.*?\})\s*```", response, re.DOTALL
            )
            if json_match:
                json_str = json_match.group(1)
            else:
                # Tentar parse direto
                json_str = response

            return json.loads(json_str)

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from response: {e}")
            logger.debug(f"Response was: {response}")

            # Tentar limpar e parse novamente
            cleaned = response.strip()
            if cleaned.startswith("```") and cleaned.endswith("```"):
                cleaned = cleaned[3:-3].strip()
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:].strip()

            try:
                return json.loads(cleaned)
            except:
                raise ValueError(
                    f"Could not parse JSON from AI response: {response[:200]}"
                )

    def get_statistics(self) -> Dict[str, Any]:
        """Retorna estatísticas de uso"""
        cache_hit_rate = 0.0
        if self.stats["total_requests"] > 0:
            cache_hit_rate = (
                self.stats["cache_hits"] / self.stats["total_requests"] * 100
            )

        return {
            **self.stats,
            "cache_hit_rate": round(cache_hit_rate, 2),
            "cache_size": len(self.cache.cache) if self.cache else 0,
        }

    def clear_cache(self):
        """Limpa cache de respostas"""
        if self.cache:
            self.cache.clear()
            logger.info("Prompt cache cleared")


# ============================================
# SINGLETON INSTANCE
# ============================================


_executor_instance: Optional[AIPromptExecutor] = None


def get_ai_executor() -> AIPromptExecutor:
    """Retorna instância singleton do executor"""
    global _executor_instance
    if _executor_instance is None:
        # Determinar provider padrão
        if os.getenv("OPENAI_API_KEY"):
            provider = AIProvider.OPENAI
        elif os.getenv("ANTHROPIC_API_KEY"):
            provider = AIProvider.ANTHROPIC
        else:
            logger.warning("No AI provider API key found")
            provider = AIProvider.OPENAI  # Tentar mesmo sem key

        _executor_instance = AIPromptExecutor(primary_provider=provider)

    return _executor_instance


# ============================================
# CONVENIENCE FUNCTIONS
# ============================================


async def execute_ai_prompt(
    prompt_name: str, variables: Optional[Dict[str, Any]] = None, **kwargs
) -> str:
    """Atalho para executar prompt"""
    executor = get_ai_executor()
    return await executor.execute_prompt(prompt_name, variables, **kwargs)


async def execute_ai_prompt_json(
    prompt_name: str, variables: Optional[Dict[str, Any]] = None, **kwargs
) -> Dict[str, Any]:
    """Atalho para executar prompt e parsear JSON"""
    executor = get_ai_executor()
    return await executor.execute_and_parse_json(prompt_name, variables, **kwargs)


def is_ai_available() -> bool:
    """Verifica se há IA disponível"""
    return bool(os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY"))


# ============================================
# EXPORTS
# ============================================


__all__ = [
    "AIProvider",
    "ModelName",
    "AIPromptExecutor",
    "get_ai_executor",
    "execute_ai_prompt",
    "execute_ai_prompt_json",
    "is_ai_available",
]
