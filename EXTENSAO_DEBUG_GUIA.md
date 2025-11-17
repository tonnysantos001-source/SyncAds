# 🔧 Guia de Depuração - Extensão SyncAds v4.0.4

## 📋 Problema Identificado

A extensão está **detectando o token** corretamente (logs mostram "Token is valid"), mas o **popup continua mostrando "Desconectado"** após o login.

## 🔍 Diagnóstico em 5 Passos

### Passo 1: Verificar Console do Background Script

1. Abra `chrome://extensions`
2. Ative o "Modo do desenvolvedor"
3. Clique em "Service Worker" ou "background page" na extensão SyncAds
4. Verifique os logs:

**✅ Logs Esperados (Funcionando):**
```
🚀 SyncAds Extension v4.0 - Background Service Worker Initializing...
✅ [SUCCESS] Extension connected successfully!
✅ [SUCCESS] Device registered via REST API
[INFO] Heartbeat started
```

**❌ Logs de Erro (Problema):**
```
❌ [ERROR] Device registration failed
❌ [ERROR] Missing userId or accessToken
⚠️ [WARN] Token invalid, attempting refresh...
```

### Passo 2: Verificar Console do Content Script

1. Abra `https://syncads.com.br` ou `https://syncads.com.br/login-v2`
2. Abra DevTools (F12)
3. Vá para a aba "Console"
4. Filtre por "ContentScript"

**✅ Logs Esperados:**
```
🚀 SyncAds Content Script v4.0 - Initializing on: syncads.com.br
✅ [ContentScript] Valid token detected! Sending to background...
✅ [ContentScript] Extension connected successfully!
```

**❌ Problema:**
```
⚠️ [ContentScript] No Supabase auth key found
❌ [ContentScript] Background rejected token
```

### Passo 3: Verificar Console do Popup

1. Clique com botão direito no ícone da extensão
2. Selecione "Inspecionar popup"
3. Verifique os logs:

**✅ Logs Esperados:**
```
🚀 [POPUP] Initializing popup...
📊 Status Check: { hasBasicData: true, isRecent: true, isConnected: true }
🎨 Updating UI status: true
```

**❌ Problema:**
```
📊 Status Check: { hasBasicData: false, isRecent: false, isConnected: false }
🎨 Updating UI status: false
```

### Passo 4: Verificar Chrome Storage

No console do popup, execute:

```javascript
chrome.storage.local.get(null, (data) => console.log("💾 Storage:", data));
```

**✅ Deve mostrar:**
```javascript
{
  deviceId: "device_1234567890_abc123",
  userId: "uuid-aqui",
  accessToken: "eyJ...",
  isConnected: true,
  lastActivity: 1700000000000
}
```

### Passo 5: Verificar Badge da Extensão

- **Verde "ON"** = Conectado ✅
- **Amarelo "!"** = Conectando ⏳
- **Sem badge** = Desconectado ❌

## 🛠️ Soluções para Problemas Comuns

### Problema 1: Token Detectado Mas Não Processado

**Sintoma:** Content-script detecta token mas popup continua desconectado

**Solução:**
1. Recarregue a extensão em `chrome://extensions`
2. Recarregue a página do SyncAds (F5)
3. Aguarde 5-10 segundos
4. Clique em "Conectar" no popup

**Se não funcionar:**
```javascript
// No console do background, execute:
chrome.storage.local.clear(() => console.log("Storage cleared"));
// Depois recarregue a extensão
```

### Problema 2: "Device Registration Failed"

**Sintoma:** Logs mostram erro ao registrar dispositivo

**Causas possíveis:**
- Token expirado
- RLS (Row Level Security) bloqueando
- Edge Function offline

**Solução:**
1. Verifique se a tabela `ExtensionDevice` existe no Supabase
2. Execute no SQL Editor do Supabase:

```sql
-- Verificar se a tabela existe
SELECT * FROM information_schema.tables 
WHERE table_name = 'ExtensionDevice';

-- Verificar RLS
SELECT * FROM pg_policies 
WHERE tablename = 'ExtensionDevice';

-- Testar insert manual
INSERT INTO "ExtensionDevice" (
  "userId", "deviceId", "browserInfo", "isOnline"
) VALUES (
  'seu-user-id-aqui',
  'device_test_123',
  '{"browser": "Chrome"}',
  true
);
```

### Problema 3: Popup Não Atualiza Após Login

**Sintoma:** Faz login no SyncAds mas popup continua mostrando desconectado

**Solução:**
1. **Feche o popup** completamente
2. **Aguarde 5 segundos**
3. **Abra o popup novamente**

Isso força o popup a recarregar e ler o storage atualizado.

**Ou force a atualização:**
```javascript
// No console do popup, execute:
location.reload();
```

### Problema 4: Content Script Não Detecta Token

**Sintoma:** Nenhum log de "Token detected" no console

**Solução:**
1. Verifique se está na página correta:
   - ✅ `https://syncads.com.br/*`
   - ✅ `https://syncads.com.br/login-v2`
   - ❌ Outras páginas não funcionam

2. Verifique o localStorage manualmente:
```javascript
// No console da página SyncAds:
Object.keys(localStorage).filter(k => k.includes('supabase') || k.includes('sb-'));
```

3. Se não houver keys do Supabase, faça logout e login novamente

### Problema 5: Heartbeat Não Funciona

**Sintoma:** Status fica "conectado" por uns minutos e depois volta para "desconectado"

**Solução:**
1. Verifique os logs de heartbeat no background:
```
✅ [DEBUG] Heartbeat sent successfully
```

2. Se não aparecer, execute no console do background:
```javascript
// Forçar heartbeat manualmente
sendHeartbeat();
```

3. Verifique se o endpoint REST está acessível:
```javascript
fetch('https://ovskepqggmxlfckxqgbr.supabase.co/rest/v1/ExtensionDevice', {
  headers: {
    'apikey': 'sua-anon-key-aqui'
  }
}).then(r => console.log('API Status:', r.status));
```

## 🔄 Fluxo Completo de Conexão

Para entender onde está o problema, siga o fluxo:

```
1. Usuário abre SyncAds
   ↓
2. Content-script detecta localStorage com token
   ↓
3. Content-script valida token (não expirado)
   ↓
4. Content-script envia AUTH_TOKEN_DETECTED → Background
   ↓
5. Background processa token
   ↓
6. Background registra device no Supabase
   ↓
7. Background atualiza chrome.storage.local
   ↓
8. Background envia mensagem LOGIN_SUCCESS → Popup
   ↓
9. Popup recebe storage change event
   ↓
10. Popup atualiza UI para "Conectado"
```

**Onde verificar cada etapa:**

| Etapa | Onde Ver | Log Esperado |
|-------|----------|--------------|
| 1-3 | Console da página | `Token is valid` |
| 4 | Console content + background | `AUTH_TOKEN_DETECTED` |
| 5-6 | Console background | `Device registered` |
| 7 | Storage inspection | `isConnected: true` |
| 8-9 | Console popup | `LOGIN_SUCCESS` |
| 10 | Popup visual | Badge "ON" verde |

## 🚀 Instalação da Nova Versão (v4.0.4-DEBUG)

1. **Desinstale** a versão antiga em `chrome://extensions`
2. **Extraia** o arquivo `syncads-extension-v4.0.4-DEBUG.zip`
3. **Carregue** a pasta extraída como extensão sem pacote
4. **Abra** os DevTools para cada contexto:
   - Background (Service Worker)
   - Content Script (página SyncAds)
   - Popup (ícone da extensão)
5. **Faça login** no SyncAds
6. **Observe** os logs em cada console

## 📊 Checklist de Validação

Após aplicar as correções, verifique:

- [ ] Background script carrega sem erros
- [ ] Content script detecta token após login
- [ ] Background registra device com sucesso
- [ ] Storage contém `userId` e `accessToken`
- [ ] Popup mostra "Conectado" (verde)
- [ ] Badge mostra "ON" verde
- [ ] Heartbeat aparece nos logs a cada 30s
- [ ] Recarregar popup mantém status "Conectado"
- [ ] Fechar e abrir navegador mantém conexão

## 🆘 Suporte Avançado

Se nada funcionar, colete os seguintes dados:

1. **Logs do Background:**
```javascript
// Cole no console do background
console.log("State:", JSON.stringify({
  deviceId: state.deviceId,
  userId: state.userId,
  isConnected: state.isConnected,
  hasToken: !!state.accessToken
}, null, 2));
```

2. **Logs do Storage:**
```javascript
// Cole no console do popup
chrome.storage.local.get(null, (data) => {
  console.log("Full Storage:", JSON.stringify(data, null, 2));
});
```

3. **Screenshot** do popup mostrando "Desconectado"

4. **Versão do Chrome:**
```javascript
navigator.userAgent
```

## 🎯 Versões e Changelog

### v4.0.4-DEBUG (Atual)
- ✅ Logs detalhados em todos os contextos
- ✅ Melhor detecção de mudanças no storage
- ✅ Feedback visual melhorado no popup
- ✅ Retry logic aprimorado

### v4.0.3-SYNTAX-FIXED
- ✅ Correção de erro de sintaxe no content-script
- ✅ Heartbeat funcional

### v4.0.2-FIXED
- ✅ Heartbeat implementado
- ✅ Detecção de token acelerada
- ✅ RLS simplificadas

## 📝 Notas Técnicas

- **Service Worker:** Mantido ativo via keep-alive a cada 25s
- **Heartbeat:** Sincroniza status a cada 30s
- **Token Refresh:** Verifica validade a cada 60s
- **Storage Sync:** Popup verifica a cada 10s

---

**Última Atualização:** 17/11/2025
**Versão:** 4.0.4-DEBUG
**Status:** Em teste