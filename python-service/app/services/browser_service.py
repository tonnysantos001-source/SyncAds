"""
Browser Automation Service
Unified service for browser automation using Playwright
Supports: scraping, form filling, automated purchasing, store cloning
"""

import asyncio
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from playwright.async_api import async_playwright, Browser, Page, BrowserContext
from playwright.async_api import TimeoutError as PlaywrightTimeoutError
import random

logger = logging.getLogger(__name__)


class BrowserService:
    """
    Unified browser automation service using Playwright
    Handles all browser-based tasks with anti-detection measures
    """
    
    def __init__(self):
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.contexts: Dict[str, BrowserContext] = {}
        self.pages: Dict[str, Page] = {}
        
    async def initialize(self, headless: bool = True):
        """Initialize Playwright and browser"""
        if self.playwright is None:
            self.playwright = await async_playwright().start()
            
        if self.browser is None:
            self.browser = await self.playwright.chromium.launch(
                headless=headless,
                args=[
                    '--no-sandbox',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-dev-shm-usage',
                ]
            )
            logger.info("Browser initialized successfully")
            
    async def cleanup(self):
        """Cleanup all resources"""
        for page in self.pages.values():
            await page.close()
        for context in self.contexts.values():
            await context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
        logger.info("Browser cleanup completed")
        
    async def create_session(self, session_id: str, user_agent: Optional[str] = None) -> BrowserContext:
        """Create a new browser context (isolated session)"""
        await self.initialize()
        
        context = await self.browser.new_context(
            user_agent=user_agent or self._get_random_user_agent(),
            viewport={'width': 1920, 'height': 1080},
            locale='pt-BR',
            timezone_id='America/Sao_Paulo',
        )
        
        # Anti-detection: Override navigator properties
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5]
            });
        """)
        
        self.contexts[session_id] = context
        logger.info(f"Session created: {session_id}")
        return context
        
    async def navigate(self, session_id: str, url: str) -> Dict[str, Any]:
        """Navigate to URL"""
        context = await self._get_or_create_context(session_id)
        page = await context.new_page()
        self.pages[session_id] = page
        
        # Human-like delay before navigation
        await self._human_delay(0.5, 1.5)
        
        try:
            response = await page.goto(url, wait_until='networkidle', timeout=30000)
            
            return {
                'success': True,
                'url': page.url,
                'title': await page.title(),
                'status': response.status if response else None
            }
        except PlaywrightTimeoutError:
            logger.warning(f"Navigation timeout for {url}")
            return {
                'success': False,
                'error': 'Navigation timeout',
                'url': url
            }
            
    async def fill_form(self, session_id: str, form_data: Dict[str, Any], form_selector: Optional[str] = None) -> Dict[str, Any]:
        """
        Fill form with provided data
        
        Args:
            session_id: Browser session ID
            form_data: Dict with field selectors/names as keys and values to fill
            form_selector: Optional form element selector to scope the search
        """
        page = self.pages.get(session_id)
        if not page:
            return {'success': False, 'error': 'No active page'}
            
        filled_fields = []
        errors = []
        
        for field_identifier, value in form_data.items():
            try:
                # Try multiple ways to identify the field
                selectors = [
                    f'input[name="{field_identifier}"]',
                    f'input[id="{field_identifier}"]',
                    f'textarea[name="{field_identifier}"]',
                    f'select[name="{field_identifier}"]',
                    field_identifier  # In case it's already a CSS selector
                ]
                
                if form_selector:
                    selectors = [f'{form_selector} {s}' for s in selectors]
                
                field_found = False
                for selector in selectors:
                    try:
                        element = await page.wait_for_selector(selector, timeout=2000)
                        if element:
                            # Check element type
                            tag_name = await element.evaluate('el => el.tagName.toLowerCase()')
                            
                            if tag_name == 'select':
                                await element.select_option(value)
                            elif isinstance(value, bool):
                                # Checkbox/radio
                                if value:
                                    await element.check()
                                else:
                                    await element.uncheck()
                            else:
                                # Text input
                                await element.click()
                                await self._human_delay(0.1, 0.3)
                                await element.fill('')
                                await self._type_like_human(element, str(value))
                            
                            filled_fields.append(field_identifier)
                            field_found = True
                            break
                    except:
                        continue
                        
                if not field_found:
                    errors.append(f"Field not found: {field_identifier}")
                    
            except Exception as e:
                errors.append(f"Error filling {field_identifier}: {str(e)}")
                logger.error(f"Error filling field {field_identifier}: {e}")
        
        return {
            'success': len(filled_fields) > 0,
            'filled_fields': filled_fields,
            'errors': errors,
            'total_filled': len(filled_fields),
            'total_errors': len(errors)
        }
        
    async def click_element(self, session_id: str, selector: str) -> Dict[str, Any]:
        """Click an element"""
        page = self.pages.get(session_id)
        if not page:
            return {'success': False, 'error': 'No active page'}
            
        try:
            await page.wait_for_selector(selector, timeout=10000)
            await self._human_delay(0.3, 0.8)
            await page.click(selector)
            
            return {'success': True, 'selector': selector}
        except Exception as e:
            logger.error(f"Click failed: {e}")
            return {'success': False, 'error': str(e), 'selector': selector}
            
    async def extract_data(self, session_id: str, selectors: Dict[str, str]) -> Dict[str, Any]:
        """
        Extract data from page using selectors
        
        Args:
            session_id: Browser session ID
            selectors: Dict mapping data keys to CSS selectors
        """
        page = self.pages.get(session_id)
        if not page:
            return {'success': False, 'error': 'No active page'}
            
        extracted = {}
        
        for key, selector in selectors.items():
            try:
                element = await page.query_selector(selector)
                if element:
                    text = await element.inner_text()
                    extracted[key] = text.strip()
                else:
                    extracted[key] = None
            except Exception as e:
                logger.error(f"Extraction error for {key}: {e}")
                extracted[key] = None
                
        return {
            'success': True,
            'data': extracted,
            'url': page.url
        }
        
    async def screenshot(self, session_id: str, full_page: bool = False) -> Dict[str, Any]:
        """Take screenshot"""
        page = self.pages.get(session_id)
        if not page:
            return {'success': False, 'error': 'No active page'}
            
        try:
            screenshot_bytes = await page.screenshot(full_page=full_page, type='png')
            
            return {
                'success': True,
                'screenshot': screenshot_bytes,
                'format': 'png',
                'full_page': full_page
            }
        except Exception as e:
            logger.error(f"Screenshot failed: {e}")
            return {'success': False, 'error': str(e)}
            
    async def scrape_products(self, session_id: str, product_selectors: Dict[str, str]) -> Dict[str, Any]:
        """
        Scrape products from e-commerce page
        
        Args:
            session_id: Browser session ID
            product_selectors: Dict with selectors for product container and fields
                Example: {
                    'container': '.product-item',
                    'name': '.product-name',
                    'price': '.product-price',
                    'image': 'img',
                    'link': 'a'
                }
        """
        page = self.pages.get(session_id)
        if not page:
            return {'success': False, 'error': 'No active page'}
            
        try:
            container_selector = product_selectors.get('container', '.product')
            products = await page.query_selector_all(container_selector)
            
            scraped_products = []
            
            for product in products:
                product_data = {}
                
                for field, selector in product_selectors.items():
                    if field == 'container':
                        continue
                        
                    try:
                        if field == 'image':
                            img = await product.query_selector(selector)
                            if img:
                                product_data['image'] = await img.get_attribute('src')
                        elif field == 'link':
                            link = await product.query_selector(selector)
                            if link:
                                product_data['url'] = await link.get_attribute('href')
                        else:
                            element = await product.query_selector(selector)
                            if element:
                                product_data[field] = (await element.inner_text()).strip()
                    except:
                        product_data[field] = None
                        
                if product_data:
                    scraped_products.append(product_data)
                    
            return {
                'success': True,
                'products': scraped_products,
                'count': len(scraped_products),
                'url': page.url
            }
            
        except Exception as e:
            logger.error(f"Product scraping failed: {e}")
            return {'success': False, 'error': str(e)}
            
    async def detect_checkout_form(self, session_id: str) -> Dict[str, Any]:
        """
        Detect checkout/payment form on current page
        Returns detected fields and their selectors
        """
        page = self.pages.get(session_id)
        if not page:
            return {'success': False, 'error': 'No active page'}
            
        try:
            # Common checkout form field patterns
            field_patterns = {
                'card_number': [
                    'input[name*="card"][name*="number"]',
                    'input[id*="card"][id*="number"]',
                    'input[autocomplete="cc-number"]',
                    'input[placeholder*="card"]',
                ],
                'expiry': [
                    'input[name*="expir"]',
                    'input[autocomplete="cc-exp"]',
                    'input[placeholder*="MM/YY"]',
                ],
                'cvv': [
                    'input[name*="cvv"]',
                    'input[name*="cvc"]',
                    'input[autocomplete="cc-csc"]',
                ],
                'name': [
                    'input[name*="name"][name*="card"]',
                    'input[autocomplete="cc-name"]',
                ],
                'email': [
                    'input[type="email"]',
                    'input[name*="email"]',
                ],
                'address': [
                    'input[name*="address"]',
                    'input[autocomplete="street-address"]',
                ],
                'city': [
                    'input[name*="city"]',
                    'input[autocomplete="address-level2"]',
                ],
                'zip': [
                    'input[name*="zip"]',
                    'input[name*="postal"]',
                    'input[autocomplete="postal-code"]',
                ]
            }
            
            detected_fields = {}
            
            for field_name, selectors in field_patterns.items():
                for selector in selectors:
                    try:
                        element = await page.query_selector(selector)
                        if element:
                            detected_fields[field_name] = {
                                'selector': selector,
                                'type': await element.get_attribute('type'),
                                'placeholder': await element.get_attribute('placeholder'),
                                'required': await element.get_attribute('required') is not None
                            }
                            break
                    except:
                        continue
                        
            is_checkout = len(detected_fields) >= 3  # At least 3 payment fields detected
            
            return {
                'success': True,
                'is_checkout_page': is_checkout,
                'detected_fields': detected_fields,
                'field_count': len(detected_fields),
                'url': page.url
            }
            
        except Exception as e:
            logger.error(f"Form detection failed: {e}")
            return {'success': False, 'error': str(e)}
            
    async def _get_or_create_context(self, session_id: str) -> BrowserContext:
        """Get existing context or create new one"""
        if session_id not in self.contexts:
            await self.create_session(session_id)
        return self.contexts[session_id]
        
    async def _human_delay(self, min_seconds: float = 0.1, max_seconds: float = 0.5):
        """Simulate human-like delay"""
        delay = random.uniform(min_seconds, max_seconds)
        await asyncio.sleep(delay)
        
    async def _type_like_human(self, element, text: str):
        """Type text with human-like delays"""
        for char in text:
            await element.type(char)
            await asyncio.sleep(random.uniform(0.05, 0.15))
            
    def _get_random_user_agent(self) -> str:
        """Get random user agent for anti-detection"""
        user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ]
        return random.choice(user_agents)
        

# Singleton instance
browser_service = BrowserService()
