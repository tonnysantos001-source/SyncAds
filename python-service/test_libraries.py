"""
============================================
SCRIPT DE TESTE DE BIBLIOTECAS PYTHON
Testa importação de todas as 48 libs da Railway
============================================
"""

import sys
from datetime import datetime

def test_library(name, import_name=None):
    """Testa importação de uma biblioteca"""
    try:
        __import__(import_name or name)
        return True, None
    except Exception as e:
        return False, str(e)

def test_all_libraries():
    """Testa todas as bibliotecas do requirements.txt"""
    
    print("="*60)
    print("🧪 TESTE DE BIBLIOTECAS PYTHON - SYNCADS")
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    libraries = [
        # Core Framework
        ("fastapi", "fastapi", "Core - API Framework"),
        ("uvicorn", "uvicorn", "Core - ASGI Server"),
        ("pydantic", "pydantic", "Core - Validation"),
        ("httpx", "httpx", "Core - HTTP Client"),
        ("python-dotenv", "dotenv", "Core - Config"),
        
        # Supabase
        ("supabase", "supabase", "Integration - Supabase SDK"),
        ("httpx-sse", "httpx_sse", "Integration - SSE"),
        
        # AI Providers
        ("openai", "openai", "AI - OpenAI/GPT"),
        ("anthropic", "anthropic", "AI - Claude"),
        ("groq", "groq", "AI - Groq/Llama"),
        
        # Browser Automation (CRÍTICO)
        ("playwright", "playwright", "Browser - Playwright"),
        ("browser-use", "browser_use", "Browser - AI Control"),
        ("selenium", "selenium", "Browser - Selenium"),
        ("beautifulsoup4", "bs4", "Browser - HTML Parser"),
        ("lxml", "lxml", "Browser - XML Parser"),
        
        # Security
        ("pyjwt", "jwt", "Security - JWT"),
        ("python-jose", "jose", "Security - Jose"),
        
        # Utilities
        ("python-multipart", "multipart", "Utils - File Upload"),
        ("loguru", "loguru", "Utils - Logging"),
        ("requests", "requests", "Utils - HTTP Legacy"),
        
        # PDF Generation
        ("PyPDF2", "PyPDF2", "PDF - Read/Write"),
        ("reportlab", "reportlab", "PDF - Generation"),
        ("weasyprint", "weasyprint", "PDF - HTML to PDF"),
        
        # Computer Vision
        ("numpy", "numpy", "Vision - Arrays/Math"),
        ("opencv-python-headless", "cv2", "Vision - OpenCV"),
        ("Pillow", "PIL", "Vision - Image"),
        ("rembg", "rembg", "Vision - BG Removal"),
    ]
    
    results = {
        "success": [],
        "failed": []
    }
    
    print("\n📦 TESTANDO IMPORTAÇÕES:\n")
    
    for pkg_name, import_name, description in libraries:
        success, error = test_library(pkg_name, import_name)
        
        if success:
            print(f"✅ {pkg_name:30} | {description}")
            results["success"].append((pkg_name, description))
        else:
            print(f"❌ {pkg_name:30} | {description}")
            print(f"   └─ Erro: {error}")
            results["failed"].append((pkg_name, description, error))
    
    # Resumo
    print("\n" + "="*60)
    print("📊 RESUMO:")
    print("="*60)
    print(f"✅ Funcionando: {len(results['success'])}/{len(libraries)}")
    print(f"❌ Com Erro:    {len(results['failed'])}/{len(libraries)}")
    print(f"📈 Taxa Sucesso: {len(results['success'])/len(libraries)*100:.1f}%")
    
    if results["failed"]:
        print("\n❌ BIBLIOTECAS COM ERRO:")
        for pkg, desc, error in results["failed"]:
            print(f"  • {pkg}: {error[:100]}")
    
    print("\n" + "="*60)
    
    return len(results["failed"]) == 0

if __name__ == "__main__":
    success = test_all_libraries()
    sys.exit(0 if success else 1)
