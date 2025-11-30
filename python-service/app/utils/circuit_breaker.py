"""
============================================
CIRCUIT BREAKER - External API Protection
============================================

Implementa padrão Circuit Breaker para proteger contra falhas
em APIs externas (Anthropic, OpenAI, Groq).

Estados:
- CLOSED: Normal, todas as chamadas passam
- OPEN: Muitas falhas, bloqueia chamadas
- HALF_OPEN: Teste se o serviço recuperou

Recursos:
- Fallback automático entre providers
- Timeout configurável
- Retry com backoff exponencial
- Métricas de falhas
============================================
"""

import asyncio
import time
from datetime import datetime, timedelta
from enum import Enum
from functools import wraps
from typing import Any, Callable, Dict, List, Optional

from loguru import logger


class CircuitState(Enum):
    """Estados do Circuit Breaker"""

    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Circuit tripped, blocking calls
    HALF_OPEN = "half_open"  # Testing if service recovered


class CircuitBreakerError(Exception):
    """Exceção quando o circuit breaker está aberto"""

    pass


class CircuitBreaker:
    """
    Circuit Breaker para proteger contra falhas em APIs externas
    """

    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout: int = 60,
        expected_exception: type = Exception,
    ):
        """
        Args:
            name: Nome do circuit breaker (ex: "anthropic", "openai")
            failure_threshold: Número de falhas antes de abrir o circuit
            recovery_timeout: Segundos antes de tentar recuperar
            expected_exception: Tipo de exceção a considerar como falha
        """
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception

        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._last_failure_time: Optional[datetime] = None
        self._last_success_time: Optional[datetime] = None
        self._total_calls = 0
        self._successful_calls = 0
        self._failed_calls = 0

    @property
    def state(self) -> CircuitState:
        """Retorna o estado atual do circuit breaker"""
        # Se está aberto, verifica se já passou o timeout de recuperação
        if self._state == CircuitState.OPEN:
            if (
                self._last_failure_time
                and (datetime.now() - self._last_failure_time).total_seconds()
                >= self.recovery_timeout
            ):
                self._state = CircuitState.HALF_OPEN
                logger.info(
                    f"Circuit breaker {self.name} entering HALF_OPEN state for testing"
                )

        return self._state

    def record_success(self):
        """Registra uma chamada bem-sucedida"""
        self._successful_calls += 1
        self._last_success_time = datetime.now()

        if self._state == CircuitState.HALF_OPEN:
            # Recuperou! Volta ao normal
            self._state = CircuitState.CLOSED
            self._failure_count = 0
            logger.info(f"Circuit breaker {self.name} recovered, state: CLOSED")

    def record_failure(self):
        """Registra uma falha"""
        self._failed_calls += 1
        self._failure_count += 1
        self._last_failure_time = datetime.now()

        if self._failure_count >= self.failure_threshold:
            if self._state != CircuitState.OPEN:
                self._state = CircuitState.OPEN
                logger.error(
                    f"Circuit breaker {self.name} OPENED after {self._failure_count} failures"
                )

    def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Executa função protegida pelo circuit breaker

        Args:
            func: Função a ser executada
            *args, **kwargs: Argumentos da função

        Returns:
            Resultado da função

        Raises:
            CircuitBreakerError: Se o circuit está aberto
        """
        self._total_calls += 1

        if self.state == CircuitState.OPEN:
            raise CircuitBreakerError(
                f"Circuit breaker {self.name} is OPEN. Service unavailable."
            )

        try:
            result = func(*args, **kwargs)
            self.record_success()
            return result
        except self.expected_exception as e:
            self.record_failure()
            raise e

    async def call_async(self, func: Callable, *args, **kwargs) -> Any:
        """
        Versão assíncrona de call()

        Args:
            func: Função async a ser executada
            *args, **kwargs: Argumentos da função

        Returns:
            Resultado da função

        Raises:
            CircuitBreakerError: Se o circuit está aberto
        """
        self._total_calls += 1

        if self.state == CircuitState.OPEN:
            raise CircuitBreakerError(
                f"Circuit breaker {self.name} is OPEN. Service unavailable."
            )

        try:
            result = await func(*args, **kwargs)
            self.record_success()
            return result
        except self.expected_exception as e:
            self.record_failure()
            raise e

    def get_metrics(self) -> Dict[str, Any]:
        """Retorna métricas do circuit breaker"""
        success_rate = (
            (self._successful_calls / self._total_calls * 100)
            if self._total_calls > 0
            else 0
        )

        return {
            "name": self.name,
            "state": self.state.value,
            "total_calls": self._total_calls,
            "successful_calls": self._successful_calls,
            "failed_calls": self._failed_calls,
            "success_rate": round(success_rate, 2),
            "failure_count": self._failure_count,
            "last_failure_time": (
                self._last_failure_time.isoformat() if self._last_failure_time else None
            ),
            "last_success_time": (
                self._last_success_time.isoformat() if self._last_success_time else None
            ),
        }

    def reset(self):
        """Reset do circuit breaker (útil para testes)"""
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._last_failure_time = None
        logger.info(f"Circuit breaker {self.name} reset to CLOSED")


# ==========================================
# CIRCUIT BREAKER MANAGER
# ==========================================


class CircuitBreakerManager:
    """Gerencia múltiplos circuit breakers"""

    def __init__(self):
        self._breakers: Dict[str, CircuitBreaker] = {}

    def get_breaker(self, name: str) -> CircuitBreaker:
        """
        Obtém ou cria um circuit breaker

        Args:
            name: Nome do circuit breaker

        Returns:
            CircuitBreaker instance
        """
        if name not in self._breakers:
            self._breakers[name] = CircuitBreaker(
                name=name,
                failure_threshold=5,
                recovery_timeout=60,
            )
            logger.info(f"Created circuit breaker: {name}")

        return self._breakers[name]

    def get_all_metrics(self) -> Dict[str, Dict[str, Any]]:
        """Retorna métricas de todos os circuit breakers"""
        return {name: breaker.get_metrics() for name, breaker in self._breakers.items()}

    def reset_all(self):
        """Reset de todos os circuit breakers"""
        for breaker in self._breakers.values():
            breaker.reset()


# Instância global
circuit_manager = CircuitBreakerManager()


# ==========================================
# DECORATOR PARA CIRCUIT BREAKER
# ==========================================


def circuit_breaker(provider_name: str):
    """
    Decorator para aplicar circuit breaker a funções

    Usage:
        @circuit_breaker("anthropic")
        async def call_anthropic_api():
            ...
    """

    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            breaker = circuit_manager.get_breaker(provider_name)

            try:
                return await breaker.call_async(func, *args, **kwargs)
            except CircuitBreakerError as e:
                logger.warning(f"Circuit breaker {provider_name} blocked call: {e}")
                raise

        return wrapper

    return decorator


# ==========================================
# PROVIDER FALLBACK SYSTEM
# ==========================================


class AIProviderFallback:
    """
    Sistema de fallback automático entre providers de IA
    Tenta providers na ordem até encontrar um que funcione
    """

    def __init__(self):
        self.providers = ["anthropic", "openai", "groq"]
        self.circuit_manager = circuit_manager

    async def call_with_fallback(
        self,
        provider_functions: Dict[str, Callable],
        *args,
        **kwargs,
    ) -> Any:
        """
        Tenta chamar providers na ordem até conseguir

        Args:
            provider_functions: Dict com funções de cada provider
                Exemplo: {
                    "anthropic": call_anthropic,
                    "openai": call_openai,
                    "groq": call_groq
                }
            *args, **kwargs: Argumentos para as funções

        Returns:
            Resultado do primeiro provider que funcionar

        Raises:
            Exception: Se todos os providers falharem
        """
        errors = []

        for provider_name in self.providers:
            if provider_name not in provider_functions:
                continue

            breaker = self.circuit_manager.get_breaker(provider_name)

            # Pula se o circuit está aberto
            if breaker.state == CircuitState.OPEN:
                logger.warning(f"Skipping {provider_name} - circuit breaker is OPEN")
                continue

            try:
                logger.info(f"Trying provider: {provider_name}")
                func = provider_functions[provider_name]
                result = await breaker.call_async(func, *args, **kwargs)
                logger.success(f"Provider {provider_name} succeeded")
                return result

            except CircuitBreakerError as e:
                errors.append(f"{provider_name}: {str(e)}")
                logger.warning(f"Provider {provider_name} circuit breaker blocked")
                continue

            except Exception as e:
                errors.append(f"{provider_name}: {str(e)}")
                logger.error(f"Provider {provider_name} failed: {e}")
                continue

        # Todos falharam
        error_msg = f"All AI providers failed. Errors: {'; '.join(errors)}"
        logger.error(error_msg)
        raise Exception(error_msg)


# Instância global
ai_fallback = AIProviderFallback()


# ==========================================
# HELPER FUNCTIONS
# ==========================================


async def call_with_retry(
    func: Callable,
    max_retries: int = 3,
    initial_delay: float = 1.0,
    backoff_factor: float = 2.0,
) -> Any:
    """
    Executa função com retry e backoff exponencial

    Args:
        func: Função async a executar
        max_retries: Número máximo de tentativas
        initial_delay: Delay inicial em segundos
        backoff_factor: Fator de multiplicação do delay

    Returns:
        Resultado da função

    Raises:
        Exception: Se todas as tentativas falharem
    """
    delay = initial_delay
    last_exception = None

    for attempt in range(max_retries):
        try:
            return await func()
        except Exception as e:
            last_exception = e
            if attempt < max_retries - 1:
                logger.warning(
                    f"Attempt {attempt + 1}/{max_retries} failed: {e}. "
                    f"Retrying in {delay}s..."
                )
                await asyncio.sleep(delay)
                delay *= backoff_factor
            else:
                logger.error(f"All {max_retries} attempts failed")

    raise last_exception


# ==========================================
# EXEMPLO DE USO
# ==========================================

"""
# Uso com decorator
@circuit_breaker("anthropic")
async def call_anthropic(prompt: str):
    # Sua chamada à API Anthropic
    response = await anthropic_client.messages.create(...)
    return response

# Uso com fallback
async def generate_response(prompt: str):
    provider_functions = {
        "anthropic": lambda: call_anthropic(prompt),
        "openai": lambda: call_openai(prompt),
        "groq": lambda: call_groq(prompt),
    }

    return await ai_fallback.call_with_fallback(provider_functions)

# Verificar métricas
metrics = circuit_manager.get_all_metrics()
print(metrics)
"""
