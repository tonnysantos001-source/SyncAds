# ⚡ COMANDOS PRONTOS - EXECUÇÃO IMEDIATA

## 🚀 SETUP INICIAL (5 minutos)

### 1. Preparar Ambiente
```bash
# Navegar para o projeto
cd C:\Users\dinho\Documents\GitHub\SyncAds

# Criar branch de trabalho
git checkout -b refinamento-v5

# Pull das últimas mudanças
git pull origin main
```

### 2. Instalar Dependências Python
```bash
# Entrar na pasta do serviço Python
cd python-service

# Instalar bibliotecas de scraping
pip install -r requirements-scraping.txt

# Instalar Playwright para scraping avançado
playwright install chromium

# Testar instalação
python -c "from playwright.sync_api import sync_playwright; print('✅ Playwright OK')"
python -c "from selenium import webdriver; print('✅ Selenium OK')"

# Voltar para raiz
cd ..
```

### 3. Instalar Dependências Node
```bash
# Instalar/atualizar pacotes
npm install

# Verificar versão do Node (deve ser 18+)
node --version
```

---

## 🔥 OPÇÃO A: MELHORAR FORM FILLING (1-2 horas)

### Passo 1: Abrir Arquivo
```bash
code chrome-extension/content-script.js
```

### Passo 2: Localizar Função
```javascript
// Procurar por esta função (linha ~400):
// function handleFillForm(data) { ... }
```

### Passo 3: Testar Extensão
```bash
# No Chrome, ir para:
chrome://extensions

# 1. Ativar "Modo do desenvolvedor"
# 2. Clicar "Carregar sem compactação"
# 3. Selecionar pasta: chrome-extension
```

### Passo 4: Testar Melhorias
```bash
# Abrir qualquer site com formulário
# Abrir Side Panel (clicar no ícone)
# Testar comando:
# "Preencha o formulário com email test@example.com"
```

---

## 🕷️ OPÇÃO B: WEB SCRAPING INTELIGENTE (2-3 horas)

### Passo 1: Criar Arquivo de Serviço
```bash
# Criar diretório se não existir
mkdir -p python-service/app/services

# Criar arquivo
touch python-service/app/services/scraping_service.py

# Abrir no editor
code python-service/app/services/scraping_service.py
```

### Passo 2: Copiar Código Base
```bash
# Abrir o plano completo e copiar o código da seção:
# "2.2 🕷️ Web Scraping Avançado"
code PLANO_ACAO_REFINAMENTO_COMPLETO.md
```

### Passo 3: Adicionar Endpoint na API
```bash
# Abrir main.py
code python-service/app/main.py

# Adicionar no final do arquivo:
# @app.post("/api/scrape")
# async def scrape_endpoint(request: ScrapeRequest):
#     ...
```

### Passo 4: Testar Localmente
```bash
# Iniciar servidor
cd python-service
uvicorn app.main:app --reload --port 8000

# Em outro terminal, testar:
curl http://localhost:8000/health

# Testar scraping:
curl -X POST http://localhost:8000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","selector":"h1"}'
```

---

## 🧹 OPÇÃO C: LIMPAR INTEGRAÇÕES (2 horas)

### Passo 1: Fazer Backup
```bash
# Backup Git
git add .
git commit -m "Backup antes de limpeza - $(date +%Y%m%d)"
git tag backup-integrations-$(date +%Y%m%d)

# Backup Database (opcional, se DATABASE_URL configurado)
pg_dump $DATABASE_URL > backups/database-$(date +%Y%m%d).sql
```

### Passo 2: Revisar Script
```bash
# Revisar script SQL
cat cleanup-integrations.sql | less

# Revisar script Bash
cat cleanup-integrations.sh | less
```

### Passo 3: Executar Dry Run (Simulação)
```bash
# Tornar executável
chmod +x cleanup-integrations.sh

# Executar em modo simulação
./cleanup-integrations.sh

# Escolher opção: 6 (Dry run)
```

### Passo 4: Executar de Verdade
```bash
# Se tudo OK no dry run, executar:
./cleanup-integrations.sh

# Escolher opção: 1 (Limpeza completa)

# Confirmar cada etapa quando solicitado
```

### Passo 5: Verificar Resultados
```bash
# Verificar integrações no código
grep -r "google_ads\|meta_ads\|tiktok_ads" src/ || echo "✅ Limpo!"

# Verificar database (se configurado)
psql $DATABASE_URL -c "SELECT platform, COUNT(*) FROM integrations GROUP BY platform;"
```

---

## ✅ TESTES RÁPIDOS

### Testar Extensão
```bash
# 1. Build (se necessário)
cd chrome-extension
npm run build 2>/dev/null || echo "Sem build necessário"

# 2. Carregar no Chrome
# - Abra: chrome://extensions
# - Ative: "Modo do desenvolvedor"
# - Clique: "Carregar sem compactação"
# - Selecione: pasta chrome-extension

# 3. Testar Side Panel
# - Clique no ícone da extensão
# - Side Panel deve abrir
# - Digite: "Olá"
# - IA deve responder
```

### Testar Python Service
```bash
cd python-service

# Iniciar servidor
uvicorn app.main:app --reload --port 8000 &

# Aguardar 3 segundos
sleep 3

# Testar health check
curl http://localhost:8000/health

# Parar servidor
pkill -f uvicorn
```

### Testar Tudo Junto
```bash
# Na raiz do projeto
npm run test 2>/dev/null || echo "Testes não configurados ainda"

cd python-service
pytest tests/ 2>/dev/null || echo "Testes Python não configurados ainda"
cd ..
```

---

## 🐛 TROUBLESHOOTING RÁPIDO

### Problema: Playwright não instala
```bash
# Forçar reinstalação
pip uninstall playwright -y
pip install playwright==1.41.2
python -m playwright install chromium --force

# Testar
python -c "from playwright.sync_api import sync_playwright; print('✅ OK')"
```

### Problema: Side Panel não abre
```bash
# Verificar manifest
cat chrome-extension/manifest.json | grep -A 3 "side_panel"

# Deve aparecer:
# "side_panel": {
#   "default_path": "sidepanel.html"
# }

# Se não aparecer, adicionar no manifest.json
```

### Problema: Database não conecta
```bash
# Verificar variável
echo $DATABASE_URL

# Se vazio, configurar (substitua com seu URL real):
export DATABASE_URL="postgresql://postgres:senha@host:5432/database"

# Ou criar arquivo .env:
echo "DATABASE_URL=postgresql://postgres:senha@host:5432/database" > .env
```

### Problema: Supabase CLI não funciona
```bash
# Instalar Supabase CLI
npm install -g supabase

# Verificar instalação
supabase --version

# Login
supabase login
```

### Problema: Permissão negada no .sh
```bash
# Dar permissão de execução
chmod +x cleanup-integrations.sh
chmod +x *.sh

# Tentar novamente
./cleanup-integrations.sh
```

---

## 📦 DEPLOY RÁPIDO

### Deploy Python Service (Railway)
```bash
cd python-service

# Se Railway CLI instalado:
railway up

# Ou via Git:
git add .
git commit -m "feat: adicionar scraping inteligente"
git push railway main
```

### Deploy Edge Functions (Supabase)
```bash
# Deploy chat-enhanced
supabase functions deploy chat-enhanced --project-ref YOUR_PROJECT_REF

# Verificar logs
supabase functions logs chat-enhanced
```

### Deploy Frontend (Vercel)
```bash
# Build
npm run build

# Deploy
vercel --prod

# Ou via Git:
git push origin main
# (se configurado auto-deploy no Vercel)
```

### Empacotar Extensão
```bash
cd chrome-extension

# Criar ZIP
zip -r ../syncads-extension-v5.0.0.zip . \
  -x "*.git*" \
  -x "node_modules/*" \
  -x "tests/*" \
  -x "*.md"

cd ..
echo "✅ Extensão empacotada: syncads-extension-v5.0.0.zip"
```

---

## 🔄 GIT WORKFLOW

### Criar Feature Branch
```bash
git checkout -b feature/form-filling-melhorado
# ou
git checkout -b feature/scraping-inteligente
# ou
git checkout -b cleanup/remover-integracoes-oauth
```

### Commit das Mudanças
```bash
# Adicionar arquivos
git add .

# Commit com mensagem descritiva
git commit -m "feat: melhorar form filling com validação automática"

# Ou para limpeza:
git commit -m "refactor: remover integrações OAuth antigas"

# Ou para scraping:
git commit -m "feat: adicionar scraping inteligente com fallback"
```

### Push e Pull Request
```bash
# Push para origin
git push origin feature/nome-da-branch

# Criar PR no GitHub
# Ou via CLI (se gh instalado):
gh pr create --title "Feat: Melhorar form filling" --body "Descrição detalhada"
```

### Merge e Limpeza
```bash
# Depois do merge no GitHub, limpar local:
git checkout main
git pull origin main
git branch -d feature/nome-da-branch
```

---

## 📊 VERIFICAÇÃO DE STATUS

### Verificar Tudo de Uma Vez
```bash
echo "=== STATUS DO PROJETO ==="
echo ""
echo "📁 Diretório atual:"
pwd
echo ""
echo "🌿 Branch atual:"
git branch --show-current
echo ""
echo "📦 Node version:"
node --version
echo ""
echo "🐍 Python version:"
python --version
echo ""
echo "📚 Playwright instalado:"
python -c "import playwright; print('✅ Sim')" 2>/dev/null || echo "❌ Não"
echo ""
echo "🔧 Selenium instalado:"
python -c "import selenium; print('✅ Sim')" 2>/dev/null || echo "❌ Não"
echo ""
echo "📝 Arquivos modificados:"
git status --short
echo ""
echo "=== FIM DO STATUS ==="
```

---

## ⚡ ATALHOS ÚTEIS

### Reiniciar Tudo
```bash
# Matar processos
pkill -f uvicorn
pkill -f node

# Limpar cache
rm -rf node_modules/.cache
rm -rf python-service/__pycache__
rm -rf python-service/.pytest_cache

# Reinstalar
npm install
cd python-service && pip install -r requirements-scraping.txt && cd ..
```

### Logs em Tempo Real
```bash
# Logs Python Service
cd python-service
uvicorn app.main:app --reload --log-level debug

# Logs Supabase Functions
supabase functions logs chat-enhanced --follow

# Logs Railway (se configurado)
railway logs --follow
```

### Backup Rápido
```bash
# Criar diretório de backup
mkdir -p backups/$(date +%Y%m%d)

# Backup código
cp -r src backups/$(date +%Y%m%d)/
cp -r chrome-extension backups/$(date +%Y%m%d)/
cp -r python-service backups/$(date +%Y%m%d)/

# Backup Git
git add .
git commit -m "Backup $(date +%Y%m%d_%H%M%S)"
git tag backup-$(date +%Y%m%d)

echo "✅ Backup completo!"
```

---

## 🎯 CHECKLIST DIÁRIO

```bash
# Copie e cole no terminal todo dia:
echo "[ ] Pull das últimas mudanças"
echo "[ ] Escolher tarefa prioritária"
echo "[ ] Implementar (max 2h)"
echo "[ ] Testar localmente"
echo "[ ] Commitar mudanças"
echo "[ ] Atualizar documentação"
echo "[ ] Revisar progresso"
```

---

## 📚 REFERÊNCIAS RÁPIDAS

### Arquivos Importantes
```bash
# Documentação
cat PLANO_ACAO_REFINAMENTO_COMPLETO.md | less
cat INICIO_RAPIDO_REFINAMENTO.md | less
cat RESUMO_EXECUTIVO_REFINAMENTO.md | less

# Scripts
cat cleanup-integrations.sql | less
cat cleanup-integrations.sh | less

# Extensão
code chrome-extension/manifest.json
code chrome-extension/content-script.js
code chrome-extension/sidepanel.js

# Python Service
code python-service/app/main.py
code python-service/requirements-scraping.txt
```

### Comandos Git Úteis
```bash
# Ver histórico
git log --oneline --graph -10

# Ver mudanças
git diff

# Desfazer último commit (mantém mudanças)
git reset --soft HEAD~1

# Desfazer mudanças locais
git checkout -- arquivo.txt

# Ver branches
git branch -a

# Deletar branch local
git branch -d nome-branch
```

---

## 🚀 COMANDO ÚNICO PARA COMEÇAR

```bash
# Execute este comando para setup completo:
cd C:\Users\dinho\Documents\GitHub\SyncAds && \
git checkout -b refinamento-v5 && \
cd python-service && \
pip install -r requirements-scraping.txt && \
playwright install chromium && \
cd .. && \
npm install && \
echo "✅ Setup completo! Escolha agora: A) Form Filling, B) Scraping, C) Limpeza"
```

---

**Pronto para começar! 🎉**

Escolha uma opção (A, B ou C) e siga os comandos acima.
Qualquer dúvida, consulte os documentos completos.