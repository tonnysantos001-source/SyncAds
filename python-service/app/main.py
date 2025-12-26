"""
🎭 PLAYWRIGHT AUTOMATION SERVICE V2
Arquitetura limpa e simples para automação web
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from playwright.async_api import async_playwright
import asyncio
from typing import Optional

app = FastAPI(title="SyncAds Playwright Service V2")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# MODELS
# =====================================================
class AutomationRequest(BaseModel):
    action: str  # "navigate", "type", "click"
    url: Optional[str] = None
    text: Optional[str] = None
    selector: Optional[str] = None

# =====================================================
# GLOBAL BROWSER (reuso para performance)
# =====================================================
browser = None
context = None
page = None

async def get_browser():
    """Inicializa ou retorna browser existente"""
    global browser, context, page
    
    if browser is None or not browser.is_connected():
        print("🚀 Iniciando Playwright...")
        playwright = await async_playwright().start()
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        print("✅ Browser pronto")
    
    return page

# =====================================================
# ENDPOINTS
# =====================================================
@app.get("/")
async def root():
    return {"status": "ok", "service": "Playwright Automation V2"}

@app.get("/health")
async def health():
    """Health check"""
    is_alive = browser is not None and browser.is_connected()
    return {
        "status": "healthy" if is_alive else "initializing",
        "browser_active": is_alive
    }

@app.post("/automation")
async def automation(request: AutomationRequest):
    """
    Executa ação de automação
    
    Ações suportadas:
    - navigate: Navega para URL
    - type: Digita texto
    - click: Clica em elemento
    """
    try:
        page = await get_browser()
        action = request.action.lower()
        
        print(f"📋 Executando: {action}")
        
        # NAVIGATE
        if action == "navigate":
            if not request.url:
                raise HTTPException(400, "URL required for navigate")
            
            print(f"🌐 Navegando para: {request.url}")
            await page.goto(request.url, wait_until="domcontentloaded", timeout=15000)
            
            title = await page.title()
            url = page.url
            
            return {
                "success": True,
                "message": f"✅ Página aberta: {title}",
                "data": {
                    "title": title,
                    "url": url
                }
            }
        
        # TYPE
        elif action == "type":
            if not request.text or not request.selector:
                raise HTTPException(400, "text and selector required for type")
            
            print(f"⌨️  Digitando '{request.text}' em {request.selector}")
            await page.fill(request.selector, request.text)
            
            return {
                "success": True,
                "message": f"✅ Texto digitado: {request.text[:50]}..."
            }
        
        # CLICK
        elif action == "click":
            if not request.selector:
                raise HTTPException(400, "selector required for click")
            
            print(f"👆 Clicando em: {request.selector}")
            await page.click(request.selector)
            
            return {
                "success": True,
                "message": f"✅ Clicado em: {request.selector}"
            }
        
        else:
            raise HTTPException(400, f"Ação desconhecida: {action}")
    
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
        return {
            "success": False,
            "message": f"❌ Erro: {str(e)}"
        }

@app.on_event("shutdown")
async def shutdown():
    """Cleanup ao desligar"""
    global browser
    if browser:
        await browser.close()
        print("🛑 Browser fechado")

# Run
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
