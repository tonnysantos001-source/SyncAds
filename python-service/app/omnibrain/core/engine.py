"""
============================================
SYNCADS OMNIBRAIN - CORE ENGINE
============================================
Sistema de IA Auto-Suficiente e Auto-Corretivo

Capacidades:
- Interpreta qualquer comando (texto, imagem, vídeo, áudio, código, URL)
- Identifica automaticamente o tipo de tarefa
- Seleciona a melhor biblioteca
- Cria plano de execução
- Gera código Python otimizado
- Executa com segurança
- Valida resultados
- Retry automático com fallback multi-nível
- Combina múltiplas bibliotecas quando necessário

Autor: SyncAds AI Team
Versão: 1.0.0
Data: 2025-01-15
============================================
"""

import asyncio
import hashlib
import json
import logging
import traceback
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple, Union

# ✅ CORREÇÃO: Usar types.py compartilhado
from ..types import (
    ExecutionMode,
    ExecutionResult,
    ExecutionStatus,
    FailureLevel,
    LibraryCandidate,
    ExecutionPlan,
    OmnibrainResponse,
    Priority,
    TaskInput,
    TaskPlan,
    TaskType,
    ConversationContext,
    priority_from_string,
    task_type_from_string,
)

# ✅ CORREÇÃO: Integrar novos sistemas
from ..context.context_manager import ContextManager, create_context_manager
from ..planning.task_planner import TaskPlanner, create_task_planner
from ..prompts import get_prompt, render_prompt, get_ai_executor, is_ai_available
from ..library_profiles import get_loader as get_profile_loader
from ..cache.cache_manager import get_cache_manager
from ..observability.metrics import increment, histogram, gauge, TASK_EXECUTIONS, TASK_DURATION, TASK_ERRORS

# Logging
logger = logging.getLogger("omnibrain.core")


# ============================================
# LEGACY COMPATIBILITY
# ============================================
# Manter alguns tipos aqui para compatibilidade com código existente
    UNKNOWN = "unknown"


class ExecutionStatus(Enum):
    """Status de execução"""

    PENDING = "pending"
    ANALYZING = "analyzing"
    PLANNING = "planning"
    EXECUTING = "executing"
    VALIDATING = "validating"
    SUCCESS = "success"
    FAILED = "failed"
    RETRYING = "retrying"
    FALLBACK = "fallback"


class FailureLevel(Enum):
    """Níveis de falha para retry strategy"""

    LEVEL_1_SIMPLE = 1  # Erro simples - corrigir e tentar novamente
    LEVEL_2_STRUCTURAL = 2  # Erro estrutural - trocar biblioteca
    LEVEL_3_IMPOSSIBLE = 3  # Impossível direto - criar solução híbrida


# ============================================
# DATA CLASSES
# ============================================


@dataclass
class TaskInput:
    """Input da tarefa"""

    command: str
    context: Dict[str, Any] = field(default_factory=dict)
    files: List[Dict[str, Any]] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    user_id: Optional[str] = None
    priority: int = 5
    timeout: int = 300  # segundos


@dataclass
class LibraryCandidate:
    """Candidato de biblioteca para executar tarefa"""

    name: str
    confidence: float
    reasoning: str
    priority: int
    estimated_time: float
    requirements: List[str]
    alternatives: List[str]
    pros: List[str]
    cons: List[str]


@dataclass
class ExecutionPlan:
    """Plano de execução"""

    task_id: str
    task_type: TaskType
    subtasks: List[Dict[str, Any]]
    primary_library: LibraryCandidate
    fallback_libraries: List[LibraryCandidate]
    estimated_duration: float
    requires_hybrid: bool
    hybrid_libraries: List[str] = field(default_factory=list)
    validation_criteria: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ExecutionResult:
    """Resultado de execução"""

    task_id: str
    status: ExecutionStatus
    output: Any
    error: Optional[str] = None
    execution_time: float = 0.0
    attempts: int = 1
    library_used: Optional[str] = None
    code_executed: Optional[str] = None
    validation_passed: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RetryContext:
    """Contexto de retry"""

    attempt: int
    max_attempts: int
    failure_level: FailureLevel
    previous_errors: List[str]
    libraries_tried: List[str]
    current_strategy: str


# ============================================
# OMNIBRAIN CORE ENGINE
# ============================================


class OmnibrainEngine:
    """
    Motor principal do Omnibrain

    Responsável por:
    1. Classificar tarefas
    2. Selecionar bibliotecas
    3. Criar planos de execução
    4. Executar com segurança
    5. Validar resultados
    6. Retry automático
    7. Fallback inteligente
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.max_retries = self.config.get("max_retries", 5)
        self.enable_hybrid = self.config.get("enable_hybrid", True)
        self.safe_mode = self.config.get("safe_mode", True)

        # ✅ CORREÇÃO: Novos flags de configuração
        self.enable_context = self.config.get("enable_context", True)
        self.enable_planning = self.config.get("enable_planning", True)
        self.enable_cache = self.config.get("enable_cache", True)
        self.enable_ai = self.config.get("enable_ai", True)

        # Componentes principais (serão injetados)
        self.task_classifier = None
        self.library_selector = None
        self.code_generator = None
        self.executor = None
        self.validator = None
        self.retry_engine = None

        # ✅ CORREÇÃO: Novos componentes
        self.context_manager = None
        self.task_planner = None
        self.profile_loader = None
        self.cache_manager = None
        self.ai_executor = None

        # Estado
        self.active_tasks: Dict[str, ExecutionResult] = {}
        self.execution_history: List[ExecutionResult] = []

        logger.info("OmnibrainEngine initialized")

    # ============================================
    # PUBLIC API
    # ============================================

    async def execute(self, task_input: TaskInput) -> ExecutionResult:
        """
        Executa uma tarefa completa

        Args:
            task_input: Input da tarefa

        Returns:
            ExecutionResult com o resultado
        """
        task_id = self._generate_task_id(task_input)
        start_time = datetime.now()

        logger.info(f"[{task_id}] Starting task execution")
        logger.debug(f"[{task_id}] Command: {task_input.command}")

        # ✅ Incrementar métrica de execuções
        increment(TASK_EXECUTIONS, labels={"status": "started"})

        try:
            # ✅ 0. VERIFICAR CACHE
            if self.enable_cache and self.cache_manager:
                cached_result = await self.cache_manager.get_cached_result(
                    task_input.command, task_input.context
                )
                if cached_result:
                    logger.info(f"[{task_id}] ✅ Cache hit - returning cached result")
                    increment(TASK_EXECUTIONS, labels={"status": "cache_hit"})
                    return cached_result

            # 1. CLASSIFICAR TAREFA
            task_type = await self._classify_task(task_input)
            logger.info(f"[{task_id}] Task classified as: {task_type.value}")

            # 2. CRIAR PLANO DE EXECUÇÃO
            execution_plan = await self._create_execution_plan(
                task_id, task_type, task_input
            )
            logger.info(f"[{task_id}] Execution plan created")

            # 3. EXECUTAR COM RETRY
            result = await self._execute_with_retry(task_id, execution_plan, task_input)

            # 4. VALIDAR RESULTADO
            if result.status == ExecutionStatus.SUCCESS:
                validation_passed = await self._validate_result(result, execution_plan)
                result.validation_passed = validation_passed

                if not validation_passed:
                    logger.warning(f"[{task_id}] Validation failed, retrying...")
                    result = await self._handle_validation_failure(
                        task_id, result, execution_plan, task_input
                    )

            # 5. FINALIZAR
            execution_time = (datetime.now() - start_time).total_seconds()
            result.execution_time = execution_time

            # ✅ Coletar métricas
            histogram(TASK_DURATION, execution_time, labels={"status": result.status.value})
            increment(TASK_EXECUTIONS, labels={"status": result.status.value})

            if result.library_used:
                increment("omnibrain_library_used_total", labels={"library": result.library_used})

            # ✅ Cachear resultado se sucesso
            if result.status == ExecutionStatus.SUCCESS and self.enable_cache and self.cache_manager:
                await self.cache_manager.cache_result(
                    task_input.command, result, task_input.context
                )
                logger.debug(f"[{task_id}] Result cached")

            # Salvar histórico
            self.execution_history.append(result)
            if task_id in self.active_tasks:
                del self.active_tasks[task_id]

            logger.info(
                f"[{task_id}] Task completed in {execution_time:.2f}s "
                f"with status: {result.status.value}"
            )

            return result

        except Exception as e:
            logger.error(f"[{task_id}] Fatal error: {str(e)}")
            logger.error(traceback.format_exc())

            return ExecutionResult(
                task_id=task_id,
                status=ExecutionStatus.FAILED,
                output=None,
                error=str(e),
                execution_time=(datetime.now() - start_time).total_seconds(),
            )

    async def execute_batch(self, tasks: List[TaskInput]) -> List[ExecutionResult]:
        """
        Executa múltiplas tarefas em paralelo
        """
        results = await asyncio.gather(
            *[self.execute(task) for task in tasks], return_exceptions=True
        )
        return results

    def get_task_status(self, task_id: str) -> Optional[ExecutionResult]:
        """Retorna o status de uma tarefa ativa"""
        return self.active_tasks.get(task_id)

    def get_execution_history(self, limit: int = 100) -> List[ExecutionResult]:
        """Retorna histórico de execuções"""
        return self.execution_history[-limit:]

    # ============================================
    # INTERNAL METHODS
    # ============================================

    async def _classify_task(self, task_input: TaskInput) -> TaskType:
        """
        Classifica o tipo de tarefa

        Utiliza múltiplos sinais:
        - Palavras-chave no comando
        - Tipo de arquivos anexados
        - Contexto fornecido
        - Metadados
        """
        if self.task_classifier:
            return await self.task_classifier.classify(task_input)

        # Classificação básica por palavras-chave
        command_lower = task_input.command.lower()

        # Imagem
        if any(
            kw in command_lower
            for kw in [
                "image",
                "imagem",
                "foto",
                "picture",
                "resize",
                "crop",
                "filter",
                "optimize",
                "thumbnail",
                "banner",
                "logo",
            ]
        ):
            return TaskType.IMAGE_PROCESSING

        # Vídeo
        if any(
            kw in command_lower
            for kw in ["video", "vídeo", "movie", "clip", "render", "edit"]
        ):
            return TaskType.VIDEO_PROCESSING

        # Áudio
        if any(
            kw in command_lower
            for kw in ["audio", "áudio", "sound", "music", "voice", "transcribe"]
        ):
            return TaskType.AUDIO_PROCESSING

        # Scraping
        if any(
            kw in command_lower
            for kw in [
                "scrape",
                "extract",
                "crawl",
                "website",
                "site",
                "url",
                "http",
                "www",
                "web",
            ]
        ):
            return TaskType.WEB_SCRAPING

        # E-commerce
        if any(
            kw in command_lower
            for kw in [
                "shopify",
                "store",
                "loja",
                "product",
                "produto",
                "theme",
                "tema",
                "woocommerce",
                "vtex",
            ]
        ):
            return TaskType.ECOMMERCE_OPERATION

        # Theme Generation
        if any(
            kw in command_lower
            for kw in ["theme", "tema", "template", "design", "layout", "css"]
        ):
            return TaskType.THEME_GENERATION

        # PDF
        if any(
            kw in command_lower
            for kw in ["pdf", "document", "documento", "report", "relatório"]
        ):
            return TaskType.PDF_GENERATION

        # Data Analysis
        if any(
            kw in command_lower
            for kw in [
                "analyze",
                "analisar",
                "data",
                "dados",
                "statistics",
                "estatística",
                "chart",
                "gráfico",
            ]
        ):
            return TaskType.DATA_ANALYSIS

        # ML/IA
        if any(
            kw in command_lower
            for kw in [
                "predict",
                "prever",
                "model",
                "modelo",
                "train",
                "treinar",
                "classify",
                "classificar",
                "detect",
                "detectar",
            ]
        ):
            return TaskType.ML_INFERENCE

        # Marketing
        if any(
            kw in command_lower
            for kw in [
                "ad",
                "anúncio",
                "campaign",
                "campanha",
                "copy",
                "marketing",
                "landing",
                "funnel",
                "funil",
            ]
        ):
            return TaskType.MARKETING_CONTENT

        return TaskType.UNKNOWN

    async def _create_execution_plan(
        self, task_id: str, task_type: TaskType, task_input: TaskInput
    ) -> ExecutionPlan:
        """
        Cria plano de execução detalhado
        """
        if self.library_selector:
            return await self.library_selector.create_plan(
                task_id, task_type, task_input
            )

        # Plano básico
        primary_library = LibraryCandidate(
            name="default",
            confidence=0.7,
            reasoning="Default library for task",
            priority=5,
            estimated_time=10.0,
            requirements=[],
            alternatives=[],
            pros=["Available"],
            cons=["Generic"],
        )

        return ExecutionPlan(
            task_id=task_id,
            task_type=task_type,
            subtasks=[],
            primary_library=primary_library,
            fallback_libraries=[],
            estimated_duration=10.0,
            requires_hybrid=False,
        )

    async def _execute_with_retry(
        self, task_id: str, plan: ExecutionPlan, task_input: TaskInput
    ) -> ExecutionResult:
        """
        ✅ FIX 3: Executa com retry automático usando RetryEngine
        """
        retry_attempts: List[RetryAttempt] = []
        current_library = plan.primary_library

        # Tentar biblioteca primária
        result = await self._execute_single(task_id, current_library, task_input, plan)

        if result.status == ExecutionStatus.SUCCESS:
            result.attempts = 1
            return result

        # Retry com RetryEngine
        for attempt in range(1, self.max_retries):
            # Registrar tentativa falhada
            retry_attempts.append(
                RetryAttempt(
                    attempt_number=attempt,
                    timestamp=datetime.now(),
                    delay_before=0.0,
                    library_used=result.library_used or "unknown",
                    error_type=result.error_type or "unknown",
                    error_message=result.error or "Unknown error",
                    success=False,
                    execution_time=result.execution_time,
                )
            )

            # Criar contexto para RetryEngine
            retry_context = RetryEngineContext(
                task_id=task_id,
                library_name=result.library_used or current_library.name,
                failure_type=self._map_error_to_failure_type(result.error or ""),
                error_message=result.error or "Unknown error",
                attempt_number=attempt,
                max_attempts=self.max_retries,
                previous_attempts=retry_attempts,
                metadata={"task_type": task_input.task_type},
            )

            # ✅ Usar RetryEngine para decidir
            if self.retry_engine:
                decision = await self.retry_engine.decide_retry(retry_context, plan)

                if not decision.should_retry:
                    logger.info(
                        f"[{task_id}] RetryEngine decidiu NÃO retryar: {decision.reasoning}"
                    )
                    break

                logger.info(
                    f"[{task_id}] RetryEngine decidiu retryar: {decision.reasoning} "
                    f"(delay={decision.delay_seconds}s, strategy={decision.strategy.value})"
                )

                # Aguardar delay
                if decision.delay_seconds > 0:
                    await asyncio.sleep(decision.delay_seconds)

                # Determinar próxima biblioteca
                if decision.switch_library and decision.next_library:
                    # Usar biblioteca sugerida pelo RetryEngine
                    for alt in plan.alternatives:
                        if alt.name == decision.next_library:
                            current_library = alt
                            break
                elif decision.use_hybrid:
                    # Tentar execução híbrida
                    if self.enable_hybrid and plan.requires_hybrid:
                        result = await self._execute_hybrid(
                            task_id, plan, task_input, None
                        )
                        if result.status == ExecutionStatus.SUCCESS:
                            result.attempts = attempt + 1
                            return result
                else:
                    # Usar próxima alternativa
                    next_library = await self._get_next_library(plan, None)
                    if next_library:
                        current_library = next_library
                    else:
                        break
            else:
                # Fallback: lógica simples sem RetryEngine
                next_library = await self._get_next_library(plan, None)
                if not next_library:
                    break
                current_library = next_library
                await asyncio.sleep(min(2**attempt, 30))  # Exponential backoff

            # Executar com nova biblioteca
            result = await self._execute_single(
                task_id, current_library, task_input, plan
            )

            if result.status == ExecutionStatus.SUCCESS:
                result.attempts = attempt + 1
                return result

        # Todas as tentativas falharam
        result.status = ExecutionStatus.FAILED
        result.attempts = len(retry_attempts) + 1
        result.metadata["all_attempts"] = [
            {
                "attempt": att.attempt_number,
                "library": att.library_used,
                "error": att.error_message,
            }
            for att in retry_attempts
        ]

        return result

    def _map_error_to_failure_type(self, error_message: str) -> RetryFailureType:
        """Mapeia mensagem de erro para tipo de falha do RetryEngine"""
        error_lower = error_message.lower()

        if "timeout" in error_lower:
            return RetryFailureType.TIMEOUT
        elif "network" in error_lower or "connection" in error_lower:
            return RetryFailureType.NETWORK
        elif "validation" in error_lower or "invalid" in error_lower:
            return RetryFailureType.VALIDATION
        elif "library" in error_lower or "import" in error_lower:
            return RetryFailureType.LIBRARY_ERROR
        elif "rate" in error_lower or "limit" in error_lower:
            return RetryFailureType.RATE_LIMIT
        else:
            return RetryFailureType.CODE_ERROR

    async def _execute_single(
        self,
        task_id: str,
        library: LibraryCandidate,
        task_input: TaskInput,
        plan: ExecutionPlan,
    ) -> ExecutionResult:
        """
        Executa com uma única biblioteca
        """
        logger.info(f"[{task_id}] Executing with library: {library.name}")

        try:
            # Gerar código
            code = await self._generate_code(library, task_input, plan)

            # Executar
            output = await self._execute_code(code, task_input)

            return ExecutionResult(
                task_id=task_id,
                status=ExecutionStatus.SUCCESS,
                output=output,
                library_used=library.name,
                code_executed=code,
            )

        except Exception as e:
            logger.error(f"[{task_id}] Execution failed: {str(e)}")
            return ExecutionResult(
                task_id=task_id,
                status=ExecutionStatus.FAILED,
                output=None,
                error=str(e),
                library_used=library.name,
            )

    async def _execute_hybrid(
        self,
        task_id: str,
        plan: ExecutionPlan,
        task_input: TaskInput,
        retry_context: RetryContext,
    ) -> ExecutionResult:
        """
        Executa solução híbrida combinando múltiplas bibliotecas
        """
        logger.info(f"[{task_id}] Attempting hybrid solution")

        # TODO: Implementar lógica de execução híbrida
        # Combinar múltiplas bibliotecas para resolver a tarefa

        return ExecutionResult(
            task_id=task_id,
            status=ExecutionStatus.FAILED,
            output=None,
            error="Hybrid execution not yet implemented",
        )

    async def _generate_code(
        self, library: LibraryCandidate, task_input: TaskInput, plan: ExecutionPlan
    ) -> str:
        """
        Gera código Python para executar a tarefa
        """
        if self.code_generator:
            return await self.code_generator.generate(library, task_input, plan)

        # Código básico
        return f"""
# Generated code for {library.name}
import {library.name}

# Task: {task_input.command}
result = None  # TODO: Implement

print(result)
"""

    async def _execute_code(self, code: str, task_input: TaskInput) -> Any:
        """
        Executa código Python de forma segura
        """
        if self.executor:
            return await self.executor.execute(code, task_input)

        # Execução básica (UNSAFE - apenas para desenvolvimento)
        if not self.safe_mode:
            exec_globals = {}
            exec(code, exec_globals)
            return exec_globals.get("result")

        raise RuntimeError("Safe execution not configured")

    async def _validate_result(
        self, result: ExecutionResult, plan: ExecutionPlan
    ) -> bool:
        """
        Valida o resultado da execução
        """
        if self.validator:
            return await self.validator.validate(result, plan)

        # Validação básica
        return result.output is not None

    async def _get_next_library(
        self, plan: ExecutionPlan, retry_context: RetryContext
    ) -> Optional[LibraryCandidate]:
        """
        Retorna próxima biblioteca para tentar
        """
        for lib in plan.fallback_libraries:
            if lib.name not in retry_context.libraries_tried:
                return lib
        return None

    async def _handle_validation_failure(
        self,
        task_id: str,
        result: ExecutionResult,
        plan: ExecutionPlan,
        task_input: TaskInput,
    ) -> ExecutionResult:
        """
        Trata falha de validação
        """
        # TODO: Implementar lógica de correção automática
        result.status = ExecutionStatus.FAILED
        result.error = "Validation failed"
        return result

    def _generate_task_id(self, task_input: TaskInput) -> str:
        """Gera ID único para a tarefa"""
        content = f"{task_input.command}{datetime.now().isoformat()}"
        return hashlib.md5(content.encode()).hexdigest()[:12]


# ============================================
# FACTORY
# ============================================


def create_omnibrain_engine(config: Optional[Dict[str, Any]] = None) -> OmnibrainEngine:
    """
    Factory para criar OmnibrainEngine totalmente configurado

    ✅ CORREÇÃO COMPLETA: Injetar TODOS os componentes incluindo novos sistemas
    """
    engine = OmnibrainEngine(config)

    # Componentes principais
    from ..classifiers.task_classifier import TaskClassifier
    from ..engines.code_generator import CodeGenerator
    from ..engines.library_selector import LibrarySelector
    from ..executors.safe_executor import SafeExecutor
    from ..retry.retry_engine import RetryEngine
    from ..validators.result_validator import ResultValidator

    engine.task_classifier = TaskClassifier()
    engine.library_selector = LibrarySelector()
    engine.code_generator = CodeGenerator()
    engine.executor = SafeExecutor()
    engine.validator = ResultValidator()
    engine.retry_engine = RetryEngine()

    # ✅ NOVOS SISTEMAS
    if engine.enable_context:
        engine.context_manager = create_context_manager()
        logger.info("Context Manager initialized")

    if engine.enable_planning:
        engine.task_planner = create_task_planner()
        logger.info("Task Planner initialized")

    # Library Profile Loader
    engine.profile_loader = get_profile_loader()
    engine.profile_loader.load_all()
    logger.info(f"Loaded {len(engine.profile_loader.profiles_cache)} library profiles")

    # ✅ Cache Manager
    if engine.enable_cache:
        engine.cache_manager = get_cache_manager()
        logger.info("Cache Manager initialized")

    # ✅ AI Executor
    if engine.enable_ai and is_ai_available():
        engine.ai_executor = get_ai_executor()
        logger.info("AI Executor initialized")
    elif engine.enable_ai:
        logger.warning("AI enabled but no API key found")

    logger.info("OmnibrainEngine fully configured with all systems")
    return engine


# ============================================
# EXEMPLO DE USO
# ============================================

if __name__ == "__main__":

    async def main():
        # Criar engine
        engine = create_omnibrain_engine(
            {"max_retries": 5, "enable_hybrid": True, "safe_mode": True}
        )

        # Criar tarefa
        task = TaskInput(
            command="Otimize esta imagem para web",
            context={"target_format": "webp", "quality": 85},
            metadata={"user_id": "test_user"},
        )

        # Executar
        result = await engine.execute(task)

        print(f"Status: {result.status.value}")
        print(f"Output: {result.output}")
        print(f"Time: {result.execution_time:.2f}s")
        print(f"Attempts: {result.attempts}")

    # Run
    asyncio.run(main())
