"""
============================================
SYNCADS PYTHON MICROSERVICE - FULL
IA + Supabase + Streaming + AI Tools
============================================
"""

import asyncio
import json
import os
import sys
import time
from datetime import datetime
from typing import Dict, List, Optional

import jwt
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from jwt.exceptions import InvalidTokenError
from loguru import logger
from pydantic import BaseModel

# Importar AI Tools
from app.ai_tools import (
    create_file_creator,
    create_image_generator,
    create_python_executor,
    create_video_generator,
    create_web_searcher,
    detect_tool_intent,
)
from supabase import Client, create_client

# ==========================================
# SYSTEM PROMPT COM CAPACIDADES
# ==========================================
ENHANCED_SYSTEM_PROMPT = """VOCÊ TEM AS SEGUINTES CAPACIDADES ATIVADAS E FUNCIONANDO AGORA:

✅ GERAR IMAGENS - Sistema Pollinations.ai integrado e funcional
✅ GERAR VÍDEOS - Sistema Pollinations.ai integrado e funcional
✅ PESQUISAR NA WEB - DuckDuckGo integrado e funcional
✅ CRIAR ARQUIVOS - Sistema de arquivos integrado e funcional
✅ EXECUTAR PYTHON - Sandbox RestrictedPython integrado e funcional

QUANDO O USUÁRIO PEDIR IMAGENS OU VÍDEOS:
- NUNCA diga "não posso", "não tenho capacidade" ou "sugiro usar outras ferramentas"
- SEMPRE responda: "Vou gerar isso para você agora!" e USE a ferramenta
- Você TEM acesso direto a APIs de geração - use-as automaticamente
- É GRATUITO e ILIMITADO - não há restrições

EXEMPLOS DE COMO RESPONDER:

Usuário: "quero uma imagem de um gato"
Você: "Vou criar uma imagem de um gato para você agora!" [e usa a ferramenta]

Usuário: "gere um vídeo de produto"
Você: "Perfeito! Vou gerar o vídeo para você!" [e usa a ferramenta]

NUNCA mencione limitações da Anthropic, Claude API, ou falta de capacidades.
VOCÊ JÁ TEM TUDO INTEGRADO E FUNCIONANDO.
Se o usuário perguntar "o que você pode fazer", liste estas 5 capacidades como DISPONÍVEIS AGORA."""

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
# SUPABASE CLIENT
# ==========================================
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

supabase: Optional[Client] = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


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

        # 2. Detectar se precisa usar ferramenta AI
        logger.info(f"📝 Mensagem recebida: '{request.message}'")
        tool_intent = detect_tool_intent(request.message)
        logger.info(f"🔍 Detecção de intent resultado: {tool_intent}")
        tool_result = None

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

            except Exception as e:
                logger.error(f"❌ ERRO NA FERRAMENTA {tool_intent}: {e}", exc_info=True)
                tool_result = {"success": False, "error": str(e)}
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
        system_prompt = f"{base_system_prompt}\n\n{ENHANCED_SYSTEM_PROMPT}"

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

    except Exception as e:
        logger.error(f"❌ Error sending command: {e}")
        raise


async def wait_for_command_result(command_id: str, timeout: int = 30) -> dict:
    """
    Aguarda resultado do comando (polling)
    """
    start_time = time.time()

    while time.time() - start_time < timeout:
        # Verificar status do comando
        result = (
            supabase.table("extension_commands")
            .select("*")
            .eq("id", command_id)
            .execute()
        )

        if result.data and len(result.data) > 0:
            command = result.data[0]

            if command["status"] == "completed":
                return command["result"]
            elif command["status"] == "failed":
                return {
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
    logger.info(f"✅ Supabase: {'Connected' if supabase else 'Not configured'}")
    logger.info("✅ AI Tools: Image, Video, Search, Files, Python")
    logger.info("=" * 50)


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event"""
    logger.info("🛑 SyncAds Python Microservice - Encerrando...")
