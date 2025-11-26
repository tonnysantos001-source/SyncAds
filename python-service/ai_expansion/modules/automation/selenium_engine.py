"""
Selenium Engine - Advanced browser automation with Selenium WebDriver
Supports stealth mode, multiple drivers, advanced interactions
100% ADDON - Does not modify existing functionality
"""

import asyncio
import base64
import uuid
from typing import Any, Dict, Optional

from loguru import logger
from selenium import webdriver
from selenium.common.exceptions import (
    NoSuchElementException,
    TimeoutException,
    WebDriverException,
)
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager


class SeleniumEngine:
    """
    Advanced Selenium automation engine with stealth capabilities
    """

    def __init__(self):
        """Initialize Selenium engine"""
        self.drivers: Dict[str, webdriver.Chrome] = {}
        self._initialized = False
        logger.info("SeleniumEngine created")

    async def initialize(self):
        """Initialize Selenium WebDriver"""
        if self._initialized:
            return

        try:
            # Just verify we can create a driver
            logger.info("SeleniumEngine ready to create drivers on demand")
            self._initialized = True
            logger.success("SeleniumEngine initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize Selenium: {e}")
            raise

    def _create_chrome_options(
        self, headless: bool = True, stealth: bool = True
    ) -> ChromeOptions:
        """
        Create Chrome options with stealth and performance settings

        Args:
            headless: Run in headless mode
            stealth: Enable stealth mode features

        Returns:
            Configured ChromeOptions
        """
        options = ChromeOptions()

        # Headless mode
        if headless:
            options.add_argument("--headless=new")
            options.add_argument("--window-size=1920,1080")

        # Performance and stability
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--disable-software-rasterizer")
        options.add_argument("--disable-extensions")

        # Stealth mode
        if stealth:
            options.add_argument("--disable-blink-features=AutomationControlled")
            options.add_experimental_option("excludeSwitches", ["enable-automation"])
            options.add_experimental_option("useAutomationExtension", False)

            # User agent
            options.add_argument(
                "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            )

        # Additional preferences
        prefs = {
            "profile.default_content_setting_values.notifications": 2,
            "profile.default_content_settings.popups": 0,
            "download.prompt_for_download": False,
            "credentials_enable_service": False,
            "profile.password_manager_enabled": False,
        }
        options.add_experimental_option("prefs", prefs)

        return options

    async def create_session(
        self,
        headless: bool = True,
        stealth: bool = True,
        user_agent: Optional[str] = None,
    ) -> str:
        """
        Create a new WebDriver session

        Args:
            headless: Run in headless mode
            stealth: Enable stealth mode features
            user_agent: Custom user agent

        Returns:
            Session ID
        """
        if not self._initialized:
            await self.initialize()

        session_id = str(uuid.uuid4())

        try:
            # Create Chrome options
            options = self._create_chrome_options(headless=headless, stealth=stealth)

            # Custom user agent
            if user_agent:
                options.add_argument(f"user-agent={user_agent}")

            # Create driver
            service = ChromeService(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=options)

            # Apply stealth scripts
            if stealth:
                await self._apply_stealth(driver)

            # Set timeouts
            driver.implicitly_wait(10)
            driver.set_page_load_timeout(30)

            # Store driver
            self.drivers[session_id] = driver

            logger.info(f"Created Selenium session: {session_id}")
            return session_id

        except Exception as e:
            logger.error(f"Failed to create session: {e}")
            raise

    async def _apply_stealth(self, driver: webdriver.Chrome):
        """Apply stealth mode scripts to driver"""

        stealth_js = """
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined
        });

        Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5]
        });

        Object.defineProperty(navigator, 'languages', {
            get: () => ['pt-BR', 'pt', 'en-US', 'en']
        });

        window.chrome = {
            runtime: {},
            loadTimes: function() {},
            csi: function() {},
            app: {}
        };

        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
            parameters.name === 'notifications' ?
                Promise.resolve({ state: Notification.permission }) :
                originalQuery(parameters)
        );
        """

        try:
            driver.execute_cdp_cmd(
                "Page.addScriptToEvaluateOnNewDocument", {"source": stealth_js}
            )
            logger.debug("Stealth mode applied to driver")
        except Exception as e:
            logger.warning(f"Could not apply stealth mode: {e}")

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
        driver = self._get_driver(session_id)

        try:
            driver.get(url)

            # Wait for page load
            await asyncio.sleep(0.5)

            return {
                "success": True,
                "data": {
                    "url": driver.current_url,
                    "title": driver.title,
                },
            }

        except Exception as e:
            logger.error(f"Navigation failed: {e}")
            return {"success": False, "error": str(e)}

    async def click(
        self, selector: str, session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Click element by CSS selector

        Args:
            selector: CSS selector
            session_id: Optional session ID

        Returns:
            Result dictionary
        """
        driver = self._get_driver(session_id)

        try:
            element = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
            )
            element.click()

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
        driver = self._get_driver(session_id)

        try:
            element = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, selector))
            )
            element.clear()
            element.send_keys(text)

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
        Scroll to element

        Args:
            selector: CSS selector (default: body)
            session_id: Optional session ID

        Returns:
            Result dictionary
        """
        driver = self._get_driver(session_id)

        try:
            if selector == "body":
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            else:
                element = driver.find_element(By.CSS_SELECTOR, selector)
                driver.execute_script(
                    "arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});",
                    element,
                )

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
            full_page: Capture full page (requires scrolling)

        Returns:
            Result dictionary with base64 screenshot
        """
        driver = self._get_driver(session_id)

        try:
            if full_page:
                # Get full page height
                total_height = driver.execute_script(
                    "return document.body.scrollHeight"
                )
                viewport_height = driver.execute_script("return window.innerHeight")

                # Set window to full height (if possible)
                driver.set_window_size(1920, total_height)
                await asyncio.sleep(0.3)

            screenshot_b64 = driver.get_screenshot_as_base64()

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
        driver = self._get_driver(session_id)

        try:
            result = driver.execute_script(script)

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
        driver = self._get_driver(session_id)

        try:
            html = driver.page_source

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
        driver = self._get_driver(session_id)

        try:
            element = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, selector))
            )
            text = element.text

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
        driver = self._get_driver(session_id)

        try:
            element = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, selector))
            )

            actions = ActionChains(driver)
            actions.move_to_element(element).perform()

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
        driver = self._get_driver(session_id)

        try:
            element = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, selector))
            )

            select = Select(element)
            select.select_by_value(value)

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
        driver = self._get_driver(session_id)

        try:
            source_element = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, source))
            )
            target_element = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, target))
            )

            actions = ActionChains(driver)
            actions.drag_and_drop(source_element, target_element).perform()

            return {"success": True, "data": {"source": source, "target": target}}

        except Exception as e:
            logger.error(f"Drag and drop failed: {e}")
            return {"success": False, "error": str(e)}

    async def get_cookies(self, session_id: Optional[str] = None) -> Dict[str, Any]:
        """Get all cookies"""
        driver = self._get_driver(session_id)

        try:
            cookies = driver.get_cookies()

            return {"success": True, "data": {"cookies": cookies}}

        except Exception as e:
            logger.error(f"Get cookies failed: {e}")
            return {"success": False, "error": str(e)}

    async def set_cookies(
        self, cookies: list, session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Set cookies"""
        driver = self._get_driver(session_id)

        try:
            for cookie in cookies:
                driver.add_cookie(cookie)

            return {"success": True, "data": {"cookies_set": len(cookies)}}

        except Exception as e:
            logger.error(f"Set cookies failed: {e}")
            return {"success": False, "error": str(e)}

    async def wait_for_selector(
        self, selector: str, timeout: int = 30000, session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Wait for selector to appear"""
        driver = self._get_driver(session_id)

        try:
            WebDriverWait(driver, timeout / 1000).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, selector))
            )

            return {"success": True, "data": {"selector": selector, "found": True}}

        except Exception as e:
            logger.error(f"Wait for selector failed: {e}")
            return {"success": False, "error": str(e)}

    def _get_driver(self, session_id: Optional[str] = None) -> webdriver.Chrome:
        """Get driver from session or create default"""
        if session_id and session_id in self.drivers:
            return self.drivers[session_id]

        # Create default session if needed
        if not self.drivers:
            loop = asyncio.get_event_loop()
            default_session = loop.run_until_complete(self.create_session())
            return self.drivers[default_session]

        # Return first available driver
        return next(iter(self.drivers.values()))

    async def close_session(self, session_id: str):
        """Close a specific session"""
        try:
            if session_id in self.drivers:
                self.drivers[session_id].quit()
                del self.drivers[session_id]

            logger.info(f"Closed Selenium session: {session_id}")

        except Exception as e:
            logger.error(f"Failed to close session: {e}")

    async def cleanup(self):
        """Cleanup all resources"""
        logger.info("Cleaning up SeleniumEngine...")

        # Close all drivers
        for session_id in list(self.drivers.keys()):
            await self.close_session(session_id)

        self._initialized = False
        logger.info("SeleniumEngine cleanup complete")

    def __del__(self):
        """Destructor"""
        if self._initialized and self.drivers:
            try:
                asyncio.get_event_loop().run_until_complete(self.cleanup())
            except:
                for driver in self.drivers.values():
                    try:
                        driver.quit()
                    except:
                        pass
