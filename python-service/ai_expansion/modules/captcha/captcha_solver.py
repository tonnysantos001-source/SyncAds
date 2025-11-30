"""
Captcha Solver - Ethical captcha solving using API services
Supports 2Captcha, AntiCaptcha, and other ethical services
100% ADDON - Does not modify existing functionality
"""

import asyncio
import os
import time
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, Optional

from loguru import logger

try:
    import httpx

    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False
    logger.warning("httpx not available - install with: pip install httpx")


class CaptchaType(str, Enum):
    """Supported captcha types"""

    RECAPTCHA_V2 = "recaptcha_v2"
    RECAPTCHA_V3 = "recaptcha_v3"
    HCAPTCHA = "hcaptcha"
    IMAGE = "image"
    AUDIO = "audio"
    FUNCAPTCHA = "funcaptcha"
    GEETEST = "geetest"


class SolverService(str, Enum):
    """Supported solver services"""

    TWOCAPTCHA = "2captcha"
    ANTICAPTCHA = "anticaptcha"
    DEATHBYCAPTCHA = "deathbycaptcha"


@dataclass
class CaptchaSolution:
    """Result of captcha solving"""

    success: bool
    solution: Optional[str] = None
    solve_time: float = 0.0
    cost: float = 0.0
    service: Optional[str] = None
    error: Optional[str] = None
    task_id: Optional[str] = None


class CaptchaSolver:
    """
    Ethical captcha solver using API services
    Supports multiple services with fallback
    """

    def __init__(self, service: str = "2captcha", api_key: Optional[str] = None):
        """
        Initialize captcha solver

        Args:
            service: Solver service to use
            api_key: API key (or will read from environment)
        """
        if not HTTPX_AVAILABLE:
            raise RuntimeError("httpx is required for CaptchaSolver")

        self.service = SolverService(service)
        self.api_key = api_key or self._get_api_key()

        if not self.api_key:
            logger.warning(
                f"No API key found for {service}. Set {self._get_env_var_name()} environment variable."
            )

        self.client = httpx.AsyncClient(timeout=120.0)

        # Service endpoints
        self.endpoints = {
            SolverService.TWOCAPTCHA: {
                "submit": "https://2captcha.com/in.php",
                "result": "https://2captcha.com/res.php",
            },
            SolverService.ANTICAPTCHA: {
                "submit": "https://api.anti-captcha.com/createTask",
                "result": "https://api.anti-captcha.com/getTaskResult",
            },
        }

        logger.info(f"CaptchaSolver initialized with {service}")

    def _get_env_var_name(self) -> str:
        """Get environment variable name for current service"""
        if self.service == SolverService.TWOCAPTCHA:
            return "TWOCAPTCHA_API_KEY"
        elif self.service == SolverService.ANTICAPTCHA:
            return "ANTICAPTCHA_API_KEY"
        elif self.service == SolverService.DEATHBYCAPTCHA:
            return "DEATHBYCAPTCHA_API_KEY"
        return "CAPTCHA_API_KEY"

    def _get_api_key(self) -> Optional[str]:
        """Get API key from environment"""
        return os.getenv(self._get_env_var_name())

    async def solve(
        self,
        captcha_type: CaptchaType,
        site_key: Optional[str] = None,
        page_url: Optional[str] = None,
        image_base64: Optional[str] = None,
        **kwargs,
    ) -> CaptchaSolution:
        """
        Solve a captcha

        Args:
            captcha_type: Type of captcha
            site_key: Site key (for reCAPTCHA, hCaptcha)
            page_url: Page URL where captcha appears
            image_base64: Base64 encoded image (for image captcha)
            **kwargs: Additional parameters

        Returns:
            CaptchaSolution with result
        """
        if not self.api_key:
            return CaptchaSolution(
                success=False,
                error=f"No API key configured for {self.service}",
                service=str(self.service),
            )

        logger.info(f"Solving {captcha_type} captcha using {self.service}")
        start_time = time.time()

        try:
            if self.service == SolverService.TWOCAPTCHA:
                result = await self._solve_with_2captcha(
                    captcha_type, site_key, page_url, image_base64, **kwargs
                )
            elif self.service == SolverService.ANTICAPTCHA:
                result = await self._solve_with_anticaptcha(
                    captcha_type, site_key, page_url, image_base64, **kwargs
                )
            else:
                return CaptchaSolution(
                    success=False,
                    error=f"Service {self.service} not implemented",
                    service=str(self.service),
                )

            # Add timing and service info
            result.solve_time = time.time() - start_time
            result.service = str(self.service)

            if result.success:
                logger.success(
                    f"Captcha solved in {result.solve_time:.2f}s (cost: ${result.cost:.4f})"
                )
            else:
                logger.error(f"Captcha solving failed: {result.error}")

            return result

        except Exception as e:
            logger.error(f"Captcha solving error: {e}")
            return CaptchaSolution(
                success=False,
                error=str(e),
                solve_time=time.time() - start_time,
                service=str(self.service),
            )

    async def _solve_with_2captcha(
        self,
        captcha_type: CaptchaType,
        site_key: Optional[str],
        page_url: Optional[str],
        image_base64: Optional[str],
        **kwargs,
    ) -> CaptchaSolution:
        """Solve captcha using 2Captcha service"""

        # Submit captcha
        task_id = await self._2captcha_submit(
            captcha_type, site_key, page_url, image_base64, **kwargs
        )

        if not task_id:
            return CaptchaSolution(success=False, error="Failed to submit captcha")

        # Poll for result
        max_attempts = 60  # 2 minutes max
        attempt = 0

        while attempt < max_attempts:
            await asyncio.sleep(5)  # Check every 5 seconds

            result = await self._2captcha_get_result(task_id)

            if result["status"] == "ready":
                return CaptchaSolution(
                    success=True,
                    solution=result["solution"],
                    cost=self._estimate_cost(captcha_type),
                    task_id=task_id,
                )
            elif result["status"] == "error":
                return CaptchaSolution(
                    success=False, error=result.get("error", "Unknown error")
                )

            attempt += 1

        return CaptchaSolution(success=False, error="Timeout waiting for solution")

    async def _2captcha_submit(
        self,
        captcha_type: CaptchaType,
        site_key: Optional[str],
        page_url: Optional[str],
        image_base64: Optional[str],
        **kwargs,
    ) -> Optional[str]:
        """Submit captcha to 2Captcha"""

        params = {"key": self.api_key, "json": 1}

        if captcha_type == CaptchaType.RECAPTCHA_V2:
            params.update(
                {"method": "userrecaptcha", "googlekey": site_key, "pageurl": page_url}
            )
        elif captcha_type == CaptchaType.RECAPTCHA_V3:
            params.update(
                {
                    "method": "userrecaptcha",
                    "version": "v3",
                    "googlekey": site_key,
                    "pageurl": page_url,
                    "action": kwargs.get("action", "verify"),
                    "min_score": kwargs.get("min_score", 0.3),
                }
            )
        elif captcha_type == CaptchaType.HCAPTCHA:
            params.update(
                {"method": "hcaptcha", "sitekey": site_key, "pageurl": page_url}
            )
        elif captcha_type == CaptchaType.IMAGE:
            params.update({"method": "base64", "body": image_base64})
        else:
            logger.error(f"Unsupported captcha type: {captcha_type}")
            return None

        try:
            response = await self.client.post(
                self.endpoints[SolverService.TWOCAPTCHA]["submit"], params=params
            )
            data = response.json()

            if data.get("status") == 1:
                return data.get("request")
            else:
                logger.error(f"2Captcha submit error: {data.get('request')}")
                return None

        except Exception as e:
            logger.error(f"2Captcha submit failed: {e}")
            return None

    async def _2captcha_get_result(self, task_id: str) -> Dict[str, Any]:
        """Get result from 2Captcha"""

        params = {"key": self.api_key, "action": "get", "id": task_id, "json": 1}

        try:
            response = await self.client.get(
                self.endpoints[SolverService.TWOCAPTCHA]["result"], params=params
            )
            data = response.json()

            if data.get("status") == 1:
                return {"status": "ready", "solution": data.get("request")}
            elif data.get("request") == "CAPCHA_NOT_READY":
                return {"status": "processing"}
            else:
                return {"status": "error", "error": data.get("request")}

        except Exception as e:
            logger.error(f"2Captcha get result failed: {e}")
            return {"status": "error", "error": str(e)}

    async def _solve_with_anticaptcha(
        self,
        captcha_type: CaptchaType,
        site_key: Optional[str],
        page_url: Optional[str],
        image_base64: Optional[str],
        **kwargs,
    ) -> CaptchaSolution:
        """Solve captcha using AntiCaptcha service"""

        # Submit task
        task_id = await self._anticaptcha_submit(
            captcha_type, site_key, page_url, image_base64, **kwargs
        )

        if not task_id:
            return CaptchaSolution(success=False, error="Failed to submit captcha")

        # Poll for result
        max_attempts = 60
        attempt = 0

        while attempt < max_attempts:
            await asyncio.sleep(5)

            result = await self._anticaptcha_get_result(task_id)

            if result["status"] == "ready":
                return CaptchaSolution(
                    success=True,
                    solution=result["solution"],
                    cost=self._estimate_cost(captcha_type),
                    task_id=task_id,
                )
            elif result["status"] == "error":
                return CaptchaSolution(
                    success=False, error=result.get("error", "Unknown error")
                )

            attempt += 1

        return CaptchaSolution(success=False, error="Timeout waiting for solution")

    async def _anticaptcha_submit(
        self,
        captcha_type: CaptchaType,
        site_key: Optional[str],
        page_url: Optional[str],
        image_base64: Optional[str],
        **kwargs,
    ) -> Optional[str]:
        """Submit task to AntiCaptcha"""

        task_data = {"clientKey": self.api_key}

        if captcha_type == CaptchaType.RECAPTCHA_V2:
            task_data["task"] = {
                "type": "RecaptchaV2TaskProxyless",
                "websiteURL": page_url,
                "websiteKey": site_key,
            }
        elif captcha_type == CaptchaType.RECAPTCHA_V3:
            task_data["task"] = {
                "type": "RecaptchaV3TaskProxyless",
                "websiteURL": page_url,
                "websiteKey": site_key,
                "minScore": kwargs.get("min_score", 0.3),
                "pageAction": kwargs.get("action", "verify"),
            }
        elif captcha_type == CaptchaType.HCAPTCHA:
            task_data["task"] = {
                "type": "HCaptchaTaskProxyless",
                "websiteURL": page_url,
                "websiteKey": site_key,
            }
        elif captcha_type == CaptchaType.IMAGE:
            task_data["task"] = {"type": "ImageToTextTask", "body": image_base64}
        else:
            logger.error(f"Unsupported captcha type: {captcha_type}")
            return None

        try:
            response = await self.client.post(
                self.endpoints[SolverService.ANTICAPTCHA]["submit"], json=task_data
            )
            data = response.json()

            if data.get("errorId") == 0:
                return str(data.get("taskId"))
            else:
                logger.error(
                    f"AntiCaptcha submit error: {data.get('errorDescription')}"
                )
                return None

        except Exception as e:
            logger.error(f"AntiCaptcha submit failed: {e}")
            return None

    async def _anticaptcha_get_result(self, task_id: str) -> Dict[str, Any]:
        """Get result from AntiCaptcha"""

        payload = {"clientKey": self.api_key, "taskId": int(task_id)}

        try:
            response = await self.client.post(
                self.endpoints[SolverService.ANTICAPTCHA]["result"], json=payload
            )
            data = response.json()

            if data.get("errorId") == 0:
                if data.get("status") == "ready":
                    solution = data.get("solution", {})
                    # Extract solution based on type
                    token = (
                        solution.get("gRecaptchaResponse")
                        or solution.get("token")
                        or solution.get("text")
                    )
                    return {"status": "ready", "solution": token}
                else:
                    return {"status": "processing"}
            else:
                return {
                    "status": "error",
                    "error": data.get("errorDescription", "Unknown error"),
                }

        except Exception as e:
            logger.error(f"AntiCaptcha get result failed: {e}")
            return {"status": "error", "error": str(e)}

    def _estimate_cost(self, captcha_type: CaptchaType) -> float:
        """Estimate cost for captcha solving"""
        # Approximate costs (may vary by service)
        costs = {
            CaptchaType.RECAPTCHA_V2: 0.003,  # $0.003 per captcha
            CaptchaType.RECAPTCHA_V3: 0.003,
            CaptchaType.HCAPTCHA: 0.003,
            CaptchaType.IMAGE: 0.001,
            CaptchaType.FUNCAPTCHA: 0.004,
            CaptchaType.GEETEST: 0.004,
        }
        return costs.get(captcha_type, 0.003)

    async def get_balance(self) -> Dict[str, Any]:
        """Get account balance"""
        if not self.api_key:
            return {"error": "No API key configured"}

        try:
            if self.service == SolverService.TWOCAPTCHA:
                response = await self.client.get(
                    self.endpoints[SolverService.TWOCAPTCHA]["result"],
                    params={"key": self.api_key, "action": "getbalance", "json": 1},
                )
                data = response.json()
                if data.get("status") == 1:
                    return {"balance": float(data.get("request", 0)), "currency": "USD"}

            elif self.service == SolverService.ANTICAPTCHA:
                response = await self.client.post(
                    "https://api.anti-captcha.com/getBalance",
                    json={"clientKey": self.api_key},
                )
                data = response.json()
                if data.get("errorId") == 0:
                    return {"balance": float(data.get("balance", 0)), "currency": "USD"}

            return {"error": "Failed to get balance"}

        except Exception as e:
            logger.error(f"Get balance failed: {e}")
            return {"error": str(e)}

    async def cleanup(self):
        """Cleanup resources"""
        await self.client.aclose()

    def __del__(self):
        """Destructor"""
        try:
            import asyncio

            asyncio.get_event_loop().run_until_complete(self.cleanup())
        except:
            pass


# Factory function
def create_captcha_solver(
    service: str = "2captcha", api_key: Optional[str] = None
) -> CaptchaSolver:
    """
    Create a captcha solver instance

    Args:
        service: Service to use (2captcha, anticaptcha)
        api_key: Optional API key

    Returns:
        CaptchaSolver instance
    """
    return CaptchaSolver(service=service, api_key=api_key)
