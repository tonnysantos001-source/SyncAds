# 🚀 GUIA RÁPIDO - RE-DEPLOY RAILWAY

## ⚡ EXECUTAR AGORA

### 1️⃣ Navegue para o diretório do serviço Python
```powershell
cd c:\Users\dinho\Documents\GitHub\SyncAds\python-service
```

### 2️⃣ Faça login na Railway (se necessário)
```powershell
railway login
```

### 3️⃣ Vincule ao projeto correto
```powershell
railway link 5f47519b-0823-45aa-ab00-bc9bcaaa1c94
```

### 4️⃣ Configure o ambiente de produção
```powershell
railway environment production
```

### 5️⃣ Ver status atual
```powershell
railway status
```

### 6️⃣ Ver logs atuais (IMPORTANTE - Diagnóstico)
```powershell
railway logs
```

### 7️⃣ Fazer o deploy
```powershell
railway up
```

### 8️⃣ Acompanhar logs do deploy
```powershell
railway logs --follow
```

---

## 🔧 COMANDOS ALTERNATIVOS

### Se railway up não funcionar, use:
```powershell
# Commit as mudanças primeiro
git add .
git commit -m "fix: Railway Dockerfile PORT expansion"
git push

# Railway irá detectar o push e fazer deploy automático
# OU force um re-deploy:
railway redeploy
```

---

## ✅ VALIDAÇÃO PÓS-DEPLOY

### Teste 1: Health Check
```powershell
curl https://syncads-python-microservice-production.up.railway.app/health
```
**Esperado:**
```json
{
  "status": "healthy",
  "service": "syncads-python-microservice",
  "version": "1.0.0-minimal",
  "timestamp": 1734357170.123
}
```

### Teste 2: API Docs
Abra no navegador:
```
https://syncads-python-microservice-production.up.railway.app/docs
```

### Teste 3: Logs
```powershell
railway logs
```
**Deve mostrar:**
```
Application startup complete
Uvicorn running on http://0.0.0.0:XXXX
```

---

## 🎯 CORREÇÕES APLICADAS

1. ✅ **Dockerfile corrigido** - CMD agora usa shell form com `${PORT:-8000}`
2. ✅ **railway.json criado** - Configuração explícita de build e deploy
3. ✅ **Healthcheck configurado** - `/health` endpoint com timeout de 100s

---

## 🚨 SE DER ERRO

### Erro: "Project not linked"
```powershell
railway link 5f47519b-0823-45aa-ab00-bc9bcaaa1c94
```

### Erro: "Not logged in"
```powershell
railway login
```

### Erro: "Build failed"
1. Veja os logs: `railway logs`
2. Verifique o erro específico
3. Relate o erro para correção

---

## 📱 DASHBOARD RAILWAY

**Acesse para acompanhar visualmente:**
```
https://railway.app/project/5f47519b-0823-45aa-ab00-bc9bcaaa1c94
```

---

## ⚠️ IMPORTANTE

**ANTES DE FAZER DEPLOY, VERIFIQUE NO RAILWAY DASHBOARD:**

### Settings → Root Directory
Deve estar configurado para: `python-service`

**Como configurar:**
1. Acesse: https://railway.app/project/5f47519b-0823-45aa-ab00-bc9bcaaa1c94
2. Clique no serviço "SyncAds" 
3. Vá em **Settings**
4. Procure por **Root Directory**
5. Defina como: `python-service`
6. Clique em **Save**

---

**Última atualização:** 16/12/2025 11:52 BRT
