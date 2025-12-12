from typing import Optional, Dict, Any, List
from langchain_openai import ChatOpenAI
from langchain.agents import AgentType, initialize_agent
from langchain_community.agent_toolkits import PlaywrightBrowserToolkit
from langchain_community.tools.playwright.utils import create_async_playwright_browser
import os
from loguru import logger

class BrowserAgent:
    """
    Agente de Automação de Navegador baseado em LangChain + Playwright.
    Substitui o instável 'browser-use'.
    """
    
    def __init__(self):
        self.browser = None
        self.toolkit = None
        self.agent_chain = None
        
    async def initialize(self):
        """Inicializa o navegador e o toolkit do Playwright"""
        if not self.browser:
            # Cria instância de navegador async
            self.browser = create_async_playwright_browser()
            self.toolkit = PlaywrightBrowserToolkit.from_browser(async_browser=self.browser)
            
            # Ferramentas disponíveis para o agente
            tools = self.toolkit.get_tools()
            
            # Inicializa o LLM (OpenAI GPT-4o ou 3.5-turbo)
            llm = ChatOpenAI(
                model_name="gpt-4o-mini", 
                temperature=0,
                api_key=os.getenv("OPENAI_API_KEY")
            )
            
            # Cria o agente executor
            self.agent_chain = initialize_agent(
                tools,
                llm,
                agent=AgentType.STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION,
                verbose=True,
                handle_parsing_errors=True
            )
            logger.info("BrowserAgent initialized with LangChain Playwright Toolkit")

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
        # Nota: O PlaywrightBrowserToolkit gerencia o navegador, 
        # mas podemos forçar o fechamento se necessário.
        pass
