#!/usr/bin/env python3
"""
Re-deploy V2: Dockerfile + requirements-hf.txt (sem browser-use)
"""
from huggingface_hub import HfApi, login
import os

TOKEN = "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"
SPACE_ID = "Bigodetonton/SyncAds"
LOCAL_DIR = r"c:\Users\dinho\Documents\GitHub\SyncAds\python-service"

def main():
    print("🔧 Re-deploying com requirements limpo...")
    
    login(token=TOKEN)
    api = HfApi()
    
    # Upload Dockerfile + requirements-hf.txt
    files = [
        ("Dockerfile", "Dockerfile"),
        ("requirements-hf.txt", "requirements-hf.txt"),
    ]
    
    for local, repo in files:
        print(f"📤 {repo}")
        api.upload_file(
            path_or_fileobj=os.path.join(LOCAL_DIR, local),
            path_in_repo=repo,
            repo_id=SPACE_ID,
            repo_type="space",
            token=TOKEN
        )
    
    print("✅ Deploy V2 completo!")
    print("🔄 Build iniciará em ~30s")
    print(f"🌐 https://huggingface.co/spaces/{SPACE_ID}")

if __name__ == "__main__":
    main()
