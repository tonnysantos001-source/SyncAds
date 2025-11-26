"""
Automation Manager - Central orchestrator for multi-engine browser automation
Supports Playwright, Selenium, and Pyppeteer with intelligent fallback
100% ADDON - Does not modify existing functionality
"""

import asyncio
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Literal, Optional

from loguru import logger


class EngineType(str, Enum):
    """Supported automation engines"""

    PLAYWRIGHT = "playwright"
    SELENIUM = "selenium"
    PYPPETEER = "pyppeteer"
    AUTO = "auto"  # Automatic selection based on task


class ActionType(str, Enum):
    """Types of browser actions"""

    NAVIGATE = "navigate"
    CLICK = "click"
    TYPE = "type"
    SCROLL = "scroll"
    WAIT = "wait"
    SCREENSHOT = "screenshot"
    EXECUTE_SCRIPT = "execute_script"
    GET_HTML = "get_html"
    GET_TEXT = "get_text"
    HOVER = "hover"
    SELECT = "select"
    DRAG_DROP = "drag_drop"
    MULTI_STEP = "multi_step"


@dataclass
class AutomationTask:
    """Represents a single automation task"""

    action: ActionType
    selector: Optional[str] = None
    value: Optional[str] = None
    url: Optional[str] = None
    wait_time: int = 0
    timeout: int = 30000
    engine_preference: EngineType = EngineType.AUTO
    stealth_mode: bool = True
    screenshot: bool = False
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


@dataclass
class AutomationResult:
    """Result of an automation task"""

    success: bool
    data: Optional[Any] = None
    screenshot: Optional[str] = None  # base64
    html: Optional[str] = None
    error: Optional[str] = None
    engine_used: Optional[str] = None
    execution_time: float = 0.0
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class AutomationManager:
    """
    Central manager for multi-engine browser automation
    Orchestrates Playwright, Selenium, and Pyppeteer engines
    """

    def __init__(self):
        """Initialize the automation manager"""
        self.engines: Dict[str, Any] = {}
        self.active_sessions: Dict[str, Any] = {}
        self.engine_health: Dict[str, bool] = {}
        self._initialized = False
        logger.info("AutomationManager initialized (EXPANSION MODULE)")

    async def initialize(self, engines: Optional[List[EngineType]] = None):
        """
        Initialize requested automation engines

        Args:
            engines: List of engines to initialize, or None for all
        """
        if self._initialized:
            logger.warning("AutomationManager already initialized")
            return

        if engines is None:
            engines = [EngineType.PLAYWRIGHT, EngineType.SELENIUM, EngineType.PYPPETEER]

        logger.info(f"Initializing engines: {engines}")

        for engine in engines:
            try:
                if engine == EngineType.PLAYWRIGHT:
                    from .playwright_engine import PlaywrightEngine

                    self.engines[engine] = PlaywrightEngine()
                    await self.engines[engine].initialize()
                    self.engine_health[engine] = True
                    logger.success(f"✓ Playwright engine initialized")

                elif engine == EngineType.SELENIUM:
                    from .selenium_engine import SeleniumEngine

                    self.engines[engine] = SeleniumEngine()
                    await self.engines[engine].initialize()
                    self.engine_health[engine] = True
                    logger.success(f"✓ Selenium engine initialized")

                elif engine == EngineType.PYPPETEER:
                    from .pyppeteer_engine import PyppeteerEngine

                    self.engines[engine] = PyppeteerEngine()
                    await self.engines[engine].initialize()
                    self.engine_health[engine] = True
                    logger.success(f"✓ Pyppeteer engine initialized")

            except Exception as e:
                logger.error(f"Failed to initialize {engine}: {e}")
                self.engine_health[engine] = False

        self._initialized = True
        logger.info(
            f"AutomationManager initialization complete. Active engines: {len([e for e, h in self.engine_health.items() if h])}"
        )

    async def execute_task(
        self, task: AutomationTask, session_id: Optional[str] = None
    ) -> AutomationResult:
        """
        Execute a single automation task

        Args:
            task: The automation task to execute
            session_id: Optional session ID to reuse browser context

        Returns:
            AutomationResult with execution details
        """
        if not self._initialized:
            await self.initialize()

        start_time = asyncio.get_event_loop().time()

        # Select engine
        engine = self._select_engine(task.engine_preference)
        if not engine:
            return AutomationResult(
                success=False,
                error="No healthy automation engine available",
                execution_time=0.0,
            )

        engine_name = self._get_engine_name(engine)
        logger.info(f"Executing {task.action} using {engine_name}")

        try:
            # Execute based on action type
            result = await self._execute_action(engine, task, session_id)

            execution_time = asyncio.get_event_loop().time() - start_time
            result.execution_time = execution_time
            result.engine_used = engine_name

            logger.success(
                f"Task completed in {execution_time:.2f}s using {engine_name}"
            )
            return result

        except Exception as e:
            execution_time = asyncio.get_event_loop().time() - start_time
            logger.error(f"Task failed: {e}")

            # Try fallback engine if available
            if task.engine_preference != EngineType.AUTO:
                logger.info("Attempting fallback to another engine...")
                task.engine_preference = EngineType.AUTO
                return await self.execute_task(task, session_id)

            return AutomationResult(
                success=False,
                error=str(e),
                engine_used=engine_name,
                execution_time=execution_time,
            )

    async def execute_multi_step(
        self,
        tasks: List[AutomationTask],
        session_id: Optional[str] = None,
        stop_on_error: bool = True,
    ) -> List[AutomationResult]:
        """
        Execute multiple tasks in sequence

        Args:
            tasks: List of tasks to execute
            session_id: Optional session ID to maintain context
            stop_on_error: Stop execution on first error

        Returns:
            List of AutomationResults
        """
        results = []

        for i, task in enumerate(tasks):
            logger.info(f"Executing step {i + 1}/{len(tasks)}: {task.action}")
            result = await self.execute_task(task, session_id)
            results.append(result)

            if not result.success and stop_on_error:
                logger.warning(f"Stopping execution at step {i + 1} due to error")
                break

        return results

    async def _execute_action(
        self, engine: Any, task: AutomationTask, session_id: Optional[str]
    ) -> AutomationResult:
        """Execute a specific action on the selected engine"""

        if task.action == ActionType.NAVIGATE:
            return await engine.navigate(task.url, session_id)

        elif task.action == ActionType.CLICK:
            return await engine.click(task.selector, session_id)

        elif task.action == ActionType.TYPE:
            return await engine.type_text(task.selector, task.value, session_id)

        elif task.action == ActionType.SCROLL:
            return await engine.scroll(task.selector or "body", session_id)

        elif task.action == ActionType.WAIT:
            await asyncio.sleep(task.wait_time / 1000)
            return AutomationResult(success=True, data={"waited": task.wait_time})

        elif task.action == ActionType.SCREENSHOT:
            return await engine.screenshot(session_id)

        elif task.action == ActionType.EXECUTE_SCRIPT:
            return await engine.execute_script(task.value, session_id)

        elif task.action == ActionType.GET_HTML:
            return await engine.get_html(session_id)

        elif task.action == ActionType.GET_TEXT:
            return await engine.get_text(task.selector, session_id)

        elif task.action == ActionType.HOVER:
            return await engine.hover(task.selector, session_id)

        elif task.action == ActionType.SELECT:
            return await engine.select_option(task.selector, task.value, session_id)

        elif task.action == ActionType.DRAG_DROP:
            # task.value should contain target selector
            return await engine.drag_and_drop(task.selector, task.value, session_id)

        else:
            raise ValueError(f"Unsupported action type: {task.action}")

    def _select_engine(self, preference: EngineType) -> Optional[Any]:
        """
        Select the best available engine based on preference and health

        Args:
            preference: Preferred engine type

        Returns:
            Engine instance or None
        """
        if preference != EngineType.AUTO and preference in self.engines:
            if self.engine_health.get(preference, False):
                return self.engines[preference]

        # Fallback to any healthy engine
        for engine_type, engine in self.engines.items():
            if self.engine_health.get(engine_type, False):
                return engine

        return None

    def _get_engine_name(self, engine: Any) -> str:
        """Get the name of an engine instance"""
        for engine_type, eng in self.engines.items():
            if eng is engine:
                return engine_type
        return "unknown"

    async def create_session(
        self,
        engine_type: EngineType = EngineType.AUTO,
        headless: bool = True,
        stealth: bool = True,
    ) -> Optional[str]:
        """
        Create a persistent browser session

        Args:
            engine_type: Engine to use
            headless: Run in headless mode
            stealth: Enable stealth mode

        Returns:
            Session ID or None
        """
        engine = self._select_engine(engine_type)
        if not engine:
            return None

        session_id = await engine.create_session(headless=headless, stealth=stealth)
        if session_id:
            self.active_sessions[session_id] = engine
            logger.info(f"Created session {session_id}")

        return session_id

    async def close_session(self, session_id: str):
        """Close a browser session"""
        if session_id in self.active_sessions:
            engine = self.active_sessions[session_id]
            await engine.close_session(session_id)
            del self.active_sessions[session_id]
            logger.info(f"Closed session {session_id}")

    async def get_engine_health(self) -> Dict[str, bool]:
        """Get health status of all engines"""
        return self.engine_health.copy()

    async def cleanup(self):
        """Cleanup all resources"""
        logger.info("Cleaning up AutomationManager...")

        # Close all active sessions
        for session_id in list(self.active_sessions.keys()):
            await self.close_session(session_id)

        # Cleanup engines
        for engine in self.engines.values():
            try:
                await engine.cleanup()
            except Exception as e:
                logger.error(f"Error cleaning up engine: {e}")

        self._initialized = False
        logger.info("AutomationManager cleanup complete")

    def __del__(self):
        """Destructor to ensure cleanup"""
        if self._initialized:
            try:
                asyncio.get_event_loop().run_until_complete(self.cleanup())
            except:
                pass
