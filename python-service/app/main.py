"""
============================================
SYNCADS PYTHON MICROSERVICE - FULL
IA + Supabase + Streaming + AI Tools
============================================
"""

# ==========================================
# IMPORTS PRINCIPAIS
# ==========================================
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
# HEALTH CHECK
# ==========================================
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
# RAILWAY: Run directly via Python
# ==========================================
if __name__ == "__main__":
    import uvicorn
    import os
    
    # Ler PORT do environment (Railway injeta isso)
    port = int(os.getenv("PORT", "8000"))
    
    print("=" * 50)
    print(f"🚀 Starting SyncAds Python Microservice")
    print(f"📍 Host: 0.0.0.0")
    print(f"🔌 Port: {port}")
    print(f"⚙️  Workers: 1")
    print("=" * 50)
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        workers=1,
        log_level="info",
        access_log=True
    )
