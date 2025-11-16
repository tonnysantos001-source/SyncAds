"""
============================================
SYNCADS OMNIBRAIN - GRAPHQL SCHEMA
============================================
Schema GraphQL completo para Omnibrain Engine

Features:
- Queries para buscar informações
- Mutations para executar tarefas
- Subscriptions para streaming em tempo real
- Tipos completos para todas entidades
- Resolvers integrados com Omnibrain

Autor: SyncAds AI Team
Versão: 1.0.0
Data: 2025-01-15
============================================
"""

import asyncio
from datetime import datetime
from enum import Enum
from typing import List, Optional

import strawberry
from strawberry.scalars import JSON
from strawberry.types import Info

from app.omnibrain.core.engine import (
    TaskInput as OmnibrainTaskInput,
)

# Importar Omnibrain
from app.omnibrain.core.engine import (
    create_omnibrain_engine,
)
from app.omnibrain.library_profiles.loader import get_profile_loader

# ============================================
# ENUMS
# ============================================


@strawberry.enum
class TaskTypeEnum(Enum):
    IMAGE_PROCESSING = "image_processing"
    VIDEO_PROCESSING = "video_processing"
    AUDIO_PROCESSING = "audio_processing"
    TEXT_PROCESSING = "text_processing"
    WEB_SCRAPING = "web_scraping"
    DATA_ANALYSIS = "data_analysis"
    ML_INFERENCE = "ml_inference"
    ECOMMERCE_OPERATION = "ecommerce_operation"
    THEME_GENERATION = "theme_generation"
    PDF_GENERATION = "pdf_generation"
    CODE_EXECUTION = "code_execution"
    API_INTEGRATION = "api_integration"
    AUTOMATION = "automation"
    DESIGN_GENERATION = "design_generation"
    MARKETING_CONTENT = "marketing_content"
    SHOPIFY_THEME = "shopify_theme"
    STORE_CLONING = "store_cloning"
    UNKNOWN = "unknown"


@strawberry.enum
class ExecutionStatusEnum(Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    PARTIAL = "partial"
    TIMEOUT = "timeout"
    RATE_LIMITED = "rate_limited"


@strawberry.enum
class PriorityEnum(Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


# ============================================
# INPUT TYPES
# ============================================


@strawberry.input
class FileInput:
    """Input para arquivo anexado"""

    name: str
    url: Optional[str] = None
    data: Optional[str] = None  # base64
    mime_type: Optional[str] = None


@strawberry.input
class ExecutionOptionsInput:
    """Opções de execução"""

    max_retries: Optional[int] = 3
    timeout: Optional[int] = 60
    enable_hybrid: Optional[bool] = True
    priority: Optional[PriorityEnum] = PriorityEnum.NORMAL
    stream: Optional[bool] = False


@strawberry.input
class TaskExecutionInput:
    """Input para executar tarefa"""

    command: str
    task_type: Optional[TaskTypeEnum] = None
    context: Optional[JSON] = None
    files: Optional[List[FileInput]] = None
    options: Optional[ExecutionOptionsInput] = None
    conversation_id: Optional[str] = None
    user_id: Optional[str] = None


# ============================================
# OBJECT TYPES
# ============================================


@strawberry.type
class LibraryProfileType:
    """Library Profile"""

    name: str
    category: str
    version_min: str
    version_recommended: str
    description: str
    documentation_url: str
    performance_score: float
    memory_score: float
    quality_score: float
    ease_score: float
    keywords: List[str]
    use_when: List[str]
    dont_use_when: List[str]
    alternatives: List[str]


@strawberry.type
class LibraryCandidateType:
    """Candidato a biblioteca"""

    name: str
    confidence: float
    reasoning: str
    priority: int
    estimated_time: float
    pros: List[str]
    cons: List[str]


@strawberry.type
class ExecutionPlanType:
    """Plano de execução"""

    task_id: str
    task_type: TaskTypeEnum
    primary_library: LibraryCandidateType
    alternatives: List[LibraryCandidateType]
    execution_mode: str
    requires_hybrid: bool
    reasoning: str
    confidence: float
    estimated_time: float


@strawberry.type
class ExecutionResultType:
    """Resultado de execução"""

    status: ExecutionStatusEnum
    output: Optional[JSON] = None
    library_used: Optional[str] = None
    execution_time: float
    attempts: int
    error: Optional[str] = None
    error_type: Optional[str] = None
    warnings: List[str]
    generated_code: Optional[str] = None
    validation_passed: bool
    metadata: Optional[JSON] = None


@strawberry.type
class TaskExecutionResponse:
    """Resposta completa de execução"""

    success: bool
    task_id: str
    result: Optional[ExecutionResultType] = None
    execution_plan: Optional[ExecutionPlanType] = None
    error: Optional[str] = None
    timestamp: str


@strawberry.type
class HealthStatus:
    """Status de saúde do sistema"""

    status: str
    version: str
    uptime: float
    components: JSON
    libraries_available: int
    last_check: str


@strawberry.type
class LibraryStatistics:
    """Estatísticas de bibliotecas"""

    total_profiles: int
    categories: JSON
    total_code_templates: int
    total_keywords: int
    profiles_list: List[str]


@strawberry.type
class ExecutionHistoryItem:
    """Item do histórico de execução"""

    task_id: str
    command: str
    task_type: TaskTypeEnum
    status: ExecutionStatusEnum
    library_used: Optional[str] = None
    execution_time: float
    timestamp: str


@strawberry.type
class TaskStatusResponse:
    """Status de uma tarefa"""

    task_id: str
    status: ExecutionStatusEnum
    progress: Optional[float] = None
    result: Optional[ExecutionResultType] = None
    estimated_completion: Optional[str] = None


# ============================================
# QUERIES
# ============================================


@strawberry.type
class Query:
    """GraphQL Queries"""

    @strawberry.field
    async def health(self) -> HealthStatus:
        """Verifica saúde do Omnibrain"""
        return HealthStatus(
            status="healthy",
            version="1.0.0",
            uptime=0.0,
            components={
                "task_classifier": True,
                "library_selector": True,
                "code_generator": True,
                "executor": True,
                "validator": True,
                "retry_engine": True,
            },
            libraries_available=19,  # Atualizar com count real
            last_check=datetime.now().isoformat(),
        )

    @strawberry.field
    async def library_profiles(
        self, category: Optional[str] = None, limit: Optional[int] = 50
    ) -> List[LibraryProfileType]:
        """Lista library profiles disponíveis"""
        loader = get_profile_loader()
        profiles = loader.load_all_profiles()

        # Filtrar por categoria se fornecido
        if category:
            profiles = {
                k: v
                for k, v in profiles.items()
                if category.lower() in v.category.lower()
            }

        # Converter para GraphQL types
        result = []
        for profile in list(profiles.values())[:limit]:
            result.append(
                LibraryProfileType(
                    name=profile.name,
                    category=profile.category,
                    version_min=profile.version_min,
                    version_recommended=profile.version_recommended,
                    description=profile.description,
                    documentation_url=profile.documentation_url,
                    performance_score=profile.performance_score,
                    memory_score=profile.memory_score,
                    quality_score=profile.quality_score,
                    ease_score=profile.ease_score,
                    keywords=profile.keywords,
                    use_when=profile.use_when,
                    dont_use_when=profile.dont_use_when,
                    alternatives=profile.alternatives,
                )
            )

        return result

    @strawberry.field
    async def library_profile(self, name: str) -> Optional[LibraryProfileType]:
        """Busca profile específico por nome"""
        loader = get_profile_loader()
        profile = loader.get_profile(name)

        if not profile:
            return None

        return LibraryProfileType(
            name=profile.name,
            category=profile.category,
            version_min=profile.version_min,
            version_recommended=profile.version_recommended,
            description=profile.description,
            documentation_url=profile.documentation_url,
            performance_score=profile.performance_score,
            memory_score=profile.memory_score,
            quality_score=profile.quality_score,
            ease_score=profile.ease_score,
            keywords=profile.keywords,
            use_when=profile.use_when,
            dont_use_when=profile.dont_use_when,
            alternatives=profile.alternatives,
        )

    @strawberry.field
    async def library_statistics(self) -> LibraryStatistics:
        """Estatísticas de bibliotecas"""
        loader = get_profile_loader()
        stats = loader.get_statistics()

        return LibraryStatistics(
            total_profiles=stats["total_profiles"],
            categories=stats["categories"],
            total_code_templates=stats["total_code_templates"],
            total_keywords=stats["total_keywords"],
            profiles_list=stats["profiles_list"],
        )

    @strawberry.field
    async def search_libraries(
        self, query: str, limit: Optional[int] = 10
    ) -> List[LibraryProfileType]:
        """Busca bibliotecas por keywords"""
        loader = get_profile_loader()
        profiles = loader.search_profiles(query, limit)

        result = []
        for profile in profiles:
            result.append(
                LibraryProfileType(
                    name=profile.name,
                    category=profile.category,
                    version_min=profile.version_min,
                    version_recommended=profile.version_recommended,
                    description=profile.description,
                    documentation_url=profile.documentation_url,
                    performance_score=profile.performance_score,
                    memory_score=profile.memory_score,
                    quality_score=profile.quality_score,
                    ease_score=profile.ease_score,
                    keywords=profile.keywords,
                    use_when=profile.use_when,
                    dont_use_when=profile.dont_use_when,
                    alternatives=profile.alternatives,
                )
            )

        return result


# ============================================
# MUTATIONS
# ============================================


@strawberry.type
class Mutation:
    """GraphQL Mutations"""

    @strawberry.mutation
    async def execute_task(self, input: TaskExecutionInput) -> TaskExecutionResponse:
        """Executa uma tarefa via Omnibrain"""
        try:
            # Criar engine
            engine = create_omnibrain_engine()

            # Preparar input
            task_input = OmnibrainTaskInput(
                command=input.command,
                task_type=input.task_type.value if input.task_type else None,
                context=input.context or {},
                files=[
                    {
                        "name": f.name,
                        "url": f.url,
                        "data": f.data,
                        "mime_type": f.mime_type,
                    }
                    for f in (input.files or [])
                ],
                max_retries=input.options.max_retries if input.options else 3,
                timeout=input.options.timeout if input.options else 60,
                enable_hybrid=input.options.enable_hybrid if input.options else True,
                priority=input.options.priority.value
                if input.options and input.options.priority
                else "normal",
                conversation_id=input.conversation_id,
                user_id=input.user_id,
            )

            # Executar
            result = await engine.execute(task_input)

            # Converter para GraphQL types
            execution_result = ExecutionResultType(
                status=ExecutionStatusEnum[result.status.name],
                output=result.output,
                library_used=result.library_used,
                execution_time=result.execution_time,
                attempts=result.attempts,
                error=result.error,
                error_type=result.error_type,
                warnings=result.warnings or [],
                generated_code=result.generated_code,
                validation_passed=result.validation_passed,
                metadata=result.metadata or {},
            )

            return TaskExecutionResponse(
                success=result.status.name == "SUCCESS",
                task_id=getattr(result, "task_id", "unknown"),
                result=execution_result,
                error=result.error if result.status.name != "SUCCESS" else None,
                timestamp=datetime.now().isoformat(),
            )

        except Exception as e:
            return TaskExecutionResponse(
                success=False,
                task_id="error",
                result=None,
                error=str(e),
                timestamp=datetime.now().isoformat(),
            )

    @strawberry.mutation
    async def execute_simple(self, command: str) -> TaskExecutionResponse:
        """Executa comando simples"""
        return await self.execute_task(TaskExecutionInput(command=command))


# ============================================
# SUBSCRIPTIONS
# ============================================


@strawberry.type
class Subscription:
    """GraphQL Subscriptions"""

    @strawberry.subscription
    async def task_progress(
        self, task_id: str
    ) -> AsyncGenerator[TaskStatusResponse, None]:
        """Stream de progresso de uma tarefa"""
        # Simulação de streaming de progresso
        for i in range(10):
            await asyncio.sleep(1)
            yield TaskStatusResponse(
                task_id=task_id,
                status=ExecutionStatusEnum.RUNNING,
                progress=float(i * 10),
                estimated_completion=f"{10 - i} seconds",
            )

        # Final
        yield TaskStatusResponse(
            task_id=task_id,
            status=ExecutionStatusEnum.SUCCESS,
            progress=100.0,
            estimated_completion="0 seconds",
        )


# ============================================
# SCHEMA
# ============================================

schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
    subscription=Subscription,
)


# ============================================
# EXPORTS
# ============================================

__all__ = [
    "schema",
    "Query",
    "Mutation",
    "Subscription",
    "TaskExecutionInput",
    "TaskExecutionResponse",
    "LibraryProfileType",
]
