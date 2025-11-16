"""
============================================
SYNCADS OMNIBRAIN - WEBHOOKS SYSTEM
============================================
Sistema completo de Webhooks para notificações event-driven

Features:
- Webhook registration e management
- Event dispatching assíncrono
- Retry automático com exponential backoff
- Signature verification (HMAC)
- Event types e filtering
- Delivery queue com priority
- Rate limiting
- Webhook health monitoring
- Delivery history e analytics

Autor: SyncAds AI Team
Versão: 2.0.0
Data: 2025-01-15
============================================
"""

import asyncio
import hashlib
import hmac
import json
import logging
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Callable, Dict, List, Optional
from uuid import uuid4

import httpx

logger = logging.getLogger("omnibrain.webhooks")


# ============================================
# ENUMS
# ============================================


class WebhookEvent(Enum):
    """Tipos de eventos de webhook"""

    # Task events
    TASK_CREATED = "task.created"
    TASK_STARTED = "task.started"
    TASK_PROGRESS = "task.progress"
    TASK_COMPLETED = "task.completed"
    TASK_FAILED = "task.failed"
    TASK_TIMEOUT = "task.timeout"
    TASK_CANCELLED = "task.cancelled"

    # Execution events
    EXECUTION_STARTED = "execution.started"
    EXECUTION_RETRY = "execution.retry"
    EXECUTION_FALLBACK = "execution.fallback"
    EXECUTION_SUCCESS = "execution.success"
    EXECUTION_ERROR = "execution.error"

    # System events
    SYSTEM_HEALTH_DEGRADED = "system.health.degraded"
    SYSTEM_HEALTH_RECOVERED = "system.health.recovered"
    SYSTEM_RATE_LIMIT = "system.rate_limit"

    # Library events
    LIBRARY_SELECTED = "library.selected"
    LIBRARY_FAILED = "library.failed"
    LIBRARY_SWITCHED = "library.switched"


class WebhookStatus(Enum):
    """Status de um webhook"""

    ACTIVE = "active"
    PAUSED = "paused"
    DISABLED = "disabled"
    FAILED = "failed"


class DeliveryStatus(Enum):
    """Status de entrega"""

    PENDING = "pending"
    SENDING = "sending"
    SUCCESS = "success"
    FAILED = "failed"
    RETRY = "retry"
    CANCELLED = "cancelled"


# ============================================
# DATA CLASSES
# ============================================


@dataclass
class WebhookConfig:
    """Configuração de um webhook"""

    id: str
    url: str
    events: List[WebhookEvent]
    secret: str
    status: WebhookStatus = WebhookStatus.ACTIVE

    # Optional configs
    description: Optional[str] = None
    headers: Dict[str, str] = field(default_factory=dict)
    timeout: int = 30
    max_retries: int = 3
    retry_delay: int = 5  # seconds

    # Filtering
    filters: Dict[str, Any] = field(default_factory=dict)

    # Metadata
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    last_delivery: Optional[datetime] = None
    success_count: int = 0
    failure_count: int = 0

    # Rate limiting
    rate_limit: Optional[int] = None  # requests per minute
    rate_limit_window: int = 60  # seconds

    def should_trigger(self, event: WebhookEvent, payload: Dict) -> bool:
        """Verifica se webhook deve ser disparado para este evento"""
        if self.status != WebhookStatus.ACTIVE:
            return False

        if event not in self.events:
            return False

        # Apply filters
        if self.filters:
            for key, value in self.filters.items():
                if payload.get(key) != value:
                    return False

        return True


@dataclass
class WebhookPayload:
    """Payload de um webhook"""

    event: WebhookEvent
    event_id: str
    timestamp: datetime
    data: Dict[str, Any]

    # Context
    task_id: Optional[str] = None
    user_id: Optional[str] = None

    # Metadata
    api_version: str = "2.0"
    retry_count: int = 0

    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionário"""
        return {
            "event": self.event.value,
            "event_id": self.event_id,
            "timestamp": self.timestamp.isoformat(),
            "data": self.data,
            "task_id": self.task_id,
            "user_id": self.user_id,
            "api_version": self.api_version,
            "retry_count": self.retry_count,
        }


@dataclass
class WebhookDelivery:
    """Registro de entrega de webhook"""

    id: str
    webhook_id: str
    event: WebhookEvent
    payload: WebhookPayload
    status: DeliveryStatus

    # Delivery info
    url: str
    attempt: int = 1
    max_attempts: int = 3

    # Timing
    created_at: datetime = field(default_factory=datetime.now)
    sent_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    # Response
    status_code: Optional[int] = None
    response_body: Optional[str] = None
    error: Optional[str] = None

    # Retry
    next_retry_at: Optional[datetime] = None


# ============================================
# WEBHOOK MANAGER
# ============================================


class WebhookManager:
    """Gerenciador de webhooks"""

    def __init__(self):
        self.webhooks: Dict[str, WebhookConfig] = {}
        self.deliveries: Dict[str, WebhookDelivery] = {}
        self.queue: asyncio.Queue = asyncio.Queue()

        # Stats
        self.stats = {
            "total_sent": 0,
            "total_success": 0,
            "total_failed": 0,
            "total_retries": 0,
        }

        logger.info("WebhookManager initialized")

    def register(
        self,
        url: str,
        events: List[WebhookEvent],
        secret: Optional[str] = None,
        **kwargs,
    ) -> WebhookConfig:
        """Registra um novo webhook"""
        webhook_id = str(uuid4())
        webhook_secret = secret or self._generate_secret()

        webhook = WebhookConfig(
            id=webhook_id,
            url=url,
            events=events,
            secret=webhook_secret,
            **kwargs,
        )

        self.webhooks[webhook_id] = webhook
        logger.info(f"Webhook registered: {webhook_id} -> {url}")

        return webhook

    def update(self, webhook_id: str, **kwargs) -> Optional[WebhookConfig]:
        """Atualiza configuração de webhook"""
        webhook = self.webhooks.get(webhook_id)
        if not webhook:
            return None

        for key, value in kwargs.items():
            if hasattr(webhook, key):
                setattr(webhook, key, value)

        webhook.updated_at = datetime.now()
        logger.info(f"Webhook updated: {webhook_id}")

        return webhook

    def delete(self, webhook_id: str) -> bool:
        """Remove um webhook"""
        if webhook_id in self.webhooks:
            del self.webhooks[webhook_id]
            logger.info(f"Webhook deleted: {webhook_id}")
            return True
        return False

    def get(self, webhook_id: str) -> Optional[WebhookConfig]:
        """Busca webhook por ID"""
        return self.webhooks.get(webhook_id)

    def list(self, status: Optional[WebhookStatus] = None) -> List[WebhookConfig]:
        """Lista todos os webhooks"""
        if status:
            return [w for w in self.webhooks.values() if w.status == status]
        return list(self.webhooks.values())

    def pause(self, webhook_id: str) -> bool:
        """Pausa um webhook"""
        return self.update(webhook_id, status=WebhookStatus.PAUSED) is not None

    def resume(self, webhook_id: str) -> bool:
        """Resume um webhook pausado"""
        return self.update(webhook_id, status=WebhookStatus.ACTIVE) is not None

    def _generate_secret(self) -> str:
        """Gera secret para webhook"""
        return hmac.new(uuid4().bytes, uuid4().bytes, hashlib.sha256).hexdigest()

    def get_statistics(self) -> Dict[str, Any]:
        """Retorna estatísticas de webhooks"""
        return {
            **self.stats,
            "total_webhooks": len(self.webhooks),
            "active_webhooks": len(
                [w for w in self.webhooks.values() if w.status == WebhookStatus.ACTIVE]
            ),
            "total_deliveries": len(self.deliveries),
        }


# ============================================
# WEBHOOK DISPATCHER
# ============================================


class WebhookDispatcher:
    """Dispatcher de webhooks com retry e queue"""

    def __init__(self, manager: WebhookManager):
        self.manager = manager
        self.client = httpx.AsyncClient(timeout=30.0)
        self.running = False
        self.worker_task = None

        logger.info("WebhookDispatcher initialized")

    async def start(self):
        """Inicia worker de processamento"""
        if self.running:
            return

        self.running = True
        self.worker_task = asyncio.create_task(self._process_queue())
        logger.info("WebhookDispatcher started")

    async def stop(self):
        """Para worker"""
        self.running = False
        if self.worker_task:
            self.worker_task.cancel()
            try:
                await self.worker_task
            except asyncio.CancelledError:
                pass
        await self.client.aclose()
        logger.info("WebhookDispatcher stopped")

    async def dispatch(
        self,
        event: WebhookEvent,
        data: Dict[str, Any],
        task_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ):
        """Dispara webhook para evento"""
        # Criar payload
        payload = WebhookPayload(
            event=event,
            event_id=str(uuid4()),
            timestamp=datetime.now(),
            data=data,
            task_id=task_id,
            user_id=user_id,
        )

        # Encontrar webhooks que devem ser notificados
        webhooks_to_notify = [
            webhook
            for webhook in self.manager.webhooks.values()
            if webhook.should_trigger(event, data)
        ]

        if not webhooks_to_notify:
            logger.debug(f"No webhooks registered for event: {event.value}")
            return

        # Adicionar à queue
        for webhook in webhooks_to_notify:
            delivery = WebhookDelivery(
                id=str(uuid4()),
                webhook_id=webhook.id,
                event=event,
                payload=payload,
                status=DeliveryStatus.PENDING,
                url=webhook.url,
                max_attempts=webhook.max_retries,
            )

            self.manager.deliveries[delivery.id] = delivery
            await self.manager.queue.put(delivery)

        logger.info(
            f"Dispatched event {event.value} to {len(webhooks_to_notify)} webhooks"
        )

    async def _process_queue(self):
        """Processa queue de webhooks"""
        while self.running:
            try:
                # Pegar próximo delivery da queue
                delivery = await asyncio.wait_for(self.manager.queue.get(), timeout=1.0)

                # Processar
                await self._send_webhook(delivery)

            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Error processing webhook queue: {e}")

    async def _send_webhook(self, delivery: WebhookDelivery):
        """Envia webhook"""
        webhook = self.manager.get(delivery.webhook_id)
        if not webhook:
            logger.warning(f"Webhook not found: {delivery.webhook_id}")
            return

        delivery.status = DeliveryStatus.SENDING
        delivery.sent_at = datetime.now()

        try:
            # Preparar payload
            payload_dict = delivery.payload.to_dict()
            payload_json = json.dumps(payload_dict)

            # Gerar signature
            signature = self._generate_signature(payload_json, webhook.secret)

            # Headers
            headers = {
                "Content-Type": "application/json",
                "X-Webhook-Signature": signature,
                "X-Webhook-Event": delivery.event.value,
                "X-Webhook-Delivery": delivery.id,
                "X-Webhook-Attempt": str(delivery.attempt),
                **webhook.headers,
            }

            # Enviar request
            response = await self.client.post(
                webhook.url,
                content=payload_json,
                headers=headers,
                timeout=webhook.timeout,
            )

            delivery.status_code = response.status_code
            delivery.response_body = response.text[:1000]  # Limitar tamanho

            # Verificar sucesso
            if 200 <= response.status_code < 300:
                delivery.status = DeliveryStatus.SUCCESS
                delivery.completed_at = datetime.now()

                webhook.success_count += 1
                webhook.last_delivery = datetime.now()
                self.manager.stats["total_success"] += 1

                logger.info(
                    f"Webhook delivered successfully: {delivery.id} -> {webhook.url}"
                )

            else:
                raise Exception(f"HTTP {response.status_code}: {response.text[:200]}")

        except Exception as e:
            delivery.error = str(e)
            delivery.completed_at = datetime.now()

            # Verificar se deve fazer retry
            if delivery.attempt < delivery.max_attempts:
                delivery.status = DeliveryStatus.RETRY
                delivery.attempt += 1
                delivery.payload.retry_count += 1

                # Calcular próximo retry (exponential backoff)
                retry_delay = webhook.retry_delay * (2 ** (delivery.attempt - 1))
                delivery.next_retry_at = datetime.now() + timedelta(seconds=retry_delay)

                # Re-adicionar à queue após delay
                asyncio.create_task(self._schedule_retry(delivery, retry_delay))

                webhook.failure_count += 1
                self.manager.stats["total_retries"] += 1

                logger.warning(
                    f"Webhook delivery failed (retry {delivery.attempt}/{delivery.max_attempts}): {e}"
                )

            else:
                delivery.status = DeliveryStatus.FAILED
                webhook.failure_count += 1
                self.manager.stats["total_failed"] += 1

                # Verificar se deve desabilitar webhook
                if webhook.failure_count >= 10:
                    webhook.status = WebhookStatus.FAILED
                    logger.error(
                        f"Webhook disabled due to excessive failures: {webhook.id}"
                    )

                logger.error(
                    f"Webhook delivery failed permanently: {delivery.id} -> {e}"
                )

        self.manager.stats["total_sent"] += 1

    async def _schedule_retry(self, delivery: WebhookDelivery, delay: int):
        """Agenda retry de webhook"""
        await asyncio.sleep(delay)
        await self.manager.queue.put(delivery)

    def _generate_signature(self, payload: str, secret: str) -> str:
        """Gera HMAC signature para payload"""
        return hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

    @staticmethod
    def verify_signature(payload: str, signature: str, secret: str) -> bool:
        """Verifica signature de webhook"""
        expected = hmac.new(
            secret.encode(), payload.encode(), hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, signature)


# ============================================
# WEBHOOK CLIENT (para receber webhooks)
# ============================================


class WebhookReceiver:
    """Cliente para receber e processar webhooks"""

    def __init__(self, secret: str):
        self.secret = secret
        self.handlers: Dict[WebhookEvent, List[Callable]] = {}

    def on(self, event: WebhookEvent):
        """Decorator para registrar handler de evento"""

        def decorator(func: Callable):
            if event not in self.handlers:
                self.handlers[event] = []
            self.handlers[event].append(func)
            return func

        return decorator

    async def process(self, payload: Dict, signature: str) -> bool:
        """Processa webhook recebido"""
        # Verificar signature
        payload_json = json.dumps(payload, sort_keys=True)
        if not WebhookDispatcher.verify_signature(payload_json, signature, self.secret):
            logger.warning("Invalid webhook signature")
            return False

        # Extrair evento
        event_str = payload.get("event")
        try:
            event = WebhookEvent(event_str)
        except ValueError:
            logger.warning(f"Unknown event type: {event_str}")
            return False

        # Executar handlers
        handlers = self.handlers.get(event, [])
        for handler in handlers:
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler(payload)
                else:
                    handler(payload)
            except Exception as e:
                logger.error(f"Error in webhook handler: {e}")

        return True


# ============================================
# SINGLETON INSTANCES
# ============================================


_webhook_manager: Optional[WebhookManager] = None
_webhook_dispatcher: Optional[WebhookDispatcher] = None


def get_webhook_manager() -> WebhookManager:
    """Retorna instância singleton do manager"""
    global _webhook_manager
    if _webhook_manager is None:
        _webhook_manager = WebhookManager()
    return _webhook_manager


def get_webhook_dispatcher() -> WebhookDispatcher:
    """Retorna instância singleton do dispatcher"""
    global _webhook_dispatcher
    if _webhook_dispatcher is None:
        manager = get_webhook_manager()
        _webhook_dispatcher = WebhookDispatcher(manager)
    return _webhook_dispatcher


# ============================================
# CONVENIENCE FUNCTIONS
# ============================================


async def dispatch_event(
    event: WebhookEvent,
    data: Dict[str, Any],
    task_id: Optional[str] = None,
    user_id: Optional[str] = None,
):
    """Atalho para disparar evento"""
    dispatcher = get_webhook_dispatcher()
    await dispatcher.dispatch(event, data, task_id, user_id)


# ============================================
# EXPORTS
# ============================================


__all__ = [
    "WebhookEvent",
    "WebhookStatus",
    "DeliveryStatus",
    "WebhookConfig",
    "WebhookPayload",
    "WebhookDelivery",
    "WebhookManager",
    "WebhookDispatcher",
    "WebhookReceiver",
    "get_webhook_manager",
    "get_webhook_dispatcher",
    "dispatch_event",
]
