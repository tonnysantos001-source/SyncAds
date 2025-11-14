"""
============================================
SYNCADS PYTHON MICROSERVICE - SCRAPING ROUTER
============================================
Router para scraping de websites
Suporta múltiplas abordagens e bibliotecas
============================================
"""

import asyncio
import base64
import json
from io import BytesIO
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin, urlparse

import httpx
import requests
from bs4 import BeautifulSoup
from fastapi import APIRouter, HTTPException
from loguru import logger
from playwright.async_api import async_playwright
from pydantic import BaseModel, Field, HttpUrl
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

# ==========================================
# ROUTER
# ==========================================

router = APIRouter()

# ==========================================
# MODELS
# ==========================================


class ScrapeRequest(BaseModel):
    """Request model para scraping"""

    url: str = Field(..., description="URL do site para fazer scraping")
    selectors: Optional[Dict[str, str]] = Field(
        None, description="Seletores CSS para extrair dados específicos"
    )
    wait_for: Optional[str] = Field(
        None, description="Seletor CSS para aguardar antes de extrair"
    )
    timeout: int = Field(30, description="Timeout em segundos")
    user_agent: Optional[str] = Field(None, description="User agent customizado")
    extract_images: bool = Field(False, description="Extrair URLs de imagens")
    extract_links: bool = Field(False, description="Extrair todos os links")
    javascript: bool = Field(False, description="Usar browser headless (Playwright)")
    screenshot: bool = Field(False, description="Capturar screenshot")
    approach: str = Field(
        "auto", description="Abordagem: auto, requests, playwright, selenium"
    )


class Product(BaseModel):
    """Modelo de produto extraído"""

    name: Optional[str] = None
    price: Optional[str] = None
    image: Optional[str] = None
    link: Optional[str] = None
    description: Optional[str] = None
    sku: Optional[str] = None
    availability: Optional[str] = None


class ScrapeResponse(BaseModel):
    """Response model para scraping"""

    success: bool
    url: str
    data: Optional[Dict[str, Any]] = None
    html: Optional[str] = None
    text: Optional[str] = None
    images: Optional[List[str]] = None
    links: Optional[List[str]] = None
    products: Optional[List[Product]] = None
    screenshot: Optional[str] = None
    method: str
    error: Optional[str] = None
    execution_time: float


class ProductScrapeRequest(BaseModel):
    """Request para scraping de produtos"""

    url: str
    max_products: int = Field(100, description="Máximo de produtos a extrair")
    pagination: bool = Field(False, description="Seguir paginação")
    max_pages: int = Field(5, description="Máximo de páginas")


# ==========================================
# ENDPOINTS
# ==========================================


@router.post("/scrape", response_model=ScrapeResponse)
async def scrape_website(request: ScrapeRequest):
    """
    Faz scraping de um website

    Suporta múltiplas abordagens:
    - requests + BeautifulSoup (rápido, sem JS)
    - Playwright (suporta JS, mais lento)
    - Selenium (compatibilidade máxima)
    """
    import time

    start_time = time.time()

    try:
        logger.info(f"🕷️ Scraping: {request.url} (método: {request.approach})")

        # Escolher abordagem
        if request.approach == "auto":
            if request.javascript or request.screenshot or request.wait_for:
                approach = "playwright"
            else:
                approach = "requests"
        else:
            approach = request.approach

        # Executar scraping
        if approach == "playwright":
            result = await scrape_with_playwright(request)
        elif approach == "selenium":
            result = scrape_with_selenium(request)
        else:
            result = await scrape_with_requests(request)

        execution_time = time.time() - start_time

        return ScrapeResponse(
            success=True,
            url=request.url,
            data=result.get("data"),
            html=result.get("html"),
            text=result.get("text"),
            images=result.get("images"),
            links=result.get("links"),
            screenshot=result.get("screenshot"),
            method=approach,
            execution_time=execution_time,
        )

    except Exception as e:
        logger.error(f"❌ Erro no scraping: {str(e)}")
        execution_time = time.time() - start_time
        return ScrapeResponse(
            success=False,
            url=request.url,
            method=request.approach,
            error=str(e),
            execution_time=execution_time,
        )


@router.post("/scrape-products")
async def scrape_products(request: ProductScrapeRequest):
    """
    Scraping especializado em produtos de e-commerce

    Detecta automaticamente estruturas comuns de produtos
    """
    try:
        logger.info(f"🛍️ Scraping de produtos: {request.url}")

        products = []

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()

            await page.goto(request.url, wait_until="networkidle", timeout=30000)

            # Aguardar produtos carregarem
            await page.wait_for_timeout(2000)

            # Tentar detectar produtos automaticamente
            product_selectors = [
                ".product",
                ".product-item",
                ".product-card",
                "[data-product]",
                ".item",
                ".grid-item",
            ]

            product_elements = None
            for selector in product_selectors:
                elements = await page.query_selector_all(selector)
                if elements and len(elements) > 0:
                    product_elements = elements
                    logger.info(
                        f"✅ Encontrados {len(elements)} produtos com: {selector}"
                    )
                    break

            if product_elements:
                for element in product_elements[: request.max_products]:
                    product = await extract_product_data(element, page)
                    if product:
                        products.append(product)

            await browser.close()

        return {
            "success": True,
            "url": request.url,
            "total_products": len(products),
            "products": products,
        }

    except Exception as e:
        logger.error(f"❌ Erro ao extrair produtos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scrape-batch")
async def scrape_batch(urls: List[str], approach: str = "requests"):
    """
    Faz scraping de múltiplas URLs em batch

    Processamento paralelo para maior performance
    """
    try:
        logger.info(f"📦 Scraping em batch: {len(urls)} URLs")

        async def scrape_one(url: str):
            request = ScrapeRequest(url=url, approach=approach)
            return await scrape_website(request)

        # Processar em paralelo
        tasks = [scrape_one(url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        return {
            "success": True,
            "total": len(urls),
            "results": results,
        }

    except Exception as e:
        logger.error(f"❌ Erro no batch scraping: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# HELPER FUNCTIONS
# ==========================================


async def scrape_with_requests(request: ScrapeRequest) -> Dict[str, Any]:
    """Scraping com requests + BeautifulSoup (rápido, sem JS)"""

    headers = {
        "User-Agent": request.user_agent
        or "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }

    async with httpx.AsyncClient(timeout=request.timeout) as client:
        response = await client.get(request.url, headers=headers, follow_redirects=True)
        response.raise_for_status()

    html = response.text
    soup = BeautifulSoup(html, "lxml")

    # Extrair dados
    result = {"html": html, "text": soup.get_text(strip=True)}

    # Extrair dados com seletores customizados
    if request.selectors:
        data = {}
        for key, selector in request.selectors.items():
            elements = soup.select(selector)
            if elements:
                data[key] = [el.get_text(strip=True) for el in elements]
        result["data"] = data

    # Extrair imagens
    if request.extract_images:
        images = []
        for img in soup.find_all("img"):
            src = img.get("src") or img.get("data-src")
            if src:
                images.append(urljoin(request.url, src))
        result["images"] = images

    # Extrair links
    if request.extract_links:
        links = []
        for a in soup.find_all("a", href=True):
            href = a["href"]
            links.append(urljoin(request.url, href))
        result["links"] = links

    return result


async def scrape_with_playwright(request: ScrapeRequest) -> Dict[str, Any]:
    """Scraping com Playwright (suporta JavaScript)"""

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        context_options = {}
        if request.user_agent:
            context_options["user_agent"] = request.user_agent

        context = await browser.new_context(**context_options)
        page = await context.new_page()

        # Navegar
        await page.goto(
            request.url, wait_until="networkidle", timeout=request.timeout * 1000
        )

        # Aguardar elemento específico
        if request.wait_for:
            await page.wait_for_selector(
                request.wait_for, timeout=request.timeout * 1000
            )

        # Aguardar JS executar
        await page.wait_for_timeout(2000)

        # Extrair dados
        html = await page.content()
        text = await page.inner_text("body")

        result = {"html": html, "text": text}

        # Screenshot
        if request.screenshot:
            screenshot_bytes = await page.screenshot(full_page=True)
            screenshot_b64 = base64.b64encode(screenshot_bytes).decode()
            result["screenshot"] = screenshot_b64

        # Extrair com seletores
        if request.selectors:
            data = {}
            for key, selector in request.selectors.items():
                elements = await page.query_selector_all(selector)
                values = []
                for el in elements:
                    text = await el.inner_text()
                    values.append(text)
                data[key] = values
            result["data"] = data

        # Extrair imagens
        if request.extract_images:
            images = await page.evaluate(
                """() => {
                const imgs = Array.from(document.querySelectorAll('img'));
                return imgs.map(img => img.src || img.dataset.src).filter(Boolean);
            }"""
            )
            result["images"] = images

        # Extrair links
        if request.extract_links:
            links = await page.evaluate(
                """() => {
                const links = Array.from(document.querySelectorAll('a[href]'));
                return links.map(a => a.href);
            }"""
            )
            result["links"] = links

        await browser.close()

    return result


def scrape_with_selenium(request: ScrapeRequest) -> Dict[str, Any]:
    """Scraping com Selenium (compatibilidade máxima)"""

    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")

    if request.user_agent:
        chrome_options.add_argument(f"user-agent={request.user_agent}")

    driver = webdriver.Chrome(options=chrome_options)

    try:
        driver.get(request.url)

        # Aguardar elemento
        if request.wait_for:
            WebDriverWait(driver, request.timeout).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, request.wait_for))
            )

        html = driver.page_source
        text = driver.find_element(By.TAG_NAME, "body").text

        result = {"html": html, "text": text}

        # Screenshot
        if request.screenshot:
            screenshot_bytes = driver.get_screenshot_as_png()
            screenshot_b64 = base64.b64encode(screenshot_bytes).decode()
            result["screenshot"] = screenshot_b64

        return result

    finally:
        driver.quit()


async def extract_product_data(element, page) -> Optional[Dict[str, Any]]:
    """Extrai dados de um elemento de produto"""

    try:
        product = {}

        # Nome
        name_selectors = [".product-name", ".title", "h2", "h3", "[data-product-name]"]
        for selector in name_selectors:
            try:
                name_el = await element.query_selector(selector)
                if name_el:
                    product["name"] = await name_el.inner_text()
                    break
            except:
                continue

        # Preço
        price_selectors = [".price", ".product-price", "[data-price]", ".amount"]
        for selector in price_selectors:
            try:
                price_el = await element.query_selector(selector)
                if price_el:
                    product["price"] = await price_el.inner_text()
                    break
            except:
                continue

        # Imagem
        try:
            img_el = await element.query_selector("img")
            if img_el:
                src = await img_el.get_attribute("src") or await img_el.get_attribute(
                    "data-src"
                )
                product["image"] = src
        except:
            pass

        # Link
        try:
            link_el = await element.query_selector("a")
            if link_el:
                href = await link_el.get_attribute("href")
                if href:
                    product["link"] = href
        except:
            pass

        return product if product.get("name") else None

    except Exception as e:
        logger.error(f"❌ Erro ao extrair produto: {str(e)}")
        return None


# ==========================================
# UTILITY ENDPOINTS
# ==========================================


@router.get("/test")
async def test_scraping():
    """Endpoint de teste"""
    return {
        "status": "ok",
        "message": "Scraping router funcionando!",
        "available_methods": ["requests", "playwright", "selenium"],
    }
