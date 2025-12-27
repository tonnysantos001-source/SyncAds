#!/usr/bin/env python3
"""
Deploy automático para Hugging Face Spaces
"""
from huggingface_hub import HfApi, login
import os
from pathlib import Path

# Token
TOKEN = "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"

# Configurações
SPACE_ID = "Bigodetonton/SyncAds"
LOCAL_DIR = r"c:\Users\dinho\Documents\GitHub\SyncAds\python-service"

def main():
    print("🚀 Iniciando deploy para Hugging Face...")
    
    # Login
    print(f"🔐 Fazendo login...")
    login(token=TOKEN)
    
    # Criar API client
    api = HfApi()
    
    print(f"📤 Uploading para {SPACE_ID}...")
    
    # Lista de arquivos para upload (mantendo estrutura)
    files_to_upload = [
        # Raiz
        ("Dockerfile", "Dockerfile"),
        ("README.md", "README.md"),
        ("requirements.txt", "requirements.txt"),
        ("requirements-backup.txt", "requirements-backup.txt"),
        
        # app/
        ("app/__init__.py", "app/__init__.py"),
        ("app/main.py", "app/main.py"),
        ("app/ai_tools.py", "app/ai_tools.py"),
        ("app/file_uploader.py", "app/file_uploader.py"),
        ("app/graphql_schema.py", "app/graphql_schema.py"),
        
        # app/routers/
        ("app/routers/__init__.py", "app/routers/__init__.py"),
        ("app/routers/automation.py", "app/routers/automation.py"),
        ("app/routers/extension.py", "app/routers/extension.py"),
        ("app/routers/graphql_router.py", "app/routers/graphql_router.py"),
        ("app/routers/images.py", "app/routers/images.py"),
        ("app/routers/modules.py", "app/routers/modules.py"),
        ("app/routers/omnibrain.py", "app/routers/omnibrain.py"),
        ("app/routers/pdf.py", "app/routers/pdf.py"),
        ("app/routers/scraping.py", "app/routers/scraping.py"),
        ("app/routers/webhooks.py", "app/routers/webhooks.py"),
    ]
    
    # Upload cada arquivo
    for local_path, repo_path in files_to_upload:
        full_local_path = os.path.join(LOCAL_DIR, local_path)
        
        if os.path.exists(full_local_path):
            print(f"  📁 {repo_path}")
            try:
                api.upload_file(
                    path_or_fileobj=full_local_path,
                    path_in_repo=repo_path,
                    repo_id=SPACE_ID,
                    repo_type="space",
                    token=TOKEN
                )
            except Exception as e:
                print(f"  ⚠️  Erro em {repo_path}: {e}")
        else:
            print(f"  ⚠️  Arquivo não encontrado: {local_path}")
    
    print("✅ Upload completo!")
    print(f"🌐 Acesse: https://huggingface.co/spaces/{SPACE_ID}")
    print("⏳ Aguarde ~15-20min para o build completar")

if __name__ == "__main__":
    main()
