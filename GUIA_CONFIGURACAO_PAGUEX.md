# 🎯 GUIA DE CONFIGURAÇÃO - PAGUE-X (inpagamentos.com)

## ✅ CORREÇÕES APLICADAS

### 1. **Gateway Renomeado**
- ❌ Antes: FusionPay (fusionpay)
- ✅ Agora: **Pague-X (paguex)**

### 2. **API Configurada**
- Endpoint: `https://api.inpagamentos.com/v1`
- Transações: `POST /v1/transactions`
- Consulta: `GET /v1/transactions/:id`

### 3. **Autenticação Corrigida**
- Método: **Basic Auth**
- Header: `Authorization: Basic base64(publicKey:secretKey)`

### 4. **Métodos Suportados**
- ✅ PIX
- ✅ Cartão de Crédito
- ✅ Cartão de Débito
- ✅ Boleto

---

## 📋 PASSOS PARA ATIVAR NO SEU SISTEMA

### **PASSO 1: Executar SQL no Supabase**

1. Acesse: https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/sql/new
2. Cole o conteúdo do arquivo `EXECUTAR_NO_SUPABASE_SQL.sql`
3. Clique em **RUN** ou pressione `Ctrl+Enter`
4. Aguarde a mensagem de sucesso: ✅ PAGUE-X CONFIGURADO COM SUCESSO!

### **PASSO 2: Configurar Credenciais**

1. Acesse seu dashboard SyncAds
2. Vá em: **Checkout > Gateways de Pagamento**
3. Localize **Pague-X**
4. Clique em **Configurar**
5. Preencha:
   - **Public Key**: Sua chave pública da inpagamentos.com
   - **Secret Key**: Sua chave secreta da inpagamentos.com
   - **Ambiente**: Produção
6. Clique em **Verificar Credenciais**
7. Se válido, clique em **Salvar**
8. Marque como **Gateway Padrão**

### **PASSO 3: Onde Encontrar as Chaves**

1. Acesse: https://app.inpagamentos.com
2. Faça login na sua conta
3. Vá em: **Menu > Integrações**
4. Copie:
   - **Chave Pública** (Public Key)
   - **Chave Secreta** (Secret Key)

⚠️ **IMPORTANTE**: Use as chaves de **PRODUÇÃO**, não de teste!

---

## 🧪 COMO TESTAR

### **1. Criar Pedido de Teste**

```bash
# No seu sistema, crie um pedido com produto Shopify
# O checkout deve estar funcionando
```

### **2. Acessar Checkout**

```
URL: https://syncads-dun.vercel.app/checkout/{orderId}
```

### **3. Preencher Dados**

- Nome completo
- Email válido
- CPF válido
- Telefone
- Endereço completo (CEP válido)

### **4. Escolher Método de Pagamento**

**PIX:**
- Será gerado QR Code
- Copie e cole ou escaneie
- Aguarde confirmação

**Cartão de Crédito:**
- Número do cartão
- Nome no cartão
- Validade (MM/AAAA)
- CVV
- Parcelas

**Boleto:**
- Será gerado link do PDF
- Código de barras
- Linha digitável

### **5. Verificar Logs**

No console do navegador (F12), você verá:
```
🔍 [DEBUG] Resposta process-payment: {...}
```

Se aparecer erro, capture a mensagem e me envie.

---

## 🐛 POSSÍVEIS ERROS E SOLUÇÕES

### **Erro: "NO_VERIFIED_PRODUCTION_GATEWAY"**

**Causa**: Gateway não está em produção ou não verificado

**Solução**:
1. Vá em **Checkout > Gateways**
2. Edite Pague-X
3. Certifique-se:
   - ✅ Ambiente = Produção
   - ✅ Status = Ativo
   - ✅ Verificado = Sim
   - ✅ Padrão = Sim

### **Erro: "Invalid credentials"**

**Causa**: Chaves incorretas ou inválidas

**Solução**:
1. Verifique se copiou as chaves corretas
2. Não deve ter espaços em branco
3. Use chaves de PRODUÇÃO
4. Refaça o processo de verificação

### **Erro: CORS / Acesso bloqueado**

**Causa**: Problema de CORS já está resolvido no código

**Solução**:
- Limpe cache do navegador
- Tente em aba anônima
- Se persistir, me avise

### **Erro: "Unsupported gateway"**

**Causa**: Edge Function não atualizada

**Solução**:
```bash
cd SyncAds
supabase functions deploy process-payment
```

---

## 🔍 VERIFICAR SE ESTÁ FUNCIONANDO

### **Query SQL para Verificar Gateway**

```sql
SELECT
  g.id,
  g.name,
  g.slug,
  g."apiUrl",
  gc."userId",
  gc."isActive",
  gc."isDefault",
  gc."isVerified",
  gc.environment
FROM "Gateway" g
LEFT JOIN "GatewayConfig" gc ON gc."gatewayId" = g.id
WHERE g.slug = 'paguex'
ORDER BY gc."createdAt" DESC;
```

Deve retornar:
- ✅ Gateway existe
- ✅ Tem configuração ativa
- ✅ Ambiente = production
- ✅ isVerified = true
- ✅ isDefault = true

---

## 📞 SUPORTE

Se algo não funcionar:

1. **Capture os logs**:
   - Console do navegador (F12 > Console)
   - Network tab (F12 > Network > filtrar "process-payment")

2. **Verifique o banco**:
   - Execute a query de verificação acima
   - Capture o resultado

3. **Me envie**:
   - Screenshot do erro
   - Logs do console
   - Resultado da query
   - Descrição do que aconteceu

---

## 🚀 PRÓXIMOS PASSOS APÓS CONFIGURAR

1. ✅ Testar PIX
2. ✅ Testar Cartão de Crédito
3. ✅ Testar Boleto
4. ✅ Verificar webhooks (notificações de pagamento)
5. ✅ Configurar URL de retorno/sucesso

---

## 📊 ESTRUTURA DE DADOS PAGUE-X

### **Status de Transação**
- `waiting_payment` → Aguardando pagamento
- `pending` → Em confirmação
- `approved` → Aprovado
- `paid` → Pago
- `refused` → Recusado
- `cancelled` → Cancelado
- `refunded` → Reembolsado

### **Métodos de Pagamento**
- `pix` → PIX
- `credit_card` → Cartão de Crédito
- `boleto` → Boleto Bancário

### **Credenciais Necessárias**
- `publicKey` → Chave pública (para frontend)
- `secretKey` → Chave secreta (para backend)

---

## ✨ FEATURES IMPLEMENTADAS

✅ Validação de credenciais automática
✅ Suporte a PIX com QR Code
✅ Suporte a Cartão (Crédito/Débito)
✅ Suporte a Boleto com código de barras
✅ Webhooks para notificações
✅ Consulta de status de pagamento
✅ Tratamento de erros robusto
✅ Logs detalhados para debug

---

## 🎉 TUDO PRONTO!

Agora é só:
1. Executar o SQL
2. Configurar as credenciais
3. Testar um pagamento

Boa sorte! 🚀
