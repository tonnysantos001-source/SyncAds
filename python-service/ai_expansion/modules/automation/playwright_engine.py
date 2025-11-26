"""
Playwright Engine - Advanced browser automation with Playwright
Supports stealth mode, multi-context, advanced interactions
100% ADDON - Does not modify existing functionality
"""

import asyncio
import base64
import uuid
from typing import Any, Dict, Optional

from loguru import logger
from playwright.async_api import (
    Browser,
    BrowserContext,
    Page,
    async_playwright,
)
from playwright.async_api import (
    Error as PlaywrightError,
)


class PlaywrightEngine:
    """
    Advanced Playwright automation engine with stealth capabilities
    """

    def __init__(self):
        """Initialize Playwright engine"""
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.contexts: Dict[str, BrowserContext] = {}
        self.pages: Dict[str, Page] = {}
        self._initialized = False
        logger.info("PlaywrightEngine created")

    async def initialize(self):
        """Initialize Playwright and browser"""
        if self._initialized:
            return

        try:
            self.playwright = await async_playwright().start()

            # Launch browser with stealth settings
            self.browser = await self.playwright.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-blink-features=AutomationControlled",
                    "--disable-web-security",
                    "--disable-features=IsolateOrigins,site-per-process",
                ],
            )

            self._initialized = True
            logger.success("PlaywrightEngine initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize Playwright: {e}")
            raise

    async def create_session(
        self,
        headless: bool = True,
        stealth: bool = True,
        user_agent: Optional[str] = None,
        viewport: Optional[Dict[str, int]] = None,
    ) -> str:
        """
        Create a new browser context (session)

        Args:
            headless: Run in headless mode
            stealth: Enable stealth mode features
            user_agent: Custom user agent
            viewport: Custom viewport size

        Returns:
            Session ID
        """
        if not self._initialized:
            await self.initialize()

        session_id = str(uuid.uuid4())

        try:
            # Default viewport
            if viewport is None:
                viewport = {"width": 1920, "height": 1080}

            # Default user agent
            if user_agent is None:
                user_agent = (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                )

            # Create context with stealth settings
            context = await self.browser.new_context(
                viewport=viewport,
                user_agent=user_agent,
                locale="pt-BR",
                timezone_id="America/Sao_Paulo",
                permissions=["geolocation", "notifications"],
                java_script_enabled=True,
                bypass_csp=True,
                ignore_https_errors=True,
            )

            # Apply stealth mode
            if stealth:
                await self._apply_stealth(context)

            # Create initial page
            page = await context.new_page()

            # Store context and page
            self.contexts[session_id] = context
            self.pages[session_id] = page

            logger.info(f"Created Playwright session: {session_id}")
            return session_id

        except Exception as e:
            logger.error(f"Failed to create session: {e}")
            raise

    async def _apply_stealth(self, context: BrowserContext):
        """Apply stealth mode scripts to context"""

        stealth_js = """
        // Overwrite the `plugins` property to use a custom getter.
        Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5]
        });

        // Overwrite the `languages` property to use a custom getter.
        Object.defineProperty(navigator, 'languages', {
            get: () => ['pt-BR', 'pt', 'en-US', 'en']
        });

        // Overwrite the `webdriver` property to remove it.
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined
        });

        // Mock chrome object
        window.chrome = {
            runtime: {},
            loadTimes: function() {},
            csi: function() {},
            app: {}
        };

        // Mock permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
            parameters.name === 'notifications' ?
                Promise.resolve({ state: Notification.permission }) :
                originalQuery(parameters)
        );
        """

        await context.add_init_script(stealth_js)
        logger.debug("Stealth mode applied to context")

    async def navigate(
        self, url: str, session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Navigate to URL

        Args:
            url: Target URL
            session_id: Optional session ID

        Returns:
            Result dictionary
        """
        page = await self._get_page(session_id)

        try:
            response = await page.goto(url, wait_until="networkidle", timeout=30000)

            return {
                "success": True,
                "data": {
                    "url": page.url,
                    "status": response.status if response else None,
                    "title": await page.title(),
                },
            }

        except Exception as e:
            logger.error(f"Navigation failed: {e}")
            return {"success": False, "error": str(e)}

    async def click(
        self, selector: str, session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Click element by selector

        Args:
            selector: CSS selector
            session_id: Optional session ID

        Returns:
            Result dictionary
        """
        page = await self._get_page(session_id)

        try:
            await page.wait_for_selector(selector, timeout=10000)
            await page.click(selector)

            return {
                "success": True,
                "data": {"selector": selector, "action": "clicked"},
            }

        except Exception as e:
            logger.error(f"Click failed: {e}")
            return {"success": False, "error": str(e)}

    async def type_text(
        self, selector: str, text: str, session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Type text into element

        Args:
            selector: CSS selector
            text: Text to type
            session_id: Optional session ID

        Returns:
            Result dictionary
        """
        page = await self._get_page(session_id)

        try:
            await page.wait_for_selector(selector, timeout=10000)
            await page.fill(selector, text)

            return {
                "success": True,
                "data": {"selector": selector, "text_length": len(text)},
            }

        except Exception as e:
            logger.error(f"Type text failed: {e}")
            return {"success": False, "error": str(e)}

    async def scroll(
        self, selector: str = "body", session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Scroll element or page

        Args:
            selector: CSS selector (default: body)
            session_id: Optional session ID

        Returns:
            Result dictionary
        """
        page = await self._get_page(session_id)

        try:
            await page.evaluate(f"""
                const element = document.querySelector('{selector}');
                if (element) {{
                    element.scrollIntoView({{ behavior: 'smooth', block: 'center' }});
                }}
            """)

            return {"success": True, "data": {"scrolled": selector}}

        except Exception as e:
            logger.error(f"Scroll failed: {e}")
            return {"success": False, "error": str(e)}

    async def screenshot(
        self, session_id: Optional[str] = None, full_page: bool = False
    ) -> Dict[str, Any]:
        """
        Take screenshot

        Args:
            session_id: Optional session ID
            full_page: Capture full page

        Returns:
            Result dictionary with base64 screenshot
        """
        page = await self._get_page(session_id)

        try:
            screenshot_bytes = await page.screenshot(full_page=full_page)
            screenshot_b64 = base64.b64encode(screenshot_bytes).decode("utf-8")

            return {
                "success": True,
                "data": {"screenshot": screenshot_b64, "format": "base64"},
            }

        except Exception as e:
            logger.error(f"Screenshot failed: {e}")
            return {"success": False, "error": str(e)}

    async def execute_script(
        self, script: str, session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Execute JavaScript

        Args:
            script: JavaScript code
            session_id: Optional session ID

        Returns:
            Result dictionary
        """
        page = await self._get_page(session_id)

        try:
            result = await page.evaluate(script)

            return {"success": True, "data": {"result": result}}

        except Exception as e:
            logger.error(f"Script execution failed: {e}")
            return {"success": False, "error": str(e)}

    async def get_html(self, session_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get page HTML

        Args:
            session_id: Optional session ID

        Returns:
            Result dictionary with HTML
        """
        page = await self._get_page(session_id)

        try:
            html = await page.content()

            return {"success": True, "data": {"html": html, "length": len(html)}}

        except Exception as e:
            logger.error(f"Get HTML failed: {e}")
            return {"success": False, "error": str(e)}

    async def get_text(
        self, selector: str, session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get text from element

        Args:
            selector: CSS selector
            session_id: Optional session ID

        Returns:
            Result dictionary
        """
        page = await self._get_page(session_id)

        try:
            await page.wait_for_selector(selector, timeout=10000)
            text = await page.text_content(selector)

            return {"success": True, "data": {"text": text, "selector": selector}}

        except Exception as e:
            logger.error(f"Get text failed: {e}")
            return {"success": False, "error": str(e)}

    async def hover(
        self, selector: str, session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Hover over element

        Args:
            selector: CSS selector
            session_id: Optional session ID

        Returns:
            Result dictionary
        """
        page = await self._get_page(session_id)

        try:
            await page.wait_for_selector(selector, timeout=10000)
            await page.hover(selector)

            return {"success": True, "data": {"hovered": selector}}

        except Exception as e:
            logger.error(f"Hover failed: {e}")
            return {"success": False, "error": str(e)}

    async def select_option(
        self, selector: str, value: str, session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Select option from dropdown

        Args:
            selector: CSS selector
            value: Option value
            session_id: Optional session ID

        Returns:
            Result dictionary
        """
        page = await self._get_page(session_id)

        try:
            await page.wait_for_selector(selector, timeout=10000)
            await page.select_option(selector, value)

            return {"success": True, "data": {"selector": selector, "value": value}}

        except Exception as e:
            logger.error(f"Select option failed: {e}")
            return {"success": False, "error": str(e)}

    async def drag_and_drop(
        self, source: str, target: str, session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Drag and drop element

        Args:
            source: Source selector
            target: Target selector
            session_id: Optional session ID

        Returns:
            Result dictionary
        """
        page = await self._get_page(session_id)

        try:
            await page.wait_for_selector(source, timeout=10000)
            await page.wait_for_selector(target, timeout=10000)
            await page.drag_and_drop(source, target)

            return {"success": True, "data": {"source": source, "target": target}}

        except Exception as e:
            logger.error(f"Drag and drop failed: {e}")
            return {"success": False, "error": str(e)}

    async def get_cookies(self, session_id: Optional[str] = None) -> Dict[str, Any]:
        """Get all cookies from context"""
        try:
            context = self.contexts.get(session_id)
            if not context:
                return {"success": False, "error": "Session not found"}

            cookies = await context.cookies()

            return {"success": True, "data": {"cookies": cookies}}

        except Exception as e:
            logger.error(f"Get cookies failed: {e}")
            return {"success": False, "error": str(e)}

    async def set_cookies(
        self, cookies: list, session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Set cookies in context"""
        try:
            context = self.contexts.get(session_id)
            if not context:
                return {"success": False, "error": "Session not found"}

            await context.add_cookies(cookies)

            return {"success": True, "data": {"cookies_set": len(cookies)}}

        except Exception as e:
            logger.error(f"Set cookies failed: {e}")
            return {"success": False, "error": str(e)}

    async def wait_for_selector(
        self, selector: str, timeout: int = 30000, session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Wait for selector to appear"""
        page = await self._get_page(session_id)

        try:
            await page.wait_for_selector(selector, timeout=timeout)

            return {"success": True, "data": {"selector": selector, "found": True}}

        except Exception as e:
            logger.error(f"Wait for selector failed: {e}")
            return {"success": False, "error": str(e)}

    async def wait_for_navigation(
        self, session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Wait for navigation to complete"""
        page = await self._get_page(session_id)

        try:
            await page.wait_for_load_state("networkidle")

            return {"success": True, "data": {"url": page.url}}

        except Exception as e:
            logger.error(f"Wait for navigation failed: {e}")
            return {"success": False, "error": str(e)}

    async def _get_page(self, session_id: Optional[str] = None) -> Page:
        """Get page from session or create default"""
        if session_id and session_id in self.pages:
            return self.pages[session_id]

        # Create default session if needed
        if not self.pages:
            default_session = await self.create_session()
            return self.pages[default_session]

        # Return first available page
        return next(iter(self.pages.values()))

    async def close_session(self, session_id: str):
        """Close a specific session"""
        try:
            if session_id in self.contexts:
                await self.contexts[session_id].close()
                del self.contexts[session_id]

            if session_id in self.pages:
                del self.pages[session_id]

            logger.info(f"Closed Playwright session: {session_id}")

        except Exception as e:
            logger.error(f"Failed to close session: {e}")

    async def cleanup(self):
        """Cleanup all resources"""
        logger.info("Cleaning up PlaywrightEngine...")

        # Close all contexts
        for session_id in list(self.contexts.keys()):
            await self.close_session(session_id)

        # Close browser
        if self.browser:
            await self.browser.close()
            self.browser = None

        # Stop playwright
        if self.playwright:
            await self.playwright.stop()
            self.playwright = None

        self._initialized = False
        logger.info("PlaywrightEngine cleanup complete")

    def __del__(self):
        """Destructor"""
        if self._initialized:
            try:
                asyncio.get_event_loop().run_until_complete(self.cleanup())
            except:
                pass
