"""
Pyppeteer Engine - Advanced browser automation with Pyppeteer
Headless Chrome automation with full async support
100% ADDON - Does not modify existing functionality
"""

import asyncio
import base64
import uuid
from typing import Any, Dict, Optional

from loguru import logger

try:
    from pyppeteer import launch
    from pyppeteer.browser import Browser
    from pyppeteer.page import Page

    PYPPETEER_AVAILABLE = True
except ImportError:
    PYPPETEER_AVAILABLE = False
    Browser = None
    Page = None
    launch = None
    logger.warning("Pyppeteer not available - install with: pip install pyppeteer")


class PyppeteerEngine:
    """
    Advanced Pyppeteer automation engine with stealth capabilities
    """

    def __init__(self):
        """Initialize Pyppeteer engine"""
        self.browser: Optional[Browser] = None
        self.pages: Dict[str, Page] = {}
        self._initialized = False

        if not PYPPETEER_AVAILABLE:
            logger.warning("PyppeteerEngine created but library not available")
        else:
            logger.info("PyppeteerEngine created")

    async def initialize(self):
        """Initialize Pyppeteer and browser"""
        if self._initialized:
            return

        if not PYPPETEER_AVAILABLE:
            raise RuntimeError("Pyppeteer library not installed")

        try:
            # Launch browser with stealth settings
            self.browser = await launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-blink-features=AutomationControlled",
                    "--disable-web-security",
                    "--disable-features=IsolateOrigins,site-per-process",
                    "--window-size=1920,1080",
                ],
                ignoreHTTPSErrors=True,
                dumpio=False,
            )

            self._initialized = True
            logger.success("PyppeteerEngine initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize Pyppeteer: {e}")
            raise

    async def create_session(
        self,
        headless: bool = True,
        stealth: bool = True,
        user_agent: Optional[str] = None,
        viewport: Optional[Dict[str, int]] = None,
    ) -> str:
        """
        Create a new browser page (session)

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
            # Create new page
            page = await self.browser.newPage()

            # Set viewport
            if viewport is None:
                viewport = {"width": 1920, "height": 1080}
            await page.setViewport(viewport)

            # Set user agent
            if user_agent is None:
                user_agent = (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                )
            await page.setUserAgent(user_agent)

            # Apply stealth mode
            if stealth:
                await self._apply_stealth(page)

            # Store page
            self.pages[session_id] = page

            logger.info(f"Created Pyppeteer session: {session_id}")
            return session_id

        except Exception as e:
            logger.error(f"Failed to create session: {e}")
            raise

    async def _apply_stealth(self, page: Page):
        """Apply stealth mode scripts to page"""

        stealth_js = """
        () => {
            // Overwrite the `plugins` property
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5]
            });

            // Overwrite the `languages` property
            Object.defineProperty(navigator, 'languages', {
                get: () => ['pt-BR', 'pt', 'en-US', 'en']
            });

            // Overwrite the `webdriver` property
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
        }
        """

        await page.evaluateOnNewDocument(stealth_js)
        logger.debug("Stealth mode applied to page")

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
            response = await page.goto(
                url, {"waitUntil": "networkidle2", "timeout": 30000}
            )

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
            await page.waitForSelector(selector, {"timeout": 10000})
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
            await page.waitForSelector(selector, {"timeout": 10000})
            await page.type(selector, text)

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
                () => {{
                    const element = document.querySelector('{selector}');
                    if (element) {{
                        element.scrollIntoView({{ behavior: 'smooth', block: 'center' }});
                    }}
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
            screenshot_bytes = await page.screenshot({"fullPage": full_page})
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
            await page.waitForSelector(selector, {"timeout": 10000})

            text = await page.evaluate(f"""
                () => {{
                    const element = document.querySelector('{selector}');
                    return element ? element.textContent : null;
                }}
            """)

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
            await page.waitForSelector(selector, {"timeout": 10000})
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
            await page.waitForSelector(selector, {"timeout": 10000})
            await page.select(selector, value)

            return {"success": True, "data": {"selector": selector, "value": value}}

        except Exception as e:
            logger.error(f"Select option failed: {e}")
            return {"success": False, "error": str(e)}

    async def drag_and_drop(
        self, source: str, target: str, session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Drag and drop element (using mouse simulation)

        Args:
            source: Source selector
            target: Target selector
            session_id: Optional session ID

        Returns:
            Result dictionary
        """
        page = await self._get_page(session_id)

        try:
            # Get bounding boxes
            source_box = await page.evaluate(f"""
                () => {{
                    const element = document.querySelector('{source}');
                    const rect = element.getBoundingClientRect();
                    return {{
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2
                    }};
                }}
            """)

            target_box = await page.evaluate(f"""
                () => {{
                    const element = document.querySelector('{target}');
                    const rect = element.getBoundingClientRect();
                    return {{
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2
                    }};
                }}
            """)

            # Simulate drag and drop
            await page.mouse.move(source_box["x"], source_box["y"])
            await page.mouse.down()
            await page.mouse.move(target_box["x"], target_box["y"])
            await page.mouse.up()

            return {"success": True, "data": {"source": source, "target": target}}

        except Exception as e:
            logger.error(f"Drag and drop failed: {e}")
            return {"success": False, "error": str(e)}

    async def get_cookies(self, session_id: Optional[str] = None) -> Dict[str, Any]:
        """Get all cookies from page"""
        page = await self._get_page(session_id)

        try:
            cookies = await page.cookies()

            return {"success": True, "data": {"cookies": cookies}}

        except Exception as e:
            logger.error(f"Get cookies failed: {e}")
            return {"success": False, "error": str(e)}

    async def set_cookies(
        self, cookies: list, session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Set cookies in page"""
        page = await self._get_page(session_id)

        try:
            await page.setCookie(*cookies)

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
            await page.waitForSelector(selector, {"timeout": timeout})

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
            await page.waitForNavigation({"waitUntil": "networkidle2"})

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
            if session_id in self.pages:
                await self.pages[session_id].close()
                del self.pages[session_id]

            logger.info(f"Closed Pyppeteer session: {session_id}")

        except Exception as e:
            logger.error(f"Failed to close session: {e}")

    async def cleanup(self):
        """Cleanup all resources"""
        logger.info("Cleaning up PyppeteerEngine...")

        # Close all pages
        for session_id in list(self.pages.keys()):
            await self.close_session(session_id)

        # Close browser
        if self.browser:
            await self.browser.close()
            self.browser = None

        self._initialized = False
        logger.info("PyppeteerEngine cleanup complete")

    def __del__(self):
        """Destructor"""
        if self._initialized:
            try:
                asyncio.get_event_loop().run_until_complete(self.cleanup())
            except:
                pass
