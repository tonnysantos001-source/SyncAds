# ✅ Teste do Facebook OAuth - SyncAds

**Client ID:** 1907637243430460  
**Status:** ✅ Configurado no código

---

## 🔍 Pré-Requisitos (IMPORTANTE!)

Antes de testar, você **DEVE** configurar no Meta for Developers:

### 1. ✅ Adicionar Redirect URIs

1. **Acesse:** https://developers.facebook.com/apps/1907637243430460/settings/basic/
2. **Role até:** "URIs de Redirecionamento do OAuth Válidos"
3. **Adicione (linha por linha):**
   ```
   http://localhost:5173/integrations/callback
   ```
4. **Clique em:** "Salvar Alterações"

⚠️ **SEM ISSO, O OAUTH NÃO VAI FUNCIONAR!**

---

### 2. ✅ Adicionar Permissões (Marketing API)

1. **No seu app Meta, vá em:** "Produtos"
2. **Adicione:** "Marketing API" (se ainda não tiver)
3. **Vá em:** "Permissões e Recursos"
4. **Solicite as permissões:**
   - `ads_management`
   - `ads_read`
   - `business_management`

---

## 🧪 Como Testar

### Passo 1: Reiniciar Servidor

```bash
# No terminal, pressione Ctrl+C para parar o servidor
# Depois rode novamente:
npm run dev
```

**Por quê?** O Vite precisa recarregar as variáveis de ambiente do `.env`

---

### Passo 2: Verificar Variáveis

1. **Abra o console do navegador** (F12)
2. **Digite:**
   ```javascript
   console.log('Client ID:', import.meta.env.VITE_META_CLIENT_ID);
   console.log('Tem Secret?', !!import.meta.env.VITE_META_CLIENT_SECRET);
   ```

3. **Deve mostrar:**
   ```
   Client ID: 1907637243430460
   Tem Secret? true
   ```

✅ **Se aparecer isso = Configurado corretamente!**

❌ **Se aparecer `undefined` = Servidor não foi reiniciado**

---

### Passo 3: Gerar URL OAuth

**No console do navegador:**

```javascript
// Criar state de teste
const state = btoa(JSON.stringify({
  platform: 'facebook_ads',
  userId: 'test-user-123',
  timestamp: Date.now(),
  random: Math.random().toString(36).substring(7)
}));

// Gerar URL OAuth
const clientId = '1907637243430460';
const redirectUri = 'http://localhost:5173/integrations/callback';
const scopes = 'ads_management,ads_read,pages_manage_ads';

const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes}&state=${state}`;

console.log('URL OAuth:', authUrl);

// Abrir em nova aba
window.open(authUrl, '_blank');
```

---

### Passo 4: Autorizar no Facebook

1. **Nova aba abrirá** com login do Facebook
2. **Faça login** com sua conta
3. **Você verá:**
   - Nome do app: "SyncAds" (ou o nome que você colocou)
   - Permissões solicitadas
4. **Clique em:** "Continuar" ou "Autorizar"

---

### Passo 5: Verificar Callback

Após autorizar, você será redirecionado para:

```
http://localhost:5173/integrations/callback?code=ABC123...&state=...
```

**O que deve acontecer:**
1. ✅ Página de callback abre
2. ✅ Mostra "Processing..."
3. ✅ Tenta trocar `code` por `access_token`
4. ✅ Salva no banco Supabase
5. ✅ Mostra "Success!" e fecha

---

## ❗ Possíveis Erros

### Erro 1: "Redirect URI mismatch"

**Motivo:** Redirect URI não foi adicionado no Meta Developers

**Solução:**
1. Vá em: https://developers.facebook.com/apps/1907637243430460/settings/basic/
2. Adicione: `http://localhost:5173/integrations/callback`
3. Salve e teste novamente

---

### Erro 2: "Invalid OAuth access token"

**Motivo:** Client Secret incorreto

**Solução:**
1. Verifique se copiou o Client Secret correto
2. Confirme que está em `VITE_META_CLIENT_SECRET` no `.env`
3. Reinicie o servidor

---

### Erro 3: "App not setup: This app is still in development mode"

**Motivo:** App em modo de desenvolvimento

**Solução:**
1. **NORMAL!** Está em desenvolvimento
2. **Teste com sua própria conta** (funcionará)
3. **Para outros usuários:**
   - Vá em: "Papéis" → "Funções de teste"
   - Adicione usuários de teste
   - OU publique o app (demora dias para aprovação)

---

### Erro 4: "CORS error" ao trocar tokens

**Motivo:** Não dá para trocar tokens direto do frontend (precisa do backend)

**Solução TEMPORÁRIA:**
Por enquanto, o fluxo parará no callback. Isso é ESPERADO até criarmos a Edge Function.

Você verá o `code` na URL:
```
?code=ABC123XYZ...
```

✅ **Se chegou até aqui = OAuth está funcionando!**

O próximo passo é criar Edge Function para trocar o `code` por `access_token`.

---

## 📊 Checklist de Teste

Marque conforme for testando:

### Configuração Meta Developers
- [ ] Redirect URI adicionado
- [ ] Marketing API habilitada
- [ ] Permissões configuradas

### Código
- [x] Client ID no `.env`
- [x] Client Secret no `.env`
- [x] oauthConfig.ts atualizado
- [x] integrationsService.ts atualizado

### Testes
- [ ] Servidor reiniciado
- [ ] Variáveis carregadas (console)
- [ ] URL OAuth gerada
- [ ] Login no Facebook funcionou
- [ ] Redirect funcionou
- [ ] Callback abriu

---

## 🎯 Resultado Esperado

### ✅ Sucesso Parcial (OK por enquanto):
```
1. URL gerada ✅
2. Login no Facebook ✅
3. Autorização concedida ✅
4. Redirect para callback ✅
5. Code recebido ✅
6. Troca de token ❌ (ESPERADO - precisa Edge Function)
```

### ✅ Sucesso Total (após Edge Function):
```
1-5. Igual acima ✅
6. Troca de token ✅
7. Salvou no banco ✅
8. Popup fechou ✅
9. Integração conectada ✅
```

---

## 🚀 Próximo Passo

Depois que confirmar que o OAuth funciona até o callback, precisamos:

1. **Criar Supabase Edge Function** para trocar tokens
2. **Mover Client Secret** para a Edge Function (seguro)
3. **Testar fluxo completo** end-to-end

---

## 💡 Dica Pro

Para ver o `code` que o Facebook retorna:

1. Abra DevTools (F12)
2. Vá em "Network"
3. Autorize no Facebook
4. Veja o redirect na aba Network
5. Você verá o `code` na URL

Esse `code` é o que precisa ser trocado por `access_token`!

---

**✅ TUDO PRONTO PARA TESTAR!**

**Próximo passo:**
1. Configure Redirect URI no Meta Developers
2. Reinicie servidor (`npm run dev`)
3. Teste o fluxo OAuth
4. Me avise se funcionou! 🎉

