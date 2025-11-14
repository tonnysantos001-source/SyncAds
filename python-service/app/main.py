"""
============================================
SYNCADS PYTHON MICROSERVICE - MAIN
============================================
FastAPI Server com todas as capacidades
Python 3.10+
============================================
"""

import os
import sys
import time
from contextlib import asynccontextmanager
from typing import Any, Dict

import uvicorn
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from loguru import logger

# Configurar logging
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level="INFO",
)

# Importar routers
from app.routers import (
    automation,
    data_analysis,
    images,
    ml,
    nlp,
    pdf,
    python_executor,
    scraping,
    shopify,
)

# ==========================================
# LIFESPAN EVENTS
# ==========================================


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerenciar ciclo de vida da aplicação"""
    logger.info("🚀 Iniciando SyncAds Python Microservice...")

    # Startup
    logger.info("✅ Carregando modelos de IA...")
    # Aqui você pode pré-carregar modelos ML/NLP

    logger.info("✅ Conectando ao banco de dados...")
    # Inicializar conexões de banco se necessário

    logger.info("✅ Microservice pronto!")

    yield

    # Shutdown
    logger.info("🛑 Encerrando microservice...")
    logger.info("✅ Limpeza concluída!")


# ==========================================
# FASTAPI APP
# ==========================================

app = FastAPI(
    title="SyncAds Python Microservice",
    description="Microserviço Python para scraping, IA, ML, processamento de imagens e mais",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ==========================================
# CORS MIDDLEWARE
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://syncads.com.br",
        "https://www.syncads.com.br",
        "https://*.vercel.app",
        "*",  # Em produção, especifique os domínios exatos
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# MIDDLEWARE DE LOGGING
# ==========================================


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log todas as requisições"""
    start_time = time.time()

    # Log da requisição
    logger.info(f"📥 {request.method} {request.url.path}")

    # Processar requisição
    response = await call_next(request)

    # Calcular tempo de processamento
    process_time = time.time() - start_time

    # Log da resposta
    logger.info(
        f"📤 {request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Tempo: {process_time:.2f}s"
    )

    # Adicionar header de tempo de processamento
    response.headers["X-Process-Time"] = str(process_time)

    return response


# ==========================================
# ERROR HANDLERS
# ==========================================


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handler para HTTPException"""
    logger.error(f"❌ HTTPException: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail, "status_code": exc.status_code},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handler para exceções gerais"""
    logger.error(f"💥 Exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc),
        },
    )


# ==========================================
# HEALTH CHECK
# ==========================================


@app.get("/")
async def root():
    """Endpoint raiz"""
    return {
        "service": "SyncAds Python Microservice",
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "syncads-python-microservice",
        "version": "1.0.0",
        "timestamp": time.time(),
    }


@app.get("/ping")
async def ping():
    """Ping endpoint"""
    return {"message": "pong"}


# ==========================================
# INCLUDE ROUTERS
# ==========================================

# Scraping
app.include_router(scraping.router, prefix="/api/scraping", tags=["Scraping"])

# Shopify
app.include_router(shopify.router, prefix="/api/shopify", tags=["Shopify"])

# Imagens
app.include_router(images.router, prefix="/api/images", tags=["Images"])

# PDF
app.include_router(pdf.router, prefix="/api/pdf", tags=["PDF"])

# Machine Learning
app.include_router(ml.router, prefix="/api/ml", tags=["Machine Learning"])

# NLP
app.include_router(nlp.router, prefix="/api/nlp", tags=["NLP"])

# Data Analysis
app.include_router(data_analysis.router, prefix="/api/data", tags=["Data Analysis"])

# Python Executor
app.include_router(
    python_executor.router, prefix="/api/python", tags=["Python Executor"]
)

# Automation
app.include_router(automation.router, prefix="/api/automation", tags=["Automation"])

# ==========================================
# STARTUP MESSAGE
# ==========================================


@app.on_event("startup")
async def startup_event():
    """Mensagem de startup"""
    logger.info("=" * 60)
    logger.info("🚀 SyncAds Python Microservice ONLINE")
    logger.info("=" * 60)
    logger.info("📚 Documentação: http://localhost:8000/docs")
    logger.info("🏥 Health Check: http://localhost:8000/health")
    logger.info("=" * 60)


# ==========================================
# RUN SERVER
# ==========================================

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,  # Apenas em desenvolvimento
        log_level="info",
        access_log=True,
    )
