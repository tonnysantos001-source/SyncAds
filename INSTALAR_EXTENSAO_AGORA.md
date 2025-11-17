# 🚀 INSTALAR EXTENSÃO SYNCADS - GUIA RÁPIDO

## ⚠️ IMPORTANTE: Você Está com Erro de Sintaxe!

O erro que você viu (`Uncaught SyntaxError: Unexpected token '<'`) acontece quando:
- Extensão foi carregada incorretamente
- Arquivos estão corrompidos
- Pasta errada foi selecionada

## 📦 Arquivo para Download

**Localização:** `SyncAds/syncads-extension-WORKING.zip`

Este é o ZIP mais recente e validado!

---

## 🔧 INSTALAÇÃO EM 5 PASSOS

### Passo 1: Remover Extensão Antiga

1. Abra `chrome://extensions`
2. Encontre **SyncAds AI Automation**
3. Clique em **"Remover"**
4. Confirme a remoção

### Passo 2: Extrair o ZIP

1. Localize o arquivo: `SyncAds/syncads-extension-WORKING.zip`
2. Clique com botão direito → **"Extrair tudo..."**
3. Extraia para uma pasta nova, exemplo:
   - `C:\SyncAds\extensao-chrome\`
   - Ou `C:\Users\SEU_USUARIO\Desktop\syncads-ext\`

### Passo 3: Ativar Modo Desenvolvedor

1. Abra `chrome://extensions`
2. No canto superior direito, ative: **"Modo do desenvolvedor"**

### Passo 4: Carregar Extensão

1. Clique em **"Carregar sem pacote"** (ou "Load unpacked")
2. Navegue até a pasta extraída
3. Selecione a pasta que contém o arquivo `manifest.json`
4. Clique em **"Selecionar pasta"**

### Passo 5: Verificar Instalação

✅ **Sinais de sucesso:**
- Extensão aparece na lista sem erros
- Ícone da extensão aparece na barra do Chrome
- Nenhum erro vermelho aparece

❌ **Se aparecer erro:**
- Verifique se selecionou a pasta correta
- A pasta DEVE conter `manifest.json`
- Não selecione a pasta pai, selecione a pasta com os arquivos

---

## 🔍 TESTAR SE FUNCIONOU

### Teste 1: Abrir Console do Background

1. Em `chrome://extensions`
2. Encontre **SyncAds AI Automation**
3. Clique em **"Service Worker"** ou **"background page"**
4. Uma janela de DevTools deve abrir

**Deve mostrar:**
```
🚀 SyncAds Extension v4.0 - Background Service Worker Initializing...
✅ [SUCCESS] Background service worker initialized
[INFO] Device ID loaded
```

**NÃO deve mostrar:**
```
❌ Uncaught SyntaxError: Unexpected token '<'
❌ Failed to load resource
```

### Teste 2: Abrir Popup

1. Clique no ícone da extensão (barra do Chrome)
2. Popup deve abrir mostrando:
   - ⚠️ Desconectado
   - Clique em Conectar para ativar
   - Botão azul "🔗 Conectar"

### Teste 3: Ver Logs do Popup

1. **ANTES** de clicar no ícone, faça:
2. Clique com **botão direito** no ícone da extensão
3. Selecione **"Inspecionar popup"**
4. DevTools abre
5. **AGORA SIM** clique no ícone para abrir o popup
6. Veja os logs no console

**Deve mostrar:**
```
🎯 [POPUP] Popup script loaded and ready
🚀 [POPUP] Initializing popup...
📊 Status Check: { hasBasicData: false, ... }
✅ [POPUP] Popup initialized
```

---

## 🐛 RESOLVER PROBLEMAS

### Problema: "Unexpected token '<'"

**Causa:** Chrome está carregando HTML em vez de JavaScript

**Solução:**
1. Remova a extensão completamente
2. Extraia o ZIP novamente em outra pasta
3. Carregue a pasta extraída (não o ZIP!)
4. Certifique-se de selecionar a pasta com `manifest.json`

### Problema: "Failed to load manifest"

**Causa:** Pasta errada selecionada

**Solução:**
1. Verifique se a pasta contém:
   ```
   ✓ manifest.json
   ✓ background.js
   ✓ content-script.js
   ✓ popup.html
   ✓ popup.js
   ✓ icons/ (pasta)
   ```
2. Se não tiver esses arquivos, você selecionou a pasta errada

### Problema: Ícone não aparece na barra

**Solução:**
1. Clique no ícone de **puzzle** (extensões) na barra do Chrome
2. Encontre **SyncAds AI Automation**
3. Clique no **📌 pin** para fixar na barra

---

## ✅ CHECKLIST DE INSTALAÇÃO

- [ ] Removi extensão antiga
- [ ] Extraí o ZIP para uma pasta
- [ ] Ativei "Modo do desenvolvedor"
- [ ] Carreguei a pasta (não o ZIP)
- [ ] Extensão aparece sem erros
- [ ] Console do background funciona
- [ ] Popup abre corretamente
- [ ] Logs aparecem no console

---

## 📸 PRÓXIMO PASSO: COLETAR LOGS

Após instalar corretamente, siga estas etapas:

### 1. Abrir 3 Consoles

**Console 1: Background**
- `chrome://extensions` → Clique em "Service Worker"

**Console 2: Página SyncAds**
- Abra https://syncads.com.br/login-v2
- Pressione F12 → Aba Console

**Console 3: Popup**
- Botão direito no ícone → "Inspecionar popup"

### 2. Fazer Login

1. Faça login no SyncAds (se não estiver)
2. Observe os logs no **Console 2**
3. Deve aparecer "Token is valid"

### 3. Clicar em Conectar

1. Clique no botão **"Conectar"** no popup
2. Observe logs em **TODOS** os 3 consoles
3. Copie e cole todos os logs aqui no chat

### 4. Verificar Storage

No **Console 3 (Popup)**, execute:
```javascript
chrome.storage.local.get(null, (data) => console.log("Storage:", JSON.stringify(data, null, 2)));
```

Copie o resultado!

---

## 📞 SE TUDO FALHAR

Compartilhe prints de:
1. Página `chrome://extensions` mostrando a extensão
2. Console do background com logs
3. Mensagem de erro completa (se houver)

---

**Versão:** 4.0.4-DEBUG  
**Arquivo:** syncads-extension-WORKING.zip  
**Última atualização:** 17/11/2025