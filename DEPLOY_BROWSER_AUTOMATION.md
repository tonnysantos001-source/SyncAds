# SyncAds - Deployment Guide for Browser Automation

## 🚀 Quick Deploy Commands

### 1. Deploy Python Service to Railway

```bash
cd python-service

# Se ainda não fez login
railway login

# Link ao projeto (se ainda não linked)
railway link

# Deploy
railway up

# Verificar deploy
railway logs
```

### 2. Deploy Edge Functions to Supabase

```bash
# Deploy browser-automation function
supabase functions deploy browser-automation

# Deploy chat-enhanced (atualizado com browser automation)
supabase functions deploy chat-enhanced

# Verificar logs
supabase functions logs browser-automation --tail
supabase functions logs chat-enhanced --tail
```

### 3. Set Environment Variables

**Python Service (Railway)**:
```bash
railway variables set SUPABASE_URL=https://ovskepqggmxlfckxqgbr.supabase.co
railway variables set SUPABASE_SERVICE_KEY=your-service-key-here
railway variables set PLAYWRIGHT_HEADLESS=true
```

**Supabase Edge Functions**:
```bash
supabase secrets set PYTHON_SERVICE_URL=https://your-railway-app.up.railway.app
```

---

## 🧪 Como Testar End-to-End

### Teste 1: AI Detecta e Navega

**Mensagem do usuário**: "navegue para https://example.com"

**Fluxo esperado**:
1. ✅ AI detecta palavra "navegue"
2. ✅ Extrai URL do texto
3. ✅ Chama browser-automation Edge Function
4. ✅ Edge Function chama Python service
5. ✅ Playwright navega para URL
6. ✅ Retorna título e URL
7. ✅ AI responde: "🌐 Navegação concluída! URL: https://example.com/ Título: Example Domain"

### Teste 2: Screenshot Automático

**Mensagem**: "tire um screenshot desta página"

**Resultado esperado**:
```
📸 Screenshot capturado!

[Imagem inline exibida no chat]
```

### Teste 3: Scraping de Produtos

**Mensagem**: "raspe os produtos desta loja"

**Resultado esperado**:
```
🛍️ 24 produtos encontrados!

1. **Produto A** - R$ 99,90
2. **Produto B** - R$ 149,90
3. **Produto C** - R$ 79,90
...

[Download CSV com todos os produtos]
```

### Teste 4: Preencher Formulário

**Mensagem**: "preencha o formulário de contato"

**Resultado esperado**:
```
✅ Formulário preenchido!

Campos preenchidos: 3
```

---

## 🔧 Troubleshooting

### Erro: "PYTHON_SERVICE_URL not defined"

**Solução**:
```bash
supabase secrets set PYTHON_SERVICE_URL=https://your-app.up.railway.app
supabase functions deploy browser-automation
```

### Erro: "Playwright not installed"

**Solução** (no Railway):
1. Certifique-se que `requirements.txt` contém `playwright==1.41.2`
2. Adicione ao `Dockerfile` ou build script:
```bash
playwright install chromium
```

### Erro: "Extension not connected"

**Causa**: AI só executa browser automation se `extensionConnected === true`

**Solução**: Usuário deve conectar a extensão primeiro clicando no ícone da extensão

### Erro: "Session not found"

**Causa**: Sessão não foi criada ou expirou

**Solução**: Edge Function cria sessão automaticamente com `user-${userId}`. Verifique logs do Python service

---

## 📊 Logs para Monitorar

### Python Service (Railway):
```bash
railway logs --tail

# Buscar por:
# "Browser automation" - requisições recebidas
# "Session created" - sessões de navegador
# "Form fill" - preenchimento de formulários
# "ERROR" - erros
```

### Supabase Edge Functions:
```bash
supabase functions logs browser-automation --tail

# Buscar por:
# "🤖 Calling browser-automation" - chamadas da AI
# "✅ Browser automation result" - sucessos
# "❌ Browser automation failed" - falhas
```

---

## ✅ Checklist de Deploy

- [ ] Python service deployed to Railway
- [ ] Playwright installed (`playwright install chromium`)
- [ ] Environment variables set (SUPABASE_URL, SUPABASE_SERVICE_KEY)
- [ ] browser-automation Edge Function deployed
- [ ] chat-enhanced Edge Function deployed (versão atualizada)
- [ ] PYTHON_SERVICE_URL secret configurado no Supabase  
- [ ] Testado navegação ("navegue para...")
- [ ] Testado screenshot ("tire um screenshot")
- [ ] Testado scraping ("raspe os produtos")
- [ ] Extension conectada e testada

---

## 🎯 Próximas Features (Opcional)

Se quiser expandir ainda mais:

1. **Store Cloning Completo**:
   - Workflow automatizado de clonagem
   - Export para formato Shopify
   - Download automático de imagens

2. **Purchasing Automation** (sensível):
   - Detecção de checkout
   - Solicitar dados de pagamento ao usuário
   - Confirmação obrigatória
   - Zero armazenamento

3. **WhatsApp Automation**:
   - Auto-resposta inteligente
   - Templates dinâmicos
   - Bulk messaging

**Aguardando sua decisão sobre qual implementar!**

---

**Deploy Time Estimado**: 15-20 minutos  
**Status**: Ready to deploy ✅
