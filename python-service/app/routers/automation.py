"""
============================================
BROWSER AUTOMATION ROUTER
Browser-Use + Playwright Integration + Enhanced Browser Service
============================================
"""

import asyncio
import json
import base64
import traceback
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException
from loguru import logger
from pydantic import BaseModel, Field

# Import enhanced browser service
from app.services.browser_service import browser_service

# Playwright imports
try:
    from playwright.async_api import Browser, BrowserContext, Page, async_playwright

    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    logger.warning("Playwright not installed. Install with: pip install playwright")

# LangChain Browser Agent
try:
    from app.services.langchain_browser import BrowserAgent
    BROWSER_AGENT_AVAILABLE = True
except ImportError as e:
    BROWSER_AGENT_AVAILABLE = False
    logger.warning(f"BrowserAgent not available: {e}")
    # Definir para evitar erro de referência se usado em outro lugar
    BROWSER_USE_AVAILABLE = False

router = APIRouter(prefix="/browser-automation", tags=["Browser Automation"])

# ==========================================
# MODELS
# ==========================================


class BrowserAction(BaseModel):
    """Single browser action"""

    type: Literal[
        "navigate",
        "click",
        "fill",
        "screenshot",
        "extract",
        "wait",
        "scroll",
        "execute_js",
    ]
    selector: Optional[str] = None
    value: Optional[str] = None
    url: Optional[str] = None
    timeout: Optional[int] = 30000
    wait_for: Optional[str] = None  # css selector to wait for


class AutomationRequest(BaseModel):
    """Browser automation request"""

    action: str = Field(..., description="Natural language description of what to do")
    url: Optional[str] = Field(None, description="Starting URL")
    actions: Optional[List[BrowserAction]] = Field(
        None, description="Structured actions"
    )
    options: Dict[str, Any] = Field(default_factory=dict)
    use_ai: bool = Field(True, description="Use Browser-Use AI for complex tasks")
    headless: bool = Field(True, description="Run browser in headless mode")
    timeout: int = Field(60, description="Overall timeout in seconds")


class AutomationResponse(BaseModel):
    """Browser automation response"""

    success: bool
    action: str
    result: Optional[Dict[str, Any]] = None
    screenshot: Optional[str] = None
    error: Optional[str] = None
    execution_time: float
    timestamp: datetime


# ==========================================
# BROWSER MANAGER
# ==========================================


class BrowserManager:
    """Manage Playwright browser instances"""

    def __init__(self):
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.playwright = None

    async def start(self, headless: bool = True, **kwargs):
        """Start browser"""
        if not PLAYWRIGHT_AVAILABLE:
            raise HTTPException(
                status_code=500,
                detail="Playwright not installed. Run: pip install playwright && playwright install chromium",
            )

        try:
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=headless, args=["--no-sandbox", "--disable-setuid-sandbox"]
            )
            self.context = await self.browser.new_context(
                viewport={"width": 1920, "height": 1080},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            )
            self.page = await self.context.new_page()

            # Set default timeout
            self.page.set_default_timeout(30000)

            logger.info("Browser started successfully")
            return self.page

        except Exception as e:
            logger.error(f"Failed to start browser: {e}")
            await self.cleanup()
            raise HTTPException(
                status_code=500, detail=f"Failed to start browser: {str(e)}"
            )

    async def cleanup(self):
        """Clean up browser resources"""
        try:
            if self.page:
                await self.page.close()
            if self.context:
                await self.context.close()
            if self.browser:
                await self.browser.close()
            if self.playwright:
                await self.playwright.stop()
            logger.info("Browser cleaned up")
        except Exception as e:
            logger.error(f"Error cleaning up browser: {e}")

    async def execute_action(self, action: BrowserAction) -> Dict[str, Any]:
        """Execute a single browser action"""
        if not self.page:
            raise HTTPException(status_code=500, detail="Browser not started")

        try:
            result = {}

            if action.type == "navigate":
                if not action.url:
                    raise ValueError("URL required for navigate action")
                await self.page.goto(
                    action.url, wait_until="networkidle", timeout=action.timeout
                )
                result = {"url": self.page.url, "title": await self.page.title()}

            elif action.type == "click":
                if not action.selector:
                    raise ValueError("Selector required for click action")
                await self.page.click(action.selector, timeout=action.timeout)
                result = {"clicked": action.selector}

            elif action.type == "fill":
                if not action.selector or not action.value:
                    raise ValueError("Selector and value required for fill action")
                await self.page.fill(
                    action.selector, action.value, timeout=action.timeout
                )
                result = {"filled": action.selector, "value": action.value}

            elif action.type == "screenshot":
                screenshot = await self.page.screenshot(full_page=True, type="png")
                import base64

                result = {
                    "screenshot": base64.b64encode(screenshot).decode("utf-8"),
                    "url": self.page.url,
                }

            elif action.type == "extract":
                if not action.selector:
                    raise ValueError("Selector required for extract action")
                elements = await self.page.query_selector_all(action.selector)
                texts = [await el.text_content() for el in elements]
                result = {"extracted": texts, "count": len(texts)}

            elif action.type == "wait":
                if action.wait_for:
                    await self.page.wait_for_selector(
                        action.wait_for, timeout=action.timeout
                    )
                else:
                    await self.page.wait_for_timeout(action.timeout or 1000)
                result = {"waited": action.timeout}

            elif action.type == "scroll":
                await self.page.evaluate(
                    "window.scrollTo(0, document.body.scrollHeight)"
                )
                result = {"scrolled": "to bottom"}

            elif action.type == "execute_js":
                if not action.value:
                    raise ValueError("JavaScript code required for execute_js action")
                js_result = await self.page.evaluate(action.value)
                result = {"js_result": js_result}

            else:
                raise ValueError(f"Unknown action type: {action.type}")

            return result

        except Exception as e:
            logger.error(f"Error executing action {action.type}: {e}")
            raise


# ==========================================
# ENDPOINTS
# ==========================================


@router.get("/health")
async def health_check():
    """Health check for automation service"""
    return {
        "status": "healthy",
        "playwright_available": PLAYWRIGHT_AVAILABLE,
        "browser_use_available": BROWSER_USE_AVAILABLE,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.post("/execute", response_model=AutomationResponse)
async def execute_automation(request: AutomationRequest):
    """
    Execute browser automation task

    Examples:
    - Natural language: "Navigate to google.com and search for SyncAds"
    - Structured: Provide specific actions list
    """
    start_time = datetime.utcnow()
    browser_manager = BrowserManager()

    try:
        # Start browser
        page = await browser_manager.start(headless=request.headless)

        results = []
        screenshot = None

        # Execute structured actions if provided
        if request.actions:
            logger.info(f"Executing {len(request.actions)} structured actions")

            for action in request.actions:
                result = await browser_manager.execute_action(action)
                results.append(result)

                # Capture screenshot if action is screenshot
                if action.type == "screenshot":
                    screenshot = result.get("screenshot")

        # Execute natural language action with LangChain Browser Agent
        elif request.use_ai and BROWSER_AGENT_AVAILABLE:
            logger.info(f"Executing AI action with LangChain: {request.action}")
            
            # Initialize agent
            agent = BrowserAgent()
            
            # Execute task
            ai_result = await agent.execute_task(request.action)
            
            results.append(ai_result)
            
            if not ai_result["success"]:
                 raise Exception(ai_result.get("error", "Unknown AI error"))

        # Fallback: Simple navigation
        elif request.url:
            logger.info(f"Simple navigation to: {request.url}")
            await page.goto(request.url, wait_until="networkidle")
            title = await page.title()
            results.append({"url": page.url, "title": title})

        else:
            raise HTTPException(
                status_code=400, detail="Either 'actions' or 'url' must be provided"
            )

        # Calculate execution time
        execution_time = (datetime.utcnow() - start_time).total_seconds()

        # Cleanup
        await browser_manager.cleanup()

        return AutomationResponse(
            success=True,
            action=request.action,
            result={"actions_executed": len(results), "results": results},
            screenshot=screenshot,
            execution_time=execution_time,
            timestamp=datetime.utcnow(),
        )

    except asyncio.TimeoutError:
        await browser_manager.cleanup()
        execution_time = (datetime.utcnow() - start_time).total_seconds()

        return AutomationResponse(
            success=False,
            action=request.action,
            error="Timeout: Operation took too long",
            execution_time=execution_time,
            timestamp=datetime.utcnow(),
        )

    except Exception as e:
        await browser_manager.cleanup()
        execution_time = (datetime.utcnow() - start_time).total_seconds()
        error_details = f"{str(e)}\n{traceback.format_exc()}"

        logger.error(f"Automation error: {error_details}")

        return AutomationResponse(
            success=False,
            action=request.action,
            error=str(e),
            execution_time=execution_time,
            timestamp=datetime.utcnow(),
        )


@router.post("/screenshot")
async def take_screenshot(url: str, full_page: bool = True):
    """Take a screenshot of a URL"""
    browser_manager = BrowserManager()

    try:
        page = await browser_manager.start(headless=True)
        await page.goto(url, wait_until="networkidle", timeout=30000)

        screenshot = await page.screenshot(full_page=full_page, type="png")

        import base64

        screenshot_base64 = base64.b64encode(screenshot).decode("utf-8")

        await browser_manager.cleanup()

        return {
            "success": True,
            "url": url,
            "screenshot": screenshot_base64,
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        await browser_manager.cleanup()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scrape")
async def scrape_page(url: str, selector: Optional[str] = None):
    """Scrape content from a URL"""
    browser_manager = BrowserManager()

    try:
        page = await browser_manager.start(headless=True)
        await page.goto(url, wait_until="networkidle", timeout=30000)

        # Get page content
        title = await page.title()
        content = await page.content()

        # Extract specific elements if selector provided
        extracted = None
        if selector:
            elements = await page.query_selector_all(selector)
            extracted = [await el.text_content() for el in elements]

        await browser_manager.cleanup()

        return {
            "success": True,
            "url": url,
            "title": title,
            "content_length": len(content),
            "extracted": extracted,
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        await browser_manager.cleanup()
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# BACKGROUND TASKS
# ==========================================


@router.post("/execute-async")
async def execute_automation_async(
    request: AutomationRequest, background_tasks: BackgroundTasks
):
    """
    Execute browser automation in background
    Returns task ID immediately
    """
    import uuid

    task_id = str(uuid.uuid4())

    async def run_automation():
        result = await execute_automation(request)
        # TODO: Store result in database or cache
        logger.info(f"Background task {task_id} completed: {result.success}")

    background_tasks.add_task(run_automation)

    return {
        "task_id": task_id,
        "status": "queued",
        "message": "Automation task queued for execution",
    }


# ==========================================
# UTILITY ENDPOINTS
# ==========================================


@router.get("/capabilities")
async def get_capabilities():
    """Get browser automation capabilities"""
    return {
        "playwright": {
            "available": PLAYWRIGHT_AVAILABLE,
            "browsers": ["chromium", "firefox", "webkit"]
            if PLAYWRIGHT_AVAILABLE
            else [],
        },
        "browser_use": {
            "available": BROWSER_USE_AVAILABLE,
            "ai_powered": True if BROWSER_USE_AVAILABLE else False,
        },
        "actions": [
            "navigate",
            "click",
            "fill",
            "screenshot",
            "extract",
            "wait",
            "scroll",
            "execute_js",
        ],
        "features": [
            "headless_mode",
            "screenshot_capture",
            "content_extraction",
            "javascript_execution",
            "ai_powered_automation" if BROWSER_USE_AVAILABLE else None,
        ],
    }


@router.get("/test")
async def test_automation():
    """Test browser automation with simple example"""
    try:
        browser_manager = BrowserManager()
        page = await browser_manager.start(headless=True)

        await page.goto("https://example.com", wait_until="networkidle")
        title = await page.title()

        await browser_manager.cleanup()

        return {
            "success": True,
            "message": "Browser automation is working",
            "test_url": "https://example.com",
            "page_title": title,
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Browser automation test failed",
        }


# ==========================================
# ENHANCED BROWSER SERVICE ENDPOINTS
# ==========================================

@router.post("/session/create")
async def create_enhanced_session(session_id: str, user_agent: Optional[str] = None):
    """Create enhanced browser session"""
    try:
        await browser_service.create_session(session_id, user_agent)
        return {
            "success": True,
            "session_id": session_id,
            "message": "Enhanced browser session created"
        }
    except Exception as e:
        logger.error(f"Session creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/session/{session_id}/navigate")
async def enhanced_navigate(session_id: str, url: str):
    """Navigate using enhanced browser service"""
    try:
        result = await browser_service.navigate(session_id, url)
        return result
    except Exception as e:
        logger.error(f"Navigation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/session/{session_id}/fill-form")
async def enhanced_fill_form(
    session_id: str,
    form_data: Dict[str, Any],
    form_selector: Optional[str] = None
):
    """Fill form using enhanced browser service with human-like behavior"""
    try:
        result = await browser_service.fill_form(session_id, form_data, form_selector)
        return result
    except Exception as e:
        logger.error(f"Form fill failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/session/{session_id}/scrape-products")
async def enhanced_scrape_products(
    session_id: str,
    product_selectors: Dict[str, str]
):
    """Scrape products using enhanced browser service"""
    try:
        result = await browser_service.scrape_products(session_id, product_selectors)
        return result
    except Exception as e:
        logger.error(f"Product scraping failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/session/{session_id}/detect-checkout")
async def enhanced_detect_checkout(session_id: str):
    """Detect checkout form on current page"""
    try:
        result = await browser_service.detect_checkout_form(session_id)
        return result
    except Exception as e:
        logger.error(f"Checkout detection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/session/{session_id}/screenshot")
async def enhanced_screenshot(session_id: str, full_page: bool = False):
    """Take screenshot using enhanced browser service"""
    try:
        result = await browser_service.screenshot(session_id, full_page)
        
        # Convert bytes to base64
        if result.get('success') and result.get('screenshot'):
            screenshot_base64 = base64.b64encode(result['screenshot']).decode('utf-8')
            result['screenshot'] = f"data:image/png;base64,{screenshot_base64}"
            
        return result
    except Exception as e:
        logger.error(f"Screenshot failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/session/{session_id}")
async def close_enhanced_session(session_id: str):
    """Close enhanced browser session"""
    try:
        if session_id in browser_service.pages:
            await browser_service.pages[session_id].close()
            del browser_service.pages[session_id]
            
        if session_id in browser_service.contexts:
            await browser_service.contexts[session_id].close()
            del browser_service.contexts[session_id]
            
        return {
            "success": True,
            "message": f"Session {session_id} closed"
        }
    except Exception as e:
        logger.error(f"Session cleanup failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
