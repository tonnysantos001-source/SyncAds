#!/usr/bin/env python3
"""
Re-deploy para Hugging Face Spaces (apenas Dockerfile corrigido)
"""
from huggingface_hub import HfApi, login
import os

# Token
TOKEN = "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"

# Configurações
SPACE_ID = "Bigodetonton/SyncAds"
LOCAL_DIR = r"c:\Users\dinho\Documents\GitHub\SyncAds\python-service"

def main():
    print("🔧 Re-deploying Dockerfile corrigido...")
    
    # Login
    login(token=TOKEN)
    
    # API client
    api = HfApi()
    
    # Upload apenas Dockerfile
    dockerfile_path = os.path.join(LOCAL_DIR, "Dockerfile")
    
    print("📤 Uploading Dockerfile...")
    api.upload_file(
        path_or_fileobj=dockerfile_path,
        path_in_repo="Dockerfile",
        repo_id=SPACE_ID,
        repo_type="space",
        token=TOKEN,
        commit_message="Fix: Dockerfile dependencies for Debian trixie"
    )
    
    print("✅ Dockerfile atualizado!")
    print("🔄 Build automático iniciará em ~30 segundos")
    print(f"🌐 Acompanhe em: https://huggingface.co/spaces/{SPACE_ID}")

if __name__ == "__main__":
    main()
