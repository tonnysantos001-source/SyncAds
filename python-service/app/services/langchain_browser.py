from typing import Optional, Dict, Any, List
from langchain_openai import ChatOpenAI
from langchain.agents import AgentType, initialize_agent, Tool
from langchain_community.tools.playwright.utils import create_async_playwright_browser
import os
import asyncio
from loguru import logger
from playwright.async_api import Page, Browser
from app.file_uploader import FileUploader

# Diretório temporário para arquivos gerados
TEMP_DIR = "/tmp/ai_generated"
os.makedirs(TEMP_DIR, exist_ok=True)

class BrowserAgent:
    """
    Agente de Automação de Navegador & Sistema de Arquivos (Enterprise Grade).
    Capaz de navegar, extrair dados, criar arquivos e gerar links de download.
    """
    
    def __init__(self):
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self.agent_chain = None
        self.playwright = None
        self.browser_instance = None
        
    async def initialize(self):
        """Inicializa o navegador e as ferramentas manuais"""
        if not self.browser:
            # 1. Inicializar navegador diretamente (Robustez)
            from playwright.async_api import async_playwright
            self.playwright = await async_playwright().start()
            self.browser_instance = await self.playwright.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-setuid-sandbox"]
            )
            self.page = await self.browser_instance.new_page()
            
            # --- FERRAMENTAS DE NAVEGAÇÃO ---
            
            async def navigate(url: str) -> str:
                """Navega para uma URL específica."""
                try:
                    await self.page.goto(url, wait_until="domcontentloaded", timeout=30000)
                    title = await self.page.title()
                    return f"Navegado com sucesso para {url}. Título: {title}"
                except Exception as e:
                    return f"Erro ao navegar: {e}"

            async def extract_text(selector: str = "body") -> str:
                """Extrai texto da página atual."""
                try:
                    content = await self.page.inner_text(selector)
                    return content[:5000]  # Aumentado limite
                except Exception as e:
                    return f"Erro ao extrair: {e}"

            async def click_element(selector: str) -> str:
                """Clica em um elemento específico."""
                try:
                    await self.page.click(selector, timeout=5000)
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

            async def get_html(selector: str = "body") -> str:
                """Pega o HTML raw da página (útil para debugging ou parsing complexo)"""
                try:
                    html = await self.page.inner_html(selector)
                    return html[:10000]
                except Exception as e:
                    return f"Erro ao pegar HTML: {e}"

            # --- FERRAMENTAS DE ARQUIVO & STORAGE (NOVO) ---

            async def create_file(input_string: str) -> str:
                """Cria arquivo local. Formato: 'filename.ext|conteudo'"""
                try:
                    if "|" not in input_string:
                        return "Erro: Formato deve ser 'filename.ext|conteudo'"
                    
                    filename, content = input_string.split("|", 1)
                    filename = filename.strip()
                    filepath = os.path.join(TEMP_DIR, filename)
                    
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(content)
                        
                    return f"Arquivo criado localmente em: {filepath}"
                except Exception as e:
                    return f"Erro ao criar arquivo: {e}"

            async def upload_and_generate_link(filename: str) -> str:
                """
                Sobe arquivo local para nuvem e gera link de download.
                Input: Apenas o nome do arquivo (ex: 'relatorio.txt') criado anteriormente.
                """
                try:
                    filename = filename.strip()
                    filepath = os.path.join(TEMP_DIR, filename)
                    
                    if not os.path.exists(filepath):
                        return f"Erro: Arquivo {filename} não encontrado localmente. Crie-o primeiro."

                    # Configuração Supabase
                    supabase_url = os.getenv("SUPABASE_URL")
                    supabase_key = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
                    
                    if not supabase_url or not supabase_key:
                        return "Erro: Credenciais do Supabase não configuradas (SUPABASE_URL/KEY)."

                    uploader = FileUploader(supabase_url, supabase_key)
                    
                    # Upload
                    url = await uploader.upload_file(filepath, filename, "ai-agent")
                    
                    if url:
                        # Markdown link format
                        return f"SUCESSO! Link de download: {url}"
                    else:
                        return "Falha no upload para o Storage."
                        
                except Exception as e:
                    return f"Erro no processo de upload: {e}"

            # 3. Lista de Ferramentas
            tools = [
                # Browser
                Tool(
                    name="navigate_browser",
                    func=None,
                    coroutine=navigate,
                    description="Navegar para URL. Input: URL (ex: https://google.com)"
                ),
                Tool(
                    name="extract_content",
                    func=None,
                    coroutine=extract_text,
                    description="Ler texto da página. Input: seletor CSS (opcional, default 'body')"
                ),
                Tool(
                    name="click_element",
                    func=None,
                    coroutine=click_element,
                    description="Clicar em elemento. Input: seletor CSS"
                ),
                Tool(
                    name="fill_field",
                    func=None,
                    coroutine=fill_form,
                    description="Preencher formulário. Input: 'seletor|valor'"
                ),
                Tool(
                    name="get_html",
                    func=None,
                    coroutine=get_html,
                    description="DEBUG: Ver código HTML da página. Útil quando extract_content falha."
                ),
                # Files
                Tool(
                    name="create_file",
                    func=None,
                    coroutine=create_file,
                    description="Criar arquivo de texto/código. Input: 'nome_arquivo.ext|conteudo'. Ex: 'lista.txt|Item 1\nItem 2'"
                ),
                Tool(
                    name="generate_download_link",
                    func=None,
                    coroutine=upload_and_generate_link,
                    description="Gerar link de download para arquivo criado. Input: 'nome_arquivo.ext'. Retorna URL pública."
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
            logger.info("BrowserAgent initialized with FILE SYSTEM Capabilities 🚀")

    async def execute_task(self, instruction: str) -> Dict[str, Any]:
        """Executa uma tarefa em linguagem natural"""
        if not self.agent_chain:
            await self.initialize()
            
        try:
            # Enriquecer instrução para incentivar uso de arquivos se necessário
            enhanced_instruction = instruction
            if "download" in instruction.lower() or "arquivo" in instruction.lower() or "salv" in instruction.lower():
                enhanced_instruction += " (Se precisar gerar arquivo, use create_file e depois generate_download_link)"
                
            logger.info(f"BrowserAgent executing: {enhanced_instruction}")
            result = await self.agent_chain.arun(enhanced_instruction)
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
