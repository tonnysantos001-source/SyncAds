#!/usr/bin/env python3
"""
Deploy FINAL: requirements-hf.txt com opencv-python
"""
from huggingface_hub import HfApi, login
import os

TOKEN = "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"
SPACE_ID = "Bigodetonton/SyncAds"
LOCAL_DIR = r"c:\Users\dinho\Documents\GitHub\SyncAds\python-service"

def main():
    print("🔧 Deploy FINAL: Adicionando opencv-python...")
    
    login(token=TOKEN)
    api = HfApi()
    
    req_file = os.path.join(LOCAL_DIR, "requirements-hf.txt")
    
    print("📤 Uploading requirements-hf.txt (com cv2)...")
    api.upload_file(
        path_or_fileobj=req_file,
        path_in_repo="requirements-hf.txt",
        repo_id=SPACE_ID,
        repo_type="space",
        token=TOKEN,
        commit_message="Add opencv-python for images router"
    )
    
    print("✅ DEPLOY FINAL COMPLETO!")
    print("🔄 Rebuild automático em ~30s")
    print(f"🌐 https://huggingface.co/spaces/{SPACE_ID}")
    print("\n🎯 AGORA DEVE FUNCIONAR 100%!")

if __name__ == "__main__":
    main()
