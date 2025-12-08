# 🚨 RAILWAY PORT - PLANO B

**Situação:** 4ª tentativa em andamento  
**Se falhar novamente:** Usar PROCFILE approach

---

## 🎯 OPÇÃO 1: Procfile (Railway nativo)

**Criar:** `python-service/Procfile`

```procfile
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**Vantagem:** Railway processa $PORT automaticamente via Procfile

---

## 🎯 OPÇÃO 2: railway.json com nixpacks

**Modificar:** `python-service/railway.json`

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

**Vantagem:** Nixpacks é mais simples que Dockerfile para Python

---

## 🎯 OPÇÃO 3: Modificar main.py (MAIS CONFIÁVEL)

**Adicionar ao final de:** `python-service/app/main.py`

```python
# ==========================================
# RAILWAY: Rodar diretamente via Python
# ==========================================
if __name__ == "__main__":
    import uvicorn
    import os
    
    port = int(os.getenv("PORT", "8000"))
    
    print(f"🚀 Starting on port {port}")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        workers=1,
        log_level="info"
    )
```

**Dockerfile CMD:**
```dockerfile
CMD ["python", "-m", "app.main"]
```

**Vantagem:** Python lê PORT diretamente, sem shell

---

## 🎯 OPÇÃO 4: Hardcode PORT 8000

**Último recurso:**

```dockerfile
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**railway.json:**
```json
{
  "deploy": {
    "staticPort": 8000
  }
}
```

**Vantagem:** Funciona sempre (mas não flexível)

---

## ⏱️ DECISÃO

**Aguardar 4ª tentativa** (~10 min)

**Se falhar:**
1. Tentar OPÇÃO 3 (main.py) - MAIS CONFIÁVEL
2. Se  falhar, tentar OPÇÃO 1 (Procfile)
3. Último caso: OPÇÃO 4 (hardcode)

---

## 🔗 Status Atual

**Build:** https://railway.com/project/.../id=37a21e89-8e30-4084-9b71-2457b546f536

**Comandos prontos se precisar:**

```bash
# OPÇÃO 3 - Adicionar ao main.py
# (código acima)

# OPÇÃO 1 - Criar Procfile
echo "web: uvicorn app.main:app --host 0.0.0.0 --port \$PORT" > python-service/Procfile

# Deploy
git add .
git commit -m "fix(railway): use Procfile for PORT handling"
git push
railway up --detach
```
