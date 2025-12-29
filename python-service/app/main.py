"""
SyncAds Playwright Service - MINIMAL (apenas automação)
Versão simplificada para funcionar no Hugging Face
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from playwright.async_api import async_playwright
from typing import Optional

app = FastAPI(
    title="SyncAds Playwright Service",
    description="Serviço de automação web com Playwright",
    version="1.0.0"
)

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
# GLOBAL BROWSER
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
    return {
        "status": "ok",
        "service": "SyncAds Playwright Automation",
        "version": "1.0.0",
        "endpoints": {
            "/automation": "Browser automation (navigate, type, click)",
            "/health": "Health check"
        }
    }

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
    Executa ação de automação no navegador
    """
    try:
        page = await get_browser()
        action = request.action.lower()
        
        print(f"📋 Executando: {action}")
        
        # NAVIGATE
        if action == "navigate":
            if not request.url:
                return {"success": False, "message": "URL required"}
            
            print(f"🌐 Navegando para: {request.url}")
            await page.goto(request.url, wait_until="domcontentloaded", timeout=15000)
            
            title = await page.title()
            url = page.url
            
            return {
                "success": True,
                "message": f"✅ Página aberta: {title}",
                "data": {"title": title, "url": url}
            }
        
        # TYPE
        elif action == "type":
            if not request.text or not request.selector:
                return {"success": False, "message": "text and selector required"}
            
            print(f"⌨️  Digitando em {request.selector}")
            await page.fill(request.selector, request.text)
            
            return {
                "success": True,
                "message": f"✅ Texto digitado"
            }
        
        # CLICK
        elif action == "click":
            if not request.selector:
                return {"success": False, "message": "selector required"}
            
            print(f"👆 Clicando em: {request.selector}")
            await page.click(request.selector)
            
            return {
                "success": True,
                "message": f"✅ Clicado"
            }

        # SCREENSHOT (Added by Auto-Fix)
        elif action == "screenshot":
            import base64
            # Take screenshot
            screenshot_bytes = await page.screenshot(full_page=False)
            # Convert to base64
            b64 = base64.b64encode(screenshot_bytes).decode('utf-8')
            
            return {
                "success": True, 
                "message": "📸 Screenshot capturado",
                "screenshot": b64
            }
        
        else:
            return {"success": False, "message": f"Ação desconhecida: {action}"}
    
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
        return {
            "success": False,
            "message": f"❌ Erro: {str(e)}"
        }

@app.on_event("shutdown")
async def shutdown():
    """Cleanup"""
    global browser
    if browser:
        await browser.close()
        print("🛑 Browser fechado")
