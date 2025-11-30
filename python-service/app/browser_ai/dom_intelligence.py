"""
DOM Intelligence - Análise inteligente de estrutura DOM
Detecta automaticamente tipos de páginas, formulários, componentes e padrões
"""

import logging
import re
from typing import Any, Dict, List, Literal, Optional, Set, Tuple

try:
    from playwright.async_api import Page
except ImportError as e:
    logging.warning(f"Playwright not installed: {e}")

logger = logging.getLogger(__name__)


class DOMIntelligence:
    """
    Analisador inteligente de DOM

    Capacidades:
    - Detectar tipo de página (e-commerce, blog, form, search, etc)
    - Analisar formulários e campos
    - Identificar componentes (navbar, footer, sidebar, etc)
    - Detectar padrões de UI (modais, carrosséis, tabs, etc)
    - Extrair metadados e estrutura semântica
    """

    def __init__(self):
        self.page_type_patterns = self._init_page_patterns()
        self.form_field_patterns = self._init_field_patterns()
        logger.info("DOMIntelligence initialized")

    def _init_page_patterns(self) -> Dict[str, List[str]]:
        """Padrões para detectar tipo de página"""
        return {
            "ecommerce": [
                r"add.?to.?cart",
                r"buy.?now",
                r"product",
                r"price",
                r"checkout",
                r"shopping.?cart",
                r"add.?to.?bag",
            ],
            "blog": [
                r"article",
                r"post",
                r"blog",
                r"comment",
                r"author",
                r"published",
                r"category",
            ],
            "social": [
                r"timeline",
                r"feed",
                r"share",
                r"like",
                r"follow",
                r"post",
                r"comment",
                r"profile",
            ],
            "search": [
                r"search",
                r"results?",
                r"filter",
                r"sort",
                r"found.*items?",
                r"showing.*of",
            ],
            "dashboard": [
                r"dashboard",
                r"analytics",
                r"stats",
                r"overview",
                r"metrics",
                r"reports?",
            ],
            "auth": [
                r"login",
                r"sign.?in",
                r"sign.?up",
                r"register",
                r"password",
                r"forgot.?password",
                r"authentication",
            ],
            "form": [
                r"form",
                r"submit",
                r"contact",
                r"inquiry",
                r"application",
                r"registration",
            ],
        }

    def _init_field_patterns(self) -> Dict[str, List[str]]:
        """Padrões para detectar tipos de campos"""
        return {
            "email": [r"email", r"e-mail", r"mail", r"@"],
            "password": [r"password", r"senha", r"pass", r"pwd"],
            "name": [
                r"name",
                r"nome",
                r"full.?name",
                r"first.?name",
                r"last.?name",
                r"username",
                r"user.?name",
            ],
            "phone": [
                r"phone",
                r"telefone",
                r"tel",
                r"mobile",
                r"celular",
                r"whatsapp",
            ],
            "address": [
                r"address",
                r"endereço",
                r"street",
                r"rua",
                r"city",
                r"cidade",
                r"state",
                r"estado",
                r"zip",
                r"cep",
                r"postal",
            ],
            "date": [
                r"date",
                r"data",
                r"birth",
                r"nascimento",
                r"day",
                r"month",
                r"year",
                r"dia",
                r"mes",
                r"ano",
            ],
            "cpf": [r"cpf", r"document", r"documento", r"tax.?id"],
            "cnpj": [r"cnpj", r"company.?id"],
            "credit_card": [
                r"card",
                r"cartão",
                r"credit",
                r"debit",
                r"card.?number",
                r"cvv",
                r"expir",
            ],
        }

    async def analyze_page(self, page: Page) -> Dict[str, Any]:
        """
        Análise completa da página

        Returns:
            {
                'page_type': str,
                'confidence': float,
                'url': str,
                'title': str,
                'has_forms': bool,
                'form_count': int,
                'has_search': bool,
                'has_auth': bool,
                'components': List[str],
                'main_content_selector': str,
                'metadata': Dict
            }
        """
        try:
            logger.info(f"Analyzing page: {page.url}")

            # Informações básicas
            url = page.url
            title = await page.title()

            # Análise de conteúdo
            page_html = await page.content()
            page_text = await page.evaluate("document.body.innerText")

            # Detectar tipo de página
            page_type, confidence = await self._detect_page_type(
                page, page_html, page_text
            )

            # Análise de formulários
            forms = await self._analyze_forms_on_page(page)

            # Detectar componentes
            components = await self._detect_components(page)

            # Metadados
            metadata = await self._extract_metadata(page)

            # Selector do conteúdo principal
            main_content = await self._find_main_content_selector(page)

            result = {
                "page_type": page_type,
                "confidence": confidence,
                "url": url,
                "title": title,
                "has_forms": len(forms) > 0,
                "form_count": len(forms),
                "has_search": await self._has_search(page),
                "has_auth": page_type == "auth" or "login" in components,
                "components": components,
                "main_content_selector": main_content,
                "metadata": metadata,
                "forms_summary": [
                    {"id": f.get("id"), "field_count": len(f.get("fields", []))}
                    for f in forms
                ],
            }

            logger.info(
                f"Page analysis complete: type={page_type}, confidence={confidence:.2f}"
            )
            return result

        except Exception as e:
            logger.error(f"Page analysis failed: {e}")
            return {"page_type": "unknown", "confidence": 0.0, "error": str(e)}

    async def analyze_form(
        self, page: Page, form_selector: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analisa formulário específico ou primeiro formulário da página

        Returns:
            {
                'id': str,
                'action': str,
                'method': str,
                'field_count': int,
                'fields': List[Dict],
                'submit_buttons': List[Dict],
                'validation_rules': Dict
            }
        """
        try:
            # Se não especificou seletor, pegar primeiro form
            if not form_selector:
                form_selector = "form"

            form = await page.query_selector(form_selector)
            if not form:
                return {"error": "Form not found", "selector": form_selector}

            # Informações do form
            form_id = await form.get_attribute("id") or "form_unnamed"
            form_action = await form.get_attribute("action") or ""
            form_method = await form.get_attribute("method") or "POST"

            # Analisar campos
            fields = await self._analyze_form_fields(page, form_selector)

            # Encontrar botões submit
            submit_buttons = await self._find_submit_buttons(page, form_selector)

            # Regras de validação
            validation_rules = self._extract_validation_rules(fields)

            result = {
                "id": form_id,
                "action": form_action,
                "method": form_method,
                "field_count": len(fields),
                "fields": fields,
                "submit_buttons": submit_buttons,
                "validation_rules": validation_rules,
                "is_login_form": self._is_login_form(fields),
                "is_signup_form": self._is_signup_form(fields),
                "is_checkout_form": self._is_checkout_form(fields),
            }

            logger.info(f"Form analysis complete: {form_id} with {len(fields)} fields")
            return result

        except Exception as e:
            logger.error(f"Form analysis failed: {e}")
            return {"error": str(e)}

    async def _analyze_forms_on_page(self, page: Page) -> List[Dict[str, Any]]:
        """Analisa todos os formulários da página"""
        forms = []
        try:
            form_count = await page.locator("form").count()

            for i in range(min(form_count, 10)):  # Limite de 10 forms
                form_analysis = await self.analyze_form(
                    page, f"form:nth-of-type({i + 1})"
                )
                if "error" not in form_analysis:
                    forms.append(form_analysis)

            return forms
        except Exception as e:
            logger.error(f"Forms analysis failed: {e}")
            return []

    async def _analyze_form_fields(
        self, page: Page, form_selector: str
    ) -> List[Dict[str, Any]]:
        """Analisa campos de um formulário"""
        fields = []

        try:
            # Inputs
            inputs = await page.locator(f"{form_selector} input").all()
            for input_elem in inputs:
                field = await self._extract_field_info(input_elem, "input")
                if field:
                    fields.append(field)

            # Textareas
            textareas = await page.locator(f"{form_selector} textarea").all()
            for textarea in textareas:
                field = await self._extract_field_info(textarea, "textarea")
                if field:
                    fields.append(field)

            # Selects
            selects = await page.locator(f"{form_selector} select").all()
            for select in selects:
                field = await self._extract_field_info(select, "select")
                if field:
                    fields.append(field)

            return fields

        except Exception as e:
            logger.error(f"Field analysis failed: {e}")
            return []

    async def _extract_field_info(
        self, element, tag_type: str
    ) -> Optional[Dict[str, Any]]:
        """Extrai informações de um campo"""
        try:
            field_type = await element.get_attribute("type") or tag_type
            field_name = await element.get_attribute("name") or ""
            field_id = await element.get_attribute("id") or ""
            placeholder = await element.get_attribute("placeholder") or ""
            required = await element.get_attribute("required") is not None
            pattern = await element.get_attribute("pattern") or ""
            maxlength = await element.get_attribute("maxlength") or ""

            # Detectar tipo semântico
            semantic_type = self._detect_field_semantic_type(
                field_name, field_id, placeholder, field_type
            )

            # Gerar seletor
            selector = f"#{field_id}" if field_id else f"[name='{field_name}']"

            return {
                "tag": tag_type,
                "type": field_type,
                "name": field_name,
                "id": field_id,
                "placeholder": placeholder,
                "required": required,
                "pattern": pattern,
                "maxlength": maxlength,
                "semantic_type": semantic_type,
                "selector": selector,
            }
        except Exception as e:
            logger.error(f"Field info extraction failed: {e}")
            return None

    def _detect_field_semantic_type(
        self, name: str, field_id: str, placeholder: str, field_type: str
    ) -> str:
        """Detecta tipo semântico do campo"""

        combined = f"{name} {field_id} {placeholder} {field_type}".lower()

        for semantic_type, patterns in self.form_field_patterns.items():
            for pattern in patterns:
                if re.search(pattern, combined, re.IGNORECASE):
                    return semantic_type

        return field_type

    async def _find_submit_buttons(
        self, page: Page, form_selector: str
    ) -> List[Dict[str, Any]]:
        """Encontra botões de submit do formulário"""
        buttons = []

        try:
            # Button type=submit
            submit_buttons = await page.locator(
                f"{form_selector} button[type='submit'], {form_selector} input[type='submit']"
            ).all()

            for btn in submit_buttons:
                text = (
                    await btn.inner_text()
                    if await btn.evaluate("el => el.tagName") == "BUTTON"
                    else await btn.get_attribute("value")
                )
                buttons.append({"text": text or "Submit", "type": "submit"})

            return buttons

        except Exception as e:
            logger.error(f"Submit button search failed: {e}")
            return []

    def _extract_validation_rules(self, fields: List[Dict]) -> Dict[str, Any]:
        """Extrai regras de validação dos campos"""
        rules = {}

        for field in fields:
            field_name = field.get("name") or field.get("id")
            if not field_name:
                continue

            field_rules = {}

            if field.get("required"):
                field_rules["required"] = True

            if field.get("pattern"):
                field_rules["pattern"] = field["pattern"]

            if field.get("maxlength"):
                field_rules["maxlength"] = field["maxlength"]

            if field.get("type") == "email":
                field_rules["format"] = "email"

            if field.get("semantic_type") == "cpf":
                field_rules["format"] = "cpf"
                field_rules["length"] = 11

            if field.get("semantic_type") == "phone":
                field_rules["format"] = "phone"

            if field_rules:
                rules[field_name] = field_rules

        return rules

    def _is_login_form(self, fields: List[Dict]) -> bool:
        """Verifica se é formulário de login"""
        has_email_or_username = False
        has_password = False

        for field in fields:
            semantic = field.get("semantic_type", "")
            if semantic in ["email", "name"]:
                has_email_or_username = True
            if semantic == "password":
                has_password = True

        return has_email_or_username and has_password and len(fields) <= 5

    def _is_signup_form(self, fields: List[Dict]) -> bool:
        """Verifica se é formulário de cadastro"""
        has_name = False
        has_email = False
        has_password = False

        for field in fields:
            semantic = field.get("semantic_type", "")
            if semantic == "name":
                has_name = True
            if semantic == "email":
                has_email = True
            if semantic == "password":
                has_password = True

        return has_name and has_email and has_password

    def _is_checkout_form(self, fields: List[Dict]) -> bool:
        """Verifica se é formulário de checkout"""
        has_payment = False
        has_address = False

        for field in fields:
            semantic = field.get("semantic_type", "")
            if semantic in ["credit_card"]:
                has_payment = True
            if semantic in ["address"]:
                has_address = True

        return has_payment or (has_address and len(fields) > 5)

    async def _detect_page_type(
        self, page: Page, html: str, text: str
    ) -> Tuple[str, float]:
        """Detecta tipo da página com score de confiança"""

        scores = {}
        html_lower = html.lower()
        text_lower = text.lower()

        for page_type, patterns in self.page_type_patterns.items():
            score = 0
            for pattern in patterns:
                # Buscar no HTML
                html_matches = len(re.findall(pattern, html_lower, re.IGNORECASE))
                # Buscar no texto visível
                text_matches = len(re.findall(pattern, text_lower, re.IGNORECASE))

                score += html_matches + (
                    text_matches * 2
                )  # Texto visível tem mais peso

            scores[page_type] = score

        # Encontrar tipo com maior score
        if not scores or max(scores.values()) == 0:
            return "unknown", 0.0

        best_type = max(scores, key=scores.get)
        max_score = scores[best_type]
        total_score = sum(scores.values())

        confidence = min(max_score / (total_score + 1), 1.0)

        return best_type, confidence

    async def _detect_components(self, page: Page) -> List[str]:
        """Detecta componentes comuns da página"""
        components = []

        component_selectors = {
            "navbar": [
                "nav",
                "header nav",
                "[role='navigation']",
                ".navbar",
                "#navbar",
            ],
            "footer": ["footer", ".footer", "#footer"],
            "sidebar": ["aside", ".sidebar", "#sidebar", "[role='complementary']"],
            "modal": [".modal", "[role='dialog']", ".popup"],
            "carousel": [".carousel", ".slider", "[data-carousel]"],
            "tabs": ["[role='tablist']", ".tabs", ".tab-container"],
            "accordion": [".accordion", "[data-accordion]"],
            "pagination": [".pagination", "[role='navigation'][aria-label*='page']"],
            "breadcrumb": ["[aria-label='breadcrumb']", ".breadcrumb"],
            "search": ["[type='search']", "[role='search']", ".search-form"],
            "login": [".login", "#login", "[data-login]"],
        }

        for component_name, selectors in component_selectors.items():
            for selector in selectors:
                try:
                    count = await page.locator(selector).count()
                    if count > 0:
                        components.append(component_name)
                        break  # Encontrou, não precisa testar outros seletores
                except:
                    continue

        return list(set(components))  # Remove duplicatas

    async def _has_search(self, page: Page) -> bool:
        """Verifica se página tem busca"""
        try:
            search_count = await page.locator(
                "input[type='search'], [role='search'], .search-input, #search"
            ).count()
            return search_count > 0
        except:
            return False

    async def _extract_metadata(self, page: Page) -> Dict[str, Any]:
        """Extrai metadados da página"""
        metadata = {}

        try:
            # Meta tags
            meta_tags = await page.locator("meta").all()
            for meta in meta_tags[:20]:  # Limite de 20
                name = await meta.get_attribute("name") or await meta.get_attribute(
                    "property"
                )
                content = await meta.get_attribute("content")
                if name and content:
                    metadata[name] = content

            # Open Graph
            og_title = (
                await page.locator("meta[property='og:title']").get_attribute("content")
                or ""
            )
            og_desc = (
                await page.locator("meta[property='og:description']").get_attribute(
                    "content"
                )
                or ""
            )

            if og_title:
                metadata["og_title"] = og_title
            if og_desc:
                metadata["og_description"] = og_desc

            return metadata

        except Exception as e:
            logger.error(f"Metadata extraction failed: {e}")
            return {}

    async def _find_main_content_selector(self, page: Page) -> str:
        """Encontra seletor do conteúdo principal"""
        candidates = [
            "main",
            "[role='main']",
            "#main",
            ".main-content",
            "#content",
            ".content",
            "article",
            "#main-content",
        ]

        for selector in candidates:
            try:
                count = await page.locator(selector).count()
                if count > 0:
                    return selector
            except:
                continue

        return "body"  # Fallback

    async def suggest_selectors_for_action(
        self, page: Page, action: str, context: str = ""
    ) -> List[Dict[str, Any]]:
        """
        Sugere seletores para uma ação específica

        Args:
            action: Tipo de ação (click, fill, hover, etc)
            context: Contexto adicional (ex: "login button", "search input")

        Returns:
            Lista de seletores sugeridos com score
        """
        suggestions = []

        try:
            context_lower = context.lower()

            # Padrões baseados no contexto
            if "login" in context_lower or "sign in" in context_lower:
                suggestions.extend(
                    [
                        {
                            "selector": "button[type='submit']",
                            "score": 0.9,
                            "reason": "Submit button in form",
                        },
                        {
                            "selector": ".login-button",
                            "score": 0.8,
                            "reason": "Common login button class",
                        },
                        {
                            "selector": "#login-btn",
                            "score": 0.8,
                            "reason": "Common login button ID",
                        },
                    ]
                )

            elif "search" in context_lower:
                suggestions.extend(
                    [
                        {
                            "selector": "input[type='search']",
                            "score": 0.9,
                            "reason": "Search input type",
                        },
                        {
                            "selector": "[role='search'] input",
                            "score": 0.8,
                            "reason": "Input in search role",
                        },
                        {
                            "selector": ".search-input",
                            "score": 0.7,
                            "reason": "Common search class",
                        },
                    ]
                )

            elif "submit" in context_lower or "send" in context_lower:
                suggestions.extend(
                    [
                        {
                            "selector": "button[type='submit']",
                            "score": 0.9,
                            "reason": "Submit button",
                        },
                        {
                            "selector": "input[type='submit']",
                            "score": 0.8,
                            "reason": "Submit input",
                        },
                    ]
                )

            # Ordenar por score
            suggestions.sort(key=lambda x: x["score"], reverse=True)

            return suggestions[:5]  # Top 5

        except Exception as e:
            logger.error(f"Selector suggestion failed: {e}")
            return []


# Helper functions para uso rápido


async def analyze_page_quick(page: Page) -> Dict[str, Any]:
    """
    Análise rápida de página

    Exemplo:
    >>> info = await analyze_page_quick(page)
    >>> print(f"Tipo: {info['page_type']}")
    """
    intelligence = DOMIntelligence()
    return await intelligence.analyze_page(page)


async def get_form_fields(page: Page) -> List[Dict[str, Any]]:
    """
    Obtém campos do primeiro formulário

    Exemplo:
    >>> fields = await get_form_fields(page)
    >>> for field in fields:
    ...     print(f"{field['name']}: {field['semantic_type']}")
    """
    intelligence = DOMIntelligence()
    form_info = await intelligence.analyze_form(page)
    return form_info.get("fields", [])


async def is_login_page(page: Page) -> bool:
    """
    Verifica se é página de login

    Exemplo:
    >>> if await is_login_page(page):
    ...     print("É uma página de login!")
    """
    intelligence = DOMIntelligence()
    analysis = await intelligence.analyze_page(page)
    return analysis.get("page_type") == "auth" or analysis.get("has_auth", False)
