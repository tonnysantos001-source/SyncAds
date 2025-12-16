# 🔑 GUIA - OBTER TOKEN RAILWAY E CONFIGURAR ACESSO

## ⚡ PASSO A PASSO (5 MINUTOS)

### 1️⃣ Obter Token da Railway

1. **Acesse:** https://railway.app/account/tokens

2. **Clique em:** "Create New Token"

3. **Nome do Token:** `Antigravity-CLI-Access` (ou qualquer nome)

4. **Copie o token** (ele será mostrado apenas UMA VEZ)
   - Formato: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

---

### 2️⃣ Configurar Token (ESCOLHA UMA OPÇÃO)

#### OPÇÃO A: Token Temporário (Esta Sessão)
```powershell
$env:RAILWAY_TOKEN="cole_seu_token_aqui"
```

#### OPÇÃO B: Token Permanente (Arquivo .env)
```powershell
# Edite o arquivo .env na raiz do projeto
# Adicione esta linha:
RAILWAY_TOKEN=cole_seu_token_aqui
```

#### OPÇÃO C: Token do Sistema (Windows)
```powershell
# Permanente para o usuário
[System.Environment]::SetEnvironmentVariable('RAILWAY_TOKEN', 'cole_seu_token_aqui', 'User')

# Reabra o PowerShell depois
```

---

### 3️⃣ Testar Conexão

```powershell
cd c:\Users\dinho\Documents\GitHub\SyncAds

# Teste se o token funciona
node scripts/railway-api-client.mjs status
```

**Resultado Esperado:**
```
🔍 Obtendo status do projeto...

📊 PROJETO:
   ID: 5f47519b-0823-45aa-ab00-bc9bcaaa1c94
   Nome: syncads-python-microservice
   Criado em: ...

🚀 SERVIÇOS:
   - SyncAds (ID: ...)

📦 ÚLTIMOS DEPLOYMENTS:
   - ...
```

---

## 🚀 COMANDOS DISPONÍVEIS

### Ver Status
```powershell
node scripts/railway-api-client.mjs status
```

### Fazer Redeploy
```powershell
node scripts/railway-api-client.mjs redeploy
```

### Ver Logs
```powershell
node scripts/railway-api-client.mjs logs
```

### Ver Variáveis de Ambiente
```powershell
node scripts/railway-api-client.mjs variables
```

### Ajuda
```powershell
node scripts/railway-api-client.mjs help
```

---

## ✅ VANTAGENS DESTE MÉTODO

1. ✅ **Não depende da Railway CLI travada**
2. ✅ **API GraphQL oficial da Railway**
3. ✅ **Controle total via código**
4. ✅ **Posso executar automaticamente**
5. ✅ **Logs detalhados**
6. ✅ **Gerenciamento de variáveis**

---

## 🎯 PRÓXIMOS PASSOS

Depois de configurar o token:

1. **Execute:** `node scripts/railway-api-client.mjs status`
2. **Me avise que funcionou**
3. **Eu farei o redeploy automaticamente**
4. **Monitorarei os logs**
5. **Validarei que está funcionando**

---

## ⚠️ SEGURANÇA DO TOKEN

### ✅ FAÇA:
- Guarde o token no `.env` (já no .gitignore)
- Use token apenas para este projeto
- Revogue tokens antigos/não usados

### ❌ NÃO FAÇA:
- Compartilhar token publicamente
- Fazer commit do token no git
- Usar mesmo token em múltiplos lugares

---

## 🔄 SE O TOKEN EXPIRAR

1. Acesse: https://railway.app/account/tokens
2. Delete o token antigo
3. Crie novo token
4. Atualize a variável `RAILWAY_TOKEN`
5. Teste com: `node scripts/railway-api-client.mjs status`

---

## 📱 ALTERNATIVA: Via Dashboard

Se preferir fazer manualmente por enquanto:

1. Acesse: https://railway.app/project/5f47519b-0823-45aa-ab00-bc9bcaaa1c94
2. Clique no serviço
3. Deployments → Redeploy

**MAS**: Com o token configurado, eu posso fazer tudo isso automaticamente para você! 🚀

---

## 🆘 PROBLEMAS COMUNS

### Erro: "RAILWAY_TOKEN não definido"
```powershell
# Verifique se está definido:
$env:RAILWAY_TOKEN

# Se não retornar nada, defina novamente:
$env:RAILWAY_TOKEN="seu_token"
```

### Erro: "Unauthorized" ou "401"
- Token inválido ou expirado
- Crie novo token e atualize

### Erro: "Project not found"
- Verifique se o token tem acesso ao projeto
- Verifique se está no workspace correto

---

## ✅ CHECKLIST

- [ ] Acessei https://railway.app/account/tokens
- [ ] Criei novo token
- [ ] Copiei o token
- [ ] Configurei `$env:RAILWAY_TOKEN="..."`
- [ ] Testei `node scripts/railway-api-client.mjs status`
- [ ] Funcionou! ✅

---

**Cole seu token e execute o comando de teste. Assim que funcionar, eu faço o resto! 🚀**
