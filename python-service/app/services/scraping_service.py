"""
SyncAds - Intelligent Scraping Service
Sistema de scraping com múltiplas estratégias e fallback automático
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

# Estratégia 1: Playwright
try:
    from playwright.async_api import TimeoutError as PlaywrightTimeout
    from playwright.async_api import async_playwright

    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False

# Estratégia 2: Selenium
try:
    from selenium import webdriver
    from selenium.common.exceptions import TimeoutException, WebDriverException
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.support.ui import WebDriverWait

    SELENIUM_AVAILABLE = True
except ImportError:
    SELENIUM_AVAILABLE = False

# Estratégia 3: Requests + BeautifulSoup
try:
    import requests
    from bs4 import BeautifulSoup

    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

# Estratégia 4: aiohttp
try:
    import aiohttp

    AIOHTTP_AVAILABLE = True
except ImportError:
    AIOHTTP_AVAILABLE = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class IntelligentScraper:
    """
    Scraper inteligente que tenta múltiplas estratégias até conseguir extrair dados
    """

    def __init__(self):
        self.strategies = []

        # Registrar estratégias disponíveis em ordem de preferência
        if PLAYWRIGHT_AVAILABLE:
            self.strategies.append(("playwright", self.strategy_playwright))
        if SELENIUM_AVAILABLE:
            self.strategies.append(("selenium", self.strategy_selenium))
        if AIOHTTP_AVAILABLE:
            self.strategies.append(("aiohttp", self.strategy_aiohttp))
        if REQUESTS_AVAILABLE:
            self.strategies.append(("requests", self.strategy_requests))

        logger.info(f"Estratégias disponíveis: {[s[0] for s in self.strategies]}")

    async def scrape(self, url: str, target: Dict[str, Any]) -> Dict[str, Any]:
        """
        Tenta extrair dados usando múltiplas estratégias

        Args:
            url: URL para scraping
            target: Configuração do que extrair
                - selector: Seletor CSS
                - wait_selector: Seletor para aguardar (opcional)
                - min_results: Mínimo de resultados esperados
                - required_fields: Campos obrigatórios
                - timeout: Timeout em segundos (padrão: 30)

        Returns:
            Dict com success, data, strategy, e errors
        """
        errors = []
        timeout = target.get("timeout", 30)

        logger.info(f"🔍 Iniciando scraping: {url}")
        logger.info(f"📋 Target: {target}")

        for strategy_name, strategy_func in self.strategies:
            try:
                logger.info(f"🎯 Tentando estratégia: {strategy_name}")

                # Executar estratégia com timeout
                result = await asyncio.wait_for(
                    strategy_func(url, target), timeout=timeout
                )

                # Validar resultado
                if self.validate_result(result, target):
                    logger.info(f"✅ Sucesso com {strategy_name}")
                    return {
                        "success": True,
                        "data": result,
                        "strategy": strategy_name,
                        "url": url,
                        "timestamp": datetime.utcnow().isoformat(),
                        "count": len(result) if isinstance(result, list) else 1,
                    }
                else:
                    logger.warning(f"⚠️ {strategy_name}: resultado inválido")
                    errors.append(
                        {
                            "strategy": strategy_name,
                            "error": "Validation failed",
                            "result": result,
                        }
                    )

            except asyncio.TimeoutError:
                logger.error(f"⏱️ {strategy_name}: timeout ({timeout}s)")
                errors.append(
                    {"strategy": strategy_name, "error": f"Timeout after {timeout}s"}
                )
            except Exception as e:
                logger.error(f"❌ {strategy_name}: {str(e)}")
                errors.append(
                    {
                        "strategy": strategy_name,
                        "error": str(e),
                        "type": type(e).__name__,
                    }
                )
                continue

        # Nenhuma estratégia funcionou
        logger.error("❌ Todas as estratégias falharam")
        return {
            "success": False,
            "errors": errors,
            "url": url,
            "timestamp": datetime.utcnow().isoformat(),
            "tried_strategies": [s[0] for s in self.strategies],
        }

    async def strategy_playwright(
        self, url: str, target: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Estratégia 1: Playwright (JavaScript rendering)"""

        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"]
            )

            try:
                page = await browser.new_page()

                # User agent realista
                await page.set_extra_http_headers(
                    {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                    }
                )

                # Navegar
                await page.goto(url, wait_until="networkidle", timeout=30000)

                # Esperar por elemento se especificado
                wait_selector = target.get("wait_selector", target["selector"])
                try:
                    await page.wait_for_selector(wait_selector, timeout=10000)
                except PlaywrightTimeout:
                    logger.warning(f"Timeout aguardando {wait_selector}")

                # Extrair dados
                selector = target["selector"]
                data = await page.evaluate(f"""
                    () => {{
                        const elements = document.querySelectorAll('{selector}');
                        return Array.from(elements).map(el => ({{
                            text: el.textContent.trim(),
                            html: el.innerHTML,
                            href: el.href || null,
                            src: el.src || null,
                            attributes: Object.fromEntries(
                                Array.from(el.attributes).map(a => [a.name, a.value])
                            )
                        }}));
                    }}
                """)

                return data

            finally:
                await browser.close()

    async def strategy_selenium(
        self, url: str, target: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Estratégia 2: Selenium (mais robusto)"""

        options = webdriver.ChromeOptions()
        options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)")

        driver = None
        try:
            driver = webdriver.Chrome(options=options)
            driver.set_page_load_timeout(30)
            driver.get(url)

            # Esperar elemento
            wait_selector = target.get("wait_selector", target["selector"])
            try:
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, wait_selector))
                )
            except TimeoutException:
                logger.warning(f"Timeout aguardando {wait_selector}")

            # Extrair dados
            elements = driver.find_elements(By.CSS_SELECTOR, target["selector"])

            data = []
            for element in elements:
                try:
                    data.append(
                        {
                            "text": element.text,
                            "html": element.get_attribute("innerHTML"),
                            "href": element.get_attribute("href"),
                            "src": element.get_attribute("src"),
                            "attributes": {
                                "class": element.get_attribute("class"),
                                "id": element.get_attribute("id"),
                            },
                        }
                    )
                except Exception as e:
                    logger.warning(f"Erro extraindo elemento: {e}")
                    continue

            return data

        finally:
            if driver:
                driver.quit()

    async def strategy_aiohttp(
        self, url: str, target: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Estratégia 3: aiohttp + BeautifulSoup (async)"""

        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, timeout=30) as response:
                response.raise_for_status()
                html = await response.text()

        # Parse com BeautifulSoup
        soup = BeautifulSoup(html, "html.parser")
        elements = soup.select(target["selector"])

        data = []
        for element in elements:
            data.append(
                {
                    "text": element.get_text(strip=True),
                    "html": str(element),
                    "href": element.get("href"),
                    "src": element.get("src"),
                    "attributes": dict(element.attrs),
                }
            )

        return data

    async def strategy_requests(
        self, url: str, target: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Estratégia 4: Requests + BeautifulSoup (sync wrapper)"""

        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

        # Executar sync requests em thread separada
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None, lambda: requests.get(url, headers=headers, timeout=30)
        )
        response.raise_for_status()

        # Parse com BeautifulSoup
        soup = BeautifulSoup(response.content, "html.parser")
        elements = soup.select(target["selector"])

        data = []
        for element in elements:
            data.append(
                {
                    "text": element.get_text(strip=True),
                    "html": str(element),
                    "href": element.get("href"),
                    "src": element.get("src"),
                    "attributes": dict(element.attrs),
                }
            )

        return data

    def validate_result(self, result: Any, target: Dict[str, Any]) -> bool:
        """Valida se o resultado atende os critérios"""

        if not result:
            return False

        if not isinstance(result, list):
            return False

        # Verificar quantidade mínima
        min_results = target.get("min_results", 1)
        if len(result) < min_results:
            logger.warning(f"Poucos resultados: {len(result)} < {min_results}")
            return False

        # Verificar campos obrigatórios
        required_fields = target.get("required_fields", [])
        if required_fields:
            for item in result[:5]:  # Verificar primeiros 5
                for field in required_fields:
                    if field not in item or not item[field]:
                        logger.warning(f"Campo obrigatório ausente: {field}")
                        return False

        return True


# Instância global
scraper = IntelligentScraper()


async def scrape_url(url: str, selector: str, **kwargs) -> Dict[str, Any]:
    """
    Função helper para scraping rápido

    Args:
        url: URL para scraping
        selector: Seletor CSS
        **kwargs: Opções adicionais (wait_selector, min_results, etc)

    Returns:
        Resultado do scraping
    """
    target = {"selector": selector, **kwargs}

    return await scraper.scrape(url, target)


async def scrape_multiple(
    urls: List[str], selector: str, **kwargs
) -> List[Dict[str, Any]]:
    """
    Scraping de múltiplas URLs em paralelo

    Args:
        urls: Lista de URLs
        selector: Seletor CSS
        **kwargs: Opções adicionais

    Returns:
        Lista de resultados
    """
    tasks = [scrape_url(url, selector, **kwargs) for url in urls]
    return await asyncio.gather(*tasks, return_exceptions=True)


# Cache simples (opcional)
_cache = {}
_cache_ttl = 300  # 5 minutos


async def scrape_cached(
    url: str, selector: str, ttl: int = _cache_ttl, **kwargs
) -> Dict[str, Any]:
    """Scraping com cache"""

    cache_key = f"{url}:{selector}"

    # Verificar cache
    if cache_key in _cache:
        cached_data, timestamp = _cache[cache_key]
        if (datetime.utcnow() - timestamp).total_seconds() < ttl:
            logger.info(f"📦 Cache hit: {cache_key}")
            return cached_data

    # Scraping
    result = await scrape_url(url, selector, **kwargs)

    # Salvar no cache
    if result.get("success"):
        _cache[cache_key] = (result, datetime.utcnow())

    return result
