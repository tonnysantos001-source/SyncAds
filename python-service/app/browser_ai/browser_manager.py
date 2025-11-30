"""
Browser AI Manager - Orquestrador Principal de Automação Web com IA
Integra Browser-Use, Playwright, AgentQL e Vision AI para automação inteligente
"""

import asyncio
import json
import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

try:
    import agentql
    from browser_use import Agent
    from browser_use import Browser as BrowserUse
    from playwright.async_api import Browser, BrowserContext, Page, async_playwright
except ImportError as e:
    logging.warning(f"Browser automation libraries not fully installed: {e}")

from .agentql_helper import AgentQLHelper
from .dom_intelligence import DOMIntelligence
from .vision_selector import VisionElementSelector

logger = logging.getLogger(__name__)


@dataclass
class BrowserSession:
    """Representa uma sessão ativa de automação"""

    session_id: str
    browser: Optional[Browser] = None
    context: Optional[BrowserContext] = None
    page: Optional[Page] = None
    agent: Optional[Any] = None
    created_at: datetime = None
    last_activity: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()
        if self.last_activity is None:
            self.last_activity = datetime.utcnow()


class BrowserAIManager:
    """
    Gerenciador principal de automação web com IA

    Capacidades:
    - Automação com Browser-Use (natural language)
    - Playwright para tarefas precisas
    - AgentQL para seletores semânticos
    - Vision AI para identificação visual de elementos
    - Multi-tab e multi-context support
    """

    def __init__(
        self,
        llm_provider: Literal["anthropic", "openai", "groq"] = "anthropic",
        api_key: Optional[str] = None,
        headless: bool = True,
        enable_vision: bool = True,
        enable_agentql: bool = True,
    ):
        self.llm_provider = llm_provider
        self.api_key = api_key
        self.headless = headless
        self.enable_vision = enable_vision
        self.enable_agentql = enable_agentql

        # Sessões ativas
        self.sessions: Dict[str, BrowserSession] = {}

        # Componentes auxiliares
        self.vision_selector = VisionElementSelector() if enable_vision else None
        self.agentql_helper = AgentQLHelper() if enable_agentql else None
        self.dom_intelligence = DOMIntelligence()

        logger.info(
            f"BrowserAIManager initialized - LLM: {llm_provider}, Headless: {headless}"
        )

    async def create_session(
        self,
        session_id: str,
        user_agent: Optional[str] = None,
        viewport: Optional[Dict[str, int]] = None,
        proxy: Optional[Dict[str, str]] = None,
    ) -> BrowserSession:
        """
        Cria uma nova sessão de automação
        """
        if session_id in self.sessions:
            logger.warning(f"Session {session_id} already exists, returning existing")
            return self.sessions[session_id]

        try:
            playwright = await async_playwright().start()

            # Launch browser
            browser = await playwright.chromium.launch(
                headless=self.headless,
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                ],
            )

            # Create context with stealth settings
            context_options = {
                "viewport": viewport or {"width": 1920, "height": 1080},
                "user_agent": user_agent
                or "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "locale": "pt-BR",
                "timezone_id": "America/Sao_Paulo",
            }

            if proxy:
                context_options["proxy"] = proxy

            context = await browser.new_context(**context_options)

            # Create page
            page = await context.new_page()

            # Inject stealth scripts
            await self._inject_stealth(page)

            # Create session object
            session = BrowserSession(
                session_id=session_id, browser=browser, context=context, page=page
            )

            self.sessions[session_id] = session

            logger.info(f"Created browser session: {session_id}")
            return session

        except Exception as e:
            logger.error(f"Failed to create session {session_id}: {e}")
            raise

    async def _inject_stealth(self, page: Page):
        """Injeta scripts de evasão de detecção"""
        await page.add_init_script("""
            // Remover indicadores de webdriver
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });

            // Adicionar chrome object
            window.chrome = {
                runtime: {}
            };

            // Randomizar plugins
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5]
            });

            // Randomizar languages
            Object.defineProperty(navigator, 'languages', {
                get: () => ['pt-BR', 'pt', 'en-US', 'en']
            });
        """)

    async def execute_natural_language_task(
        self,
        session_id: str,
        task: str,
        url: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Executa uma tarefa em linguagem natural usando Browser-Use

        Exemplos:
        - "Pesquise por 'sapatos esportivos' no Google e extraia os primeiros 5 resultados"
        - "Preencha o formulário de contato com os dados fornecidos"
        - "Encontre o botão de adicionar ao carrinho e clique nele"
        """
        session = await self._get_or_create_session(session_id)

        try:
            logger.info(f"Executing natural language task: {task}")

            # Se URL fornecida, navegar primeiro
            if url:
                await session.page.goto(url, wait_until="networkidle")

            # Criar agente Browser-Use se não existir
            if not session.agent:
                session.agent = Agent(
                    task=task,
                    llm_provider=self.llm_provider,
                    llm_api_key=self.api_key,
                    browser=session.browser,
                    use_vision=self.enable_vision,
                )
            else:
                # Atualizar tarefa
                session.agent.task = task

            # Executar tarefa
            result = await session.agent.run()

            # Atualizar última atividade
            session.last_activity = datetime.utcnow()

            return {
                "success": True,
                "result": result,
                "task": task,
                "timestamp": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error(f"Failed to execute task: {e}")
            return {
                "success": False,
                "error": str(e),
                "task": task,
                "timestamp": datetime.utcnow().isoformat(),
            }

    async def execute_agentql_query(
        self,
        session_id: str,
        query: str,
        action: Literal["extract", "interact"] = "extract",
    ) -> Dict[str, Any]:
        """
        Executa query AgentQL para seleção semântica de elementos

        Exemplos de queries:
        - "{ search_input search_button }" - encontrar elementos de busca
        - "{ products[] { name price(integer) description } }" - extrair produtos
        """
        if not self.enable_agentql:
            return {"success": False, "error": "AgentQL not enabled"}

        session = await self._get_or_create_session(session_id)

        try:
            if action == "extract":
                result = await self.agentql_helper.query_data(session.page, query)
            else:
                result = await self.agentql_helper.query_elements(session.page, query)

            session.last_activity = datetime.utcnow()

            return {"success": True, "result": result, "query": query, "action": action}

        except Exception as e:
            logger.error(f"AgentQL query failed: {e}")
            return {"success": False, "error": str(e), "query": query}

    async def find_element_by_vision(
        self, session_id: str, description: str, action: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Encontra elemento usando visão computacional

        Args:
            description: Descrição visual do elemento (ex: "botão azul com texto Login")
            action: Ação opcional a executar (click, fill, etc)
        """
        if not self.enable_vision:
            return {"success": False, "error": "Vision AI not enabled"}

        session = await self._get_or_create_session(session_id)

        try:
            # Capturar screenshot da página
            screenshot = await session.page.screenshot()

            # Usar Vision AI para identificar elemento
            element_location = await self.vision_selector.find_element(
                screenshot, description, self.llm_provider, self.api_key
            )

            if element_location and action:
                # Executar ação no elemento encontrado
                result = await self._execute_action_at_location(
                    session.page, element_location, action
                )

                return {
                    "success": True,
                    "element_found": True,
                    "location": element_location,
                    "action_executed": True,
                    "action_result": result,
                }

            return {
                "success": True,
                "element_found": bool(element_location),
                "location": element_location,
            }

        except Exception as e:
            logger.error(f"Vision-based element search failed: {e}")
            return {"success": False, "error": str(e)}

    async def intelligent_form_fill(
        self, session_id: str, form_data: Dict[str, Any], use_ai_mapping: bool = True
    ) -> Dict[str, Any]:
        """
        Preenche formulário inteligentemente mapeando campos automaticamente
        """
        session = await self._get_or_create_session(session_id)

        try:
            # Detectar campos do formulário
            form_analysis = await self.dom_intelligence.analyze_form(session.page)

            if use_ai_mapping:
                # Usar IA para mapear dados aos campos corretos
                field_mapping = await self._ai_map_form_fields(
                    form_analysis["fields"], form_data
                )
            else:
                # Mapeamento direto por nome
                field_mapping = self._direct_map_form_fields(
                    form_analysis["fields"], form_data
                )

            # Preencher campos
            filled_fields = []
            for field_selector, value in field_mapping.items():
                try:
                    await session.page.fill(field_selector, str(value))
                    filled_fields.append(field_selector)
                except Exception as e:
                    logger.warning(f"Failed to fill field {field_selector}: {e}")

            return {
                "success": True,
                "filled_fields": len(filled_fields),
                "total_fields": len(field_mapping),
                "form_analysis": form_analysis,
            }

        except Exception as e:
            logger.error(f"Intelligent form fill failed: {e}")
            return {"success": False, "error": str(e)}

    async def create_ad_campaign(
        self,
        session_id: str,
        platform: Literal["facebook", "google", "linkedin"],
        campaign_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Cria campanha de anúncios em plataforma específica
        """
        session = await self._get_or_create_session(session_id)

        # URLs das plataformas
        platform_urls = {
            "facebook": "https://business.facebook.com/adsmanager/creation",
            "google": "https://ads.google.com/aw/campaigns",
            "linkedin": "https://www.linkedin.com/campaignmanager/accounts",
        }

        try:
            # Navegar para a plataforma
            await session.page.goto(platform_urls[platform])

            # Criar tarefa em linguagem natural
            task = self._generate_ad_creation_task(platform, campaign_data)

            # Executar com Browser-Use
            result = await self.execute_natural_language_task(
                session_id, task, context={"platform": platform, "data": campaign_data}
            )

            return result

        except Exception as e:
            logger.error(f"Ad campaign creation failed: {e}")
            return {"success": False, "error": str(e), "platform": platform}

    def _generate_ad_creation_task(
        self, platform: str, campaign_data: Dict[str, Any]
    ) -> str:
        """Gera instrução em linguagem natural para criar anúncio"""

        templates = {
            "facebook": f"""
                Criar uma nova campanha no Facebook Ads Manager com os seguintes detalhes:
                - Nome da campanha: {campaign_data.get("name", "Nova Campanha")}
                - Objetivo: {campaign_data.get("objective", "Conversões")}
                - Orçamento diário: R$ {campaign_data.get("budget", 100)}
                - Público-alvo: {campaign_data.get("audience", "Brasil, 18-65 anos")}
                - Posicionamento: {campaign_data.get("placements", "Automático")}

                Siga o fluxo de criação até salvar como rascunho.
            """,
            "google": f"""
                Criar uma nova campanha no Google Ads com:
                - Nome: {campaign_data.get("name", "Nova Campanha")}
                - Tipo: {campaign_data.get("type", "Pesquisa")}
                - Orçamento diário: R$ {campaign_data.get("budget", 100)}
                - Palavras-chave: {", ".join(campaign_data.get("keywords", []))}
                - Público: {campaign_data.get("audience", "Brasil")}
            """,
            "linkedin": f"""
                Criar campanha no LinkedIn Campaign Manager:
                - Nome: {campaign_data.get("name", "Nova Campanha")}
                - Objetivo: {campaign_data.get("objective", "Geração de Leads")}
                - Orçamento: R$ {campaign_data.get("budget", 100)}/dia
                - Segmentação: {campaign_data.get("targeting", "Profissionais no Brasil")}
            """,
        }

        return templates.get(platform, "").strip()

    async def _execute_action_at_location(
        self, page: Page, location: Dict[str, int], action: str
    ):
        """Executa ação em coordenadas específicas"""
        x, y = location.get("x", 0), location.get("y", 0)

        if action == "click":
            await page.mouse.click(x, y)
        elif action == "hover":
            await page.mouse.move(x, y)
        elif action == "right_click":
            await page.mouse.click(x, y, button="right")

        return {"x": x, "y": y, "action": action}

    async def _ai_map_form_fields(
        self, fields: List[Dict], form_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Usa IA para mapear dados aos campos corretos"""
        # TODO: Implementar com LLM para mapeamento inteligente
        # Por enquanto, usa mapeamento direto
        return self._direct_map_form_fields(fields, form_data)

    def _direct_map_form_fields(
        self, fields: List[Dict], form_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Mapeamento direto de campos por nome/id"""
        mapping = {}

        for field in fields:
            field_name = field.get("name", "").lower()
            field_id = field.get("id", "").lower()
            field_selector = field.get("selector", "")

            # Tentar encontrar correspondência nos dados
            for key, value in form_data.items():
                if key.lower() in field_name or key.lower() in field_id:
                    mapping[field_selector] = value
                    break

        return mapping

    async def _get_or_create_session(self, session_id: str) -> BrowserSession:
        """Obtém sessão existente ou cria nova"""
        if session_id not in self.sessions:
            return await self.create_session(session_id)
        return self.sessions[session_id]

    async def close_session(self, session_id: str):
        """Fecha e limpa sessão"""
        if session_id in self.sessions:
            session = self.sessions[session_id]

            if session.context:
                await session.context.close()
            if session.browser:
                await session.browser.close()

            del self.sessions[session_id]
            logger.info(f"Closed session: {session_id}")

    async def cleanup_all(self):
        """Fecha todas as sessões"""
        for session_id in list(self.sessions.keys()):
            await self.close_session(session_id)

        logger.info("All sessions cleaned up")

    def get_session_info(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retorna informações sobre sessão"""
        if session_id not in self.sessions:
            return None

        session = self.sessions[session_id]
        return {
            "session_id": session.session_id,
            "created_at": session.created_at.isoformat(),
            "last_activity": session.last_activity.isoformat(),
            "has_page": session.page is not None,
            "has_agent": session.agent is not None,
        }

    def list_sessions(self) -> List[Dict[str, Any]]:
        """Lista todas as sessões ativas"""
        return [self.get_session_info(sid) for sid in self.sessions.keys()]
