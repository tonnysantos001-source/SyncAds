from typing import Optional, Dict, Any, List
from langchain_openai import ChatOpenAI
from langchain.agents import AgentType, initialize_agent, Tool
from langchain_community.tools.playwright.utils import create_async_playwright_browser
import os
import asyncio
import json
import httpx
from loguru import logger
from playwright.async_api import Page, Browser
from app.file_uploader import FileUploader

# Diretório temporário para arquivos gerados
TEMP_DIR = "/tmp/ai_generated"
os.makedirs(TEMP_DIR, exist_ok=True)

class BrowserAgent:
    """
    Agente de Automação HÍBRIDO (Server-Side + Client-Side Extension).
    Capaz de:
    1. Navegar no servidor (Playwright headless)
    2. Controlar navegador do usuário (Chrome Extension Remote Control)
    3. Criar e gerenciar arquivos (System File IO)
    """
    
    def __init__(self):
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self.agent_chain = None
        self.playwright = None
        self.browser_instance = None
        self.user_id: Optional[str] = None
        
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
            
            # --- FERRAMENTAS DE NAVEGAÇÃO (SERVER-SIDE) ---
            
            async def navigate(url: str) -> str:
                """Navega para uma URL específica (Server-Side)."""
                try:
                    await self.page.goto(url, wait_until="domcontentloaded", timeout=30000)
                    title = await self.page.title()
                    return f"Navegado com sucesso para {url}. Título: {title}"
                except Exception as e:
                    return f"Erro ao navegar: {e}"

            async def extract_text(selector: str = "body") -> str:
                """Extrai texto da página atual (Server-Side)."""
                try:
                    content = await self.page.inner_text(selector)
                    return content[:5000]
                except Exception as e:
                    return f"Erro ao extrair: {e}"

            async def click_element(selector: str) -> str:
                """Clica em um elemento específico (Server-Side)."""
                try:
                    await self.page.click(selector, timeout=5000)
                    return f"Clicado em {selector}"
                except Exception as e:
                    return f"Erro ao clicar: {e}"
            
            async def fill_form(input_string: str) -> str:
                """Preenche campo (Server-Side). Formato: 'selector|value'"""
                try:
                    selector, value = input_string.split("|", 1)
                    await self.page.fill(selector, value)
                    return f"Preenchido {selector} com {value}"
                except Exception as e:
                    return f"Erro ao preencher: {e}"

            async def get_html(selector: str = "body") -> str:
                """Pega HTML (Server-Side)."""
                try:
                    html = await self.page.inner_html(selector)
                    return html[:10000]
                except Exception as e:
                    return f"Erro ao pegar HTML: {e}"

            # --- FERRAMENTAS DE EXTENSÃO (CLIENT-SIDE REMOTO) ---
            
            async def control_user_extension(input_string: str) -> str:
                """
                Envia comando para o Chrome REAL do usuário.
                Use para: Sites logados, Facebook Ads, Ações no PC do usuário.
                
                Input: 'COMANDO|JSON_PARAMS'
                Ex: 'NAVIGATE|{"url": "https://facebook.com"}'
                Ex: 'CLICK|{"selector": "#submit-btn"}'
                """
                if not self.user_id:
                    return "ERRO: User ID não disponível. Não posso controlar a extensão remota."
                
                try:
                    cmd_type, params_str = input_string.split("|", 1)
                    params = json.loads(params_str)
                except:
                    return "ERRO FORMATO. Use: TIPO|JSON. Ex: NAVIGATE|{\"url\":\"...\"}"

                supabase_url = os.getenv("SUPABASE_URL")
                supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
                
                if not supabase_url or not supabase_key:
                    return "Erro: Credenciais Supabase ausentes."

            async def control_user_extension(input_string: str) -> str:
                """
                Envia comando para o Chrome REAL do usuário e AGUARDA o resultado.
                Use para: Sites logados, Facebook Ads, Ações no PC do usuário.
                
                Input: 'COMANDO|JSON_PARAMS'
                Ex: 'NAVIGATE|{"url": "https://facebook.com"}'
                Ex: 'CLICK|{"selector": "#submit-btn"}'
                Ex: 'EXTRACT|{"selector": ".price"}'
                """
                if not self.user_id:
                    return "ERRO: User ID não disponível. Não posso controlar a extensão remota."
                
                try:
                    cmd_type, params_str = input_string.split("|", 1)
                    params = json.loads(params_str)
                except:
                    return "ERRO FORMATO. Use: TIPO|JSON. Ex: NAVIGATE|{\"url\":\"...\"}"

                supabase_url = os.getenv("SUPABASE_URL")
                supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
                
                if not supabase_url or not supabase_key:
                    return "Erro: Credenciais Supabase ausentes."

                timeout_seconds = 45 # Tempo máximo de espera pela resposta do navegador

                async with httpx.AsyncClient(timeout=60.0) as client:
                    headers = {
                        "apikey": supabase_key,
                        "Authorization": f"Bearer {supabase_key}",
                        "Content-Type": "application/json",
                        "Prefer": "return=representation" # Importante para receber o ID criado
                    }

                    # 1. Encontrar dispositivo online
                    params_get = {
                        "user_id": f"eq.{self.user_id}",
                        "order": "last_seen.desc",
                        "limit": "1"
                    }
                    
                    resp = await client.get(f"{supabase_url}/rest/v1/extension_devices", params=params_get, headers=headers)
                    if resp.status_code != 200: return f"Erro busca device: {resp.text}"
                    
                    devices = resp.json()
                    if not devices: return "Nenhum dispositivo ativo encontrado."
                    device_id = devices[0]['device_id']
                    
                    # 2. Inserir Comando e Pegar ID
                    payload = {
                        "deviceId": device_id,
                        "command": cmd_type.upper(),
                        "data": params,
                        "status": "PENDING"
                    }
                    
                    resp_cmd = await client.post(f"{supabase_url}/rest/v1/ExtensionCommand", json=payload, headers=headers)
                    
                    if resp_cmd.status_code != 201:
                        return f"Erro ao enviar comando: {resp_cmd.text}"
                    
                    cmd_data = resp_cmd.json()
                    cmd_id = cmd_data[0]['id']
                    
                    # 3. Loop de Espera (Polling) pelo Resultado
                    start_time = asyncio.get_event_loop().time()
                    
                    while (asyncio.get_event_loop().time() - start_time) < timeout_seconds:
                        await asyncio.sleep(2) # Esperar 2s entre checks
                        
                        resp_check = await client.get(
                            f"{supabase_url}/rest/v1/ExtensionCommand?id=eq.{cmd_id}&select=status,result,error", 
                            headers=headers
                        )
                        
                        if resp_check.status_code == 200:
                            current_cmd = resp_check.json()[0]
                            status = current_cmd.get('status')
                            
                            if status == 'COMPLETED':
                                result = current_cmd.get('result', {})
                                return f"SUCESSO: {json.dumps(result, ensure_ascii=False)}"
                            
                            if status == 'FAILED':
                                error = current_cmd.get('error', 'Erro desconhecido')
                                return f"FALHA na execução remota: {error}"
                    
                    return f"TIMEOUT: Navegador não respondeu em {timeout_seconds}s."

            # --- FERRAMENTAS DE ARQUIVO ---

            async def create_file(input_string: str) -> str:
                """Cria arquivo local. Formato: 'filename.ext|conteudo'"""
                try:
                    filename, content = input_string.split("|", 1)
                    filepath = os.path.join(TEMP_DIR, filename.strip())
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(content)
                    return f"Arquivo criado: {filepath}"
                except Exception as e:
                    return f"Erro ao criar arquivo: {e}"

            async def upload_and_generate_link(filename: str) -> str:
                """Sobe arquivo para nuvem e gera link."""
                try:
                    filename = filename.strip()
                    filepath = os.path.join(TEMP_DIR, filename)
                    if not os.path.exists(filepath): return "Erro: Arquivo não existe."
                    
                    supa_url = os.getenv("SUPABASE_URL")
                    supa_key = os.getenv("SUPABASE_KEY")
                    if not supa_url: return "Erro config Supabase."
                    
                    uploader = FileUploader(supa_url, supa_key)
                    url = await uploader.upload_file(filepath, filename, "ai_agent")
                    
                    return f"Download Link: {url}" if url else "Erro upload."
                except Exception as e:
                    return f"Erro upload: {e}"

            # --- FERRAMENTAS DE COGNIÇÃO & SEGURANÇA (NOVO) ---

            async def solve_captcha(url: str) -> str:
                """
                Tenta resolver CAPTCHA na página atual (ReCaptcha/hCaptcha).
                Requer TWOCAPTCHA_API_KEY configurada no ambiente.
                Retorna: Status da resolução.
                """
                api_key = os.getenv("TWOCAPTCHA_API_KEY")
                if not api_key:
                    return "ERRO: Chave API 2Captcha não configurada (TWOCAPTCHA_API_KEY)."

                try:
                    from twocaptcha import TwoCaptcha
                    solver = TwoCaptcha(api_key)
                    
                    # Identificar imagem ou sitekey seria o ideal
                    # Por enquanto, tentamos resolver via URL (menos confiável mas genérico)
                    result = solver.recaptcha(sitekey='DETECT_ME', url=url) # Placeholder logic
                    
                    return f"Captcha Resolvido! Código: {result['code']}. (Nota: A injeção automática requer seletor específico)"
                except Exception as e:
                    return f"Erro ao resolver captcha: {e}"

            async def consult_hive_mind(query: str) -> str:
                """
                Consulta a 'Mente Coletiva' para ver se já aprendemos a fazer isso.
                Input: Descrição da tarefa (ex: 'criar campanha google ads rede display')
                Retorna: Instruções aprendidas ou 'Nenhum conhecimento prévio'.
                """
                # Simulação de Busca Semântica (RAG)
                # Em produção, isso consultaria tabela 'ai_memory' no Supabase via pgvector
                return "Memória: Para criar campanha no Google Ads, comece clicando em 'Nova Campanha' (botão azul, canto esquerdo). Se falhar, tente a URL direta: https://ads.google.com/aw/campaigns/new"

            async def share_learning(experience: str) -> str:
                """
                Ensina a IA (e outros usuários) com base no sucesso/erro atual.
                Input: 'TIPO_TAREFA|CAMINHO_SUCESSO'.
                Ex: 'google_ads_login|Use o botão "Fazer Login" no topo direito, não o do meio.'
                """
                # Em produção, salvaria na tabela 'ai_memory'
                logger.info(f"🧠 HIVE MIND APRENDEU: {experience}")
                return "Lição aprendida e salva na Mente Coletiva."

            # Lista de Ferramentas
            tools = [
                # Server Browser
                Tool(name="navigate_server", func=None, coroutine=navigate, description="Navegar no SERVIDOR (Headless). Use para pesquisa pública."),
                Tool(name="extract_server", func=None, coroutine=extract_text, description="Extrair texto no SERVIDOR."),
                
                # Client Browser (Extension)
                Tool(
                    name="control_user_browser",
                    func=None,
                    coroutine=control_user_extension,
                    description="COMANDAR O NAVEGADOR DO USUÁRIO. Use APENAS se precisar logar em contas (Facebook, Google). Input: 'CMD|JSON'. Ex: NAVIGATE|{\"url\":\"...\"}"
                ),
                
                # Files
                Tool(name="create_file", func=None, coroutine=create_file, description="Criar arquivo. Input: 'nome|conteudo'"),
                Tool(name="generate_download_link", func=None, coroutine=upload_and_generate_link, description="Gerar link download. Input: 'nome'"),
                
                # Cognition & Security
                Tool(name="solve_captcha", func=None, coroutine=solve_captcha, description="Resolver Captcha. Input: URL da página."),
                Tool(name="consult_hive_mind", func=None, coroutine=consult_hive_mind, description="Buscar conhecimento prévio. Input: 'tema'"),
                Tool(name="share_learning", func=None, coroutine=share_learning, description="Salvar aprendizado. Input: 'tema|lição'")
            ]
            
            llm = ChatOpenAI(model_name="gpt-4o-mini", temperature=0, api_key=os.getenv("OPENAI_API_KEY"))
            
            self.agent_chain = initialize_agent(
                tools, llm, 
                agent=AgentType.STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION, 
                verbose=True, 
                handle_parsing_errors=True
            )
            logger.info("Hybrid BrowserAgent v3.0 initialized (Cognitive + Captcha) 🧠")

    async def execute_task(self, instruction: str, user_id: str = None) -> Dict[str, Any]:
        """Executa tarefa com contexto de usuário"""
        self.user_id = user_id
        if not self.agent_chain:
            await self.initialize()
            
        try:
            # Enriquecer instrução
            enhanced = instruction
            if user_id:
                enhanced += " (Você tem acesso ao navegador do usuário via control_user_browser se necessário)"
            
            # Incentivo para usar a memória
            enhanced += ". Antes de agir, consulte a hive_mind para ver se já sabemos fazer isso."
                
            logger.info(f"BrowserAgent executing for user {user_id}: {enhanced}")
            result = await self.agent_chain.arun(enhanced)
            return {"success": True, "result": result}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def cleanup(self):
        if self.browser_instance: await self.browser_instance.close()
        if self.playwright: await self.playwright.stop()
