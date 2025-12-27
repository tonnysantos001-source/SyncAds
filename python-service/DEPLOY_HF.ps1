# ========================================
# DEPLOY HUGGING FACE - COMANDOS PRONTOS
# Username: Bigodetonton
# Space: syncads-complete
# ========================================

# 1. Navegar para o diretório
cd c:\Users\dinho\Documents\GitHub\SyncAds\python-service

# 2. Inicializar Git (se necessário)
git init

# 3. Adicionar remote do Hugging Face (com token)
git remote add hf https://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@huggingface.co/spaces/Bigodetonton/syncads-complete

# 4. Adicionar todos os arquivos
git add .

# 5. Commit
git commit -m "🚀 SyncAds Complete Service - All 9 Modules + 175 Libraries"

# 6. Push para Hugging Face
git push hf main --force

# ========================================
# OPCIONAL: Remover remote do HF depois
# ========================================
# git remote remove hf
