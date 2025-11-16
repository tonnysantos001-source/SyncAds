"""
============================================
SYNCADS OMNIBRAIN - WEBHOOKS ROUTER
============================================
Router FastAPI para gerenciamento de webhooks

Endpoints:
- POST /webhooks - Criar webhook
- GET /webhooks - Listar webhooks
- GET /webhooks/{id} - Buscar webhook específico
- PUT /webhooks/{id} - Atualizar webhook
- DELETE /webhooks/{id} - Remover webhook
- POST /webhooks/{id}/pause - Pausar webhook
- POST /webhooks/{id}/resume - Resumir webhook
- POST /webhooks/{id}/test - Testar webhook
- GET /webhooks/{id}/deliveries - Histórico de entregas
- GET /webhooks/statistics - Estatísticas gerais

Autor: SyncAds AI Team
Versão: 2.0.0
Data: 2025-01-15
============================================
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, HttpUrl

from app.webhooks import (
    DeliveryStatus,
    WebhookEvent,
    WebhookStatus,
    dispatch_event,
    get_webhook_dispatcher,
    get_webhook_manager,
)

# ============================================
# ROUTER
# ============================================

router = APIRouter()

# ============================================
# PYDANTIC MODELS
# ============================================


class WebhookCreateRequest(BaseModel):
    """Request para criar webhook"""

    url: HttpUrl
    events: List[str] = Field(..., min_items=1)
    description: Optional[str] = None
    secret: Optional[str] = None
    headers: Optional[dict] = {}
    timeout: int = Field(30, ge=5, le=120)
    max_retries: int = Field(3, ge=0, le=10)
    retry_delay: int = Field(5, ge=1, le=60)
    filters: Optional[dict] = {}
    rate_limit: Optional[int] = Field(None, ge=1)

    class Config:
        schema_extra = {
            "example": {
                "url": "https://example.com/webhook",
                "events": ["task.completed", "task.failed"],
                "description": "Production webhook for task completion",
                "timeout": 30,
                "max_retries": 3,
            }
        }


class WebhookUpdateRequest(BaseModel):
    """Request para atualizar webhook"""

    url: Optional[HttpUrl] = None
    events: Optional[List[str]] = None
    description: Optional[str] = None
    headers: Optional[dict] = None
    timeout: Optional[int] = Field(None, ge=5, le=120)
    max_retries: Optional[int] = Field(None, ge=0, le=10)
    retry_delay: Optional[int] = Field(None, ge=1, le=60)
    filters: Optional[dict] = None
    rate_limit: Optional[int] = Field(None, ge=1)


class WebhookResponse(BaseModel):
    """Response de webhook"""

    id: str
    url: str
    events: List[str]
    status: str
    description: Optional[str] = None
    created_at: str
    updated_at: str
    last_delivery: Optional[str] = None
    success_count: int
    failure_count: int
    secret: str  # Incluir apenas na criação


class WebhookListResponse(BaseModel):
    """Response para lista de webhooks"""

    webhooks: List[WebhookResponse]
    total: int


class WebhookTestRequest(BaseModel):
    """Request para testar webhook"""

    event_type: str = "task.completed"
    sample_data: Optional[dict] = None


class DeliveryResponse(BaseModel):
    """Response de delivery"""

    id: str
    webhook_id: str
    event: str
    status: str
    url: str
    attempt: int
    max_attempts: int
    created_at: str
    sent_at: Optional[str] = None
    completed_at: Optional[str] = None
    status_code: Optional[int] = None
    error: Optional[str] = None
    next_retry_at: Optional[str] = None


class DeliveryHistoryResponse(BaseModel):
    """Response para histórico de deliveries"""

    deliveries: List[DeliveryResponse]
    total: int
    webhook_id: str


class WebhookStatisticsResponse(BaseModel):
    """Response de estatísticas"""

    total_webhooks: int
    active_webhooks: int
    total_deliveries: int
    total_sent: int
    total_success: int
    total_failed: int
    total_retries: int
    success_rate: float
    failure_rate: float


# ============================================
# HELPER FUNCTIONS
# ============================================


def parse_webhook_events(event_strings: List[str]) -> List[WebhookEvent]:
    """Parse lista de strings para WebhookEvent enums"""
    events = []
    for event_str in event_strings:
        try:
            events.append(WebhookEvent(event_str))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid event type: {event_str}",
            )
    return events


def webhook_to_response(webhook) -> WebhookResponse:
    """Converte WebhookConfig para response"""
    return WebhookResponse(
        id=webhook.id,
        url=str(webhook.url),
        events=[e.value for e in webhook.events],
        status=webhook.status.value,
        description=webhook.description,
        created_at=webhook.created_at.isoformat(),
        updated_at=webhook.updated_at.isoformat(),
        last_delivery=webhook.last_delivery.isoformat()
        if webhook.last_delivery
        else None,
        success_count=webhook.success_count,
        failure_count=webhook.failure_count,
        secret=webhook.secret,
    )


def delivery_to_response(delivery) -> DeliveryResponse:
    """Converte WebhookDelivery para response"""
    return DeliveryResponse(
        id=delivery.id,
        webhook_id=delivery.webhook_id,
        event=delivery.event.value,
        status=delivery.status.value,
        url=delivery.url,
        attempt=delivery.attempt,
        max_attempts=delivery.max_attempts,
        created_at=delivery.created_at.isoformat(),
        sent_at=delivery.sent_at.isoformat() if delivery.sent_at else None,
        completed_at=delivery.completed_at.isoformat()
        if delivery.completed_at
        else None,
        status_code=delivery.status_code,
        error=delivery.error,
        next_retry_at=delivery.next_retry_at.isoformat()
        if delivery.next_retry_at
        else None,
    )


# ============================================
# ENDPOINTS
# ============================================


@router.post("/", response_model=WebhookResponse, status_code=status.HTTP_201_CREATED)
async def create_webhook(request: WebhookCreateRequest):
    """Cria um novo webhook"""
    manager = get_webhook_manager()

    # Parse eventos
    events = parse_webhook_events(request.events)

    # Criar webhook
    webhook = manager.register(
        url=str(request.url),
        events=events,
        secret=request.secret,
        description=request.description,
        headers=request.headers or {},
        timeout=request.timeout,
        max_retries=request.max_retries,
        retry_delay=request.retry_delay,
        filters=request.filters or {},
        rate_limit=request.rate_limit,
    )

    return webhook_to_response(webhook)


@router.get("/", response_model=WebhookListResponse)
async def list_webhooks(status_filter: Optional[str] = None):
    """Lista todos os webhooks"""
    manager = get_webhook_manager()

    # Filtrar por status se fornecido
    webhook_status = None
    if status_filter:
        try:
            webhook_status = WebhookStatus(status_filter)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {status_filter}",
            )

    webhooks = manager.list(status=webhook_status)

    return WebhookListResponse(
        webhooks=[webhook_to_response(w) for w in webhooks], total=len(webhooks)
    )


@router.get("/{webhook_id}", response_model=WebhookResponse)
async def get_webhook(webhook_id: str):
    """Busca webhook específico"""
    manager = get_webhook_manager()

    webhook = manager.get(webhook_id)
    if not webhook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Webhook not found"
        )

    return webhook_to_response(webhook)


@router.put("/{webhook_id}", response_model=WebhookResponse)
async def update_webhook(webhook_id: str, request: WebhookUpdateRequest):
    """Atualiza webhook"""
    manager = get_webhook_manager()

    webhook = manager.get(webhook_id)
    if not webhook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Webhook not found"
        )

    # Preparar updates
    updates = {}
    if request.url:
        updates["url"] = str(request.url)
    if request.events:
        updates["events"] = parse_webhook_events(request.events)
    if request.description is not None:
        updates["description"] = request.description
    if request.headers is not None:
        updates["headers"] = request.headers
    if request.timeout is not None:
        updates["timeout"] = request.timeout
    if request.max_retries is not None:
        updates["max_retries"] = request.max_retries
    if request.retry_delay is not None:
        updates["retry_delay"] = request.retry_delay
    if request.filters is not None:
        updates["filters"] = request.filters
    if request.rate_limit is not None:
        updates["rate_limit"] = request.rate_limit

    # Atualizar
    webhook = manager.update(webhook_id, **updates)

    return webhook_to_response(webhook)


@router.delete("/{webhook_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_webhook(webhook_id: str):
    """Remove webhook"""
    manager = get_webhook_manager()

    success = manager.delete(webhook_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Webhook not found"
        )

    return None


@router.post("/{webhook_id}/pause", response_model=WebhookResponse)
async def pause_webhook(webhook_id: str):
    """Pausa webhook"""
    manager = get_webhook_manager()

    success = manager.pause(webhook_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Webhook not found"
        )

    webhook = manager.get(webhook_id)
    return webhook_to_response(webhook)


@router.post("/{webhook_id}/resume", response_model=WebhookResponse)
async def resume_webhook(webhook_id: str):
    """Resume webhook pausado"""
    manager = get_webhook_manager()

    success = manager.resume(webhook_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Webhook not found"
        )

    webhook = manager.get(webhook_id)
    return webhook_to_response(webhook)


@router.post("/{webhook_id}/test")
async def test_webhook(webhook_id: str, request: WebhookTestRequest):
    """Testa webhook enviando evento de teste"""
    manager = get_webhook_manager()

    webhook = manager.get(webhook_id)
    if not webhook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Webhook not found"
        )

    # Parse evento de teste
    try:
        event = WebhookEvent(request.event_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid event type: {request.event_type}",
        )

    # Dados de teste
    test_data = request.sample_data or {
        "test": True,
        "message": "This is a test webhook",
        "timestamp": datetime.now().isoformat(),
    }

    # Disparar evento de teste
    await dispatch_event(event, test_data, task_id="test-task-id")

    return {
        "success": True,
        "message": f"Test webhook sent to {webhook.url}",
        "event": event.value,
        "webhook_id": webhook_id,
    }


@router.get("/{webhook_id}/deliveries", response_model=DeliveryHistoryResponse)
async def get_webhook_deliveries(webhook_id: str, limit: int = 50, offset: int = 0):
    """Busca histórico de deliveries de um webhook"""
    manager = get_webhook_manager()

    webhook = manager.get(webhook_id)
    if not webhook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Webhook not found"
        )

    # Filtrar deliveries deste webhook
    deliveries = [d for d in manager.deliveries.values() if d.webhook_id == webhook_id]

    # Ordenar por data (mais recentes primeiro)
    deliveries.sort(key=lambda d: d.created_at, reverse=True)

    # Paginação
    total = len(deliveries)
    deliveries = deliveries[offset : offset + limit]

    return DeliveryHistoryResponse(
        deliveries=[delivery_to_response(d) for d in deliveries],
        total=total,
        webhook_id=webhook_id,
    )


@router.get("/statistics", response_model=WebhookStatisticsResponse)
async def get_webhook_statistics():
    """Retorna estatísticas de webhooks"""
    manager = get_webhook_manager()

    stats = manager.get_statistics()

    # Calcular taxas
    total_sent = stats.get("total_sent", 0)
    success_rate = (
        (stats.get("total_success", 0) / total_sent * 100) if total_sent > 0 else 0.0
    )
    failure_rate = (
        (stats.get("total_failed", 0) / total_sent * 100) if total_sent > 0 else 0.0
    )

    return WebhookStatisticsResponse(
        total_webhooks=stats.get("total_webhooks", 0),
        active_webhooks=stats.get("active_webhooks", 0),
        total_deliveries=stats.get("total_deliveries", 0),
        total_sent=total_sent,
        total_success=stats.get("total_success", 0),
        total_failed=stats.get("total_failed", 0),
        total_retries=stats.get("total_retries", 0),
        success_rate=round(success_rate, 2),
        failure_rate=round(failure_rate, 2),
    )


# ============================================
# HEALTH CHECK
# ============================================


@router.get("/health")
async def webhooks_health():
    """Health check do sistema de webhooks"""
    manager = get_webhook_manager()
    dispatcher = get_webhook_dispatcher()

    stats = manager.get_statistics()

    return {
        "status": "healthy",
        "service": "webhooks",
        "dispatcher_running": dispatcher.running,
        "total_webhooks": stats.get("total_webhooks", 0),
        "active_webhooks": stats.get("active_webhooks", 0),
        "queue_size": manager.queue.qsize(),
    }


# ============================================
# STARTUP EVENT
# ============================================


@router.on_event("startup")
async def startup_event():
    """Inicia webhook dispatcher"""
    dispatcher = get_webhook_dispatcher()
    await dispatcher.start()


@router.on_event("shutdown")
async def shutdown_event():
    """Para webhook dispatcher"""
    dispatcher = get_webhook_dispatcher()
    await dispatcher.stop()
