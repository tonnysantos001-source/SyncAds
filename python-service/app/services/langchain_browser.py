from typing import Optional, Dict, Any, List
from langchain_openai import ChatOpenAI
from langchain.agents import AgentType, initialize_agent, Tool
from langchain_community.tools.playwright.utils import create_async_playwright_browser
from langchain.tools import tool
import os
from loguru import logger
from playwright.async_api import Page, Browser

class BrowserAgent:
    """
    Agente de Automação de Navegador ROBUSTO.
    Define ferramentas manualmente para evitar erros de importação do langchain-community.
    """
    
    def __init__(self):
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self.agent_chain = None
        
    async def initialize(self):
        """Inicializa o navegador e as ferramentas manuais"""
        if not self.browser:
            # 1. Inicializar navegador diretamente
            self.browser = create_async_playwright_browser()
            # Precisamos criar uma página/contexto manualmente se o create_async não fizer
            # Mas o utils do langchain geralmente retorna um browser wrapper.
            # Vamos simplificar: Usar o browser wrapper para criar ferramentas.
            
            # Nota: O create_async_playwright_browser retorna um AsyncBrowser do langchain
            # que gerencia o loop. Vamos usar as tools manuais.
            
            # Hack seguro: Criar nosso próprio gerenciamento de página
            from playwright.async_api import async_playwright
            self.playwright = await async_playwright().start()
            self.browser_instance = await self.playwright.chromium.launch(headless=True)
            self.page = await self.browser_instance.new_page()
            
            # 2. Definir Ferramentas (Tools) Manualmente
            
            async def navigate(url: str) -> str:
                """Navega para uma URL específica."""
                try:
                    await self.page.goto(url, wait_until="domcontentloaded")
                    return f"Navegado para {url}. Título: {await self.page.title()}"
                except Exception as e:
                    return f"Erro ao navegar: {e}"

            async def extract_text(selector: str = "body") -> str:
                """Extrai texto da página atual."""
                try:
                    content = await self.page.inner_text(selector)
                    return content[:4000]  # Limitar tamanho
                except Exception as e:
                    return f"Erro ao extrair: {e}"

            async def click_element(selector: str) -> str:
                """Clica em um elemento específico."""
                try:
                    await self.page.click(selector)
                    return f"Clicado em {selector}"
                except Exception as e:
                    return f"Erro ao clicar: {e}"
            
            async def fill_form(input_string: str) -> str:
                """Preenche campo. Formato: 'selector|value'"""
                try:
                    selector, value = input_string.split("|", 1)
                    await self.page.fill(selector, value)
                    return f"Preenchido {selector} com {value}"
                except Exception as e:
                    return f"Erro ao preencher (use formato 'seletor|valor'): {e}"

            # 3. Lista de Ferramentas
            tools = [
                Tool(
                    name="navigate_browser",
                    func=None,
                    coroutine=navigate,
                    description="Útil para navegar para uma URL. Input deve ser a URL (ex: https://google.com)"
                ),
                Tool(
                    name="extract_content",
                    func=None,
                    coroutine=extract_text,
                    description="Útil para ler o conteúdo da página atual."
                ),
                Tool(
                    name="click_element",
                    func=None,
                    coroutine=click_element,
                    description="Útil para clicar em botões ou links. Input deve ser o seletor CSS."
                ),
                Tool(
                    name="fill_field",
                    func=None,
                    coroutine=fill_form,
                    description="Útil para preencher formulários. Input deve ser 'seletor|valor'."
                )
            ]
            
            # 4. Inicializa o LLM
            llm = ChatOpenAI(
                model_name="gpt-4o-mini", 
                temperature=0,
                api_key=os.getenv("OPENAI_API_KEY")
            )
            
            # 5. Inicializa Agente
            self.agent_chain = initialize_agent(
                tools,
                llm,
                agent=AgentType.STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION,
                verbose=True,
                handle_parsing_errors=True
            )
            logger.info("BrowserAgent initialized with CUSTOM TOOLS")

    async def execute_task(self, instruction: str) -> Dict[str, Any]:
        """Executa uma tarefa em linguagem natural"""
        if not self.agent_chain:
            await self.initialize()
            
        try:
            logger.info(f"BrowserAgent executing: {instruction}")
            result = await self.agent_chain.arun(instruction)
            return {
                "success": True,
                "result": result,
                "action": instruction
            }
        except Exception as e:
            logger.error(f"BrowserAgent execution failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "action": instruction
            }
            
    async def cleanup(self):
        """Limpa recursos"""
        if self.browser_instance:
            await self.browser_instance.close()
        if self.playwright:
            await self.playwright.stop()
