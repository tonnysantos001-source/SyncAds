"""
============================================
SYNCADS OMNIBRAIN - FASTAPI ROUTER
============================================
API REST para o Omnibrain Engine

Endpoints:
- POST /omnibrain/execute - Executa tarefa
- POST /omnibrain/execute/async - Executa tarefa async
- GET /omnibrain/task/{task_id} - Status da tarefa
- GET /omnibrain/history - Histórico de execuções
- GET /omnibrain/statistics - Estatísticas
- POST /omnibrain/validate - Valida código
- WS /omnibrain/stream - Streaming de execução

Autor: SyncAds AI Team
Versão: 1.0.0
============================================
"""

import asyncio
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import (
    APIRouter,
    BackgroundTasks,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
)
from pydantic import BaseModel, Field

from ..omnibrain.classifiers.task_classifier import TaskClassifier

# Omnibrain imports
from ..omnibrain.core.engine import (
    ExecutionResult,
    ExecutionStatus,
    OmnibrainEngine,
    TaskInput,
    TaskType,
    create_omnibrain_engine,
)
from ..omnibrain.engines.code_generator import CodeGenerator
from ..omnibrain.engines.library_selector import LibrarySelector
from ..omnibrain.executors.safe_executor import SafeExecutor
from ..omnibrain.retry.retry_engine import RetryEngine
from ..omnibrain.validators.result_validator import ResultValidator

logger = logging.getLogger("omnibrain.router")

# ============================================
# ROUTER SETUP
# ============================================

router = APIRouter(
    prefix="/api/omnibrain",
    tags=["Omnibrain AI"],
    responses={404: {"description": "Not found"}},
)

# Global Omnibrain Engine instance
_omnibrain_engine: Optional[OmnibrainEngine] = None


def get_omnibrain_engine() -> OmnibrainEngine:
    """Get or create Omnibrain Engine instance"""
    global _omnibrain_engine

    if _omnibrain_engine is None:
        logger.info("Initializing Omnibrain Engine...")

        # Create engine
        engine = create_omnibrain_engine(
            {
                "max_retries": 5,
                "enable_hybrid": True,
                "safe_mode": True,
            }
        )

        # Inject components
        engine.task_classifier = TaskClassifier()
        engine.library_selector = LibrarySelector()
        engine.code_generator = CodeGenerator()
        engine.executor = SafeExecutor()
        engine.validator = ResultValidator()
        engine.retry_engine = RetryEngine()

        _omnibrain_engine = engine
        logger.info("Omnibrain Engine initialized successfully")

    return _omnibrain_engine


# ============================================
# PYDANTIC MODELS
# ============================================


class ExecuteTaskRequest(BaseModel):
    """Request model para executar tarefa"""

    command: str = Field(..., description="Comando em linguagem natural", min_length=1)
    context: Optional[Dict[str, Any]] = Field(
        default={}, description="Contexto adicional"
    )
    files: Optional[List[Dict[str, Any]]] = Field(
        default=[], description="Arquivos anexados"
    )
    metadata: Optional[Dict[str, Any]] = Field(default={}, description="Metadados")
    user_id: Optional[str] = Field(None, description="ID do usuário")
    priority: Optional[int] = Field(5, ge=1, le=10, description="Prioridade (1-10)")
    timeout: Optional[int] = Field(
        300, ge=10, le=3600, description="Timeout em segundos"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "command": "Otimize esta imagem para web",
                "context": {"quality": 85, "format": "webp"},
                "files": [{"filename": "image.jpg", "size": 1024000}],
                "user_id": "user123",
                "priority": 5,
                "timeout": 60,
            }
        }


class ExecuteTaskResponse(BaseModel):
    """Response model para execução de tarefa"""

    task_id: str
    status: str
    output: Optional[Any] = None
    error: Optional[str] = None
    execution_time: float
    attempts: int
    library_used: Optional[str] = None
    validation_passed: bool = False
    metadata: Dict[str, Any] = {}

    class Config:
        json_schema_extra = {
            "example": {
                "task_id": "abc123def456",
                "status": "success",
                "output": {"result": "processed"},
                "execution_time": 2.34,
                "attempts": 1,
                "library_used": "Pillow",
                "validation_passed": True,
                "metadata": {"width": 1920, "height": 1080},
            }
        }


class TaskStatusResponse(BaseModel):
    """Response model para status de tarefa"""

    task_id: str
    status: str
    progress: Optional[float] = None
    current_stage: Optional[str] = None
    estimated_time_remaining: Optional[float] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class HistoryResponse(BaseModel):
    """Response model para histórico"""

    total: int
    results: List[ExecuteTaskResponse]


class StatisticsResponse(BaseModel):
    """Response model para estatísticas"""

    total_executions: int
    successful_executions: int
    failed_executions: int
    success_rate: float
    average_execution_time: float
    most_used_libraries: Dict[str, int]
    task_types_distribution: Dict[str, int]


class ValidateCodeRequest(BaseModel):
    """Request model para validar código"""

    code: str = Field(..., description="Código Python para validar")
    strict_mode: bool = Field(True, description="Modo estrito de validação")


class ValidateCodeResponse(BaseModel):
    """Response model para validação de código"""

    is_valid: bool
    is_safe: bool
    violations: List[str]
    warnings: List[str]
    imports_detected: List[str]


class HealthResponse(BaseModel):
    """Response model para health check"""

    status: str
    version: str
    omnibrain_initialized: bool
    components: Dict[str, bool]
    statistics: Dict[str, Any]


# ============================================
# ENDPOINTS
# ============================================


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check do Omnibrain Engine

    Retorna status dos componentes e estatísticas básicas
    """
    try:
        engine = get_omnibrain_engine()

        components = {
            "task_classifier": engine.task_classifier is not None,
            "library_selector": engine.library_selector is not None,
            "code_generator": engine.code_generator is not None,
            "executor": engine.executor is not None,
            "validator": engine.validator is not None,
            "retry_engine": engine.retry_engine is not None,
        }

        stats = {
            "active_tasks": len(engine.active_tasks),
            "total_history": len(engine.execution_history),
        }

        return HealthResponse(
            status="healthy",
            version="1.0.0",
            omnibrain_initialized=True,
            components=components,
            statistics=stats,
        )

    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return HealthResponse(
            status="unhealthy",
            version="1.0.0",
            omnibrain_initialized=False,
            components={},
            statistics={},
        )


@router.post("/execute", response_model=ExecuteTaskResponse)
async def execute_task(request: ExecuteTaskRequest):
    """
    Executa uma tarefa com o Omnibrain Engine

    O Omnibrain irá:
    1. Classificar o tipo de tarefa
    2. Selecionar a melhor biblioteca
    3. Gerar código otimizado
    4. Executar com segurança
    5. Validar o resultado
    6. Fazer retry automático se necessário

    Returns:
        ExecuteTaskResponse com resultado da execução
    """
    try:
        logger.info(f"Executing task: {request.command[:50]}...")

        # Get engine
        engine = get_omnibrain_engine()

        # Create TaskInput
        task_input = TaskInput(
            command=request.command,
            context=request.context or {},
            files=request.files or [],
            metadata=request.metadata or {},
            user_id=request.user_id,
            priority=request.priority,
            timeout=request.timeout,
        )

        # Execute
        result = await engine.execute(task_input)

        # Convert to response
        response = ExecuteTaskResponse(
            task_id=result.task_id,
            status=result.status.value,
            output=result.output,
            error=result.error,
            execution_time=result.execution_time,
            attempts=result.attempts,
            library_used=result.library_used,
            validation_passed=result.validation_passed,
            metadata=result.metadata,
        )

        logger.info(f"Task {result.task_id} completed: {result.status.value}")

        return response

    except Exception as e:
        logger.error(f"Task execution failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Execution failed: {str(e)}")


@router.post("/execute/async", status_code=202)
async def execute_task_async(
    request: ExecuteTaskRequest, background_tasks: BackgroundTasks
):
    """
    Executa tarefa em background (assíncrona)

    Returns:
        task_id para consultar status posteriormente
    """
    try:
        # Generate task_id
        import hashlib
        from datetime import datetime

        task_id = hashlib.md5(
            f"{request.command}{datetime.now().isoformat()}".encode()
        ).hexdigest()[:12]

        # Add to background tasks
        background_tasks.add_task(_execute_task_background, task_id, request)

        logger.info(f"Task {task_id} queued for background execution")

        return {
            "task_id": task_id,
            "status": "queued",
            "message": "Task queued for execution",
        }

    except Exception as e:
        logger.error(f"Failed to queue task: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to queue: {str(e)}")


async def _execute_task_background(task_id: str, request: ExecuteTaskRequest):
    """Background task execution"""
    try:
        engine = get_omnibrain_engine()

        task_input = TaskInput(
            command=request.command,
            context=request.context or {},
            files=request.files or [],
            metadata=request.metadata or {},
            user_id=request.user_id,
            priority=request.priority,
            timeout=request.timeout,
        )

        result = await engine.execute(task_input)
        logger.info(f"Background task {task_id} completed: {result.status.value}")

    except Exception as e:
        logger.error(f"Background task {task_id} failed: {str(e)}")


@router.get("/task/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    """
    Consulta status de uma tarefa em execução ou concluída

    Args:
        task_id: ID da tarefa

    Returns:
        TaskStatusResponse com status atual
    """
    try:
        engine = get_omnibrain_engine()

        # Check active tasks
        active_task = engine.get_task_status(task_id)

        if active_task:
            return TaskStatusResponse(
                task_id=task_id,
                status=active_task.status.value,
                progress=None,
                current_stage="executing",
            )

        # Check history
        for result in engine.execution_history:
            if result.task_id == task_id:
                return TaskStatusResponse(
                    task_id=task_id,
                    status=result.status.value,
                    progress=100.0,
                    current_stage="completed",
                )

        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get task status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history", response_model=HistoryResponse)
async def get_execution_history(limit: int = 100, offset: int = 0):
    """
    Retorna histórico de execuções

    Args:
        limit: Número máximo de resultados (default: 100)
        offset: Offset para paginação (default: 0)

    Returns:
        HistoryResponse com lista de execuções
    """
    try:
        engine = get_omnibrain_engine()

        history = engine.get_execution_history(limit=1000)
        total = len(history)

        # Paginate
        paginated = history[offset : offset + limit]

        # Convert to responses
        results = [
            ExecuteTaskResponse(
                task_id=r.task_id,
                status=r.status.value,
                output=r.output,
                error=r.error,
                execution_time=r.execution_time,
                attempts=r.attempts,
                library_used=r.library_used,
                validation_passed=r.validation_passed,
                metadata=r.metadata,
            )
            for r in paginated
        ]

        return HistoryResponse(total=total, results=results)

    except Exception as e:
        logger.error(f"Failed to get history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/statistics", response_model=StatisticsResponse)
async def get_statistics():
    """
    Retorna estatísticas de execução do Omnibrain

    Returns:
        StatisticsResponse com métricas agregadas
    """
    try:
        engine = get_omnibrain_engine()

        history = engine.get_execution_history()

        if not history:
            return StatisticsResponse(
                total_executions=0,
                successful_executions=0,
                failed_executions=0,
                success_rate=0.0,
                average_execution_time=0.0,
                most_used_libraries={},
                task_types_distribution={},
            )

        # Calculate stats
        total = len(history)
        successful = sum(1 for r in history if r.status == ExecutionStatus.SUCCESS)
        failed = total - successful
        success_rate = successful / total if total > 0 else 0.0

        avg_time = sum(r.execution_time for r in history) / total

        # Most used libraries
        from collections import Counter

        libraries = [r.library_used for r in history if r.library_used]
        library_counts = dict(Counter(libraries).most_common(10))

        # Task types (simplified)
        task_types = {}

        return StatisticsResponse(
            total_executions=total,
            successful_executions=successful,
            failed_executions=failed,
            success_rate=success_rate,
            average_execution_time=avg_time,
            most_used_libraries=library_counts,
            task_types_distribution=task_types,
        )

    except Exception as e:
        logger.error(f"Failed to get statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/validate", response_model=ValidateCodeResponse)
async def validate_code(request: ValidateCodeRequest):
    """
    Valida código Python quanto a segurança

    Args:
        request: ValidateCodeRequest com código

    Returns:
        ValidateCodeResponse com resultado da validação
    """
    try:
        engine = get_omnibrain_engine()

        if not engine.executor:
            raise HTTPException(status_code=503, detail="Executor not initialized")

        # Validate code safety
        is_safe, reasons = engine.executor.is_code_safe(request.code)

        # Get security config
        security_config = engine.executor.get_security_config()

        # Detect imports
        import ast

        imports = []
        try:
            tree = ast.parse(request.code)
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.append(alias.name)
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        imports.append(node.module)
        except:
            pass

        return ValidateCodeResponse(
            is_valid=is_safe,
            is_safe=is_safe,
            violations=reasons if not is_safe else [],
            warnings=[],
            imports_detected=imports,
        )

    except Exception as e:
        logger.error(f"Validation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/stream")
async def websocket_stream(websocket: WebSocket):
    """
    WebSocket para streaming de execução em tempo real

    Cliente pode enviar tarefas e receber updates em tempo real
    """
    await websocket.accept()

    try:
        logger.info("WebSocket client connected")

        while True:
            # Receive message
            data = await websocket.receive_json()

            command = data.get("command")
            context = data.get("context", {})

            if not command:
                await websocket.send_json({"error": "Missing 'command' field"})
                continue

            # Send acknowledgment
            await websocket.send_json(
                {
                    "type": "started",
                    "message": "Task started",
                    "progress": 0,
                }
            )

            # Execute task
            try:
                engine = get_omnibrain_engine()

                task_input = TaskInput(
                    command=command,
                    context=context,
                )

                # Send progress updates
                await websocket.send_json(
                    {
                        "type": "progress",
                        "stage": "classifying",
                        "progress": 20,
                    }
                )

                result = await engine.execute(task_input)

                await websocket.send_json(
                    {
                        "type": "progress",
                        "stage": "executing",
                        "progress": 80,
                    }
                )

                # Send result
                await websocket.send_json(
                    {
                        "type": "completed",
                        "task_id": result.task_id,
                        "status": result.status.value,
                        "output": result.output,
                        "execution_time": result.execution_time,
                        "progress": 100,
                    }
                )

            except Exception as e:
                await websocket.send_json(
                    {
                        "type": "error",
                        "error": str(e),
                    }
                )

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        try:
            await websocket.send_json({"type": "error", "error": str(e)})
        except:
            pass


# ============================================
# STARTUP EVENT
# ============================================


@router.on_event("startup")
async def startup_event():
    """Initialize Omnibrain on startup"""
    try:
        logger.info("Starting Omnibrain Engine initialization...")
        engine = get_omnibrain_engine()
        logger.info("Omnibrain Engine ready!")
    except Exception as e:
        logger.error(f"Failed to initialize Omnibrain: {str(e)}")
