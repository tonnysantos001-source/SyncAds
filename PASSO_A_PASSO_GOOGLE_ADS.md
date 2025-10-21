# 🔵 PASSO A PASSO: GOOGLE ADS OAUTH

**Tempo estimado:** 1 hora  
**Dificuldade:** Fácil  
**Resultado:** IA poderá conectar e controlar Google Ads

---

## 📋 PRÉ-REQUISITOS

- [ ] Conta Google (Gmail)
- [ ] Navegador aberto
- [ ] 30 minutos disponíveis

**Não precisa:**
- ❌ Cartão de crédito
- ❌ Conta Google Ads ativa (pode criar depois)
- ❌ Experiência prévia

---

## 🎯 PASSO 1: CRIAR PROJETO GOOGLE CLOUD (5 min)

### **1.1 Acessar Console**
1. Abra: https://console.cloud.google.com/
2. Faça login com sua conta Google
3. Aceite os Termos de Serviço (se aparecer)

### **1.2 Criar Novo Projeto**
1. Clique na **barra superior** onde está escrito o nome do projeto
2. Clique em **"NEW PROJECT"** (botão azul no canto superior direito)
3. Preencha:
   - **Project name:** `SyncAds Google Ads`
   - **Location:** Deixe como está (No organization)
4. Clique em **"CREATE"**
5. **Aguarde 10-30 segundos** (aparecerá notificação de criação)

### **1.3 Selecionar Projeto**
1. Clique novamente na **barra superior**
2. Selecione o projeto **"SyncAds Google Ads"**
3. Confirme que o nome aparece na barra superior

✅ **Checkpoint:** Nome do projeto aparece no topo da tela

---

## 🔌 PASSO 2: HABILITAR GOOGLE ADS API (3 min)

### **2.1 Ir para API Library**
1. No menu lateral (☰), clique em **"APIs & Services"**
2. Clique em **"Library"** (ou **"Biblioteca"**)
3. Você verá uma tela cheia de APIs

### **2.2 Buscar e Habilitar**
1. Na barra de busca, digite: `Google Ads API`
2. Clique no resultado **"Google Ads API"** (logo azul)
3. Clique no botão **"ENABLE"** (ou **"ATIVAR"**)
4. **Aguarde 5-10 segundos**
5. Você será redirecionado para a página da API

✅ **Checkpoint:** Vê "API enabled" (API ativada)

---

## 🔐 PASSO 3: CONFIGURAR OAUTH CONSENT SCREEN (10 min)

### **3.1 Acessar OAuth Consent**
1. No menu lateral, clique em **"APIs & Services"**
2. Clique em **"OAuth consent screen"**
3. Você verá 2 opções: Internal / External

### **3.2 Escolher Tipo**
1. Selecione **"External"** (círculo azul)
2. Clique em **"CREATE"** (ou **"CRIAR"**)

### **3.3 Preencher Informações do App**

**Tela 1: App information**
- **App name:** `SyncAds`
- **User support email:** Seu email (selecione no dropdown)
- **App logo:** Deixe em branco (opcional)
- **App domain:** Deixe em branco
- **Authorized domains:** Deixe em branco
- **Developer contact information → Email addresses:** Seu email

Clique em **"SAVE AND CONTINUE"**

**Tela 2: Scopes**
1. Clique em **"ADD OR REMOVE SCOPES"**
2. Na busca, digite: `adwords`
3. **Marque a caixa:**
   - ☑️ `https://www.googleapis.com/auth/adwords`
4. Clique em **"UPDATE"**
5. Clique em **"SAVE AND CONTINUE"**

**Tela 3: Test users**
1. Clique em **"ADD USERS"**
2. Digite **seu email** (o mesmo da conta Google)
3. Clique em **"ADD"**
4. Clique em **"SAVE AND CONTINUE"**

**Tela 4: Summary**
1. Revise as informações
2. Clique em **"BACK TO DASHBOARD"**

✅ **Checkpoint:** Vê "Publishing status: Testing" na tela

---

## 🔑 PASSO 4: CRIAR CREDENCIAIS OAUTH (5 min)

### **4.1 Acessar Credentials**
1. No menu lateral, clique em **"APIs & Services"**
2. Clique em **"Credentials"** (ou **"Credenciais"**)

### **4.2 Criar OAuth Client ID**
1. Clique em **"+ CREATE CREDENTIALS"** (topo da página)
2. Selecione **"OAuth client ID"**

### **4.3 Configurar Aplicação**

**Application type:**
- Selecione **"Web application"**

**Name:**
- Digite: `SyncAds Web Client`

**Authorized JavaScript origins:**
- Clique em **"+ ADD URI"**
- Digite: `http://localhost:5173`

**Authorized redirect URIs:**
- Clique em **"+ ADD URI"**
- Digite: `http://localhost:5173/integrations/callback`

**IMPORTANTE:** Adicione também para produção (quando tiver domínio):
- Clique em **"+ ADD URI"** novamente
- Digite: `https://seu-dominio.com/integrations/callback`
- (Pode editar depois quando tiver o domínio real)

### **4.4 Criar e Copiar Credenciais**
1. Clique em **"CREATE"**
2. Aparecerá um popup com suas credenciais
3. **COPIE AGORA** (não fecha o popup ainda):
   - **Client ID** (formato: `1234567890-abc...xyz.apps.googleusercontent.com`)
   - **Client secret** (formato: `GOCSPX-abc123...xyz`)

**💾 SALVE EM UM BLOCO DE NOTAS TEMPORÁRIO:**
```
Client ID: 1234567890-abc...xyz.apps.googleusercontent.com
Client Secret: GOCSPX-abc123...xyz
```

4. Clique em **"OK"** para fechar o popup

✅ **Checkpoint:** Credenciais copiadas e salvas

---

## 📊 PASSO 5: OBTER CUSTOMER ID DO GOOGLE ADS (2 min)

### **Opção A: Se você já tem conta Google Ads**
1. Acesse: https://ads.google.com/
2. Faça login
3. No canto **superior direito**, você verá um número tipo: `123-456-7890`
4. **Copie esse número SEM os hífens:** `1234567890`

### **Opção B: Se você NÃO tem conta Google Ads**
1. Por enquanto, use um ID de teste: `1234567890`
2. Você pode conectar com uma conta real depois
3. Ou criar uma conta Google Ads:
   - Acesse: https://ads.google.com/
   - Clique em "Start now"
   - Siga o wizard (pode pular a campanha inicial)
   - Depois de criar, veja o número no topo

**💾 SALVE:**
```
Customer ID: 1234567890
```

✅ **Checkpoint:** Customer ID copiado

---

## 🔧 PASSO 6: ATUALIZAR .ENV (3 min)

### **6.1 Abrir arquivo .env**
1. Abra o projeto SyncAds no VS Code
2. Abra o arquivo `.env` (raiz do projeto)

### **6.2 Encontrar seção Google Ads**
Procure por:
```env
# OAuth Client IDs - Outras plataformas (não configurado ainda)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### **6.3 Substituir com suas credenciais**
```env
# OAuth - GOOGLE ADS (CONFIGURADO ✅)
VITE_GOOGLE_CLIENT_ID=1234567890-abc...xyz.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=GOCSPX-abc123...xyz
VITE_GOOGLE_ADS_CUSTOMER_ID=1234567890
```

⚠️ **IMPORTANTE:** Cole EXATAMENTE como copiou, sem espaços extras

### **6.4 Salvar arquivo**
1. Salve o arquivo (Ctrl+S)
2. **Não commite no Git!** (o .env já está no .gitignore)

✅ **Checkpoint:** Credenciais no .env

---

## 🔄 PASSO 7: REINICIAR SERVIDOR (1 min)

### **7.1 Parar servidor atual**
1. No terminal onde está rodando `npm run dev`
2. Pressione **Ctrl+C**
3. Aguarde o processo parar

### **7.2 Iniciar novamente**
```bash
npm run dev
```

4. Aguarde aparecer: `Local: http://localhost:5173/`

✅ **Checkpoint:** Servidor reiniciado

---

## ✅ PASSO 8: TESTAR INTEGRAÇÃO (5 min)

### **8.1 Acessar Chat**
1. Abra o navegador: http://localhost:5173/
2. Faça login (se necessário)
3. Vá para `/chat`

### **8.2 Comando de Teste**
Digite no chat:
```
Conecte o Google Ads
```

### **8.3 Verificar Resposta**
A IA deve:
1. ✅ Mostrar um botão **[Connect Google Ads]**
2. ✅ Explicar o que vai fazer
3. ❌ **NÃO** mostrar erro de "Client ID não configurado"

### **8.4 Clicar no Botão (Opcional - teste completo)**
1. Clique no botão **[Connect Google Ads]**
2. Um popup abrirá com login Google
3. Faça login com a conta que você adicionou como "Test user"
4. Autorize o app SyncAds
5. O popup fechará automaticamente
6. Você verá mensagem de sucesso

### **8.5 Verificar Conexão**
Digite no chat:
```
audite as integrações
```

Deve aparecer:
```
GOOGLE_ADS: ✅ Conectado
Última sincronização: Agora
```

✅ **Checkpoint:** Google Ads conectado!

---

## 🎉 RESULTADO ESPERADO

### **Antes:**
```
❌ GOOGLE_ADS: Não conectado
Erro: Client ID não configurado
```

### **Depois:**
```
✅ GOOGLE_ADS: Conectado
Última sincronização: 21/10/2025 19:00
IA pode criar campanhas: ✅ Sim
```

---

## 🐛 TROUBLESHOOTING

### **Erro: "Redirect URI mismatch"**
**Causa:** URL de callback não está configurada corretamente

**Solução:**
1. Volte para Google Cloud Console
2. APIs & Services → Credentials
3. Clique no seu OAuth Client ID
4. Verifique "Authorized redirect URIs"
5. Deve ter EXATAMENTE: `http://localhost:5173/integrations/callback`
6. Salve e teste novamente

### **Erro: "Access blocked: This app's request is invalid"**
**Causa:** Você não está logado com o email de "Test user"

**Solução:**
1. Google Cloud Console → OAuth consent screen
2. Clique em "ADD USERS"
3. Adicione o email que você está usando
4. Tente novamente

### **Erro: "Client ID não configurado" ainda aparece**
**Causa:** .env não foi salvo ou servidor não reiniciou

**Solução:**
1. Verifique se salvou o `.env` (Ctrl+S)
2. Pare o servidor (Ctrl+C)
3. Inicie novamente: `npm run dev`
4. Force reload no navegador (Ctrl+Shift+R)

### **Erro: "Invalid scope"**
**Causa:** Scope do Google Ads não foi adicionado

**Solução:**
1. Google Cloud Console → OAuth consent screen
2. Clique em "EDIT APP"
3. Vá para "Scopes"
4. Adicione: `https://www.googleapis.com/auth/adwords`
5. Salve

---

## 📝 CHECKLIST FINAL

- [ ] Projeto Google Cloud criado
- [ ] Google Ads API habilitada
- [ ] OAuth Consent Screen configurado (External)
- [ ] Test user adicionado (seu email)
- [ ] OAuth Client ID criado
- [ ] Client ID copiado
- [ ] Client Secret copiado
- [ ] Customer ID obtido (ou usando teste)
- [ ] Credenciais adicionadas no .env
- [ ] Servidor reiniciado
- [ ] Teste no chat funcionou
- [ ] Botão [Connect Google Ads] apareceu
- [ ] (Opcional) Conta conectada com sucesso

---

## 🎯 PRÓXIMOS PASSOS

Agora que Google Ads está configurado:

**Imediato:**
- [ ] Conectar uma conta Google Ads real (se ainda não fez)
- [ ] Testar criação de campanha via IA

**Próximo dia do Roadmap:**
- [ ] **DIA 2:** LinkedIn Ads OAuth (2h)
- [ ] **DIA 2:** TikTok Ads OAuth (2h)

---

## 💡 DICAS

1. **Guarde as credenciais:** Anote Client ID e Secret em local seguro
2. **Múltiplos ambientes:** Adicione redirect URIs de dev e produção
3. **Aprovação futura:** Quando quiser publicar o app, precisará verificação do Google (mas para teste está OK)
4. **Quotas:** Modo teste tem limites menores, mas suficiente para desenvolvimento

---

**🎉 Parabéns! Google Ads OAuth está 100% configurado!**

**Agora a IA pode:**
- ✅ Conectar contas Google Ads
- ✅ Criar campanhas
- ✅ Buscar métricas
- ✅ Otimizar orçamentos
- ✅ Segmentar audiências

**Próximo:** Me avise quando terminar para irmos para o DIA 2!
