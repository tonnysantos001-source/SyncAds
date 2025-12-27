#!/usr/bin/env python3
"""
Re-deploy V3 FINAL: Dockerfile sem playwright install-deps
"""
from huggingface_hub import HfApi, login
import os

TOKEN = "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"
SPACE_ID = "Bigodetonton/SyncAds"
LOCAL_DIR = r"c:\Users\dinho\Documents\GitHub\SyncAds\python-service"

def main():
    print("🔧 Deploy V3 FINAL: Dockerfile corrigido (sem install-deps)...")
    
    login(token=TOKEN)
    api = HfApi()
    
    dockerfile = os.path.join(LOCAL_DIR, "Dockerfile")
    
    print("📤 Uploading Dockerfile V3...")
    api.upload_file(
        path_or_fileobj=dockerfile,
        path_in_repo="Dockerfile",
        repo_id=SPACE_ID,
        repo_type="space",
        token=TOKEN,
        commit_message="Fix V3: Remove playwright install-deps, add all deps to apt-get"
    )
    
    print("✅ Deploy V3 completo!")
    print("🔄 Build final iniciará em ~30s")
    print(f"🌐 https://huggingface.co/spaces/{SPACE_ID}")
    print("\n🎯 ESTA VERSÃO DEVE FUNCIONAR!")

if __name__ == "__main__":
    main()
