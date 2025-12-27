#!/usr/bin/env python3
"""
Deploy MINIMAL: main.py apenas com Playwright (sem imports problemáticos)
"""
from huggingface_hub import HfApi, login
import os

TOKEN = "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"
SPACE_ID = "Bigodetonton/SyncAds"
LOCAL_DIR = r"c:\Users\dinho\Documents\GitHub\SyncAds\python-service"

def main():
    print("🔧 Deploy MINIMAL: Apenas Playwright (funcional)...")
    
    login(token=TOKEN)
    api = HfApi()
    
    main_file = os.path.join(LOCAL_DIR, "app", "main.py")
    
    print("📤 Uploading app/main.py MINIMAL...")
    api.upload_file(
        path_or_fileobj=main_file,
        path_in_repo="app/main.py",
        repo_id=SPACE_ID,
        repo_type="space",
        token=TOKEN,
        commit_message="Simplify: main.py with ONLY Playwright automation (no other routers)"
    )
    
    print("✅ DEPLOY MINIMAL COMPLETO!")
    print("🔄 Rebuild em ~30s")
    print(f"🌐 https://huggingface.co/spaces/{SPACE_ID}")
    print("\n🎯 VERSÃO SIMPLIFICADA - DEVE FUNCIONAR!")
    print("Endpoints: /automation (navigate, type, click)")

if __name__ == "__main__":
    main()
