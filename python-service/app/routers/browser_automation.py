"""
Browser Automation API Routes
Expõe endpoints para automação web inteligente usando BrowserAIManager
"""

import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field

try:
    from ..browser_ai.agentql_helper import AgentQLHelper
    from ..browser_ai.browser_manager import BrowserAIManager
    from ..browser_ai.dom_intelligence import DOMIntelligence
    from ..browser_ai.vision_selector import VisionElementSelector
except ImportError as e:
    logging.warning(f"Browser AI modules not available: {e}")
    BrowserAIManager = None

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/browser-automation", tags=["Browser Automation"])

# ============================================
# GLOBAL STATE
# ============================================

# Managers ativos (em produção, usar Redis)
active_managers: Dict[str, BrowserAIManager] = {}

# ============================================
# PYDANTIC MODELS
# ============================================


class CreateSessionRequest(BaseModel):
    session_id: Optional[str] = Field(
        None, description="ID da sessão (gerado automaticamente se omitido)"
    )
    user_agent: Optional[str] = None
    viewport: Optional[Dict[str, int]] = Field(
        None, example={"width": 1920, "height": 1080}
    )
    proxy: Optional[Dict[str, str]] = None
    llm_provider: Literal["anthropic", "openai", "groq"] = "anthropic"
    api_key: Optional[str] = Field(None, description="API key do LLM provider")
    headless: bool = True
    enable_vision: bool = True
    enable_agentql: bool = True


class NaturalLanguageTaskRequest(BaseModel):
    session_id: str
    task: str = Field(..., description="Tarefa em linguagem natural")
    url: Optional[str] = Field(None, description="URL para navegar antes da tarefa")
    context: Optional[Dict[str, Any]] = None


class AgentQLQueryRequest(BaseModel):
    session_id: str
    query: str = Field(..., description="Query AgentQL")
    action: Literal["extract", "interact"] = "extract"


class VisionElementRequest(BaseModel):
    session_id: str
    description: str = Field(
        ..., description="Descrição visual do elemento", example="botão azul de login"
    )
    action: Optional[str] = Field(
        None, description="Ação a executar (click, fill, etc)"
    )


class FormFillRequest(BaseModel):
    session_id: str
    form_data: Dict[str, Any] = Field(
        ..., example={"name": "João Silva", "email": "joao@example.com"}
    )
    use_ai_mapping: bool = True


class AdCampaignRequest(BaseModel):
    session_id: str
    platform: Literal["facebook", "google", "linkedin"]
    campaign_data: Dict[str, Any] = Field(
        ...,
        example={
            "name": "Campanha Verão 2025",
            "objective": "Conversões",
            "budget": 100,
            "audience": "Brasil, 18-65 anos",
        },
    )


class AnalyzePageRequest(BaseModel):
    session_id: str


class ExecuteTaskRequest(BaseModel):
    task: str = Field(..., description="Tarefa em linguagem natural a ser executada")
    context: Optional[Dict[str, Any]] = Field(
        None, description="Contexto adicional da tarefa"
    )
    use_vision: bool = Field(True, description="Usar Vision AI se necessário")
    timeout: int = Field(60, description="Timeout em segundos")


class SessionResponse(BaseModel):
    success: bool
    session_id: str
    message: str
    details: Optional[Dict[str, Any]] = None


# ============================================
# HELPER FUNCTIONS
# ============================================


def get_manager(session_id: str) -> BrowserAIManager:
    """Obtém ou cria manager para sessão"""
    if session_id not in active_managers:
        raise HTTPException(
            status_code=404, detail=f"Session {session_id} not found. Create one first."
        )
    return active_managers[session_id]


def get_or_create_manager(request: CreateSessionRequest) -> BrowserAIManager:
    """Obtém manager existente ou cria novo"""
    session_id = request.session_id or str(uuid.uuid4())

    if session_id in active_managers:
        logger.info(f"Reusing existing manager for session: {session_id}")
        return active_managers[session_id]

    logger.info(f"Creating new manager for session: {session_id}")
    manager = BrowserAIManager(
        llm_provider=request.llm_provider,
        api_key=request.api_key,
        headless=request.headless,
        enable_vision=request.enable_vision,
        enable_agentql=request.enable_agentql,
    )

    active_managers[session_id] = manager
    return manager


# ============================================
# ENDPOINTS
# ============================================


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "active_sessions": len(active_managers),
        "browser_ai_available": BrowserAIManager is not None,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.post("/sessions", response_model=SessionResponse)
async def create_session(request: CreateSessionRequest):
    """
    Cria nova sessão de automação

    Uma sessão mantém um navegador ativo e permite múltiplas operações.
    """
    if BrowserAIManager is None:
        raise HTTPException(status_code=503, detail="Browser AI not available")

    try:
        session_id = request.session_id or str(uuid.uuid4())
        manager = get_or_create_manager(request)

        session = await manager.create_session(
            session_id=session_id,
            user_agent=request.user_agent,
            viewport=request.viewport,
            proxy=request.proxy,
        )

        return SessionResponse(
            success=True,
            session_id=session_id,
            message="Session created successfully",
            details={
                "created_at": session.created_at.isoformat(),
                "headless": request.headless,
                "vision_enabled": request.enable_vision,
                "agentql_enabled": request.enable_agentql,
            },
        )

    except Exception as e:
        logger.error(f"Failed to create session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execute/natural-language")
async def execute_natural_language_task(
    request: NaturalLanguageTaskRequest, background_tasks: BackgroundTasks
):
    """
    Executa tarefa em linguagem natural usando Browser-Use

    Exemplos de tarefas:
    - "Pesquise por 'tênis esportivos' no Google e extraia os primeiros 5 resultados"
    - "Preencha o formulário de contato com os dados fornecidos"
    - "Encontre o botão de adicionar ao carrinho e clique"
    """
    try:
        manager = get_manager(request.session_id)

        result = await manager.execute_natural_language_task(
            session_id=request.session_id,
            task=request.task,
            url=request.url,
            context=request.context,
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Natural language task failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execute/agentql")
async def execute_agentql_query(request: AgentQLQueryRequest):
    """
    Executa query AgentQL para seleção semântica

    Exemplos de queries:
    - "{ search_input search_button }" - encontrar elementos
    - "{ products[] { name price(integer) description } }" - extrair produtos
    """
    try:
        manager = get_manager(request.session_id)

        result = await manager.execute_agentql_query(
            session_id=request.session_id, query=request.query, action=request.action
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AgentQL query failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execute/vision-element")
async def find_element_by_vision(request: VisionElementRequest):
    """
    Encontra elemento usando Vision AI

    Exemplo:
    - description: "botão azul de login no canto superior direito"
    - action: "click"
    """
    try:
        manager = get_manager(request.session_id)

        result = await manager.find_element_by_vision(
            session_id=request.session_id,
            description=request.description,
            action=request.action,
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Vision element search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execute/fill-form")
async def intelligent_form_fill(request: FormFillRequest):
    """
    Preenche formulário inteligentemente

    A IA mapeia automaticamente os dados aos campos corretos.
    """
    try:
        manager = get_manager(request.session_id)

        result = await manager.intelligent_form_fill(
            session_id=request.session_id,
            form_data=request.form_data,
            use_ai_mapping=request.use_ai_mapping,
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Form fill failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execute/create-ad")
async def create_ad_campaign(
    request: AdCampaignRequest, background_tasks: BackgroundTasks
):
    """
    Cria campanha de anúncios em plataforma específica

    Plataformas suportadas:
    - facebook: Facebook Ads Manager
    - google: Google Ads
    - linkedin: LinkedIn Campaign Manager

    Esta operação é assíncrona e pode levar alguns minutos.
    """
    try:
        manager = get_manager(request.session_id)

        # Executar em background para não bloquear
        result = await manager.create_ad_campaign(
            session_id=request.session_id,
            platform=request.platform,
            campaign_data=request.campaign_data,
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ad campaign creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze/page")
async def analyze_page(request: AnalyzePageRequest):
    """
    Analisa estrutura e tipo da página atual

    Retorna:
    - Tipo de página (e-commerce, blog, form, etc)
    - Componentes detectados
    - Formulários encontrados
    - Metadados
    """
    try:
        manager = get_manager(request.session_id)
        session = manager.sessions.get(request.session_id)

        if not session or not session.page:
            raise HTTPException(status_code=400, detail="No active page in session")

        intelligence = DOMIntelligence()
        analysis = await intelligence.analyze_page(session.page)

        return {"success": True, "analysis": analysis}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Page analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{session_id}")
async def get_session_info(session_id: str):
    """Obtém informações sobre uma sessão"""
    try:
        manager = active_managers.get(session_id)
        if not manager:
            raise HTTPException(status_code=404, detail="Session not found")

        info = manager.get_session_info(session_id)
        if not info:
            raise HTTPException(status_code=404, detail="Session not found")

        return {"success": True, "session": info}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get session info: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions")
async def list_sessions():
    """Lista todas as sessões ativas"""
    try:
        sessions = []
        for session_id, manager in active_managers.items():
            info = manager.get_session_info(session_id)
            if info:
                sessions.append(info)

        return {"success": True, "total": len(sessions), "sessions": sessions}

    except Exception as e:
        logger.error(f"Failed to list sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/sessions/{session_id}")
async def close_session(session_id: str):
    """Fecha e remove uma sessão"""
    try:
        manager = active_managers.get(session_id)
        if not manager:
            raise HTTPException(status_code=404, detail="Session not found")

        await manager.close_session(session_id)
        del active_managers[session_id]

        return {
            "success": True,
            "message": f"Session {session_id} closed successfully",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to close session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cleanup")
async def cleanup_all_sessions():
    """Fecha todas as sessões ativas"""
    try:
        closed_count = 0
        for session_id, manager in list(active_managers.items()):
            try:
                await manager.close_session(session_id)
                del active_managers[session_id]
                closed_count += 1
            except Exception as e:
                logger.error(f"Failed to close session {session_id}: {e}")

        return {
            "success": True,
            "message": f"Closed {closed_count} sessions",
            "closed_count": closed_count,
        }

    except Exception as e:
        logger.error(f"Cleanup failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# BROWSER AUTOMATION ENDPOINTS
# ============================================


@router.post("/execute")
async def execute_task(request: ExecuteTaskRequest):
    """
    Endpoint genérico para executar tarefas de automação

    Usado pelo Edge Function quando Router decide usar PYTHON_AI

    Exemplos:
    - "Clique no botão de login"
    - "Preencha o formulário com os dados"
    - "Extraia os preços dos produtos"
    """
    try:
        logger.info(f"🤖 Executando tarefa: {request.task}")

        # Criar sessão temporária
        session_id = str(uuid.uuid4())

        if BrowserAIManager is None:
            logger.warning("BrowserAIManager não disponível, retornando mock response")

            # Retornar resposta mock quando módulos não disponíveis
            return {
                "success": True,
                "result": {
                    "status": "simulated",
                    "message": f"Tarefa '{request.task}' seria executada aqui",
                    "note": "Browser automation modules not fully loaded. Install: playwright, browser-use, agentql",
                },
                "session_id": session_id,
                "task": request.task,
                "executor": "PYTHON_AI_MOCK",
            }

        # Criar manager
        manager = BrowserAIManager(llm_provider="anthropic", headless=True)

        active_managers[session_id] = manager

        try:
            # Inicializar browser
            await manager.initialize()
            logger.info(f"✅ Browser inicializado para sessão {session_id}")

            # Executar tarefa usando Browser-Use
            result = await manager.execute_natural_language_task(
                task=request.task, context=request.context or {}
            )

            logger.info(f"✅ Tarefa executada com sucesso: {result}")

            return {
                "success": True,
                "result": result,
                "session_id": session_id,
                "task": request.task,
                "executor": "PYTHON_AI",
            }

        finally:
            # Limpar sessão
            try:
                await manager.close()
                if session_id in active_managers:
                    del active_managers[session_id]
                logger.info(f"✅ Sessão {session_id} encerrada")
            except Exception as cleanup_error:
                logger.warning(f"⚠️ Erro ao limpar sessão: {cleanup_error}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao executar tarefa: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Erro ao executar automação: {str(e)}"
        )


@router.post("/execute/natural-language")
async def batch_execute_tasks(
    tasks: List[NaturalLanguageTaskRequest], background_tasks: BackgroundTasks
):
    """
    Executa múltiplas tarefas em batch

    Útil para workflows complexos com múltiplos passos.
    """
    results = []

    for task_request in tasks:
        try:
            result = await execute_natural_language_task(task_request, background_tasks)
            results.append({"task": task_request.task, "result": result})
        except Exception as e:
            results.append(
                {"task": task_request.task, "error": str(e), "success": False}
            )

    return {
        "success": True,
        "total_tasks": len(tasks),
        "completed": sum(1 for r in results if r.get("result", {}).get("success")),
        "results": results,
    }


@router.get("/capabilities")
async def get_capabilities():
    """
    Retorna capacidades disponíveis do Browser AI

    Útil para descoberta de features.
    """
    return {
        "natural_language_automation": True,
        "vision_ai": True,
        "agentql_semantic_selectors": True,
        "intelligent_form_filling": True,
        "ad_campaign_creation": ["facebook", "google", "linkedin"],
        "page_analysis": True,
        "multi_step_workflows": True,
        "cross_site_automation": True,
        "headless_execution": True,
        "browser_engines": ["chromium"],
        "llm_providers": ["anthropic", "openai", "groq"],
    }


@router.get("/examples")
async def get_examples():
    """
    Retorna exemplos de uso da API

    Útil para onboarding e documentação.
    """
    return {
        "natural_language": [
            "Pesquise por 'tênis esportivos' no Google Shopping e compare os 5 primeiros preços",
            "Preencha o formulário de contato com nome 'João Silva' e email 'joao@example.com'",
            "Encontre o botão de adicionar ao carrinho e clique nele",
        ],
        "agentql": [
            "{ search_input search_button }",
            "{ products[] { name price(integer) description availability } }",
            "{ form { name_input email_input submit_button } }",
        ],
        "vision": [
            "botão azul de login no canto superior direito",
            "campo de busca principal",
            "menu hamburguer no topo",
        ],
        "ad_campaign": {
            "facebook": {
                "name": "Campanha Verão 2025",
                "objective": "Conversões",
                "budget": 100,
                "audience": "Brasil, 18-65 anos",
            }
        },
    }
