"""
Stealth Mode - Anti-detection for browser automation
Prevents detection by anti-bot systems
100% ADDON - Does not modify existing functionality
"""

from typing import Any, Dict, Optional

from loguru import logger

# Stealth configurations
STEALTH_CONFIG = {
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "viewport": {"width": 1920, "height": 1080},
    "language": "en-US,en;q=0.9",
    "timezone": "America/New_York",
}


class StealthMode:
    """
    Stealth mode configuration for browser automation
    Helps avoid detection by anti-bot systems
    """

    def __init__(self):
        """Initialize stealth mode"""
        self.config = STEALTH_CONFIG.copy()
        logger.info("✅ StealthMode initialized")

    def get_playwright_args(self) -> Dict[str, Any]:
        """
        Get Playwright launch arguments for stealth mode

        Returns:
            Dict with launch arguments
        """
        return {
            "headless": True,
            "args": [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas",
                "--disable-gpu",
                "--window-size=1920,1080",
                "--disable-blink-features=AutomationControlled",
            ],
        }

    def get_selenium_options(self):
        """
        Get Selenium options for stealth mode

        Returns:
            Chrome options with stealth settings
        """
        try:
            from selenium.webdriver.chrome.options import Options

            options = Options()
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--disable-blink-features=AutomationControlled")
            options.add_experimental_option("excludeSwitches", ["enable-automation"])
            options.add_experimental_option("useAutomationExtension", False)
            options.add_argument(f"user-agent={self.config['user_agent']}")

            return options

        except ImportError:
            logger.warning("Selenium not available")
            return None

    def apply_to_page(self, page: Any) -> None:
        """
        Apply stealth settings to a page/browser instance

        Args:
            page: Playwright page or Selenium driver
        """
        try:
            # Try to set properties that hide automation
            page.evaluate(
                """
                // Overwrite the `navigator.webdriver` property
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                });

                // Overwrite the `plugins` property
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [1, 2, 3, 4, 5]
                });

                // Overwrite the `languages` property
                Object.defineProperty(navigator, 'languages', {
                    get: () => ['en-US', 'en']
                });
            """
            )
            logger.info("✅ Stealth mode applied to page")

        except Exception as e:
            logger.warning(f"Could not apply stealth mode: {e}")

    def get_headers(self) -> Dict[str, str]:
        """
        Get HTTP headers for stealth requests

        Returns:
            Dict with headers
        """
        return {
            "User-Agent": self.config["user_agent"],
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": self.config["language"],
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
        }


# Singleton instance
_stealth_instance = None


def get_stealth_mode() -> StealthMode:
    """Get singleton stealth mode instance"""
    global _stealth_instance
    if _stealth_instance is None:
        _stealth_instance = StealthMode()
    return _stealth_instance
