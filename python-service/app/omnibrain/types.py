"""
============================================
SYNCADS OMNIBRAIN - SHARED TYPES
============================================
Tipos compartilhados para evitar imports circulares

IMPORTANTE: Este arquivo não deve importar nada de outros
módulos do omnibrain, apenas bibliotecas padrão e third-party.

Autor: SyncAds AI Team
Versão: 1.0.0
Data: 2025-01-15
============================================
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Union

# ============================================
# ENUMS
# ============================================


class TaskType(Enum):
    """Tipos de tarefas suportadas"""

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


class ExecutionStatus(Enum):
    """Status de execução"""

    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    PARTIAL = "partial"
    TIMEOUT = "timeout"
    RATE_LIMITED = "rate_limited"


class FailureLevel(Enum):
    """Níveis de falha para retry escalável"""

    LEVEL_1_SIMPLE = 1  # Erro simples - retry mesma lib
    LEVEL_2_STRUCTURAL = 2  # Erro estrutural - trocar lib
    LEVEL_3_IMPOSSIBLE = 3  # Impossível - abortar


class ExecutionMode(Enum):
    """Modos de execução"""

    SINGLE = "single"  # Biblioteca única
    SEQUENTIAL = "sequential"  # Múltiplas bibliotecas em sequência
    PARALLEL = "parallel"  # Múltiplas bibliotecas em paralelo
    HYBRID = "hybrid"  # Combinação de bibliotecas


class Priority(Enum):
    """Prioridade de execução"""

    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


# ============================================
# DATA CLASSES - INPUT
# ============================================


@dataclass
class TaskInput:
    """Input de tarefa para o Omnibrain"""

    command: str
    task_type: Optional[str] = None
    context: Dict[str, Any] = field(default_factory=dict)
    files: List[Dict[str, Any]] = field(default_factory=list)

    # Options
    max_retries: int = 3
    timeout: int = 60
    enable_hybrid: bool = True
    priority: str = "normal"

    # Multi-turn context
    conversation_id: Optional[str] = None
    user_id: Optional[str] = None
    previous_results: List[Any] = field(default_factory=list)

    # Metadata
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)


# ============================================
# DATA CLASSES - LIBRARY SELECTION
# ============================================


@dataclass
class LibraryCandidate:
    """Candidato a biblioteca para executar tarefa"""

    name: str
    confidence: float
    reasoning: str
    priority: int = 5
    estimated_time: float = 10.0

    # Requirements
    requirements: List[str] = field(default_factory=list)

    # Alternatives
    alternatives: List[str] = field(default_factory=list)

    # Pros and Cons
    pros: List[str] = field(default_factory=list)
    cons: List[str] = field(default_factory=list)

    # Performance
    performance_score: float = 0.0
    accuracy_score: float = 0.0
    ease_score: float = 0.0

    # Success tracking
    historical_success_rate: float = 0.0
    recent_failures: int = 0

    # Metadata
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ExecutionPlan:
    """Plano de execução completo"""

    task_id: str
    task_type: TaskType
    primary_library: LibraryCandidate
    alternatives: List[LibraryCandidate] = field(default_factory=list)

    # Strategy
    execution_mode: ExecutionMode = ExecutionMode.SINGLE
    requires_hybrid: bool = False
    subtasks: List[Dict[str, Any]] = field(default_factory=list)

    # Validation
    validation_criteria: Dict[str, Any] = field(default_factory=dict)
    expected_output_type: Optional[str] = None

    # Reasoning
    reasoning: str = ""
    confidence: float = 0.0

    # Resources
    estimated_time: float = 10.0
    estimated_memory: Optional[int] = None

    # Context
    context_analysis: Dict[str, Any] = field(default_factory=dict)

    # Metadata
    created_at: datetime = field(default_factory=datetime.now)
    metadata: Dict[str, Any] = field(default_factory=dict)


# ============================================
# DATA CLASSES - EXECUTION
# ============================================


@dataclass
class ExecutionResult:
    """Resultado de execução"""

    status: ExecutionStatus
    output: Any = None

    # Library info
    library_used: Optional[str] = None
    library_version: Optional[str] = None

    # Performance
    execution_time: float = 0.0
    attempts: int = 1

    # Error handling
    error: Optional[str] = None
    error_type: Optional[str] = None
    traceback: Optional[str] = None
    warnings: List[str] = field(default_factory=list)

    # Code
    generated_code: Optional[str] = None

    # Validation
    validation_passed: bool = False
    validation_details: Dict[str, Any] = field(default_factory=dict)

    # Metadata
    metadata: Dict[str, Any] = field(default_factory=dict)
    completed_at: datetime = field(default_factory=datetime.now)


# ============================================
# DATA CLASSES - RETRY/FALLBACK
# ============================================


@dataclass
class RetryContext:
    """Contexto de retry (compatível com core.engine e retry.retry_engine)"""

    # Basic info
    task_id: str
    library_name: str
    attempt_number: int
    max_attempts: int

    # Error info
    failure_type: str  # Pode ser FailureType enum ou string
    error_message: str

    # History
    previous_attempts: List[Any] = field(default_factory=list)
    libraries_tried: List[str] = field(default_factory=list)
    previous_errors: List[str] = field(default_factory=list)

    # Legacy fields (para compatibilidade com engine.py antigo)
    attempt: Optional[int] = None
    failure_level: Optional[FailureLevel] = None
    current_strategy: str = "primary"

    # Metadata
    metadata: Dict[str, Any] = field(default_factory=dict)


# ============================================
# DATA CLASSES - CONTEXT MANAGEMENT
# ============================================


@dataclass
class ConversationContext:
    """Contexto de conversa multi-turn"""

    conversation_id: str
    user_id: str

    # History
    messages: List[Dict[str, Any]] = field(default_factory=list)
    executions: List[ExecutionResult] = field(default_factory=list)

    # State
    variables: Dict[str, Any] = field(default_factory=dict)
    intermediate_results: Dict[str, Any] = field(default_factory=dict)

    # Metadata
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    metadata: Dict[str, Any] = field(default_factory=dict)


# ============================================
# DATA CLASSES - RESPONSE
# ============================================


@dataclass
class OmnibrainResponse:
    """Resposta padronizada do Omnibrain"""

    success: bool
    task_id: str

    # Result
    result: Optional[ExecutionResult] = None

    # Error
    error: Optional[str] = None
    error_type: Optional[str] = None

    # Plan
    execution_plan: Optional[ExecutionPlan] = None

    # Timing
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

    # Metadata
    metadata: Dict[str, Any] = field(default_factory=dict)


# ============================================
# DATA CLASSES - LIBRARY PROFILE
# ============================================


@dataclass
class LibraryProfile:
    """Profile de biblioteca carregado de arquivo"""

    name: str
    category: str
    version_min: str
    version_recommended: str

    # Metadata
    description: str = ""
    documentation_url: str = ""
    license: str = ""

    # Use cases
    use_cases: List[Dict[str, float]] = field(default_factory=list)

    # Performance
    performance_score: float = 0.0
    memory_score: float = 0.0
    quality_score: float = 0.0
    ease_score: float = 0.0

    # Keywords
    keywords: List[str] = field(default_factory=list)

    # Decision criteria
    use_when: List[str] = field(default_factory=list)
    dont_use_when: List[str] = field(default_factory=list)

    # Alternatives
    alternatives: List[str] = field(default_factory=list)

    # Templates
    code_templates: Dict[str, str] = field(default_factory=dict)

    # Requirements
    dependencies: List[str] = field(default_factory=list)
    system_requirements: List[str] = field(default_factory=list)

    # Compatibility
    python_versions: List[str] = field(default_factory=list)
    platforms: List[str] = field(default_factory=list)

    # Metadata
    metadata: Dict[str, Any] = field(default_factory=dict)


# ============================================
# DATA CLASSES - SUBTASK
# ============================================


@dataclass
class Subtask:
    """Subtarefa de uma tarefa complexa"""

    subtask_id: str
    name: str
    task_type: TaskType
    command: str

    # Dependencies
    depends_on: List[str] = field(default_factory=list)
    input_from: Optional[str] = None  # ID da subtask que fornece input

    # Execution
    library_preference: Optional[str] = None
    priority: Priority = Priority.NORMAL

    # Status
    status: ExecutionStatus = ExecutionStatus.PENDING
    result: Optional[ExecutionResult] = None

    # Metadata
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TaskPlan:
    """Plano completo de tarefa com subtarefas"""

    task_id: str
    original_command: str
    subtasks: List[Subtask] = field(default_factory=list)

    # Execution order
    execution_order: List[str] = field(default_factory=list)

    # Status
    status: ExecutionStatus = ExecutionStatus.PENDING

    # Results
    final_result: Optional[Any] = None

    # Metadata
    created_at: datetime = field(default_factory=datetime.now)
    metadata: Dict[str, Any] = field(default_factory=dict)


# ============================================
# UTILITY FUNCTIONS
# ============================================


def execution_status_from_string(status_str: str) -> ExecutionStatus:
    """Converte string para ExecutionStatus"""
    try:
        return ExecutionStatus(status_str.lower())
    except (ValueError, AttributeError):
        return ExecutionStatus.FAILED


def task_type_from_string(type_str: str) -> TaskType:
    """Converte string para TaskType"""
    try:
        return TaskType(type_str.lower())
    except (ValueError, AttributeError):
        return TaskType.UNKNOWN


def priority_from_string(priority_str: str) -> Priority:
    """Converte string para Priority"""
    try:
        return Priority(priority_str.lower())
    except (ValueError, AttributeError):
        return Priority.NORMAL


# ============================================
# TYPE ALIASES
# ============================================


# Para compatibilidade com código existente
LibraryName = str
TaskID = str
ConversationID = str
UserID = str
