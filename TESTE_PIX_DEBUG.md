# 🔍 TESTE E DEBUG DO FLUXO PIX - INSTRUÇÕES

## 📋 PRÉ-REQUISITOS

- ✅ Backend (Edge Functions) deployed: `process-payment` v21
- ✅ Frontend deployed: https://syncads-24zzjbq2w-carlos-dols-projects.vercel.app
- ✅ Logs de debug adicionados em todos os pontos críticos
- ✅ Gateway Pague-X configurado com credenciais válidas

---

## 🧪 PASSO A PASSO PARA TESTE

### 1. Acessar o Checkout
```
https://syncads-24zzjbq2w-carlos-dols-projects.vercel.app/checkout/ORDER_ID
```
*(Substitua ORDER_ID pelo ID do pedido real)*

### 2. Preencher Dados do Cliente
- Nome completo
- Email válido
- CPF válido (ex: 123.456.789-09)
- Telefone (ex: 11 98765-4321)

### 3. Preencher Endereço
- CEP válido (consulta automática)
- Número, complemento, etc.

### 4. Selecionar PIX e Finalizar
- Clicar no botão "PIX"
- Clicar em "Finalizar Compra"
- **AGUARDAR** (não fechar o console ainda!)

---

## 🔎 O QUE VERIFICAR NO CONSOLE DO NAVEGADOR

Abra o **DevTools** (F12) e vá para a aba **Console**. Você deve ver a seguinte sequência de logs:

### ✅ LOGS ESPERADOS NO FRONTEND

#### 1. Normalização do Método de Pagamento
```javascript
[DEBUG] Payment method original: PIX
[DEBUG] Payment method normalized: pix
```

#### 2. Resposta da API
```javascript
🔍 [DEBUG] Resposta process-payment: { data: {...}, errors: null }
🔍 [DEBUG] data.success: true
🔍 [DEBUG] paymentMethod: PIX
🔍 [DEBUG] data.pixData: { qrCode: "00020126...", ... }
🔍 [DEBUG] data.transactionId: "uuid-xxxx-xxxx"
🔍 [DEBUG] effectiveOrderId: "ORDER_ID"
```

#### 3. Entrada no Bloco de Redirecionamento PIX
```javascript
✅ [DEBUG] Entrando no bloco de PIX
✅ [DEBUG] Vai redirecionar para: /pix/ORDER_ID/TRANSACTION_ID
```

#### 4. Toast de Sucesso
```
"PIX gerado com sucesso!"
"Redirecionando para pagamento..."
```

#### 5. Redirecionamento (após 1 segundo)
- URL deve mudar para: `/pix/ORDER_ID/TRANSACTION_ID`
- Página `PixPaymentPage` deve carregar
- QR Code deve aparecer

### ⚠️ LOGS DE PROBLEMA (SE NÃO FUNCIONAR)

Se aparecer este log, algo está errado:
```javascript
❌ [DEBUG] NÃO entrou em nenhum bloco de pagamento
❌ [DEBUG] Motivo:
   - paymentMethod: PIX
   - paymentMethod === 'CREDIT_CARD'? false
   - paymentMethod === 'PIX'? true
   - data.pixData existe? false ❌ PROBLEMA AQUI!
```

**Diagnóstico**: A API não está retornando `data.pixData`

---

## 🖥️ O QUE VERIFICAR NOS LOGS DO SUPABASE

### Acessar Logs da Edge Function
1. Acesse: https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/functions/process-payment/logs
2. Clique em "Refresh" após fazer o teste
3. Procure pela última execução

### ✅ LOGS ESPERADOS NO BACKEND

#### 1. Verificação dos Dados da Resposta
```
[Pague-X] 🔍 Verificando dados do response:
   - response.id: 123456
   - response.status: waiting_payment
   - response.pix: { qrcode: "00020126...", expirationDate: "2025-..." }
   - response.pix?.qrcode existe? true ✅
   - request.paymentMethod: PIX
```

#### 2. Resposta Final
```
[Pague-X] 🎯 Resposta final sendo retornada:
   - transactionId: uuid-xxxx-xxxx
   - status: PENDING
   - pixData existe? true ✅
   - pixData.qrCode (primeiros 50 chars): 00020126580014br.gov.bcb.pix...
   - pixData.expiresAt: 2025-11-04
   - pixData.amount: 21.06
```

### ⚠️ SE `pixData existe? false`

**Possíveis causas:**

1. **API Pague-X não retornou `response.pix`**
   - Verificar: `response.pix` é `undefined` ou `null`?
   - Solução: Verificar payload enviado para Pague-X
   - Verificar: Credenciais válidas?

2. **Método de pagamento incorreto**
   - Verificar: `request.paymentMethod` é `PIX`?
   - Verificar: Normalização está correta?

3. **Condição não está sendo satisfeita**
   ```typescript
   if (response.pix && request.paymentMethod === PaymentMethod.PIX) {
     // Este bloco não está sendo executado
   }
   ```

---

## 🔧 VERIFICAÇÕES ADICIONAIS

### 1. Verificar Transação no Banco de Dados

Acesse: https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/editor

Execute:
```sql
SELECT 
  id,
  status,
  "paymentMethod",
  amount,
  metadata->'pixData' as pix_data,
  "createdAt"
FROM "Transaction"
ORDER BY "createdAt" DESC
LIMIT 1;
```

**Verificar:**
- ✅ `status` = "PENDING"
- ✅ `paymentMethod` = "PIX"
- ✅ `pix_data` não é `null` (deve conter qrCode, expiresAt, etc.)

### 2. Verificar localStorage

No Console do navegador:
```javascript
// Verificar se PIX foi salvo
localStorage.getItem('pix-ORDER_ID');

// Deve retornar:
// {"qrCode":"00020126...","amount":21.06,"transactionId":"uuid-..."}
```

### 3. Testar Rota Manualmente

Após gerar PIX, copie o `transactionId` dos logs e acesse manualmente:
```
https://syncads-24zzjbq2w-carlos-dols-projects.vercel.app/pix/ORDER_ID/TRANSACTION_ID
```

**Deve aparecer:**
- ✅ QR Code grande (400x400px)
- ✅ Botão "Copiar Código PIX"
- ✅ Timer de expiração
- ✅ Valor do pagamento

---

## 🎯 CENÁRIOS E SOLUÇÕES

### ❌ PROBLEMA: Não redireciona para `/pix/...`

**Verificar:**
1. Console mostra: `data.pixData existe? false`
   - **Causa**: Backend não está retornando pixData
   - **Solução**: Verificar logs do Supabase (seção anterior)

2. Console mostra: `Entrando no bloco de PIX` mas não redireciona
   - **Causa**: Erro no `navigate()`
   - **Solução**: Verificar se rota existe no `App.tsx` (linha 236)

3. Redireciona mas página não carrega
   - **Causa**: `PixPaymentPage` não está sendo importada corretamente
   - **Solução**: Verificar imports no `App.tsx`

### ❌ PROBLEMA: QR Code não aparece na página `/pix/...`

**Verificar:**
1. localStorage tem os dados?
   ```javascript
   localStorage.getItem('pix-ORDER_ID')
   ```

2. Página está recebendo os parâmetros da URL?
   - Abrir DevTools → Console
   - Verificar se `orderId` e `transactionId` estão corretos

3. Componente `PixPaymentPage` tem erros?
   - Verificar aba "Console" do DevTools
   - Procurar por erros em vermelho

### ❌ PROBLEMA: Backend retorna `response.pix` mas `pixData` não é criado

**Verificar no código** (`paguex/index.ts` linha ~253):
```typescript
if (response.pix && request.paymentMethod === PaymentMethod.PIX) {
  paymentResponse.pixData = {
    qrCode: response.pix.qrcode,  // ⚠️ Verificar se é "qrcode" ou "qrCode"
    qrCodeBase64: response.pix.qrcodeImage,
    expiresAt: response.pix.expirationDate,
    amount: request.amount,
  };
}
```

**Possível problema:** Propriedade `qrcode` vs `qrCode` (case-sensitive)

---

## 📊 CHECKLIST DE SUCESSO

Após o teste, marque ✅ se funcionou:

- [ ] Console mostra logs de debug completos
- [ ] `data.pixData existe? true`
- [ ] Toast "PIX gerado com sucesso!" aparece
- [ ] Redireciona para `/pix/ORDER_ID/TRANSACTION_ID`
- [ ] Página `PixPaymentPage` carrega
- [ ] QR Code aparece (grande, 400x400px)
- [ ] Botão "Copiar Código PIX" funciona
- [ ] Timer de expiração está contando
- [ ] Verificação automática está rodando (a cada 5s)
- [ ] localStorage contém dados do PIX
- [ ] Transação aparece no banco com status "PENDING"

---

## 🆘 PRÓXIMOS PASSOS SE FALHAR

### Se `data.pixData` não existe:

1. **Verificar resposta real da API Pague-X**
   - Acessar logs do Supabase
   - Procurar por: `[Pague-X] 🔍 Verificando dados do response:`
   - Copiar o objeto `response.pix` completo

2. **Ajustar mapeamento se necessário**
   - Se propriedades têm nomes diferentes (ex: `qr_code` vs `qrcode`)
   - Atualizar código em `paguex/index.ts`

3. **Testar com dados mockados**
   - Criar um teste local retornando `pixData` fixo
   - Verificar se o fluxo de redirecionamento funciona

### Se redirecionamento não funciona:

1. **Verificar rota no App.tsx**
   ```typescript
   <Route path="/pix/:orderId/:transactionId" element={<PixPaymentPage />} />
   ```

2. **Testar navegação direta**
   - Acessar URL manualmente
   - Verificar se página carrega

3. **Adicionar mais logs no `navigate()`**
   ```typescript
   console.log("🚀 Executando navigate...");
   navigate(`/pix/${effectiveOrderId}/${data.transactionId}`);
   console.log("✅ Navigate executado");
   ```

---

## 📞 SUPORTE

Se ainda não funcionar, envie:

1. **Screenshot do Console** com todos os logs
2. **Screenshot dos Logs do Supabase**
3. **URL que você está testando**
4. **ID da transação criada**

---

**Última Atualização**: {{DATA_ATUAL}}  
**Versão Backend**: process-payment v21  
**Versão Frontend**: Deploy {{TIMESTAMP}}