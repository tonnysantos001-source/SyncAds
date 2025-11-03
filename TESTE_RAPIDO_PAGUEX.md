# ✅ Teste Rápido - Gateway Pague-X (Pós-Deploy)

**Data do Deploy**: 31/01/2025  
**Status**: Edge Function `gateway-config-verify` deployed com sucesso ✅  
**Urgência**: Alta - Teste imediato necessário

---

## 🎯 Objetivo

Testar se a correção da Edge Function resolveu o bug de verificação de credenciais do gateway Pague-X.

---

## ⚡ Teste Rápido (3 minutos)

### 1️⃣ Acessar Dashboard

1. Abra: https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/functions
2. Clique em **gateway-config-verify**
3. Abra aba **Logs** (deixe aberta em outra aba/tela)

### 2️⃣ Acessar Interface do Gateway

1. Abra a aplicação SyncAds
2. Vá para: **Dashboard > Checkout > Configurações de Gateway**
3. Selecione: **Pague-X**

### 3️⃣ Preencher Credenciais

**PublicKey**: 
```
pk_lIMlc5KEBubiYAEKlqi_DylmVviqow5r-QxFQuB3SpPqcc0u
```

**SecretKey**: 
```
[COLAR SECRET KEY DO CLIENTE AQUI]
```

**Ambiente**: Produção

### 4️⃣ Verificar Credenciais

1. Clique em **"Verificar credenciais"**
2. **Aguarde 2-5 segundos**
3. Observe os logs no Supabase Dashboard (aba que você abriu)

---

## ✅ Resultado Esperado (SUCESSO)

### Na Interface:
- ✅ Mensagem: "Credenciais verificadas com sucesso"
- ✅ Badge verde: **"✓ Verificado"**
- ✅ Campo "Ambiente": **production**
- ✅ Botão "Salvar" habilitado
- ✅ Checkbox "Marcar como padrão" disponível

### Nos Logs (Supabase Dashboard):
```
[PagueX] ========== INICIANDO VERIFICAÇÃO ==========
[PagueX] Credentials recebidas: [ 'publicKey', 'secretKey' ]
[PagueX] PublicKey presente: true
[PagueX] PublicKey (primeiros 15 chars): pk_lIMlc5KEBub
[PagueX] SecretKey presente: true
[PagueX] Fazendo requisição para: https://api.inpagamentos.com/v1/transactions?limit=1
[PagueX] Response recebida!
[PagueX] Status Code: 200
[PagueX] Status OK: true
[PagueX] ✅ VERIFICAÇÃO SUCESSO! Status: 200
[PagueX] ✅ Data recebida: [ 'pagination', 'data' ]
[HANDLER] Verificação concluída!
[HANDLER] - ok: true
[HANDLER] - httpStatus: 200
[HANDLER] - message: Credenciais Pague-X verificadas com sucesso
[HANDLER] ✅ GatewayConfig atualizado com sucesso
[HANDLER] ========== Retornando resposta com status 200 ==========
```

---

## ❌ Possíveis Erros

### Erro 1: Credenciais Inválidas (401)

**Logs:**
```
[PagueX] Status Code: 401
[PagueX] ❌ VERIFICAÇÃO FALHOU! Status: 401
[PagueX] ❌ 401 Unauthorized - Credenciais incorretas
```

**Solução:**
- Confirme que a publicKey está correta
- Confirme que a secretKey está correta
- Teste credenciais direto na API (ver seção "Teste Manual" abaixo)

### Erro 2: Timeout (408)

**Logs:**
```
[PagueX] ❌ TIMEOUT após 5 segundos
```

**Solução:**
- API pode estar lenta ou fora do ar
- Aguarde 1 minuto e tente novamente
- Verifique status da API: https://inpagamentos.com

### Erro 3: Adapter Não Encontrado (422)

**Logs:**
```
[HANDLER] ❌ Adapter não encontrado para slug: paguex
```

**Solução:**
- Deploy pode não ter sido aplicado corretamente
- Rode novamente: `supabase functions deploy gateway-config-verify`
- Aguarde 1-2 minutos para propagar

---

## 🧪 Teste Manual das Credenciais (Opcional)

Se quiser confirmar que as credenciais estão corretas independente da Edge Function:

### Via Console do Navegador:

1. Abra DevTools (F12)
2. Cole e execute:

```javascript
const publicKey = "pk_lIMlc5KEBubiYAEKlqi_DylmVviqow5r-QxFQuB3SpPqcc0u";
const secretKey = "[SECRET_KEY_AQUI]";
const auth = btoa(publicKey + ':' + secretKey);

fetch('https://api.inpagamentos.com/v1/transactions?limit=1', {
  headers: {
    'Authorization': 'Basic ' + auth,
    'Content-Type': 'application/json'
  }
})
.then(r => {
  console.log('Status:', r.status, r.ok ? '✅ OK' : '❌ ERRO');
  return r.json();
})
.then(data => {
  console.log('Data:', data);
  console.log('✅ CREDENCIAIS VÁLIDAS!');
})
.catch(err => {
  console.error('❌ ERRO:', err);
});
```

**Resultado Esperado:**
```
Status: 200 ✅ OK
Data: {pagination: {...}, data: Array(20)}
✅ CREDENCIAIS VÁLIDAS!
```

---

## 📊 Checklist Pós-Teste

Após teste bem-sucedido:

- [ ] ✅ Verificação retornou sucesso
- [ ] ✅ Badge "Verificado" aparece na UI
- [ ] ✅ Logs mostram status 200
- [ ] ✅ GatewayConfig foi atualizado no banco
- [ ] ✅ Salvar configuração
- [ ] ✅ Marcar como gateway padrão
- [ ] 🧪 Fazer teste de pagamento real (próximo passo)

---

## 🚀 Próximo Passo: Teste de Pagamento Real

Após verificação bem-sucedida:

1. **Salvar** a configuração do gateway
2. **Marcar como padrão**
3. Ir para página de **Checkout**
4. Criar pedido de teste
5. Testar pagamento:
   - 💳 **PIX** (mais rápido)
   - 💳 **Cartão de Crédito**
   - 💳 **Boleto**

---

## 📞 Reportar Resultado

### Se Funcionou ✅

✅ **SUCESSO!** Gateway Pague-X verificado e pronto para produção.

**Próximas ações:**
1. Notificar cliente que gateway está ativo
2. Monitorar primeiras transações reais
3. Configurar webhooks (se necessário)

### Se Não Funcionou ❌

❌ **ERRO!** Algo ainda precisa ser corrigido.

**Envie para o time:**
1. **Screenshot** da mensagem de erro na UI
2. **Logs** do Supabase Dashboard (copiar texto completo)
3. **Credenciais** usadas (apenas primeiros/últimos 5 caracteres)
4. **Horário** do teste

---

## 📂 Arquivos Relacionados

- ✅ Correções aplicadas: `CORRECOES_EDGE_FUNCTION_PAGUEX.md`
- 📖 Contexto completo: `CONTEXTO_EDGE_FUNCTION_PAGUEX.md`
- 🔧 Código da Edge Function: `supabase/functions/gateway-config-verify/index.ts`
- 📝 SQL de setup: `EXECUTAR_ESTE_SQL_AGORA.sql`

---

## 🔗 Links Úteis

- **Supabase Dashboard**: https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr
- **Edge Functions**: https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/functions
- **Logs**: https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/functions/gateway-config-verify/logs
- **API Pague-X**: https://api.inpagamentos.com/v1

---

**⏱️ Tempo estimado de teste**: 3-5 minutos  
**🎯 Resultado esperado**: ✅ Verificação bem-sucedida  
**📅 Data**: 31/01/2025  
**🚀 Status do Deploy**: ✅ Concluído com sucesso

---

**BOA SORTE! 🍀**

Qualquer problema, consulte os logs detalhados no Supabase Dashboard.