# 🚨 ERRO 502 - Application failed to respond

## 📋 PROBLEMA

O backend no Railway está **OFFLINE** ou **TRAVADO**. A extensão não consegue se conectar.

**Erro nos logs:**
```
❌ Error 502 - Application failed to respond
```

---

## ✅ SOLUÇÃO RÁPIDA (5 minutos)

### OPÇÃO 1: Redeploy via Dashboard (RECOMENDADO)

1. **Acesse o Railway Dashboard:**
   ```
   https://railway.app/dashboard
   ```

2. **Encontre o projeto:**
   - Nome: `syncads-python-microservice`
   - Environment: `production`

3. **Clique no serviço** e depois em **"Deployments"**

4. **Redeploy:**
   - Clique nos 3 pontinhos `⋮` do último deploy
   - Clique em **"Redeploy"**
   - Aguarde 2-3 minutos

5. **Verifique se funcionou:**
   - Abra: https://syncads-python-microservice-production.up.railway.app/api/extension/health
   - Deve retornar: `{"status":"ok","service":"extension"}`

---

### OPÇÃO 2: Redeploy via CLI

```bash
# 1. Entre na pasta
cd python-service

# 2. Remova arquivo problemático (se existir)
rm -f nul

# 3. Faça commit vazio
git add .
git commit -m "fix: redeploy railway" --allow-empty

# 4. Push para trigger deploy
git push origin main

# 5. OU use railway CLI
railway login
railway up --detach
```

**Aguarde 2-3 minutos e teste:**
```bash
curl https://syncads-python-microservice-production.up.railway.app/api/extension/health
```

---

### OPÇÃO 3: Verificar Variáveis de Ambiente

Se o redeploy não resolver, verifique as variáveis:

```bash
railway variables
```

**Variáveis necessárias:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY` (opcional)
- `GROQ_API_KEY` (opcional)

**Se alguma estiver faltando:**
```bash
railway variables set SUPABASE_URL=https://ovskepqggmxlfckxqgbr.supabase.co
railway variables set SUPABASE_SERVICE_ROLE_KEY=sua-key-aqui
```

---

## 🧪 TESTE SE ESTÁ FUNCIONANDO

### 1. Teste direto da API:
```bash
curl https://syncads-python-microservice-production.up.railway.app/api/extension/health
```

**✅ Resposta esperada:**
```json
{"status":"ok","service":"extension","timestamp":"2025-01-17T..."}
```

### 2. Teste na extensão:
1. Abra: `chrome://extensions/`
2. Clique em "service worker" na extensão
3. Execute no console:
```javascript
fetch('https://syncads-python-microservice-production.up.railway.app/api/extension/health')
  .then(r => r.json())
  .then(d => console.log('✅ API OK:', d))
  .catch(e => console.error('❌ API Erro:', e));
```

---

## 📊 VERIFICAR LOGS DO RAILWAY

### Via Dashboard:
1. Acesse: https://railway.app/dashboard
2. Clique no serviço `syncads-python-microservice`
3. Vá em **"Deployments"**
4. Clique no deployment ativo
5. Veja os logs em tempo real

### Via CLI:
```bash
cd python-service
railway logs
```

**Procure por:**
- ✅ `Application startup complete`
- ✅ `Uvicorn running on`
- ❌ `Error` ou `Exception`
- ❌ `Connection refused`

---

## 🔧 PROBLEMAS COMUNS

### 1. "Connection refused" nos logs
**Causa:** Porta incorreta
**Solução:**
```bash
# Verificar se o PORT está correto
railway variables
# Deve ter: PORT=8000 ou Railway define automaticamente
```

### 2. "ModuleNotFoundError" nos logs
**Causa:** Dependências não instaladas
**Solução:**
```bash
# Verificar requirements.txt
railway run pip list
# Ou force rebuild:
railway up --detach
```

### 3. "Supabase não configurado"
**Causa:** Variáveis de ambiente faltando
**Solução:**
```bash
railway variables set SUPABASE_URL=https://ovskepqggmxlfckxqgbr.supabase.co
railway variables set SUPABASE_SERVICE_ROLE_KEY=sua-key-aqui
```

### 4. Deploy trava em "Building..."
**Causa:** Build timeout
**Solução:**
1. Cancele o deploy no dashboard
2. Tente novamente
3. Se persistir, delete o serviço e recrie

---

## 🆘 SE NADA FUNCIONAR

### Plano B: Criar novo serviço

```bash
# 1. No dashboard Railway, crie novo serviço
# 2. Conecte ao GitHub repo
# 3. Selecione a pasta: python-service
# 4. Configure variáveis de ambiente
# 5. Deploy automático será feito
```

### Plano C: Usar backend local temporário

```bash
# 1. Rode localmente
cd python-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 2. Atualize a extensão para usar localhost
# No background.js, linha 12:
apiUrl: "http://localhost:8000"
```

---

## ✅ CHECKLIST

- [ ] Railway dashboard acessado
- [ ] Serviço encontrado
- [ ] Redeploy realizado
- [ ] Aguardou 2-3 minutos
- [ ] API testada (curl ou navegador)
- [ ] Retornou status "ok"
- [ ] Extensão recarregada
- [ ] Testou conexão novamente

---

## 📞 STATUS DO SERVIÇO

**URL da API:**
https://syncads-python-microservice-production.up.railway.app

**Endpoints importantes:**
- `/api/extension/health` - Health check
- `/api/extension/register` - Registro de dispositivo
- `/docs` - Documentação Swagger

**Como verificar se está online:**
```bash
# PowerShell/CMD
curl https://syncads-python-microservice-production.up.railway.app/api/extension/health

# Ou abra no navegador
start https://syncads-python-microservice-production.up.railway.app/docs
```

---

## 🎯 DEPOIS DE CORRIGIR

1. **Recarregue a extensão:**
   - `chrome://extensions/` > Reload

2. **Limpe o storage:**
   ```javascript
   // No service worker console
   chrome.storage.local.clear();
   ```

3. **Teste a conexão:**
   - Acesse: https://syncads.com.br/login-v2
   - Faça login
   - Clique no ícone da extensão
   - Badge deve ficar VERDE 🟢

---

**Última atualização:** 17/01/2025 - 23:55
**Status do Railway:** 🔴 OFFLINE (Erro 502)
**Ação necessária:** REDEPLOY URGENTE