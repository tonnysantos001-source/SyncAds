"""
AI Expansion - Captcha Solving Module
Ethical captcha solving using API services (2Captcha, AntiCaptcha)
Maintains 100% compatibility with existing system - ADDON ONLY
"""

from .captcha_solver import (
    CaptchaSolution,
    CaptchaSolver,
    CaptchaType,
    SolverService,
    create_captcha_solver,
)

__all__ = [
    "CaptchaSolver",
    "CaptchaSolution",
    "CaptchaType",
    "SolverService",
    "create_captcha_solver",
]

__version__ = "1.0.0"
