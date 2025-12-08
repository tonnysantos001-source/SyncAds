# 🚀 QUICK DEPLOY - RAILWAY FIX

**Problema:** `$PORT` não expande no CMD  
**Solução:** Usar shell form em vez de JSON array

## ✅ Correção Aplicada

**Arquivo:** `python-service/Dockerfile`

**Antes (quebrado):**
```dockerfile
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]
```

**Depois (correto):**
```dockerfile
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1
```

## 🚀 Comandos para Deploy

```bash
# 1. Commit da correção
git add python-service/Dockerfile
git commit -m "fix: Railway deploy - use shell form CMD for PORT expansion"

# 2. Push para trigger deploy
git push origin main

# 3. Railway vai automaticamente detectar e redeployar
```

## ⏱️ Tempo estimado
- Upload: 10s
- Build: 5-8 min
- Deploy: 30s
- **Total: ~6-10 min**

## 🔍 Monitorar

Railway Dashboard → Deployments → Ver logs em tempo real

## ✅ Sucesso quando ver:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:XXXX
```

## 🧪 Testar depois
```bash
curl https://syncads-python-microservice-production.up.railway.app/health
```

Esperado:
```json
{
  "status": "healthy",
  "service": "SyncAds Python Microservice",
  "version": "1.0.0"
}
```
