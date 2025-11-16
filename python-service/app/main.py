"""
============================================
SYNCADS PYTHON MICROSERVICE - FULL
IA + Supabase + Streaming
============================================
"""

import os
import sys
import time
import json
from typing import Dict, Optional, List
from datetime import datetime

from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from loguru import logger
from pydantic import BaseModel
from supabase import create_client, Client
import jwt
from jwt.exceptions import InvalidTokenError
</text>

<old_text line=25>
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

# Configurar logging
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan> - <level>{message}</level>",
    level="INFO",
)

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
# MODELS
# ==========================================
class ChatRequest(BaseModel):
    message: str
    conversationId: str
    userId: Optional[str] = None
    organizationId: Optional[str] = None


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
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )

        return payload
    except InvalidTokenError as e:
        logger.error(f"Invalid JWT: {e}")
        raise HTTPException(status_code=401, detail="Token inválido")


async def get_active_ai(organization_id: Optional[str] = None) -> Optional[Dict]:
    """Busca IA ativa da organização no Supabase"""
    if not supabase:
        logger.warning("Supabase not configured, using fallback")
        return None

    try:
        if organization_id:
            # Buscar IA da organização
            response = supabase.table("OrganizationAiConnection").select(
                "*, GlobalAiConnection(*)"
            ).eq("organizationId", organization_id).eq("isDefault", True).limit(1).execute()

            if response.data and len(response.data) > 0:
                ai_config = response.data[0].get("GlobalAiConnection")
                if ai_config and ai_config.get("isActive"):
                    logger.info(f"✅ Using org AI: {ai_config.get('name')}")
                    return ai_config

        # Fallback: buscar primeira IA global ativa
        response = supabase.table("GlobalAiConnection").select("*").eq(
            "isActive", True
        ).order("createdAt", desc=False).limit(1).execute()

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
        response = supabase.table("ChatMessage").select("*").eq(
            "conversationId", conversation_id
        ).order("createdAt", desc=False).limit(limit).execute()

        return response.data if response.data else []
    except Exception as e:
        logger.error(f"Error fetching history: {e}")
        return []


async def save_message(conversation_id: str, role: str, content: str, user_id: Optional[str] = None):
    """Salva mensagem no Supabase"""
    if not supabase:
        return

    try:
        data = {
            "conversationId": conversation_id,
            "role": role,
            "content": content,
            "createdAt": datetime.utcnow().isoformat()
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
async def chat(request: ChatRequest, authorization: str = Header(None, alias="Authorization")):
    """Chat com IA integrado ao Supabase"""
    try:
        logger.info(f"📨 Chat request: conversationId={request.conversationId}")

        # 1. Validar JWT
        user_payload = await validate_jwt(authorization) if authorization else {"sub": "anonymous"}
        user_id = request.userId or user_payload.get("sub")

        # 2. Salvar mensagem do usuário
        await save_message(request.conversationId, "user", request.message, user_id)

        # 3. Buscar IA ativa da organização
        ai_config = await get_active_ai(request.organizationId)

        # 4. Fallback para variáveis de ambiente se não houver config
        if not ai_config:
            logger.warning("⚠️ No AI config found, using env vars")
            ai_config = {
                "provider": "ANTHROPIC",
                "apiKey": os.getenv("ANTHROPIC_API_KEY"),
                "model": "claude-3-5-sonnet-20241022",
                "maxTokens": 4096,
                "temperature": 0.7,
                "systemPrompt": "Você é um assistente útil."
            }

        # 5. Buscar histórico
        history = await get_conversation_history(request.conversationId, limit=10)

        # 6. Montar mensagens
        messages = []
        for msg in history:
            messages.append({
                "role": msg.get("role"),
                "content": msg.get("content")
            })

        # 7. Gerar resposta baseado no provider
        provider = ai_config.get("provider", "ANTHROPIC").upper()
        api_key = ai_config.get("apiKey")
        model = ai_config.get("model", "claude-3-5-sonnet-20241022")
        max_tokens = ai_config.get("maxTokens", 4096)
        temperature = ai_config.get("temperature", 0.7)
        system_prompt = ai_config.get("systemPrompt", "Você é um assistente útil.")

        logger.info(f"🤖 Using provider: {provider}, model: {model}")

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
                    messages=messages
                ) as stream:
                    for text in stream.text_stream:
                        full_response += text
                        yield f"data: {json.dumps({'text': text})}\n\n"

                # Salvar resposta completa
                await save_message(request.conversationId, "assistant", full_response, user_id)
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
                    stream=True
                )

                for chunk in stream:
                    if chunk.choices[0].delta.content:
                        text = chunk.choices[0].delta.content
                        full_response += text
                        yield f"data: {json.dumps({'text': text})}\n\n"

                await save_message(request.conversationId, "assistant", full_response, user_id)
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
                    stream=True
                )

                for chunk in stream:
                    if chunk.choices[0].delta.content:
                        text = chunk.choices[0].delta.content
                        full_response += text
                        yield f"data: {json.dumps({'text': text})}\n\n"

                await save_message(request.conversationId, "assistant", full_response, user_id)
                yield f"data: {json.dumps({'done': True})}\n\n"

            return StreamingResponse(generate(), media_type="text/event-stream")

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Provider '{provider}' não suportado"
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
# STARTUP
# ==========================================
@app.on_event("startup")
async def startup_event():
    """Startup event"""
    logger.info("=" * 50)
    logger.info("🚀 SyncAds Python Microservice - FULL")
    logger.info("=" * 50)
    logger.info("✅ FastAPI iniciado")
    logger.info(f"✅ Docs: /docs")
    logger.info(f"✅ Health: /health")
    logger.info(f"✅ Chat: /api/chat (streaming + Supabase)")
    logger.info(f"✅ Supabase: {'Connected' if supabase else 'Not configured'}")
    logger.info("=" * 50)


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event"""
    logger.info("🛑 SyncAds Python Microservice - Encerrando...")
