# ⚠️ RAILWAY FIX MANUAL - Service Configuration

## Problema Atual
Railway está servindo **frontend** em vez de **Python API** porque o service está configurado incorretamente.

## ✅ SOLUÇÃO DEFINITIVA (Passo a Passo)

### Opção 1: Criar NOVO Service (RECOMENDADO)

1. **Abra Railway Dashboard**
   - Acesse: https://railway.app/

2. **Crie Novo Service**
   - Clique em "+ New Service"
   - Escolha "GitHub Repo"
   - Selecione o repositório `SyncAds`

3. **Configure o Service**
   - **Root Directory**: `/python-service`
   - **Build Command**: (deixe vazio, vai usar Dockerfile)
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

4. **Variáveis de Ambiente**
   Adicione estas variáveis no service novo:
   ```
   SUPABASE_URL=https://ovskepqggmxlfckxqgbr.supabase.co
   SUPABASE_ANON_KEY=(copie do Supabase)
   SUPABASE_SERVICE_ROLE_KEY=(copie do Supabase)
   OPENAI_API_KEY=(sua chave)
   ANTHROPIC_API_KEY=(sua chave)  
   GROQ_API_KEY=(sua chave)
   PORT=8000
   ```

5. **Deploy**
   - Clique em "Deploy"
   - Aguarde 2-3 minutos

6. **Pegue a URL**
   - Depois do deploy, copie a URL gerada
   - Teste: `curl https://NOVA-URL/health`

---

### Opção 2: Fix Service Existente

1. **Abra o Service Atual**
   - Dashboard → `syncads-python-microservice`

2. **Settings → Service**
   - **Root Directory**: Mude para `/python-service`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Build Source**: Verifique se está apontando para o repo correto

3. **Redeploy**
   - Aba "Deployments"
   - Clique nos 3 pontinhos no último deploy
   - "Redeploy"

4. **Teste**
   - Aguarde 2-3 min
   - `curl https://URL/health`

---

### Opção 3: Usar CLI Railway (Mais Técnico)

```bash
cd python-service
railway up --detach
railway domain
```

---

## 🧪 Como Testar Se Funcionou

```bash
curl https://RAILWAY-URL/health
```

### ✅ SUCESSO:
```json
{
  "status": "healthy",
  "service": "SyncAds Python Microservice", 
  "version": "1.0.0"
}
```

### ❌ AINDA ERRADO:
```html
<!DOCTYPE html>
```

---

## 📝 Depois que Funcionar

Quando testar e retornar JSON:

1. **Me avise** qual URL funcionou
2. **Eu vou**:
   - Atualizar `PYTHON_SERVICE_URL` no Supabase
   - Redeploy `browser-automation` Edge Function  
   - Testar automação end-to-end
   - IA vai funcionar com browser automation! 🎉

---

## ❓ Se Nada Funcionar

Tire screenshot de:
1. Railway Settings → Service (mostrando Root Directory e Commands)
2. Railway Deployments → Last Deploy Logs
3. Resultado do curl

E me mande que eu ajudo a debugar!
