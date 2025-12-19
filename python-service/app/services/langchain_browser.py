from typing import Optional, Dict, Any, List
from langchain_openai import ChatOpenAI
from langchain.agents import AgentType, initialize_agent, Tool
import os
import asyncio
import json
import httpx
from loguru import logger
from app.file_uploader import FileUploader
# Importar o serviço de navegador persistente
from app.services.browser_service import browser_service

# Diretório temporário para arquivos gerados
TEMP_DIR = "/tmp/ai_generated"
os.makedirs(TEMP_DIR, exist_ok=True)

class BrowserAgent:
    """
    Agente de Automação HÍBRIDO (Server-Side + Client-Side Extension).
    Capaz de:
    1. Navegar no servidor (BrowserService persistente)
    2. Controlar navegador do usuário (Chrome Extension)
    3. Criar e gerenciar arquivos
    """
    
    def __init__(self):
        self.agent_chain = None
        self.user_id: Optional[str] = None
        self.session_id: Optional[str] = None
        
    async def initialize(self):
        """Inicializa as ferramentas"""
        # Garantir que o serviço de navegador está pronto (embora ele se auto-inicialize)
        pass 
            
        # --- FERRAMENTAS DE NAVEGAÇÃO (SERVER-SIDE VIA BROWSER SERVICE) ---
        
        async def navigate(url: str) -> str:
            """Navega para uma URL específica (Server-Side)."""
            if not self.session_id: return "Erro: Sessão não iniciada."
            try:
                result = await browser_service.navigate(self.session_id, url)
                if result['success']:
                    return f"Navegado com sucesso para {url}. Título: {result.get('title')}"
                else:
                    return f"Erro na navegação: {result.get('error')}"
            except Exception as e:
                return f"Exceção ao navegar: {e}"

        async def extract_text(selector: str = "body") -> str:
            """Extrai texto da página atual (Server-Side)."""
            if not self.session_id: return "Erro: Sessão não iniciada."
            try:
                # Usar extract_data do browser service
                result = await browser_service.extract_data(self.session_id, {"content": selector})
                if result['success']:
                    content = result['data'].get('content', '')
                    return content[:5000] if content else "Nenhum conteúdo encontrado."
                return f"Erro ao extrair: {result.get('error')}"
            except Exception as e:
                return f"Erro ao extrair: {e}"

        async def click_element(selector: str) -> str:
            """Clica em um elemento específico (Server-Side)."""
            if not self.session_id: return "Erro: Sessão não iniciada."
            try:
                result = await browser_service.click_element(self.session_id, selector)
                if result['success']:
                    return f"Clicado em {selector}"
                return f"Erro ao clicar: {result.get('error')}"
            except Exception as e:
                return f"Erro ao clicar: {e}"
        
        async def fill_form(input_string: str) -> str:
            """Preenche campo (Server-Side). Formato: 'selector|value'"""
            if not self.session_id: return "Erro: Sessão não iniciada."
            try:
                selector, value = input_string.split("|", 1)
                # BrowserService espera um dicionário {selector: value}
                # Mas fill_form do service é mais inteligente, vamos adaptar ou usar fill normal
                # O método fill_form do service espera { "field_name": "value" }
                # Vamos tentar usar o selector como chave
                result = await browser_service.fill_form(self.session_id, {selector: value})
                
                if result['success']:
                    return f"Preenchido {selector} com {value}"
                
                # Se falhar, tentar dizer o motivo
                return f"Erro ao preencher: {result.get('errors')}"
            except Exception as e:
                return f"Erro ao preencher: {e}"

        async def get_html(selector: str = "body") -> str:
            """Pega HTML (Server-Side)."""
            if not self.session_id: return "Erro: Sessão não iniciada."
            try:
                page = browser_service.pages.get(self.session_id)
                if not page: return "Erro: Página não encontrada na sessão."
                
                if selector == "body":
                    html = await page.content()
                else:
                    html = await page.eval_on_selector(selector, "el => el.outerHTML")
                    
                return html[:10000]
            except Exception as e:
                return f"Erro ao pegar HTML: {e}"

        # --- FERRAMENTAS DE EXTENSÃO (CLIENT-SIDE REMOTO) ---
        
        async def control_user_extension(input_string: str) -> str:
            """
            Envia comando para o Chrome REAL do usuário e AGUARDA o resultado.
            Input: 'COMANDO|JSON_PARAMS'
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

            timeout_seconds = 45 

            async with httpx.AsyncClient(timeout=60.0) as client:
                headers = {
                    "apikey": supabase_key,
                    "Authorization": f"Bearer {supabase_key}",
                    "Content-Type": "application/json",
                    "Prefer": "return=representation"
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
                
                # 2. Inserir Comando
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
                
                # 3. Polling
                start_time = asyncio.get_event_loop().time()
                
                while (asyncio.get_event_loop().time() - start_time) < timeout_seconds:
                    await asyncio.sleep(2)
                    
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

        # --- FERRAMENTAS DE COGNIÇÃO & SEGURANÇA ---

        async def solve_captcha(url: str) -> str:
            """Tenta resolver CAPTCHA na página atual."""
            api_key = os.getenv("TWOCAPTCHA_API_KEY")
            if not api_key:
                return "ERRO: Chave API 2Captcha ausente."

            try:
                from twocaptcha import TwoCaptcha
                solver = TwoCaptcha(api_key)
                # Placeholder logic
                result = solver.recaptcha(sitekey='DETECT_ME', url=url)
                return f"Captcha Resolvido! Código: {result['code']}"
            except Exception as e:
                return f"Erro ao resolver captcha: {e}"

        async def consult_hive_mind(query: str) -> str:
            """Consulta a 'Mente Coletiva'."""
            return "Memória: Para criar campanha no Google Ads, comece clicando em 'Nova Campanha' (botão azul)."

        async def share_learning(experience: str) -> str:
            """Ensina a IA."""
            logger.info(f"🧠 HIVE MIND APRENDEU: {experience}")
            return "Lição aprendida e salva."

        # Lista de Ferramentas
        tools = [
            # Server Browser (Persistent)
            Tool(name="navigate_server", func=None, coroutine=navigate, description="Navegar no SERVIDOR (Headless) mantendo a SESSÃO. Use para pesquisa pública."),
            Tool(name="extract_server", func=None, coroutine=extract_text, description="Extrair texto no SERVIDOR da página ATUAL."),
            Tool(name="click_server", func=None, coroutine=click_element, description="Clicar elemento no SERVIDOR."),
            Tool(name="fill_server", func=None, coroutine=fill_form, description="Preencher form no SERVIDOR. 'seletor|valor'"),
            
            # Client Browser (Extension)
            Tool(
                name="control_user_browser",
                func=None,
                coroutine=control_user_extension,
                description="COMANDAR O NAVEGADOR DO USUÁRIO. Use APENAS se precisar logar em contas (Facebook, Google). Input: 'CMD|JSON'."
            ),
            
            # Files
            Tool(name="create_file", func=None, coroutine=create_file, description="Criar arquivo. Input: 'nome|conteudo'"),
            Tool(name="generate_download_link", func=None, coroutine=upload_and_generate_link, description="Gerar link download. Input: 'nome'"),
            
            # Cognition
            Tool(name="solve_captcha", func=None, coroutine=solve_captcha, description="Resolver Captcha."),
            Tool(name="consult_hive_mind", func=None, coroutine=consult_hive_mind, description="Buscar conhecimento prévio."),
            Tool(name="share_learning", func=None, coroutine=share_learning, description="Salvar aprendizado.")
        ]
        
        llm = ChatOpenAI(model_name="gpt-4o-mini", temperature=0, api_key=os.getenv("OPENAI_API_KEY"))
        
        self.agent_chain = initialize_agent(
            tools, llm, 
            agent=AgentType.STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION, 
            verbose=True, 
            handle_parsing_errors=True
        )
        logger.info("BrowserAgent v3.1 initialized (Persistent Session) 🧠")

    async def execute_task(self, instruction: str, user_id: str = None, session_id: str = None) -> Dict[str, Any]:
        """Executa tarefa com contexto de usuário e sessão"""
        self.user_id = user_id
        
        # Se um ID de sessão foi passado, usá-lo. 
        # Se não, criar um temporário? Não, melhor pedir para criar antes.
        # Por segurança, se não vier session_id, criamos um baseado no user_id ou random
        if not session_id:
             import uuid
             session_id = f"auto_{uuid.uuid4()}"
             
        self.session_id = session_id
        
        # Garantir que a sessão existe no browser service
        if session_id not in browser_service.contexts:
            await browser_service.create_session(session_id)
            
        if not self.agent_chain:
            await self.initialize()
            
        try:
            # Enriquecer instrução
            enhanced = instruction
            if user_id:
                enhanced += " (Você tem acesso ao navegador do usuário via control_user_browser se necessário)"
            
            enhanced += f". ESTADO ATUAL: Você está usando a sessão de navegador ID {session_id}. Se você já navegou antes, a página continua aberta."
            enhanced += ". Antes de agir, verifique onde você está se necessário."
                
            logger.info(f"BrowserAgent executing for session {session_id}: {enhanced}")
            result = await self.agent_chain.arun(enhanced)
            return {"success": True, "result": result}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def cleanup(self):
        # Não fechamos mais o navegador aqui, pois ele pertence ao BrowserService singleton
        pass
