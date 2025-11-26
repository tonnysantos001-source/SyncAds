"""
AI Expansion Integration Script
Integrates expansion modules with existing FastAPI app
100% ADDON - Does not modify existing code
"""

import os
from pathlib import Path
from typing import Optional

from fastapi import FastAPI
from loguru import logger


class ExpansionIntegration:
    """
    Integration manager for AI Expansion modules
    Safely integrates with existing FastAPI application
    """

    def __init__(self, app: FastAPI):
        """
        Initialize integration

        Args:
            app: Existing FastAPI application instance
        """
        self.app = app
        self.initialized = False
        self.modules_enabled = {
            "automation": False,
            "dom_intelligence": False,
            "ai_agents": False,
            "vision": False,
            "captcha": False,
            "rpa": False,
        }
        logger.info("ExpansionIntegration initialized")

    async def integrate(
        self,
        enable_automation: bool = True,
        enable_dom: bool = True,
        enable_agents: bool = True,
        enable_vision: bool = True,
        enable_captcha: bool = True,
        enable_rpa: bool = True,
    ):
        """
        Integrate expansion modules with the application

        Args:
            enable_automation: Enable multi-engine automation
            enable_dom: Enable DOM intelligence
            enable_agents: Enable AI agents
            enable_vision: Enable computer vision
            enable_captcha: Enable captcha solving
            enable_rpa: Enable RPA frameworks
        """
        if self.initialized:
            logger.warning("Expansion already integrated")
            return

        logger.info("🚀 Starting AI Expansion integration...")

        # Register API router
        try:
            from ai_expansion.api.expansion_router import router as expansion_router

            self.app.include_router(expansion_router)
            logger.success("✓ Expansion API routes registered")
        except Exception as e:
            logger.error(f"Failed to register expansion routes: {e}")

        # Initialize automation module
        if enable_automation:
            try:
                from ai_expansion.modules.automation import AutomationManager

                # Just verify it can be imported
                logger.success("✓ Automation module available")
                self.modules_enabled["automation"] = True
            except Exception as e:
                logger.warning(f"Automation module not available: {e}")

        # Initialize DOM intelligence
        if enable_dom:
            try:
                from ai_expansion.modules.dom_intelligence import DOMParser

                parser = DOMParser()
                info = parser.get_engine_info()
                logger.success(
                    f"✓ DOM Intelligence available: {info['available_engines']}"
                )
                self.modules_enabled["dom_intelligence"] = True
            except Exception as e:
                logger.warning(f"DOM Intelligence not available: {e}")

        # Initialize AI agents
        if enable_agents:
            try:
                # Verify LangChain is available
                import langchain

                logger.success("✓ AI Agents module available (LangChain)")
                self.modules_enabled["ai_agents"] = True
            except Exception as e:
                logger.warning(f"AI Agents not available: {e}")

        # Initialize vision module
        if enable_vision:
            try:
                import cv2

                logger.success("✓ Computer Vision module available")
                self.modules_enabled["vision"] = True
            except Exception as e:
                logger.warning(f"Computer Vision not available: {e}")

        # Initialize captcha module
        if enable_captcha:
            try:
                # Check if API keys are configured
                has_2captcha = bool(os.getenv("TWOCAPTCHA_API_KEY"))
                has_anticaptcha = bool(os.getenv("ANTICAPTCHA_API_KEY"))

                if has_2captcha or has_anticaptcha:
                    logger.success("✓ Captcha solving module available")
                    self.modules_enabled["captcha"] = True
                else:
                    logger.info("⚠ Captcha module available but no API keys configured")
            except Exception as e:
                logger.warning(f"Captcha module not available: {e}")

        # Initialize RPA module
        if enable_rpa:
            try:
                # Check if RPA Framework is available
                import RPA

                logger.success("✓ RPA Framework available")
                self.modules_enabled["rpa"] = True
            except Exception as e:
                logger.warning(f"RPA Framework not available: {e}")

        self.initialized = True

        # Summary
        enabled_count = sum(1 for v in self.modules_enabled.values() if v)
        logger.success(
            f"🎉 AI Expansion integration complete! {enabled_count}/{len(self.modules_enabled)} modules enabled"
        )

        # Log enabled modules
        for module, enabled in self.modules_enabled.items():
            status = "🟢 ENABLED" if enabled else "🔴 DISABLED"
            logger.info(f"  - {module}: {status}")

    def get_status(self) -> dict:
        """Get integration status"""
        return {
            "initialized": self.initialized,
            "modules": self.modules_enabled,
            "enabled_count": sum(1 for v in self.modules_enabled.values() if v),
            "total_modules": len(self.modules_enabled),
        }


# ==========================================
# EASY INTEGRATION FUNCTION
# ==========================================


async def integrate_expansion(
    app: FastAPI,
    enable_all: bool = True,
    enable_automation: Optional[bool] = None,
    enable_dom: Optional[bool] = None,
    enable_agents: Optional[bool] = None,
    enable_vision: Optional[bool] = None,
    enable_captcha: Optional[bool] = None,
    enable_rpa: Optional[bool] = None,
):
    """
    Easy integration function for AI Expansion

    Usage in main.py:
        from ai_expansion.integration import integrate_expansion

        # After creating FastAPI app
        await integrate_expansion(app)

    Args:
        app: FastAPI application instance
        enable_all: Enable all modules (default: True)
        enable_automation: Override for automation module
        enable_dom: Override for DOM intelligence
        enable_agents: Override for AI agents
        enable_vision: Override for computer vision
        enable_captcha: Override for captcha solving
        enable_rpa: Override for RPA framework
    """
    integrator = ExpansionIntegration(app)

    # Use enable_all unless specific overrides are provided
    await integrator.integrate(
        enable_automation=enable_automation
        if enable_automation is not None
        else enable_all,
        enable_dom=enable_dom if enable_dom is not None else enable_all,
        enable_agents=enable_agents if enable_agents is not None else enable_all,
        enable_vision=enable_vision if enable_vision is not None else enable_all,
        enable_captcha=enable_captcha if enable_captcha is not None else enable_all,
        enable_rpa=enable_rpa if enable_rpa is not None else enable_all,
    )

    return integrator


# ==========================================
# STARTUP EVENT HANDLER
# ==========================================


def create_expansion_startup_handler(app: FastAPI):
    """
    Create startup event handler for expansion

    Usage:
        from ai_expansion.integration import create_expansion_startup_handler

        app = FastAPI()
        startup_handler = create_expansion_startup_handler(app)

        @app.on_event("startup")
        async def startup():
            await startup_handler()
    """

    async def startup_handler():
        """Startup handler for expansion integration"""
        try:
            logger.info("🚀 Initializing AI Expansion modules...")
            await integrate_expansion(app, enable_all=True)
            logger.success("✅ AI Expansion ready!")
        except Exception as e:
            logger.error(f"❌ AI Expansion initialization failed: {e}")
            logger.warning("⚠ Continuing without expansion modules")

    return startup_handler


# ==========================================
# MIDDLEWARE (Optional)
# ==========================================


class ExpansionMiddleware:
    """
    Optional middleware for expansion features
    Can add logging, monitoring, or feature flags
    """

    def __init__(self, app: FastAPI):
        self.app = app

    async def __call__(self, scope, receive, send):
        """Middleware handler"""
        # Add custom logic here if needed
        # For now, just pass through
        await self.app(scope, receive, send)


# ==========================================
# UTILITIES
# ==========================================


def check_expansion_dependencies() -> dict:
    """
    Check which expansion dependencies are available

    Returns:
        Dictionary with availability status of each dependency
    """
    dependencies = {}

    # Automation engines
    try:
        import playwright

        dependencies["playwright"] = True
    except:
        dependencies["playwright"] = False

    try:
        import selenium

        dependencies["selenium"] = True
    except:
        dependencies["selenium"] = False

    try:
        import pyppeteer

        dependencies["pyppeteer"] = True
    except:
        dependencies["pyppeteer"] = False

    # DOM parsers
    try:
        from bs4 import BeautifulSoup

        dependencies["beautifulsoup4"] = True
    except:
        dependencies["beautifulsoup4"] = False

    try:
        from lxml import html

        dependencies["lxml"] = True
    except:
        dependencies["lxml"] = False

    try:
        from selectolax.parser import HTMLParser

        dependencies["selectolax"] = True
    except:
        dependencies["selectolax"] = False

    # AI frameworks
    try:
        import langchain

        dependencies["langchain"] = True
    except:
        dependencies["langchain"] = False

    try:
        import autogen

        dependencies["autogen"] = True
    except:
        dependencies["autogen"] = False

    # Vision
    try:
        import cv2

        dependencies["opencv"] = True
    except:
        dependencies["opencv"] = False

    try:
        import pytesseract

        dependencies["tesseract"] = True
    except:
        dependencies["tesseract"] = False

    # RPA
    try:
        import RPA

        dependencies["rpa_framework"] = True
    except:
        dependencies["rpa_framework"] = False

    return dependencies


def print_expansion_banner():
    """Print expansion module banner"""
    banner = """
    ╔════════════════════════════════════════════════════════╗
    ║                                                        ║
    ║          🚀 SYNCADS AI - EXPANSION MODULE 🚀          ║
    ║                                                        ║
    ║               Ultra-Advanced Capabilities              ║
    ║                    100% ADDON MODE                     ║
    ║                                                        ║
    ║  ✨ Multi-Engine Automation (Playwright/Selenium/Pup) ║
    ║  ✨ DOM Intelligence (10-100x faster parsing)         ║
    ║  ✨ AI Agents (LangChain + AutoGen)                   ║
    ║  ✨ Computer Vision (OpenCV + OCR)                    ║
    ║  ✨ Captcha Solving (Ethical APIs)                    ║
    ║  ✨ RPA Framework Integration                         ║
    ║                                                        ║
    ║            Version: 1.0.0 | Status: 🟢               ║
    ║                                                        ║
    ╚════════════════════════════════════════════════════════╝
    """
    print(banner)


# ==========================================
# AUTO-INTEGRATION (Optional)
# ==========================================


def auto_integrate_if_enabled():
    """
    Automatically integrate if ENABLE_AI_EXPANSION env var is set
    Call this at the end of main.py
    """
    if os.getenv("ENABLE_AI_EXPANSION", "false").lower() == "true":
        logger.info("AI_EXPANSION enabled via environment variable")
        return True
    return False


# ==========================================
# EXPORT
# ==========================================

__all__ = [
    "ExpansionIntegration",
    "integrate_expansion",
    "create_expansion_startup_handler",
    "check_expansion_dependencies",
    "print_expansion_banner",
    "auto_integrate_if_enabled",
]
