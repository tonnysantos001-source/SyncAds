"""
============================================
SYNCADS PYTHON MICROSERVICE - FULL
IA + Supabase + Streaming + AI Tools
============================================
"""

# ==========================================
# IMPORTS DE ROUTERS
# ==========================================
from app.routers.automation import router as automation_router

# ==========================================
# CRIAR APP FASTAPI
# ==========================================
app = FastAPI(
    title="SyncAds Python Microservice",
    description="IA Service - Claude, OpenAI, Groq",
    version="1.0.0-minimal",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ==========================================
# CORS
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# INCLUDE ROUTERS
# ==========================================
app.include_router(automation_router, prefix="/api", tags=["Automation"])

# ==========================================
# SUPABASE HTTP FALLBACK
# ==========================================
class SupabaseHTTP:
    """Cliente Supabase alternativo usando httpx direto"""

    def __init__(self, url: str, key: str):
        self.url = url.rstrip("/")
        self.key = key
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    async def table(self, table_name: str):
        return SupabaseTableHTTP(self.url, table_name, self.headers)


class SupabaseTableHTTP:
    """Operações de tabela usando httpx"""

    def __init__(self, base_url: str, table_name: str, headers: dict):
        self.base_url = base_url
        self.table_name = table_name
        self.headers = headers
        self.endpoint = f"{base_url}/rest/v1/{table_name}"

    async def insert(self, data: dict):
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(self.endpoint, json=data, headers=self.headers)
            return {"data": response.json() if response.status_code == 201 else None}

    async def select(self, columns: str = "*"):
        return SupabaseSelectHTTP(self.endpoint, columns, self.headers)

    async def update(self, data: dict):
        return SupabaseUpdateHTTP(self.endpoint, data, self.headers)

    async def upsert(self, data: dict):
        headers = {**self.headers, "Prefer": "resolution=merge-duplicates"}
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(self.endpoint, json=data, headers=headers)
            return {
                "data": response.json() if response.status_code in [200, 201] else None
            }


class SupabaseSelectHTTP:
    def __init__(self, endpoint: str, columns: str, headers: dict):
        self.endpoint = endpoint
        self.columns = columns
        self.headers = headers
        self.filters = []

    def eq(self, column: str, value: str):
        self.filters.append(f"{column}=eq.{value}")
        return self

    async def execute(self):
        params = {"select": self.columns}
        if self.filters:
            for filter_str in self.filters:
                key, val = filter_str.split("=", 1)
                params[key] = val

        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        url = f"{self.endpoint}?{query_string}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, headers=self.headers)
            return {"data": response.json() if response.status_code == 200 else []}


class SupabaseUpdateHTTP:
    def __init__(self, endpoint: str, data: dict, headers: dict):
        self.endpoint = endpoint
        self.data = data
        self.headers = headers
        self.filters = []

    def eq(self, column: str, value: str):
        self.filters.append(f"{column}=eq.{value}")
        return self

    async def execute(self):
        query_string = "&".join(self.filters)
        url = f"{self.endpoint}?{query_string}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.patch(url, json=self.data, headers=self.headers)
            return {"data": response.json() if response.status_code == 200 else None}


# ==========================================
# SUPABASE CLIENT
# ==========================================
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

supabase: Optional[Client] = None
supabase_http: Optional[SupabaseHTTP] = None

if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("✅ Supabase SDK initialized successfully")
    except Exception as e:
        logger.warning(f"⚠️ Supabase SDK initialization failed: {e}")
        logger.info("🔄 Trying HTTP fallback...")
        try:
            supabase_http = SupabaseHTTP(SUPABASE_URL, SUPABASE_KEY)
            logger.info("✅ Supabase HTTP fallback initialized successfully")
        except Exception as e2:
            logger.error(f"❌ Supabase HTTP fallback also failed: {e2}")
            logger.warning("⚠️ Running without Supabase connection")


# ==========================================
# BROWSER AUTOMATION DETECTION
# ==========================================
def detect_browser_automation_intent(message: str) -> Optional[Dict]:
    """Detecta intenção de automação de navegador na mensagem"""
    message_lower = message.lower()

    # Navegar para URL
    if any(
        word in message_lower
        for word in ["abra", "abrir", "navegue", "vá para", "acesse"]
    ):
        # Extrair URL se houver
        import re

        url_pattern = (
            r"https?://[^\s]+|(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:/[^\s]*)?"
        )
        urls = re.findall(url_pattern, message)
        if urls:
            return {"type": "NAVIGATE", "data": {"url": urls[0]}}

    # Clicar em elemento
    if any(
        word in message_lower for word in ["clique", "clicar", "pressione", "aperte"]
    ):
        # Extrair texto do botão/elemento
        button_patterns = [
            r'bot[ãa]o ["\']([^"\']+)["\']',
            r'em ["\']([^"\']+)["\']',
            r"no bot[ãa]o ([^\s]+)",
        ]
        for pattern in button_patterns:
            import re

            match = re.search(pattern, message_lower)
            if match:
                return {
                    "type": "DOM_CLICK",
                    "data": {
                        "selector": f"button:contains('{match.group(1)}')",
                        "text": match.group(1),
                    },
                }

    # Preencher campo
    if any(
        word in message_lower
        for word in ["preencha", "preencher", "digite", "escreva", "insira"]
    ):
        # Extrair campo e valor
        import re

        fill_pattern = r'campo ["\']?([^"\']+)["\']? (?:com|de) ["\']?([^"\']+)["\']?'
        match = re.search(fill_pattern, message_lower)
        if match:
            return {
                "type": "DOM_FILL",
                "data": {
                    "selector": f"input[name*='{match.group(1)}']",
                    "value": match.group(2),
                },
            }

    # Tirar screenshot
    if any(
        word in message_lower
        for word in ["print", "screenshot", "captura", "tire uma foto"]
    ):
        return {"type": "SCREENSHOT", "data": {}}

    # Ler dados da página
    if any(
        word in message_lower for word in ["leia", "extraia", "pegue", "busque"]
    ) and any(word in message_lower for word in ["página", "tela", "site"]):
        return {"type": "DOM_READ", "data": {"selector": "body"}}

    return None


# ==========================================
# MODELS
# ==========================================
class ChatRequest(BaseModel):
    message: str
    conversationId: str
    userId: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    model: str
    provider: str
    tokens_used: Optional[int] = None


# ==========================================
# HELPER FUNCTIONS
# ==========================================
async def validate_jwt(authorization: str) -> Dict:
    """Valida JWT do Supabase e retorna payload"""
    try:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Token não fornecido")

        token = authorization.replace("Bearer ", "")

        if not SUPABASE_JWT_SECRET:
            logger.warning("JWT validation skipped - no secret configured")
            return {"sub": "anonymous"}

        payload = jwt.decode(
            token, SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated"
        )

        return payload
    except InvalidTokenError as e:
        logger.error(f"Invalid JWT: {e}")
        raise HTTPException(status_code=401, detail="Token inválido")


async def get_active_ai() -> Optional[Dict]:
    """Busca primeira IA global ativa no Supabase"""
    if not supabase:
        logger.warning("Supabase not configured, using fallback")
        return None

    try:
        # Buscar primeira IA global ativa
        response = (
            supabase.table("GlobalAiConnection")
            .select("*")
            .eq("isActive", True)
            .order("createdAt", desc=False)
            .limit(1)
            .execute()
        )

        if response.data and len(response.data) > 0:
            logger.info(f"✅ Using global AI: {response.data[0].get('name')}")
            return response.data[0]

        logger.warning("⚠️ No active AI found")
        return None

    except Exception as e:
        logger.error(f"Error fetching AI config: {e}")
        return None


async def get_conversation_history(conversation_id: str, limit: int = 10) -> List[Dict]:
    """Busca histórico da conversa no Supabase"""
    if not supabase:
        return []

    try:
        response = (
            supabase.table("ChatMessage")
            .select("*")
            .eq("conversationId", conversation_id)
            .order("createdAt", desc=False)
            .limit(limit)
            .execute()
        )

        return response.data if response.data else []
    except Exception as e:
        logger.error(f"Error fetching history: {e}")
        return []


async def save_message(
    conversation_id: str, role: str, content: str, user_id: Optional[str] = None
):
    """Salva mensagem no Supabase"""
    if not supabase:
        return

    try:
        data = {
            "conversationId": conversation_id,
            "role": role,
            "content": content,
            "createdAt": datetime.utcnow().isoformat(),
        }

        if user_id:
            data["userId"] = user_id

        supabase.table("ChatMessage").insert(data).execute()
        logger.info(f"✅ Message saved: {role}")
    except Exception as e:
        logger.error(f"Error saving message: {e}")


# ==========================================
# HEALTH CHECK
# ==========================================
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "syncads-python-microservice",
        "status": "running",
        "version": "1.0.0-minimal",
        "timestamp": time.time(),
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "syncads-python-microservice",
        "version": "1.0.0-minimal",
        "timestamp": time.time(),
    }


# ==========================================
# IA CHAT ENDPOINT - FULL VERSION
# ==========================================
@app.post("/api/chat")
async def chat(
    request: ChatRequest, authorization: str = Header(None, alias="Authorization")
):
    """Chat com IA integrado ao Supabase + AI Tools"""
    try:
        logger.info(f"📨 Chat request: conversationId={request.conversationId}")

        # 1. Validar JWT
        user_payload = (
            await validate_jwt(authorization) if authorization else {"sub": "anonymous"}
        )
        user_id = request.userId or user_payload.get("sub")

        # 1.5 Verificar se usuário tem extensão conectada
        user_devices = []
        if supabase:
            try:
                response = (
                    supabase.table("extension_devices")
                    .select("*")
                    .eq("user_id", user_id)
                    .eq("status", "online")
                    .execute()
                )
                user_devices = response.data if response.data else []
            except Exception as e:
                logger.error(f"❌ Error fetching devices: {e}")

        has_extension = len(user_devices) > 0

        if has_extension:
            logger.info(
                f"✅ Usuário {user_id} tem {len(user_devices)} extensão(ões) conectada(s)"
            )
        else:
            logger.info(f"⚠️ Usuário {user_id} sem extensões conectadas")

        # 2. Detectar se precisa usar ferramenta AI
        logger.info(f"📝 Mensagem recebida: '{request.message}'")
        tool_intent = detect_tool_intent(request.message)
        logger.info(f"🔍 Detecção de intent resultado: {tool_intent}")
        tool_result = None

        # 2.5 Detectar automação de navegador
        browser_intent = detect_browser_automation_intent(request.message)
        if browser_intent and has_extension:
            logger.info(
                f"🌐 Automação de navegador detectada: {browser_intent['type']}"
            )

            # Criar comando para extensão
            if user_devices:
                device_id = user_devices[0]["device_id"]

                command_data = {
                    "user_id": user_id,
                    "device_id": device_id,
                    "command": browser_intent["type"], # Adjusted to match schema
                    "params": browser_intent["data"],  # Adjusted to match schema
                    "status": "PENDING",               # Adjusted to match schema
                    "created_at": datetime.utcnow().isoformat(),
                }

                try:
                    # Salvar comando no Supabase
                    cmd_response = supabase.table("extension_commands").insert(command_data).execute()

                    if cmd_response.data:
                        command_id = cmd_response.data[0]['id']
                        logger.info(f"✅ Comando criado no DB: {command_id}")

                        # Adicionar ao contexto da resposta
                        tool_result = (
                            f"\n\n[COMANDO DE AUTOMAÇÃO ENVIADO: {browser_intent['type']}]\n"
                        )
                    else:
                        logger.error("❌ Falha ao criar comando: sem dados retornados")
                except Exception as e:
                    logger.error(f"❌ Erro ao salvar comando no Supabase: {e}")

        if tool_intent:
            logger.info(f"🛠️ TOOL DETECTED! Executando ferramenta: {tool_intent}")

            try:
                # NOVO: Verificar se precisa usar extensão do navegador
                if tool_intent in [
                    "dom_automation",
                    "browser_action",
                    "web_automation",
                ]:
                    # Tentar criar comando para extensão
                    try:
                        # Extrair informações do comando da mensagem
                        command_type = "DOM_CLICK"  # Default
                        selector = None
                        value = None

                        # Análise simples da mensagem
                        msg_lower = request.message.lower()
                        if "clicar" in msg_lower or "click" in msg_lower:
                            command_type = "DOM_CLICK"
                        elif (
                            "preencher" in msg_lower
                            or "digitar" in msg_lower
                            or "fill" in msg_lower
                        ):
                            command_type = "DOM_FILL"
                        elif (
                            "ler" in msg_lower
                            or "extrair" in msg_lower
                            or "read" in msg_lower
                        ):
                            command_type = "DOM_READ"
                        elif (
                            "navegar" in msg_lower
                            or "ir para" in msg_lower
                            or "navigate" in msg_lower
                        ):
                            command_type = "NAVIGATE"

                        command_id = await send_command_to_extension(
                            user_id=user_id,
                            command_type=command_type,
                            selector=selector,
                            value=value,
                            options={},
                        )

                        # Aguardar resultado (com timeout)
                        tool_result = await wait_for_command_result(
                            command_id, timeout=30
                        )

                    except Exception as ext_error:
                        logger.error(f"❌ Extension error: {ext_error}")
                        tool_result = {
                            "success": False,
                            "error": str(ext_error),
                            "message": "Erro ao usar extensão. Verifique se está instalada e ativa.",
                        }

                elif tool_intent == "image":
                    # Gerar imagem com Pollinations.ai (gratuito)
                    logger.info(
                        f"🎨 Iniciando geração de imagem com prompt: {request.message}"
                    )
                    image_gen = create_image_generator()
                    tool_result = await image_gen.generate(request.message)
                    logger.info(f"🎨 Resultado da geração: {tool_result}")

                elif tool_intent == "video":
                    # Gerar vídeo com Pollinations.ai (gratuito)
                    logger.info(
                        f"🎬 Iniciando geração de vídeo com prompt: {request.message}"
                    )
                    video_gen = create_video_generator()
                    tool_result = await video_gen.generate_from_prompt(request.message)
                    logger.info(f"🎬 Resultado da geração: {tool_result}")

                elif tool_intent == "search":
                    # Buscar na web
                    query = (
                        request.message.replace("pesquise", "")
                        .replace("busque", "")
                        .replace("procure", "")
                        .strip()
                    )
                    searcher = create_web_searcher()
                    tool_result = await searcher.search(query, num_results=5)

                elif tool_intent == "file":
                    # Placeholder - precisa de nome e conteúdo
                    tool_result = {
                        "success": False,
                        "error": "Criar arquivo requer nome e conteúdo. Use: 'crie arquivo dados.txt com conteúdo: [texto]'",
                    }

                elif tool_intent == "python":
                    # Executar Python
                    code = (
                        request.message.replace("execute python", "")
                        .replace("rode python", "")
                        .strip()
                    )
                    executor = create_python_executor()
                    tool_result = await executor.execute(code)

            except Exception as tool_error:
                logger.error(
                    f"❌ ERRO NA FERRAMENTA {tool_intent}: {tool_error}", exc_info=True
                )
                tool_result = {"success": False, "error": str(tool_error)}
        else:
            logger.info("ℹ️ Nenhuma ferramenta detectada - resposta normal de chat")

        # 3. Salvar mensagem do usuário
        await save_message(request.conversationId, "user", request.message, user_id)

        # 4. Buscar IA global ativa
        ai_config = await get_active_ai()

        # 4. Fallback para variáveis de ambiente se não houver config
        if not ai_config:
            logger.warning("⚠️ No AI config found, using env vars")
            ai_config = {
                "provider": "ANTHROPIC",
                "apiKey": os.getenv("ANTHROPIC_API_KEY"),
                "model": "claude-3-5-sonnet-20241022",
                "maxTokens": 4096,
                "temperature": 0.7,
                "systemPrompt": ENHANCED_SYSTEM_PROMPT,
            }

        # 5. Buscar histórico
        history = await get_conversation_history(request.conversationId, limit=10)

        # 6. Montar mensagens (incluir resultado da ferramenta se houver)
        messages = []
        for msg in history:
            messages.append({"role": msg.get("role"), "content": msg.get("content")})

        # Se usou ferramenta, adicionar resultado ao contexto
        if tool_result:
            tool_context = f"\n\n[TOOL_RESULT]\n{json.dumps(tool_result, indent=2, ensure_ascii=False)}\n[/TOOL_RESULT]\n\nResponda ao usuário sobre o resultado acima de forma amigável."
            messages.append({"role": "system", "content": tool_context})

        # 7. Gerar resposta baseado no provider
        provider = ai_config.get("provider", "ANTHROPIC").upper()
        api_key = ai_config.get("apiKey")
        model = ai_config.get("model", "claude-3-5-sonnet-20241022")
        max_tokens = ai_config.get("maxTokens", 4096)
        temperature = ai_config.get("temperature", 0.7)

        # Usar prompt do banco OU o enhanced prompt
        base_system_prompt = ai_config.get(
            "systemPrompt", "Você é um assistente útil de marketing digital."
        )

        # Condicionar system prompt baseado em extensão
        extension_status = ""
        if has_extension:
            extension_status = """

✅ EXTENSÃO DO NAVEGADOR CONECTADA E ATIVA!

O usuário tem a extensão SyncAds AI instalada e conectada.
Você PODE e DEVE usar os comandos de automação de navegador!

Quando o usuário pedir para:
- Criar campanhas
- Preencher formulários
- Navegar em sites
- Clicar em botões
- Ler dados de páginas

EXECUTE automaticamente usando a extensão!
NUNCA diga "não posso acessar o navegador" - VOCÊ PODE!
"""
        else:
            extension_status = """

⚠️ EXTENSÃO DO NAVEGADOR NÃO CONECTADA

O usuário NÃO tem a extensão SyncAds AI conectada no momento.

Se ele pedir automação de navegador:
1. Informe: "Para realizar essa automação, preciso que você conecte a extensão SyncAds AI"
2. Instrua: "Clique no ícone da extensão no Chrome e clique em 'Conectar'"
3. Ofereça alternativas: "Posso ajudar de outras formas enquanto isso?"

NÃO prometa funcionalidades de navegador sem extensão conectada.
"""

        system_prompt = (
            f"{base_system_prompt}\n\n{ENHANCED_SYSTEM_PROMPT}\n\n{extension_status}"
        )

        logger.info(
            f"🤖 Using provider: {provider}, model: {model}, extension: {has_extension}"
        )

        # 8. Gerar resposta com streaming
        if provider == "ANTHROPIC":
            if not api_key:
                api_key = os.getenv("ANTHROPIC_API_KEY")

            from anthropic import Anthropic

            client = Anthropic(api_key=api_key)

            async def generate():
                full_response = ""
                with client.messages.stream(
                    model=model,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    system=system_prompt,
                    messages=messages,
                ) as stream:
                    for text in stream.text_stream:
                        full_response += text
                        yield f"data: {json.dumps({'text': text})}\n\n"

                # Salvar resposta completa
                await save_message(
                    request.conversationId, "assistant", full_response, user_id
                )
                yield f"data: {json.dumps({'done': True})}\n\n"

            return StreamingResponse(generate(), media_type="text/event-stream")

        elif provider == "OPENAI":
            if not api_key:
                api_key = os.getenv("OPENAI_API_KEY")

            from openai import OpenAI

            client = OpenAI(api_key=api_key)

            async def generate():
                full_response = ""
                stream = client.chat.completions.create(
                    model=model or "gpt-4-turbo-preview",
                    messages=[{"role": "system", "content": system_prompt}] + messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    stream=True,
                )

                for chunk in stream:
                    if chunk.choices[0].delta.content:
                        text = chunk.choices[0].delta.content
                        full_response += text
                        yield f"data: {json.dumps({'text': text})}\n\n"

                await save_message(
                    request.conversationId, "assistant", full_response, user_id
                )
                yield f"data: {json.dumps({'done': True})}\n\n"

            return StreamingResponse(generate(), media_type="text/event-stream")

        elif provider == "GROQ":
            if not api_key:
                api_key = os.getenv("GROQ_API_KEY")

            from groq import Groq

            client = Groq(api_key=api_key)

            async def generate():
                full_response = ""
                stream = client.chat.completions.create(
                    model=model or "mixtral-8x7b-32768",
                    messages=[{"role": "system", "content": system_prompt}] + messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    stream=True,
                )

                for chunk in stream:
                    if chunk.choices[0].delta.content:
                        text = chunk.choices[0].delta.content
                        full_response += text
                        yield f"data: {json.dumps({'text': text})}\n\n"

                await save_message(
                    request.conversationId, "assistant", full_response, user_id
                )
                yield f"data: {json.dumps({'done': True})}\n\n"

            return StreamingResponse(generate(), media_type="text/event-stream")

        else:
            raise HTTPException(
                status_code=400, detail=f"Provider '{provider}' não suportado"
            )

    except Exception as e:
        logger.error(f"❌ Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# EXCEPTION HANDLER
# ==========================================
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Handle all exceptions"""
    logger.error(f"Global exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": str(exc),
            "timestamp": time.time(),
        },
    )


# ==========================================
# EXTENSION HELPER FUNCTIONS
# ==========================================


async def send_command_to_extension(
    user_id: str,
    command_type: str,
    selector: str = None,
    value: str = None,
    options: dict = None,
) -> str:
    """
    Envia comando para extensão do navegador
    """
    try:
        # Buscar device ativo do usuário
        result = (
            supabase.table("extension_devices")
            .select("device_id")
            .eq("user_id", user_id)
            .eq("status", "online")
            .limit(1)
            .execute()
        )

        if not result.data or len(result.data) == 0:
            raise Exception(
                "Nenhuma extensão conectada. Por favor, instale e ative a extensão."
            )

        device_id = result.data[0]["device_id"]

        # Criar comando
        command = (
            supabase.table("extension_commands")
            .insert(
                {
                    "device_id": device_id,
                    "user_id": user_id,
                    "type": command_type,
                    "selector": selector,
                    "value": value,
                    "options": options or {},
                    "status": "pending",
                }
            )
            .execute()
        )

        command_id = command.data[0]["id"]
        logger.info(f"✅ Command created: {command_id}")

        return command_id

                    "success": False,
                    "error": command.get("result", {}).get("error", "Command failed"),
                }

        # Aguardar 500ms antes de verificar novamente
        await asyncio.sleep(0.5)

    # Timeout
    return {"success": False, "error": f"Command timeout after {timeout}s"}


# ==========================================
# EXTENSION API ENDPOINTS
# ==========================================


@app.post("/api/extension/register")
async def register_extension(request: Request):
    """
    Registra dispositivo da extensão
    Body: { deviceId, userId, browser, version, timestamp }
    """
    try:
        data = await request.json()

        logger.info(f"📱 Registrando extensão: {data.get('deviceId')}")

        # Salvar no Supabase
        result = (
            supabase.table("extension_devices")
            .upsert(
                {
                    "device_id": data["deviceId"],
                    "user_id": data.get("userId"),
                    "browser_info": data.get("browser"),
                    "version": data.get("version"),
                    "status": "online",
                    "last_seen": datetime.utcnow().isoformat(),
                }
            )
            .execute()
        )

        logger.info(f"✅ Extension registered: {data['deviceId']}")

        return {
            "success": True,
            "deviceId": data["deviceId"],
            "message": "Extension registered successfully",
        }

    except Exception as e:
        logger.error(f"❌ Registration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/extension/commands")
async def get_extension_commands(deviceId: str):
    """
    Long polling - retorna comandos pendentes para a extensão
    Query: ?deviceId=device_xxx
    """
    try:
        logger.info(f"🔍 Buscando comandos para: {deviceId}")

        # Buscar comandos pendentes no Supabase
        result = (
            supabase.table("extension_commands")
            .select("*")
            .eq("device_id", deviceId)
            .eq("status", "pending")
            .order("created_at")
            .execute()
        )

        commands = result.data if result.data else []

        # Marcar como "processing"
        if commands:
            command_ids = [cmd["id"] for cmd in commands]
            supabase.table("extension_commands").update(
                {"status": "processing", "started_at": datetime.utcnow().isoformat()}
            ).in_("id", command_ids).execute()

            logger.info(f"✅ Retornando {len(commands)} comandos")

        return {"success": True, "commands": commands, "count": len(commands)}

    except Exception as e:
        logger.error(f"❌ Commands fetch error: {e}")
        return {"success": False, "commands": [], "error": str(e)}


@app.post("/api/extension/result")
async def receive_extension_result(request: Request):
    """
    Recebe resultado de comando executado pela extensão
    Body: { deviceId, commandId, result, timestamp }
    """
    try:
        data = await request.json()

        logger.info(f"📥 Recebendo resultado: {data.get('commandId')}")

        # Atualizar comando no Supabase
        supabase.table("extension_commands").update(
            {
                "status": "completed" if data["result"].get("success") else "failed",
                "result": data["result"],
                "completed_at": datetime.utcnow().isoformat(),
            }
        ).eq("id", data["commandId"]).execute()

        logger.info(f"✅ Command result received: {data['commandId']}")

        # Salvar log da execução
        supabase.table("extension_logs").insert(
            {
                "device_id": data["deviceId"],
                "command_id": data["commandId"],
                "result": data["result"],
                "action": "COMMAND_COMPLETED",
                "message": f"Command {data['commandId']} completed",
                "timestamp": data.get("timestamp", int(time.time() * 1000)),
            }
        ).execute()

        return {"success": True, "message": "Result received"}

    except Exception as e:
        logger.error(f"❌ Result error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/extension/log")
async def receive_extension_log(request: Request):
    """
    Recebe logs da extensão
    Body: { deviceId, userId, action, message, data, timestamp }
    """
    try:
        data = await request.json()

        # Salvar log no Supabase
        supabase.table("extension_logs").insert(
            {
                "device_id": data["deviceId"],
                "user_id": data.get("userId"),
                "action": data["action"],
                "message": data["message"],
                "data": data.get("data"),
                "url": data.get("url"),
                "timestamp": data.get("timestamp", int(time.time() * 1000)),
            }
        ).execute()

        logger.info(f"📝 Log recebido: {data['action']} - {data['message']}")

        return {"success": True}

    except Exception as e:
        logger.error(f"❌ Log error: {e}")
        return {"success": False, "error": str(e)}


@app.get("/api/extension/devices/{user_id}")
async def get_user_devices(user_id: str):
    """
    Lista dispositivos conectados de um usuário
    """
    try:
        user_devices = []

        # Buscar no Supabase
        if supabase:
            try:
                result = (
                    supabase.table("extension_devices")
                    .select("*")
                    .eq("user_id", user_id)
                    .execute()
                )
                if result.data:
                    for db_device in result.data:
                        user_devices.append(
                            {
                                "device_id": db_device["device_id"],
                                "browser_info": db_device.get("browser_info"),
                                "version": db_device.get("version"),
                                "status": db_device.get("status"),
                                "last_seen": db_device.get("last_seen"),
                            }
                        )
            except Exception as e:
                logger.warning(f"⚠️ Erro ao buscar devices no Supabase: {e}")

        logger.info(f"📱 Usuário {user_id} tem {len(user_devices)} dispositivos")

        return {"success": True, "devices": user_devices, "count": len(user_devices)}

    except Exception as e:
        logger.error(f"❌ Erro ao buscar dispositivos: {e}")
        return {"success": False, "devices": [], "error": str(e)}


# ==========================================
# STARTUP
# ==========================================
@app.on_event("startup")
async def startup_event():
    """Startup event"""
    logger.info("=" * 50)
    logger.info("🚀 SyncAds Python Microservice - FULL + AI TOOLS + EXTENSION")
    logger.info("=" * 50)
    logger.info("✅ FastAPI iniciado")
    logger.info(f"✅ Docs: /docs")
    logger.info(f"✅ Health: /health")
    logger.info(f"✅ Chat: /api/chat (streaming + Supabase + AI Tools)")
    logger.info(f"✅ Extension API: /api/extension/* (4 endpoints)")
    logger.info(f"✅ Browser Automation: /api/browser-automation/* (Playwright + Browser-Use)")
    logger.info(f"✅ Supabase: {'Connected' if supabase else 'Not configured'}")
    logger.info("✅ AI Tools: Image, Video, Search, Files, Python")
    logger.info("=" * 50)


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event"""
    logger.info("🛑 SyncAds Python Microservice - Encerrando...")
