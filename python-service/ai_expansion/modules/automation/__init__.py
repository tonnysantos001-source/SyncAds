"""
AI Expansion - Automation Module
Multi-engine browser automation with Playwright, Selenium, and Pyppeteer
Maintains 100% compatibility with existing system - ADDON ONLY
"""

from .automation_manager import AutomationManager
from .playwright_engine import PlaywrightEngine
from .pyppeteer_engine import PyppeteerEngine
from .selenium_engine import SeleniumEngine
from .stealth_mode import StealthMode

__all__ = [
    "PlaywrightEngine",
    "SeleniumEngine",
    "PyppeteerEngine",
    "AutomationManager",
    "StealthMode",
]

__version__ = "1.0.0"
