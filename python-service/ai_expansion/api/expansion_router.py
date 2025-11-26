"""
AI Expansion API Router
Novos endpoints opcionais para capacidades expandidas
100% ADDON - Não modifica rotas existentes
"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException
from loguru import logger
from pydantic import BaseModel, Field

# Router
router = APIRouter(prefix="/api/expansion", tags=["AI Expansion"])


# ==========================================
# REQUEST/RESPONSE MODELS
# ==========================================


class AutomationTask(BaseModel):
    """Single automation task"""

    action: str = Field(..., description="Action type: navigate, click, type, etc")
    selector: Optional[str] = Field(None, description="CSS selector")
    value: Optional[str] = Field(None, description="Value for input/script")
    url: Optional[str] = Field(None, description="URL for navigation")
    wait_time: int = Field(0, description="Wait time in milliseconds")
    timeout: int = Field(30000, description="Timeout in milliseconds")


class MultiStepAutomationRequest(BaseModel):
    """Multi-step automation request"""

    session_id: Optional[str] = Field(None, description="Optional session ID to reuse")
    engine: str = Field(
        "auto", description="Engine: playwright, selenium, pyppeteer, auto"
    )
    stealth: bool = Field(True, description="Enable stealth mode")
    headless: bool = Field(True, description="Run headless")
    tasks: List[AutomationTask] = Field(..., description="List of tasks to execute")
    stop_on_error: bool = Field(True, description="Stop execution on first error")


class DOMAnalysisRequest(BaseModel):
    """DOM analysis request"""

    html: str = Field(..., description="HTML content to analyze")
    engine: str = Field(
        "selectolax", description="Parser: selectolax, lxml, beautifulsoup"
    )
    extract_metadata: bool = Field(True, description="Extract metadata")
    semantic_analysis: bool = Field(True, description="Perform semantic analysis")


class AIAgentGoalRequest(BaseModel):
    """AI agent goal execution request"""

    goal: str = Field(..., description="Goal description in natural language")
    context: Dict[str, Any] = Field(default_factory=dict, description="Contextual data")
    max_steps: int = Field(20, description="Maximum steps to execute")
    agent_type: str = Field("langchain", description="Agent type: langchain, autogen")
    session_id: Optional[str] = Field(None, description="Browser session ID")


class VisionAnalysisRequest(BaseModel):
    """Computer vision analysis request"""

    image: str = Field(..., description="Base64 encoded image")
    tasks: List[str] = Field(
        default_factory=list, description="Tasks: detect_buttons, extract_text, etc"
    )
    target_element: Optional[Dict[str, Any]] = Field(
        None, description="Specific element to find"
    )


class CaptchaSolveRequest(BaseModel):
    """Captcha solving request"""

    captcha_type: str = Field(
        ..., description="Type: recaptcha_v2, recaptcha_v3, hcaptcha"
    )
    site_key: str = Field(..., description="Site key")
    page_url: str = Field(..., description="Page URL")
    service: str = Field("2captcha", description="Service: 2captcha, anticaptcha")


class ElementFinderRequest(BaseModel):
    """Smart element finder request"""

    html: str = Field(..., description="HTML content")
    query: str = Field(..., description="Natural language query")
    find_type: str = Field("any", description="Type: button, input, link, any")


# ==========================================
# AUTOMATION ENDPOINTS
# ==========================================


@router.post("/automation/multi-step")
async def multi_step_automation(request: MultiStepAutomationRequest):
    """
    Execute multi-step browser automation with intelligent fallback

    Supports: Playwright, Selenium, Pyppeteer
    Features: Stealth mode, persistent sessions, automatic retry
    """
    try:
        from ai_expansion.modules.automation import (
            ActionType,
            AutomationManager,
            EngineType,
        )
        from ai_expansion.modules.automation import (
            AutomationTask as Task,
        )

        logger.info(
            f"Multi-step automation request: {len(request.tasks)} tasks, engine={request.engine}"
        )

        # Initialize manager
        manager = AutomationManager()
        await manager.initialize()

        # Create or reuse session
        session_id = request.session_id
        if not session_id:
            session_id = await manager.create_session(
                engine_type=EngineType(request.engine),
                headless=request.headless,
                stealth=request.stealth,
            )

        # Convert tasks
        tasks = []
        for task_data in request.tasks:
            task = Task(
                action=ActionType(task_data.action),
                selector=task_data.selector,
                value=task_data.value,
                url=task_data.url,
                wait_time=task_data.wait_time,
                timeout=task_data.timeout,
                engine_preference=EngineType(request.engine),
                stealth_mode=request.stealth,
            )
            tasks.append(task)

        # Execute
        results = await manager.execute_multi_step(
            tasks=tasks, session_id=session_id, stop_on_error=request.stop_on_error
        )

        # Convert results
        response_results = []
        for result in results:
            response_results.append(
                {
                    "success": result.success,
                    "data": result.data,
                    "screenshot": result.screenshot,
                    "html": result.html,
                    "error": result.error,
                    "engine_used": result.engine_used,
                    "execution_time": result.execution_time,
                }
            )

        return {
            "success": True,
            "session_id": session_id,
            "results": response_results,
            "total_steps": len(results),
            "successful_steps": sum(1 for r in results if r.success),
        }

    except Exception as e:
        logger.error(f"Multi-step automation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/automation/engines/health")
async def get_automation_engines_health():
    """Get health status of all automation engines"""
    try:
        from ai_expansion.modules.automation import AutomationManager

        manager = AutomationManager()
        await manager.initialize()

        health = await manager.get_engine_health()

        return {
            "success": True,
            "engines": health,
            "healthy_count": sum(1 for h in health.values() if h),
        }

    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# DOM INTELLIGENCE ENDPOINTS
# ==========================================


@router.post("/dom/analyze")
async def analyze_dom(request: DOMAnalysisRequest):
    """
    Analyze HTML/DOM with ultra-fast parsers

    Engines: Selectolax (fastest), LXML, BeautifulSoup4
    Features: Semantic analysis, clickable map, interactive elements
    """
    try:
        from ai_expansion.modules.dom_intelligence import DOMAnalyzer, DOMParser

        logger.info(f"DOM analysis request: engine={request.engine}")

        # Parse DOM
        parser = DOMParser(engine=request.engine)
        tree = parser.parse(
            html=request.html, extract_metadata=request.extract_metadata
        )

        response = {
            "success": True,
            "tree": {
                "total_elements": tree.total_elements,
                "clickable_elements": tree.clickable_elements,
                "form_elements": tree.form_elements,
                "interactive_elements": tree.interactive_elements,
                "metadata": tree.metadata,
            },
            "parser_used": request.engine,
        }

        # Semantic analysis if requested
        if request.semantic_analysis:
            analyzer = DOMAnalyzer()
            semantic = await analyzer.analyze_semantic(request.html)
            response["semantic_analysis"] = semantic

        return response

    except Exception as e:
        logger.error(f"DOM analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/dom/find-elements")
async def find_elements(request: ElementFinderRequest):
    """
    Find elements using natural language or smart selectors

    Example: "find the submit button" or "login form"
    """
    try:
        from ai_expansion.modules.dom_intelligence import ElementFinder

        logger.info(f"Element finder request: query='{request.query}'")

        finder = ElementFinder()
        elements = await finder.find_by_description(
            html=request.html, description=request.query, element_type=request.find_type
        )

        return {
            "success": True,
            "query": request.query,
            "found_count": len(elements),
            "elements": elements,
        }

    except Exception as e:
        logger.error(f"Element finding failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# AI AGENTS ENDPOINTS
# ==========================================


@router.post("/agent/execute-goal")
async def execute_agent_goal(
    request: AIAgentGoalRequest, background_tasks: BackgroundTasks
):
    """
    Execute a goal using autonomous AI agents

    Agents: LangChain (ReAct), AutoGen (Multi-agent)
    Features: Multi-step planning, adaptive execution, verification
    """
    try:
        from ai_expansion.modules.planner import ActionPlanner

        logger.info(f"Agent goal execution: '{request.goal}' with {request.agent_type}")

        planner = ActionPlanner(agent_type=request.agent_type)

        # Create plan
        plan = await planner.create_plan(goal=request.goal, context=request.context)

        logger.info(f"Plan created with {len(plan.steps)} steps")

        # Execute plan
        results = await planner.execute_plan(
            plan=plan, session_id=request.session_id, max_steps=request.max_steps
        )

        # Verify results
        verification = await planner.verify_results(results, request.goal)

        return {
            "success": True,
            "goal": request.goal,
            "plan": {
                "steps": [step.description for step in plan.steps],
                "total_steps": len(plan.steps),
            },
            "execution": {
                "steps_completed": results.steps_completed,
                "steps_total": results.steps_total,
                "time_elapsed": results.time_elapsed,
                "errors": results.errors,
            },
            "verification": {
                "goal_achieved": verification.goal_achieved,
                "confidence": verification.confidence,
                "reasoning": verification.reasoning,
            },
            "agent_type": request.agent_type,
        }

    except Exception as e:
        logger.error(f"Agent goal execution failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# COMPUTER VISION ENDPOINTS
# ==========================================


@router.post("/vision/analyze")
async def analyze_vision(request: VisionAnalysisRequest):
    """
    Analyze screenshot with computer vision

    Features: Button detection, OCR, popup detection, element localization
    Uses: OpenCV, Tesseract, EasyOCR
    """
    try:
        from ai_expansion.modules.vision import VisionAnalyzer

        logger.info(f"Vision analysis request: tasks={request.tasks}")

        analyzer = VisionAnalyzer()
        results = await analyzer.analyze_image(
            image_base64=request.image,
            tasks=request.tasks,
            target_element=request.target_element,
        )

        return {
            "success": True,
            "tasks_completed": len(request.tasks),
            "results": results,
        }

    except Exception as e:
        logger.error(f"Vision analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# CAPTCHA SOLVING ENDPOINTS
# ==========================================


@router.post("/captcha/solve")
async def solve_captcha(request: CaptchaSolveRequest):
    """
    Solve captcha using ethical APIs

    Services: 2Captcha, AntiCaptcha
    Types: reCAPTCHA v2/v3, hCaptcha, Image, Audio
    """
    try:
        from ai_expansion.modules.captcha import CaptchaSolver

        logger.info(
            f"Captcha solve request: type={request.captcha_type}, service={request.service}"
        )

        solver = CaptchaSolver(service=request.service)
        solution = await solver.solve(
            captcha_type=request.captcha_type,
            site_key=request.site_key,
            page_url=request.page_url,
        )

        return {
            "success": True,
            "solution": solution.token,
            "solve_time": solution.solve_time,
            "cost": solution.cost,
            "service": request.service,
        }

    except Exception as e:
        logger.error(f"Captcha solving failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# UTILITY ENDPOINTS
# ==========================================


@router.get("/health")
async def expansion_health_check():
    """Health check for expansion modules"""
    try:
        from ai_expansion.modules.automation import AutomationManager

        # Check automation engines
        manager = AutomationManager()
        await manager.initialize()
        engines_health = await manager.get_engine_health()

        # Check parsers
        from ai_expansion.modules.dom_intelligence import DOMParser

        parser = DOMParser()
        parser_info = parser.get_engine_info()

        return {
            "success": True,
            "status": "healthy",
            "modules": {
                "automation": {
                    "available": True,
                    "engines": engines_health,
                },
                "dom_intelligence": {
                    "available": True,
                    "parsers": parser_info["engines_status"],
                },
                "ai_agents": {
                    "available": True,
                    "types": ["langchain", "autogen"],
                },
                "vision": {
                    "available": True,
                    "engines": ["opencv", "tesseract", "easyocr"],
                },
                "captcha": {"available": True, "services": ["2captcha", "anticaptcha"]},
            },
            "version": "1.0.0",
        }

    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "success": False,
            "status": "unhealthy",
            "error": str(e),
        }


@router.get("/info")
async def expansion_info():
    """Get information about expansion capabilities"""
    return {
        "success": True,
        "name": "SyncAds AI Expansion Module",
        "version": "1.0.0",
        "description": "Ultra-advanced AI capabilities - 100% ADDON",
        "modules": {
            "automation": {
                "engines": ["Playwright", "Selenium", "Pyppeteer"],
                "features": [
                    "Multi-engine with fallback",
                    "Stealth mode",
                    "Persistent sessions",
                    "Multi-step execution",
                ],
            },
            "dom_intelligence": {
                "parsers": ["Selectolax (10-100x faster)", "LXML", "BeautifulSoup4"],
                "features": [
                    "Ultra-fast parsing",
                    "Semantic analysis",
                    "Clickable element detection",
                    "Interactive map",
                ],
            },
            "ai_agents": {
                "types": ["LangChain ReAct", "Microsoft AutoGen"],
                "features": [
                    "Goal-based planning",
                    "Multi-step reasoning",
                    "Adaptive execution",
                    "Verification system",
                ],
            },
            "vision": {
                "engines": ["OpenCV", "Tesseract OCR", "EasyOCR"],
                "features": [
                    "Button detection",
                    "Text extraction",
                    "Popup detection",
                    "Visual element localization",
                ],
            },
            "captcha": {
                "services": ["2Captcha", "AntiCaptcha"],
                "types": ["reCAPTCHA v2/v3", "hCaptcha", "Image", "Audio"],
            },
        },
        "compatibility": "100% backward compatible - ADDON only",
    }


# ==========================================
# SESSION MANAGEMENT
# ==========================================


@router.post("/session/create")
async def create_automation_session(
    engine: str = "auto", headless: bool = True, stealth: bool = True
):
    """Create persistent automation session"""
    try:
        from ai_expansion.modules.automation import AutomationManager, EngineType

        manager = AutomationManager()
        await manager.initialize()

        session_id = await manager.create_session(
            engine_type=EngineType(engine), headless=headless, stealth=stealth
        )

        return {
            "success": True,
            "session_id": session_id,
            "engine": engine,
            "configuration": {"headless": headless, "stealth": stealth},
        }

    except Exception as e:
        logger.error(f"Session creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/session/{session_id}")
async def close_automation_session(session_id: str):
    """Close automation session"""
    try:
        from ai_expansion.modules.automation import AutomationManager

        manager = AutomationManager()
        await manager.initialize()
        await manager.close_session(session_id)

        return {"success": True, "message": f"Session {session_id} closed"}

    except Exception as e:
        logger.error(f"Session closure failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
