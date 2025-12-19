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
import subprocess
import sys

from fastapi import APIRouter, BackgroundTasks, HTTPException
from loguru import logger
from pydantic import BaseModel, Field

# Import enhanced browser service
# Singleton instance that holds all sessions
from app.services.browser_service import browser_service

# Playwright imports (Check availability)
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
    user_id: Optional[str] = Field(None, description="User ID for extension control")
    session_id: Optional[str] = Field(None, description="Optional session ID for persistent automation")


class AutomationResponse(BaseModel):
    """Browser automation response"""

    success: bool
    action: str
    result: Optional[Dict[str, Any]] = None
    screenshot: Optional[str] = None
    error: Optional[str] = None
    execution_time: float
    timestamp: datetime
    session_id: Optional[str] = None


# ==========================================
# ENDPOINTS
# ==========================================


@router.get("/health")
async def health_check():
    """Health check for automation service"""
    return {
        "status": "healthy",
        "playwright_available": PLAYWRIGHT_AVAILABLE,
        "browser_use_available": BROWSER_USE_AVAILABLE if 'BROWSER_USE_AVAILABLE' in locals() else False, # BROWSER_USE_AVAILABLE was undefined in original except context
        "active_sessions": len(browser_service.contexts),
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.post("/execute", response_model=AutomationResponse)
async def execute_automation(request: AutomationRequest):
    """
    Execute browser automation task using PERSISTENT SESSIONS.
    
    Examples:
    - Natural language: "Navigate to google.com and search for SyncAds"
    - Structured: Provide specific actions list
    """
    start_time = datetime.utcnow()
    
    # 1. Determine Session ID
    # Use provided ID, generate one from user_id, or create random
    import uuid
    session_id = request.session_id
    if not session_id:
        if request.user_id:
            # Create a consistent session ID for the user if preferred, 
            # OR generate one. Let's create a fresh one if not specified to avoid conflicts unless explicitly requested.
            # But the goal IS persistence...
            # Let's say: If session_id is NOT provided, we assume a discrete task but we use the service.
            # If the user wants persistence, they SHOULD provide session_id or we return one.
            session_id = f"sess_{uuid.uuid4()}"
            
    logger.info(f"🤖 Automation Request: {request.action} | Session: {session_id}")

    try:
        # 2. Ensure Session Exists
        if session_id not in browser_service.contexts:
            logger.info(f"Creating new session: {session_id}")
            await browser_service.create_session(session_id)
            
        results = []
        screenshot = None

        # 3. Execute Structured Actions (Direct Browser Control)
        if request.actions:
            logger.info(f"Executing {len(request.actions)} structured actions")

            for action in request.actions:
                result = {}
                
                if action.type == "navigate":
                    result = await browser_service.navigate(session_id, action.url)
                    
                elif action.type == "click":
                    result = await browser_service.click_element(session_id, action.selector)
                    
                elif action.type == "fill":
                    # Adapt fill to browser_service expectations
                    # browser_service.fill_form expects {selector: value}
                    result = await browser_service.fill_form(session_id, {action.selector: action.value})
                    
                elif action.type == "screenshot":
                    result = await browser_service.screenshot(session_id, full_page=True)
                    if result.get('success'):
                         # Convert bytes to base64 for response
                         import base64
                         b64 = base64.b64encode(result['screenshot']).decode('utf-8')
                         result['screenshot'] = b64
                         screenshot = b64
                
                elif action.type == "extract":
                    result = await browser_service.extract_data(session_id, {"data": action.selector})

                # TODO: Implement others in BrowserService (wait, scroll, execute_js)
                # For now, if missing, we skip or add ad-hoc
                elif action.type == "wait":
                     page = browser_service.pages.get(session_id)
                     if page:
                         await page.wait_for_timeout(action.timeout or 1000)
                         result = {"success": True, "waited": action.timeout}
                
                elif action.type == "scroll":
                    page = browser_service.pages.get(session_id)
                    if page:
                        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                        result = {"success": True, "scrolled": True}
                        
                elif action.type == "execute_js":
                    page = browser_service.pages.get(session_id)
                    if page:
                        js_res = await page.evaluate(action.value)
                        result = {"success": True, "result": js_res}

                results.append(result)


        # 4. Execute Natural Language (AI Agent)
        elif request.use_ai and BROWSER_AGENT_AVAILABLE:
            logger.info(f"Executing AI action with LangChain: {request.action}")
            
            # Initialize agent
            agent = BrowserAgent()
            
            # Execute task passing the session_id so it uses the SAME session
            ai_result = await agent.execute_task(request.action, user_id=request.user_id, session_id=session_id)
            
            results.append(ai_result)
            
            if not ai_result["success"]:
                 raise Exception(ai_result.get("error", "Unknown AI error"))

        # 5. Fallback: Simple Navigation
        elif request.url:
            logger.info(f"Simple navigation to: {request.url}")
            res = await browser_service.navigate(session_id, request.url)
            results.append(res)

        else:
            raise HTTPException(
                status_code=400, detail="Either 'actions' or 'url' must be provided"
            )

        # Calculate execution time
        execution_time = (datetime.utcnow() - start_time).total_seconds()

        # NOTE: We do NOT cleanup session here anymore to allow persistence.
        # Client must explicitly call close_session if desired.

        return AutomationResponse(
            success=True,
            action=request.action,
            result={"actions_executed": len(results), "results": results},
            screenshot=screenshot,
            execution_time=execution_time,
            timestamp=datetime.utcnow(),
            session_id=session_id 
        )

    except Exception as e:
        execution_time = (datetime.utcnow() - start_time).total_seconds()
        error_details = f"{str(e)}\n{traceback.format_exc()}"
        logger.error(f"Automation error: {error_details}")

        return AutomationResponse(
            success=False,
            action=request.action,
            error=str(e),
            execution_time=execution_time,
            timestamp=datetime.utcnow(),
            session_id=session_id 
        )


@router.post("/screenshot")
async def take_screenshot(url: str, full_page: bool = True):
    """Take a screenshot of a URL (One-off session)"""
    # For one-off, we can create a temp session and close it
    import uuid
    temp_id = f"temp_{uuid.uuid4()}"
    
    try:
        await browser_service.navigate(temp_id, url)
        result = await browser_service.screenshot(temp_id, full_page)
        
        # Cleanup
        await browser_service.pages[temp_id].close()
        del browser_service.pages[temp_id]
        # Clean context? 
        if temp_id in browser_service.contexts:
            await browser_service.contexts[temp_id].close()
            del browser_service.contexts[temp_id]

        if result.get('success'):
            import base64
            b64 = base64.b64encode(result['screenshot']).decode('utf-8')
            return {
                "success": True,
                "url": url,
                "screenshot": b64,
                "timestamp": datetime.utcnow().isoformat(),
            }
        else:
            raise Exception(result.get('error'))

    except Exception as e:
        # Try cleanup
        if temp_id in browser_service.contexts:
             pass # cleanup logic above handles it roughly, in production use finally block
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scrape")
async def scrape_page(url: str, selector: Optional[str] = None):
    """Scrape content from a URL (One-off)"""
    import uuid
    temp_id = f"scrape_{uuid.uuid4()}"
    
    try:
        await browser_service.navigate(temp_id, url)
        
        # Get page content
        page = browser_service.pages[temp_id]
        title = await page.title()
        content = await page.content()
        
        extracted = None
        if selector:
             extracted_res = await browser_service.extract_data(temp_id, {"data": selector})
             if extracted_res.get('success'):
                 extracted = [extracted_res['data']['data']]

        # Cleanup
        await page.close()
        del browser_service.pages[temp_id]
        if temp_id in browser_service.contexts:
            await browser_service.contexts[temp_id].close()
            del browser_service.contexts[temp_id]
            
        return {
            "success": True,
            "url": url,
            "title": title,
            "content_length": len(content),
            "extracted": extracted,
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
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
            "browsers": ["chromium"]
        },
        "browser_use": {
            "available": BROWSER_USE_AVAILABLE if 'BROWSER_USE_AVAILABLE' in locals() else False,
            "ai_powered": True,
        },
        "features": [
            "persistent_sessions",
            "headless_mode",
            "screenshot_capture",
            "content_extraction",
            "ai_powered_automation"
        ],
    }


# ==========================================
# LEGACY ENDPOINTS (Redirects to New Logic)
# ==========================================
# These maintain compatibility with Edge Function calls

@router.post("/automation/browser/navigate")
async def legacy_navigate(session_id: str, url: str): # Receives params as body in FastAPI if not typed as Pydantic model correctly for JSON body, but here simple args usually match query params. 
    # Actually for POST with JSON body, better use Pydantic models or Body()
    # But keeping signature similar to original file
    logger.info(f"Legacy navigate called: {url}")
    return await enhanced_navigate(session_id, url)


@router.post("/automation/browser/fill-form")
async def legacy_fill_form(
    session_id: str,
    form_data: Dict[str, Any],
    form_selector: Optional[str] = None
):
    logger.info("Legacy fill-form called")
    return await enhanced_fill_form(session_id, form_data, form_selector)


@router.post("/automation/browser/click")
async def legacy_click(session_id: str, selector: str):
    logger.info(f"Legacy click called: {selector}")
    try:
        res = await browser_service.click_element(session_id, selector)
        if not res['success']: raise Exception(res.get('error'))
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/automation/browser/extract")
async def legacy_extract(session_id: str, selectors: Dict[str, str]):
    logger.info("Legacy extract called")
    return await enhanced_extract(session_id, selectors) # We need to create/use enhanced_extract helper or direct call


@router.post("/automation/browser/screenshot")
async def legacy_screenshot(session_id: str, full_page: bool = False):
    logger.info("Legacy screenshot called")
    return await enhanced_screenshot(session_id, full_page)


@router.post("/automation/browser/scrape-products")
async def legacy_scrape_products(
    session_id: str,
    product_selectors: Dict[str, str]
):
    logger.info("Legacy scrape-products called")
    return await enhanced_scrape_products(session_id, product_selectors)


@router.post("/automation/browser/detect-checkout")
async def legacy_detect_checkout(session_id: str):
    logger.info("Legacy detect-checkout called")
    return await enhanced_detect_checkout(session_id)


@router.post("/automation/browser/session")
async def legacy_create_session(session_id: str, user_agent: Optional[str] = None):
    logger.info(f"Legacy create session called: {session_id}")
    return await create_enhanced_session(session_id, user_agent)



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
    try:
        result = await browser_service.scrape_products(session_id, product_selectors)
        return result
    except Exception as e:
        logger.error(f"Product scraping failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/session/{session_id}/detect-checkout")
async def enhanced_detect_checkout(session_id: str):
    try:
        result = await browser_service.detect_checkout_form(session_id)
        return result
    except Exception as e:
        logger.error(f"Checkout detection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/session/{session_id}/screenshot")
async def enhanced_screenshot(session_id: str, full_page: bool = False):
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
        
async def enhanced_extract(session_id: str, selectors: Dict[str, str]):
    try:
        result = await browser_service.extract_data(session_id, selectors)
        return result
    except Exception as e:
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


# ==========================================
# PYTHON EXECUTION (For AI)
# ==========================================
# (Original python execution code kept as is mostly)

class PythonExecutionRequest(BaseModel):
    code: str
    libraries: List[str] = []
    timeout: int = 30

@router.post("/execute-python")
async def execute_python_code(request: PythonExecutionRequest):
    """Execute arbitrary Python code safely"""
    try:
        logger.info(f"Executing Python code (timeout={request.timeout}s)")
        
        # Create a temporary script
        import tempfile
        import os
        
        # Prepare imports
        imports_str = "\n".join([f"import {lib}" for lib in request.libraries])
        
        full_code = f"{imports_str}\n\n{request.code}"
        
        # Write to temp file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(full_code)
            temp_path = f.name
            
        try:
            # Execute
            proc = await asyncio.create_subprocess_exec(
                sys.executable, temp_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            try:
                stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=request.timeout)
                output = stdout.decode().strip()
                error = stderr.decode().strip()
                
                return {
                    "success": proc.returncode == 0,
                    "output": output,
                    "error": error,
                    "executionTime": 0 
                }
            except asyncio.TimeoutError:
                proc.kill()
                return {
                    "success": False,
                    "output": "",
                    "error": f"Execution timed out after {request.timeout}s"
                }
                
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
    except Exception as e:
        logger.error(f"Python execution failed: {e}")
        return {
            "success": False,
            "output": "",
            "error": str(e)
        }
