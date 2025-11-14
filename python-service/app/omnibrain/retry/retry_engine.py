"""
============================================
SYNCADS OMNIBRAIN - RETRY ENGINE
============================================
Sistema Inteligente de Retry com Estratégias Avançadas

Responsável por:
- Gerenciar estratégias de retry
- Implementar backoff exponencial
- Circuit breaker pattern
- Análise de falhas
- Decisões inteligentes de retry
- Tracking de tentativas
- Estatísticas de sucesso/falha
- Adaptive retry (aprende com histórico)
- Jitter para evitar thundering herd
- Rate limiting

Autor: SyncAds AI Team
Versão: 1.0.0
============================================
"""

import asyncio
import logging
import random
import time
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Tuple

logger = logging.getLogger("omnibrain.retry")


# ============================================
# ENUMS & TYPES
# ============================================


class RetryStrategy(Enum):
    """Estratégias de retry"""

    IMMEDIATE = "immediate"  # Tenta imediatamente
    LINEAR = "linear"  # Delay linear (1s, 2s, 3s...)
    EXPONENTIAL = "exponential"  # Backoff exponencial (1s, 2s, 4s, 8s...)
    FIBONACCI = "fibonacci"  # Sequência Fibonacci (1s, 1s, 2s, 3s, 5s...)
    RANDOM = "random"  # Delay aleatório
    ADAPTIVE = "adaptive"  # Aprende com histórico
    NONE = "none"  # Não fazer retry


class CircuitState(Enum):
    """Estados do circuit breaker"""

    CLOSED = "closed"  # Normal - permite requisições
    OPEN = "open"  # Aberto - rejeita requisições
    HALF_OPEN = "half_open"  # Meio-aberto - testando recuperação


class FailureType(Enum):
    """Tipos de falha"""

    TIMEOUT = "timeout"
    NETWORK = "network"
    VALIDATION = "validation"
    LIBRARY_ERROR = "library_error"
    CODE_ERROR = "code_error"
    RESOURCE_EXHAUSTED = "resource_exhausted"
    RATE_LIMIT = "rate_limit"
    UNKNOWN = "unknown"


# ============================================
# DATA CLASSES
# ============================================


@dataclass
class RetryConfig:
    """Configuração de retry"""

    strategy: RetryStrategy = RetryStrategy.EXPONENTIAL
    max_attempts: int = 5
    initial_delay: float = 1.0
    max_delay: float = 60.0
    exponential_base: float = 2.0
    jitter: bool = True
    jitter_range: float = 0.3  # ±30%

    # Circuit breaker
    enable_circuit_breaker: bool = True
    circuit_failure_threshold: int = 5
    circuit_success_threshold: int = 2
    circuit_timeout: float = 30.0  # segundos

    # Adaptive
    enable_adaptive: bool = True
    learning_rate: float = 0.1

    # Rate limiting
    enable_rate_limit: bool = False
    max_requests_per_second: float = 10.0


@dataclass
class RetryAttempt:
    """Registro de tentativa"""

    attempt_number: int
    timestamp: datetime
    delay_before: float
    library_used: str
    error_type: Optional[str] = None
    error_message: Optional[str] = None
    success: bool = False
    execution_time: float = 0.0


@dataclass
class RetryContext:
    """Contexto completo de retry"""

    task_id: str
    library_name: str
    failure_type: FailureType
    error_message: str
    attempt_number: int
    max_attempts: int
    previous_attempts: List[RetryAttempt] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RetryDecision:
    """Decisão sobre retry"""

    should_retry: bool
    strategy: RetryStrategy
    delay_seconds: float
    next_library: Optional[str]
    reasoning: str
    confidence: float
    switch_library: bool = False
    use_hybrid: bool = False


# ============================================
# CIRCUIT BREAKER
# ============================================


class CircuitBreaker:
    """
    Implementação do Circuit Breaker Pattern

    Estados:
    - CLOSED: Normal, permite requisições
    - OPEN: Detectou muitas falhas, rejeita requisições
    - HALF_OPEN: Testando se sistema recuperou
    """

    def __init__(
        self,
        failure_threshold: int = 5,
        success_threshold: int = 2,
        timeout: float = 30.0,
    ):
        self.failure_threshold = failure_threshold
        self.success_threshold = success_threshold
        self.timeout = timeout

        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: Optional[datetime] = None

        logger.info(
            f"CircuitBreaker initialized: threshold={failure_threshold}, timeout={timeout}s"
        )

    def call(self, func: Callable, *args, **kwargs) -> Tuple[bool, Any, Optional[str]]:
        """
        Executa função com circuit breaker

        Returns:
            (allowed, result, error)
        """

        # Check circuit state
        if self.state == CircuitState.OPEN:
            # Check if timeout expired
            if self._should_attempt_reset():
                logger.info("Circuit breaker: Attempting reset (HALF_OPEN)")
                self.state = CircuitState.HALF_OPEN
            else:
                logger.warning("Circuit breaker: OPEN - Request rejected")
                return False, None, "Circuit breaker is OPEN"

        # Execute function
        try:
            result = func(*args, **kwargs)
            self._on_success()
            return True, result, None

        except Exception as e:
            self._on_failure()
            return False, None, str(e)

    async def call_async(
        self, func: Callable, *args, **kwargs
    ) -> Tuple[bool, Any, Optional[str]]:
        """Versão async do call"""

        if self.state == CircuitState.OPEN:
            if self._should_attempt_reset():
                self.state = CircuitState.HALF_OPEN
            else:
                return False, None, "Circuit breaker is OPEN"

        try:
            result = await func(*args, **kwargs)
            self._on_success()
            return True, result, None

        except Exception as e:
            self._on_failure()
            return False, None, str(e)

    def _on_success(self):
        """Callback de sucesso"""
        self.failure_count = 0

        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.success_threshold:
                logger.info("Circuit breaker: Recovered - CLOSED")
                self.state = CircuitState.CLOSED
                self.success_count = 0

    def _on_failure(self):
        """Callback de falha"""
        self.failure_count += 1
        self.last_failure_time = datetime.now()

        if self.state == CircuitState.HALF_OPEN:
            logger.warning("Circuit breaker: Failure in HALF_OPEN - back to OPEN")
            self.state = CircuitState.OPEN
            self.success_count = 0

        elif self.failure_count >= self.failure_threshold:
            logger.warning(
                f"Circuit breaker: Threshold reached ({self.failure_count}) - OPEN"
            )
            self.state = CircuitState.OPEN

    def _should_attempt_reset(self) -> bool:
        """Verifica se deve tentar reset"""
        if not self.last_failure_time:
            return True

        elapsed = (datetime.now() - self.last_failure_time).total_seconds()
        return elapsed >= self.timeout

    def get_state(self) -> CircuitState:
        """Retorna estado atual"""
        return self.state

    def reset(self):
        """Reset manual"""
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        logger.info("Circuit breaker: Manual reset")


# ============================================
# BACKOFF STRATEGIES
# ============================================


class BackoffCalculator:
    """Calculadora de delays para backoff"""

    @staticmethod
    def immediate() -> float:
        """Sem delay"""
        return 0.0

    @staticmethod
    def linear(attempt: int, initial_delay: float = 1.0) -> float:
        """Backoff linear: delay * attempt"""
        return initial_delay * attempt

    @staticmethod
    def exponential(
        attempt: int, initial_delay: float = 1.0, base: float = 2.0
    ) -> float:
        """Backoff exponencial: delay * base^attempt"""
        return initial_delay * (base ** (attempt - 1))

    @staticmethod
    def fibonacci(attempt: int, initial_delay: float = 1.0) -> float:
        """Backoff com sequência Fibonacci"""
        fib = BackoffCalculator._fibonacci_number(attempt)
        return initial_delay * fib

    @staticmethod
    def random_delay(min_delay: float = 0.5, max_delay: float = 5.0) -> float:
        """Delay aleatório"""
        return random.uniform(min_delay, max_delay)

    @staticmethod
    def _fibonacci_number(n: int) -> int:
        """Calcula número Fibonacci"""
        if n <= 1:
            return 1
        a, b = 1, 1
        for _ in range(n - 1):
            a, b = b, a + b
        return b

    @staticmethod
    def add_jitter(delay: float, jitter_range: float = 0.3) -> float:
        """
        Adiciona jitter (variação aleatória) ao delay

        Evita thundering herd problem
        """
        jitter = random.uniform(-jitter_range, jitter_range)
        return delay * (1.0 + jitter)

    @staticmethod
    def cap_delay(delay: float, max_delay: float = 60.0) -> float:
        """Limita delay máximo"""
        return min(delay, max_delay)


# ============================================
# FAILURE ANALYZER
# ============================================


class FailureAnalyzer:
    """Analisa falhas para determinar melhor estratégia"""

    def __init__(self):
        self.failure_patterns: Dict[str, List[FailureType]] = defaultdict(list)

    def analyze_failure(self, context: RetryContext) -> FailureType:
        """
        Analisa falha e classifica tipo

        Args:
            context: Contexto do retry

        Returns:
            FailureType
        """

        error_msg = context.error_message.lower()

        # Timeout
        if any(kw in error_msg for kw in ["timeout", "timed out", "deadline exceeded"]):
            return FailureType.TIMEOUT

        # Network
        if any(
            kw in error_msg
            for kw in [
                "connection",
                "network",
                "unreachable",
                "refused",
                "dns",
                "socket",
            ]
        ):
            return FailureType.NETWORK

        # Rate limit
        if any(
            kw in error_msg for kw in ["rate limit", "too many requests", "429", "quota"]
        ):
            return FailureType.RATE_LIMIT

        # Resource exhausted
        if any(
            kw in error_msg for kw in ["memory", "disk", "resource", "exhausted", "oom"]
        ):
            return FailureType.RESOURCE_EXHAUSTED

        # Validation
        if any(
            kw in error_msg for kw in ["validation", "invalid", "malformed", "corrupt"]
        ):
            return FailureType.VALIDATION

        # Library specific
        if any(kw in error_msg for kw in ["import", "module", "library", "package"]):
            return FailureType.LIBRARY_ERROR

        # Code errors
        if any(
            kw in error_msg
            for kw in [
                "syntax",
                "name error",
                "type error",
                "attribute error",
                "index error",
            ]
        ):
            return FailureType.CODE_ERROR

        return FailureType.UNKNOWN

    def should_retry(self, failure_type: FailureType, attempt: int) -> bool:
        """Determina se deve fazer retry baseado no tipo de falha"""

        # Rate limit: sempre fazer retry com backoff maior
        if failure_type == FailureType.RATE_LIMIT:
            return True

        # Timeout: retry com timeout maior
        if failure_type == FailureType.TIMEOUT:
            return attempt < 4

        # Network: retry
        if failure_type == FailureType.NETWORK:
            return attempt < 5

        # Resource exhausted: retry com delay
        if failure_type == FailureType.RESOURCE_EXHAUSTED:
            return attempt < 3

        # Validation: não fazer retry (problema com dados)
        if failure_type == FailureType.VALIDATION:
            return False

        # Code error: não fazer retry (problema no código)
        if failure_type == FailureType.CODE_ERROR:
            return False

        # Library error: trocar biblioteca
        if failure_type == FailureType.LIBRARY_ERROR:
            return attempt < 3

        # Unknown: tentar algumas vezes
        return attempt < 3

    def recommend_strategy(self, failure_type: FailureType) -> RetryStrategy:
        """Recomenda estratégia baseada no tipo de falha"""

        strategy_map = {
            FailureType.TIMEOUT: RetryStrategy.EXPONENTIAL,
            FailureType.NETWORK: RetryStrategy.EXPONENTIAL,
            FailureType.RATE_LIMIT: RetryStrategy.FIBONACCI,
            FailureType.RESOURCE_EXHAUSTED: RetryStrategy.LINEAR,
            FailureType.LIBRARY_ERROR: RetryStrategy.IMMEDIATE,
            FailureType.VALIDATION: RetryStrategy.NONE,
            FailureType.CODE_ERROR: RetryStrategy.NONE,
            FailureType.UNKNOWN: RetryStrategy.EXPONENTIAL,
        }

        return strategy_map.get(failure_type, RetryStrategy.EXPONENTIAL)

    def track_failure(self, library: str, failure_type: FailureType):
        """Rastreia padrões de falha por biblioteca"""
        self.failure_patterns[library].append(failure_type)

        # Manter apenas últimas 100 falhas
        if len(self.failure_patterns[library]) > 100:
            self.failure_patterns[library] = self.failure_patterns[library][-100:]

    def get_library_reliability(self, library: str) -> float:
        """
        Calcula confiabilidade de uma biblioteca baseado em histórico

        Returns:
            Score 0.0-1.0
        """
        failures = self.failure_patterns.get(library, [])

        if not failures:
            return 1.0

        # Count non-retryable failures (mais graves)
        critical_failures = sum(
            1
            for f in failures
            if f in [FailureType.VALIDATION, FailureType.CODE_ERROR]
        )

        total = len(failures)
        reliability = 1.0 - (critical_failures / total)

        return max(0.0, min(1.0, reliability))


# ============================================
# RETRY ENGINE
# ============================================


class RetryEngine:
    """
    Motor de Retry Inteligente

    Features:
    - Múltiplas estratégias de retry
    - Backoff exponencial com jitter
    - Circuit breaker integrado
    - Análise de falhas
    - Decisões adaptativas
    - Tracking de tentativas
    - Estatísticas
    """

    def __init__(self, config: Optional[RetryConfig] = None):
        self.config = config or RetryConfig()
        self.backoff = BackoffCalculator()
        self.analyzer = FailureAnalyzer()

        # Circuit breakers por biblioteca
        self.circuit_breakers: Dict[str, CircuitBreaker] = {}

        # Estatísticas
        self.stats = {
            "total_retries": 0,
            "successful_retries": 0,
            "failed_retries": 0,
            "circuits_opened": 0,
        }

        # Rate limiting
        self.request_times: List[float] = []

        logger.info("RetryEngine initialized")

    async def decide_retry(
        self, context: RetryContext, execution_plan: Any
    ) -> RetryDecision:
        """
        Decide se deve fazer retry e como

        Args:
            context: Contexto do retry
            execution_plan: Plano de execução original

        Returns:
            RetryDecision
        """

        logger.debug(
            f"[{context.task_id}] Analyzing retry: "
            f"attempt {context.attempt_number}/{context.max_attempts}"
        )

        # 1. Verificar se atingiu máximo de tentativas
        if context.attempt_number >= context.max_attempts:
            return RetryDecision(
                should_retry=False,
                strategy=RetryStrategy.NONE,
                delay_seconds=0.0,
                next_library=None,
                reasoning=f"Max attempts reached ({context.max_attempts})",
                confidence=1.0,
            )

        # 2. Analisar tipo de falha
        failure_type = self.analyzer.analyze_failure(context)
        logger.info(f"[{context.task_id}] Failure type: {failure_type.value}")

        # 3. Verificar se deve fazer retry baseado no tipo
        should_retry = self.analyzer.should_retry(
            failure_type, context.attempt_number
        )

        if not should_retry:
            return RetryDecision(
                should_retry=False,
                strategy=RetryStrategy.NONE,
                delay_seconds=0.0,
                next_library=None,
                reasoning=f"Failure type {failure_type.value} is not retryable",
                confidence=0.9,
            )

        # 4. Verificar circuit breaker
        if self.config.enable_circuit_breaker:
            circuit = self._get_circuit_breaker(context.library_name)
            if circuit.get_state() == CircuitState.OPEN:
                logger.warning(
                    f"[{context.task_id}] Circuit breaker OPEN for {context.library_name}"
                )
                # Tentar outra biblioteca
                return RetryDecision(
                    should_retry=True,
                    strategy=RetryStrategy.IMMEDIATE,
                    delay_seconds=0.0,
                    next_library=self._get_next_library(context, execution_plan),
                    reasoning=f"Circuit breaker OPEN for {context.library_name}",
                    confidence=0.8,
                    switch_library=True,
                )

        # 5. Determinar estratégia
        strategy = self._determine_strategy(failure_type, context)

        # 6. Calcular delay
        delay = self._calculate_delay(strategy, context)

        # 7. Decidir se deve trocar biblioteca
        switch_library = self._should_switch_library(failure_type, context)

        next_library = None
        if switch_library:
            next_library = self._get_next_library(context, execution_plan)

        # 8. Considerar solução híbrida
        use_hybrid = self._should_use_hybrid(context)

        # 9. Gerar reasoning
        reasoning = self._generate_reasoning(
            failure_type, strategy, delay, switch_library, use_hybrid
        )

        # 10. Calcular confidence
        confidence = self._calculate_confidence(failure_type, context)

        decision = RetryDecision(
            should_retry=True,
            strategy=strategy,
            delay_seconds=delay,
            next_library=next_library,
            reasoning=reasoning,
            confidence=confidence,
            switch_library=switch_library,
            use_hybrid=use_hybrid,
        )

        # Track
        self.stats["total_retries"] += 1
        self.analyzer.track_failure(context.library_name, failure_type)

        logger.info(
            f"[{context.task_id}] Retry decision: {decision.should_retry}, "
            f"strategy={decision.strategy.value}, delay={decision.delay_seconds:.2f}s, "
            f"switch={decision.switch_library}"
        )

        return decision

    async def execute_with_retry(
        self,
        func: Callable,
        context: RetryContext,
        *args,
        **kwargs,
    ) -> Tuple[bool, Any, List[RetryAttempt]]:
        """
        Executa função com retry automático

        Returns:
            (success, result, attempts)
        """

        attempts = []

        for attempt in range(1, context.max_attempts + 1):
            logger.info(f"[{context.task_id}] Attempt {attempt}/{context.max_attempts}")

            # Rate limiting
            if self.config.enable_rate_limit:
                await self._apply_rate_limit()

            # Circuit breaker check
            if self.config.enable_circuit_breaker:
                circuit = self._get_circuit_breaker(context.library_name)
                if circuit.get_state() == CircuitState.OPEN:
                    logger.warning(
                        f"[{context.task_id}] Circuit breaker OPEN, skipping attempt"
                    )
                    continue

            # Execute
            start_time = time.time()

            try:
                result = await func(*args, **kwargs)
                execution_time = time.time() - start_time

                # Success
                attempt_record = RetryAttempt(
                    attempt_number=attempt,
                    timestamp=datetime.now(),
                    delay_before=0.0,
                    library_used=context.library_name,
                    success=True,
                    execution_time=execution_time,
                )
                attempts.append(attempt_record)

                # Update circuit breaker
                if self.config.enable_circuit_breaker:
                    circuit._on_success()

                self.stats["successful_retries"] += 1

                logger.info(
                    f"[{context.task_id}] Success on attempt {attempt} "
                    f"({execution_time:.2f}s)"
                )

                return True, result, attempts

            except Exception as e:
                execution_time = time.time() - start_time

                # Failure
                attempt_record = RetryAttempt(
                    attempt_number=attempt,
                    timestamp=datetime.now(),
                    delay_before=0.0,
                    library_used=context.library_name,
                    error_type=type(e).__name__,
                    error_message=str(e),
                    success=False,
                    execution_time=execution_time,
                )
                attempts.append(attempt_record)

                # Update circuit breaker
                if self.config.enable_circuit_breaker:
                    circuit._on_failure()

                logger.warning(
                    f"[{context.task_id}] Attempt {attempt} failed: {str(e)}"
                )

                # Last attempt?
                if attempt >= context.max_attempts:
                    logger.error(
                        f"[{context.task_id}] All attempts exhausted"
                    )
                    self.stats["failed_retries"] += 1
                    return False, None, attempts

                # Decide retry
                context.attempt_number = attempt
                context.error_message = str(e)
                context.previous_attempts = attempts

                decision = await self.decide_retry(context, None)

                if not decision.should_retry:
                    logger.info(
                        f"[{context.task_id}] Not retrying: {decision.reasoning}"
                    )
                    self.stats["failed_retries"] += 1
                    return False, None, attempts

                # Wait before retry
                if decision.delay_seconds > 0:
                    logger.info(
                        f"[{context.task_id}] Waiting {decision.delay_seconds:.2f}s before retry"
                    )
                    await asyncio.sleep(decision.delay_seconds)

        # Exhausted
        self.stats["failed_retries"] += 1
        return False, None, attempts

    def _determine_strategy(
        self, failure_type: FailureType, context: RetryContext
    ) -> RetryStrategy:
        """Determina estratégia de retry"""

        # Use config strategy if not adaptive
        if not self.config.enable_adaptive:
            return self.config.strategy

        # Adaptive: usa recomendação do analyzer
        recommended = self.analyzer.recommend_strategy(failure_type)

        # Override se rate limit
        if failure_type == FailureType.RATE_LIMIT:
            return RetryStrategy.FIBONACCI

        return recommended

    def _calculate_delay(
        self, strategy: RetryStrategy, context: RetryContext
    ) -> float:
        """Calcula delay baseado na estratégia"""

        attempt = context.attempt_number

        if strategy == RetryStrategy.IMMEDIATE:
            delay = 0.0

        elif strategy == RetryStrategy.LINEAR:
            delay = self.backoff.linear(attempt, self.config.initial_delay)

        elif strategy == RetryStrategy.EXPONENTIAL:
            delay = self.backoff.exponential(
                attempt, self.config.initial_delay, self.config.exponential_base
            )

        elif strategy == RetryStrategy.FIBONACCI:
            delay = self.backoff.fibonacci(attempt, self.config.initial_delay)

        elif strategy == RetryStrategy.RANDOM:
            delay = self.backoff.random_delay()

        else:
            delay = self.config.initial_delay

        # Add jitter
        if self.config.jitter and delay > 0:
            delay = self.backoff.add_jitter(delay, self.config.jitter_range)

        # Cap delay
        delay = self.backoff.cap_delay(delay, self.config.max_delay)

        return delay

    def _should_switch_library(
        self, failure_type: FailureType, context: RetryContext
    ) -> bool:
        """Determina se deve trocar de biblioteca"""

        # Library error: sempre trocar
        if failure_type == FailureType.LIBRARY_ERROR:
            return True

        # Circuit breaker open: trocar
        if self.config.enable_circuit_breaker:
            circuit = self._get_circuit_breaker(context.library_name)
            if circuit.get_state() == CircuitState.OPEN:
                return True

        # Após 2 tentativas com mesma biblioteca, considerar trocar
        if context.attempt_number >= 2:
            same_library_failures = sum(
                1
                for a in context.previous_attempts
                if a.library_used == context.library_name and not a.success
            )
            if same_library_failures >= 2:
                return True

        return False

    def _should_use_hybrid(self, context: RetryContext) -> bool:
        """Determina se deve usar solução híbrida"""

        # Após 3 tentativas falhadas
        if context.attempt_number >= 3:
            return True

        return False

    def _get_next_library(
        self, context: RetryContext, execution_plan: Any
    ) -> Optional[str]:
        """Retorna próxima biblioteca para tentar"""

        if not execution_plan:
            return None

        # Get fallback libraries
        fallbacks = getattr(execution_plan, "fallback_libraries", [])

        # Find next untried library
        tried_libraries = {a.library_used for a in context.previous_attempts}

        for lib in fallbacks:
            lib_name = lib.name if hasattr(lib, "name") else str(lib)
            if lib_name not in tried_libraries:
                return lib_name

        return None

    def _generate_reasoning(
        self,
        failure_type: FailureType,
        strategy: RetryStrategy,
        delay: float,
        switch_library: bool,
        use_hybrid: bool,
    ) -> str:
        """Gera explicação da decisão"""

        parts = [f"Failure: {failure_type.value}", f"Strategy: {strategy.value}"]

        if delay > 0:
            parts.append(f"Delay: {delay:.1f}s")

        if switch_library:
            parts.append("Switch library")

        if use_hybrid:
            parts.append("Use hybrid solution")

        return " | ".join(parts)

    def _calculate_confidence(
        self, failure_type: FailureType, context: RetryContext
    ) -> float:
        """Calcula confidence na decisão de retry"""

        base_confidence = 0.7

        # Aumenta confidence para falhas retryable
        if failure_type in [FailureType.TIMEOUT, FailureType.NETWORK]:
            base_confidence += 0.2

        # Diminui confidence conforme tentativas aumentam
        base_confidence -= (context.attempt_number - 1) * 0.1

        return max(0.0, min(1.0, base_confidence))

    def _get_circuit_breaker(self, library_name: str) -> CircuitBreaker:
        """Retorna circuit breaker para biblioteca"""

        if library_name not in self.circuit_breakers:
            self.circuit_breakers[library_name] = CircuitBreaker(
                failure_threshold=self.config.circuit_failure_threshold,
                success_threshold=self.config.circuit_success_threshold,
                timeout=self.config.circuit_timeout,
            )

        return self.circuit_breakers[library_name]

    async def _apply_rate_limit(self):
        """Aplica rate limiting"""

        now = time.time()

        # Remove requests antigos (> 1 segundo)
        self.request_times = [t for t in self.request_times if now - t < 1.0]

        # Check rate
        if len(self.request_times) >= self.config.max_requests_per_second:
            # Wait
            wait_time = 1.0 - (now - self.request_times[0])
            if wait_time > 0:
                logger.debug(f"Rate limiting: waiting {wait_time:.2f}s")
                await asyncio.sleep(wait_time)

        self.request_times.append(now)

    def get_statistics(self) -> Dict[str, Any]:
        """Retorna estatísticas"""
        total = self.stats["total_retries"]
        success_rate = (
            self.stats["successful_retries"] / total if total > 0 else 0.0
        )

        return {
            "total_retries": total,
            "successful_retries": self.stats["successful_retries"],
            "failed_retries": self.stats["failed_retries"],
            "success_rate": success_rate,
            "circuits_
