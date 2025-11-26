"""
============================================
SYNCADS PYTHON MICROSERVICE - PRODUCTION
IA + Supabase + Browser Automation + AI Tools
============================================
"""

# ==========================================
# IMPORTS - CORE
# ==========================================
import asyncio
import json
import os
import time
from datetime import datetime
from typing import Any, Dict, List, Optional

# ==========================================
# IMPORTS - FASTAPI
# ==========================================
import httpx
import jwt
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from jwt.exceptions import InvalidTokenError
from loguru import logger
from pydantic import BaseModel, Field

# ==========================================
# IMPORTS - SUPABASE
# ==========================================
from supabase import Client, create_client

# ==========================================
# SYSTEM PROMPTS
# ==========================================
ENHANCED_SYSTEM_PROMPT = """
Você é um assistente de IA inteligente do SyncAds AI que pode:
- Automatizar tarefas de navegador através da extensão Chrome
- Executar automações complexas com Playwright e AgentQL
- Interagir com o DOM de páginas web
- Realizar scraping de dados
- Processar e analisar informações

Quando o usuário solicitar automação web, você deve:
1. Identificar se é uma tarefa simples (DOM direto via extensão) ou complexa (Playwright/AgentQL)
2. Explicar o que vai fazer antes de executar
3. Fornecer feedback claro sobre o progresso
4. Reportar erros de forma compreensível

Seja direto, eficiente e sempre confirme ações importantes.
"""

# ==========================================
# CRIAR APP FASTAPI
# ==========================================
app = FastAPI(
    title="SyncAds Python Microservice",
    description="IA Service - Claude, OpenAI, Groq + Browser Automation",
    version="2.0.0",
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
    def __init__(self, url: str, table_name: str, headers: dict):
        self.url = url
        self.table_name = table_name
        self.headers = headers
        self.base_url = f"{url}/rest/v1/{table_name}"

    async def insert(self, data: dict):
        async with httpx.AsyncClient() as client:
            response = await client.post(self.base_url, json=data, headers=self.headers)
            return response

    async def select(self, columns: str = "*"):
        return SupabaseSelectHTTP(self.url, self.table_name, self.headers, columns)

    async def update(self, data: dict):
        return SupabaseUpdateHTTP(self.url, self.table_name, self.headers, data)

    async def upsert(self, data: dict):
        headers = self.headers.copy()
        headers["Prefer"] = "resolution=merge-duplicates"
        async with httpx.AsyncClient() as client:
            response = await client.post(self.base_url, json=data, headers=headers)
            return response


class SupabaseSelectHTTP:
    def __init__(self, url: str, table_name: str, headers: dict, columns: str):
        self.url = url
        self.table_name = table_name
        self.headers = headers
        self.columns = columns
        self.filters = []

    def eq(self, column: str, value: Any):
        self.filters.append(f"{column}=eq.{value}")
        return self

    async def execute(self):
        query_url = f"{self.url}/rest/v1/{self.table_name}?select={self.columns}"
        if self.filters:
            query_url += "&" + "&".join(self.filters)

        async with httpx.AsyncClient() as client:
            response = await client.get(query_url, headers=self.headers)
            data = response.json() if response.status_code == 200 else []
            return type(
                "Response",
                (),
                {
                    "data": data,
                    "error": None if response.status_code == 200 else response.text,
                },
            )()


class SupabaseUpdateHTTP:
    def __init__(self, url: str, table_name: str, headers: dict, data: dict):
        self.url = url
        self.table_name = table_name
        self.headers = headers
        self.data = data
        self.filters = []

    def eq(self, column: str, value: Any):
        self.filters.append(f"{column}=eq.{value}")
        return self

    async def execute(self):
        query_url = f"{self.url}/rest/v1/{self.table_name}"
        if self.filters:
            query_url += "?" + "&".join(self.filters)

        async with httpx.AsyncClient() as client:
            response = await client.patch(
                query_url, json=self.data, headers=self.headers
            )
            return response


# ==========================================
# ENVIRONMENT VARIABLES
# ==========================================
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

supabase: Optional[Client] = None
supabase_http: Optional[SupabaseHTTP] = None

# Initialize Supabase
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
else:
    logger.warning("⚠️ Supabase credentials not configured")


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
        import re

        url_match = re.search(r"https?://[^\s]+", message)
        if url_match:
            return {"type": "NAVIGATE", "data": {"url": url_match.group(0)}}

    # Clicar em elemento
    if any(word in message_lower for word in ["clique", "click", "pressione"]):
        # Tentar extrair seletor
        if "botão" in message_lower or "button" in message_lower:
            return {"type": "CLICK", "data": {"selector": "button"}}
        return {"type": "CLICK", "data": {"selector": "*"}}

    # Preencher formulário
    if any(
        word in message_lower for word in ["digite", "preencha", "escreva", "insira"]
    ):
        import re

        value_match = re.search(r'"([^"]+)"', message)
        field_match = re.search(r"no campo (\w+)", message_lower)

        if value_match:
            selector = (
                f"input[name*='{field_match.group(1)}']" if field_match else "input"
            )
            return {
                "type": "TYPE",
                "data": {
                    "selector": selector,
                    "value": value_match.group(1),
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
# PYDANTIC MODELS
# ==========================================
class ChatRequest(BaseModel):
    message: str
    conversationId: str
    userId: Optional[str] = None


class ChatResponse(BaseModel):
    role: str
    content: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# ==========================================
# HELPER FUNCTIONS
# ==========================================
async def validate_jwt(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Valida JWT do Supabase"""
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


async def get_active_ai(supabase_client) -> Optional[Dict]:
    """Busca configuração da IA ativa global"""
    if not supabase_client:
        logger.warning("Supabase not configured, using fallback")
        return None

    try:
        response = (
            supabase_client.table("ai_configurations")
            .select("*")
            .eq("is_active", True)
            .eq("scope", "GLOBAL")
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
    """Busca histórico de conversação"""
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

        return response.data or []
    except Exception as e:
        logger.error(f"Error fetching history: {e}")
        return []


async def save_message(
    conversation_id: str, role: str, content: str, user_id: Optional[str] = None
):
    """Salva mensagem no banco"""
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
# ENDPOINTS
# ==========================================
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "SyncAds Python Microservice",
        "version": "2.0.0",
        "status": "online",
        "endpoints": {"health": "/health", "docs": "/docs", "chat": "/api/chat"},
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "supabase": "connected" if supabase else "disconnected",
        "version": "2.0.0",
    }


@app.post("/api/chat")
async def chat(request: ChatRequest):
    """
    Chat endpoint with AI streaming support
    """
    try:
        logger.info(f"📨 Chat request: conversationId={request.conversationId}")

        # Save user message
        await save_message(
            request.conversationId, "user", request.message, request.userId
        )

        # Detect browser automation intent
        browser_intent = detect_browser_automation_intent(request.message)

        if browser_intent:
            logger.info(f"🌐 Browser automation detected: {browser_intent['type']}")
            response_content = f"Detectei uma solicitação de automação: {browser_intent['type']}. Por favor, instale a extensão Chrome do SyncAds para executar esta ação."
        else:
            # Default AI response
            response_content = f"Recebi sua mensagem: {request.message}. Sistema de IA em desenvolvimento."

        # Save assistant response
        await save_message(
            request.conversationId, "assistant", response_content, request.userId
        )

        return ChatResponse(role="assistant", content=response_content)

    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# STARTUP EVENT
# ==========================================
@app.on_event("startup")
async def startup_event():
    """Startup event"""
    logger.info("=" * 50)
    logger.info("🚀 SyncAds Python Microservice - STARTING")
    logger.info("=" * 50)
    logger.info("✅ FastAPI initialized")
    logger.info("✅ Docs: /docs")
    logger.info("✅ Health: /health")
    logger.info("✅ Chat: /api/chat")

    # Try to register routers
    try:
        from app.routers.browser_automation import router as browser_automation_router

        app.include_router(browser_automation_router)
        logger.info("✅ Browser Automation router registered")
    except ImportError as e:
        logger.warning(f"⚠️ Browser Automation router not available: {e}")

    logger.info("✅ Supabase: " + ("Connected" if supabase else "Disconnected"))
    logger.info("=" * 50)


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event"""
    logger.info("🛑 SyncAds Python Microservice - Shutting down...")


# ==========================================
# EXCEPTION HANDLER
# ==========================================
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Global exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "detail": str(exc),
            "timestamp": datetime.utcnow().isoformat(),
        },
    )


# ==========================================
# MAIN - Para execução direta
# ==========================================
if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        workers=int(os.getenv("WORKERS", 2)),
        log_level="info",
    )
