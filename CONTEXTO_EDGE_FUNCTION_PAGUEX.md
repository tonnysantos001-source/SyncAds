# 🎯 CONTEXTO: Corrigir Edge Function de Verificação do Gateway Pague-X

## 📋 SITUAÇÃO ATUAL

### Projeto
- **Nome**: SyncAds - Plataforma SaaS de E-commerce  
- **Stack**: React + TypeScript + Supabase + Edge Functions (Deno)
- **Localização**: `C:\Users\dinho\Documents\GitHub\SyncAds`

### O Que Estamos Fazendo
Implementando gateway de pagamento **Pague-X (inpagamentos.com)** no sistema de checkout para processar PIX, Cartão de Crédito/Débito e Boleto.

---

## ✅ O QUE JÁ FOI IMPLEMENTADO E FUNCIONA

### 1. Gateway de Pagamento (Backend)
✅ **FUNCIONAL E DEPLOYED**

- **Arquivo**: `supabase/functions/process-payment/gateways/paguex/index.ts` (350 linhas)
- **Endpoint API**: `https://api.inpagamentos.com/v1`
- **Autenticação**: Basic Auth (publicKey:secretKey)
- **Métodos suportados**: PIX, Cartão de Crédito, Cartão de Débito, Boleto
- **Status**: Deployed no Supabase ✅
- **Sistema**: Modular com 53 gateways disponíveis

### 2. Frontend
✅ **FUNCIONAL**

- Gateway adicionado em: `src/lib/gateways/gatewaysList.ts`
- Aparece na lista de gateways no dashboard
- Formulário de configuração completo
- Build realizado sem erros

### 3. Banco de Dados
✅ **CONFIGURADO**

- SQL executado com sucesso
- Tabela `Gateway` possui registro com slug: `paguex`
- Campos: name, slug, supportsPix, supportsCreditCard, supportsBoleto, requiredFields, etc.

### 4. Credenciais do Cliente
✅ **TESTADAS E VÁLIDAS**

Teste realizado diretamente no console do navegador:

```javascript
const publicKey = "pk_lIMlc5KEBubiYAEKlqi_DylmVviqow5r-QxFQuB3SpPqcc0u";
const secretKey = "[CLIENT_SECRET_KEY]";
const auth = btoa(publicKey + ':' + secretKey);

fetch('https://api.inpagamentos.com/v1/transactions?limit=1', {
  headers: {
    'Authorization': 'Basic ' + auth,
    'Content-Type': 'application/json'
  }
})
```

**Resultado do teste**:
- ✅ Status HTTP: **200**
- ✅ Resposta: `{pagination: {...}, data: Array(20)}`
- ✅ **Credenciais são 100% VÁLIDAS**

---

## ❌ PROBLEMA ATUAL

### Edge Function de Verificação Falhando

**Arquivo com problema**: `supabase/functions/gateway-config-verify/index.ts`

**Sintoma**: 
- Cliente preenche credenciais válidas no formulário
- Clica em "Verificar credenciais"  
- Edge Function retorna: **"Edge Function returned a non-2xx status code"**
- Gateway não fica marcado como "Verificado"

**Fluxo que está falhando**:
1. ✅ Cliente preenche publicKey e secretKey no formulário
2. ✅ Seleciona "Produção" no campo Ambiente
3. ✅ Clica em "Verificar credenciais"
4. ✅ Frontend chama: `supabase.functions.invoke('gateway-config-verify', { body: payload })`
5. ❌ **Edge Function retorna erro (status não-2xx)**
6. ❌ Frontend mostra: "Erro na verificação"

**Paradoxo**: As mesmas credenciais funcionam perfeitamente quando testadas diretamente via fetch no console, mas falham na Edge Function.

---

## 🔍 ANÁLISE TÉCNICA DETALHADA

### Código Atual do Adapter Pague-X

**Localização**: `supabase/functions/gateway-config-verify/index.ts` (linha ~299)

```typescript
// Pague-X: GET /v1/transactions (Basic Auth: publicKey:secretKey)
const paguexAdapter: Adapter = {
  slug: "paguex",
  async verify(credentials, signal) {
    const publicKey = credentials?.publicKey || credentials?.PUBLIC_KEY;
    const secretKey = credentials?.secretKey || credentials?.SECRET_KEY;
    
    if (!publicKey || !secretKey) {
      return {
        ok: false,
        httpStatus: 400,
        message: "Credenciais Pague-X inválidas: publicKey e/ou secretKey ausentes",
      };
    }

    // Gerar Basic Auth: base64(publicKey:secretKey)
    const authString = btoa(`${publicKey}:${secretKey}`);

    // Endpoint de verificação leve (lista transações com limit=1)
    let res: Response | null = null;
    try {
      res = await fetch(
        "https://api.inpagamentos.com/v1/transactions?limit=1",
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${authString}`,
            "Content-Type": "application/json",
          },
          signal,
        },
      );
    } catch (e: any) {
      if (e?.name === "AbortError") {
        return { ok: false, httpStatus: 408, message: "Pague-X: timeout" };
      }
      return {
        ok: false,
        httpStatus: 500,
        message: "Pague-X: erro de conexão",
      };
    }

    if (!res) return {
      ok: false,
      httpStatus: 500,
      message: "Pague-X: resposta vazia",
    };

    const httpStatus = res.status;
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const capabilities = {
        credit_card: true,
        pix: true,
        boleto: true,
        wallet: false,
      };
      return {
        ok: true,
        httpStatus,
        message: `Credenciais Pague-X verificadas com sucesso`,
        capabilities,
        metadata: {
          api_version: "v1",
          provider: "inpagamentos.com",
        },
      };
    }

    const text = await res.text().catch(() => "");
    return {
      ok: false,
      httpStatus,
      message: `Pague-X rejeitou as credenciais (${httpStatus})`,
      metadata: { response_excerpt: text.slice(0, 200) },
    };
  },
};
```

### Registro no adapters (linha ~376)

```typescript
const adapters: Record<string, Adapter> = {
  stripe: stripeAdapter,
  "mercado-pago": mercadopagoAdapter,
  mercadopago: mercadopagoAdapter,
  asaas: asaasAdapter,
  paguex: paguexAdapter,  // ✅ Adicionado
};
```

### Interface VerifyResult

```typescript
interface VerifyResult {
  ok: boolean;
  httpStatus: number;
  message: string;
  capabilities?: Record<string, boolean>;
  metadata?: Record<string, any>;
}
```

---

## 🎯 POSSÍVEIS CAUSAS DO ERRO

### 1. Problema no Payload do Frontend
- Frontend pode não estar enviando `slug: "paguex"` corretamente
- Campo `credentials` pode estar em formato diferente do esperado
- Campo `environment` pode estar faltando ou incorreto

### 2. Problema no Retorno da Edge Function
- Edge Function pode estar retornando formato incorreto
- Handler principal pode não estar processando o VerifyResult corretamente
- Response HTTP da Edge Function pode ter status code errado

### 3. Timeout ou Problemas de Rede
- Fetch pode estar demorando mais de 5 segundos
- AbortController pode estar sendo acionado prematuramente
- Problema de CORS (improvável, mas possível)

### 4. Falta de Logs para Debug
- Não temos visibilidade do que está acontecendo dentro da Edge Function
- Não sabemos se o adapter está sendo chamado
- Não sabemos qual é o status HTTP real retornado pela API

---

## 📝 O QUE PRECISA SER FEITO

### 1. Adicionar Logs Detalhados

Adicione console.log em pontos estratégicos:

```typescript
console.log('[PagueX] ========== INICIANDO VERIFICAÇÃO ==========');
console.log('[PagueX] Credentials recebidas:', Object.keys(credentials));
console.log('[PagueX] PublicKey presente:', !!publicKey);
console.log('[PagueX] PublicKey (primeiros 10 chars):', publicKey?.substring(0, 10));
console.log('[PagueX] SecretKey presente:', !!secretKey);
console.log('[PagueX] Auth string gerado (primeiros 20 chars):', authString.substring(0, 20));
console.log('[PagueX] Fazendo requisição para:', "https://api.inpagamentos.com/v1/transactions?limit=1");

// Após o fetch
console.log('[PagueX] Response recebida!');
console.log('[PagueX] Status Code:', res.status);
console.log('[PagueX] Status OK:', res.ok);
console.log('[PagueX] Headers:', Object.fromEntries(res.headers.entries()));

// No sucesso
console.log('[PagueX] ✅ VERIFICAÇÃO SUCESSO!');

// No erro
console.log('[PagueX] ❌ VERIFICAÇÃO FALHOU:', httpStatus, text);
```

### 2. Melhorar Tratamento de Erros HTTP

```typescript
// Após receber response
const httpStatus = res.status;

// Mensagens específicas por código
let message = `Pague-X: erro ${httpStatus}`;
if (httpStatus === 401) {
  message = "Pague-X: credenciais inválidas - verifique publicKey e secretKey";
} else if (httpStatus === 403) {
  message = "Pague-X: acesso negado - verifique permissões da conta";
} else if (httpStatus === 404) {
  message = "Pague-X: endpoint não encontrado";
} else if (httpStatus === 429) {
  message = "Pague-X: limite de requisições excedido";
} else if (httpStatus >= 500) {
  message = "Pague-X: erro no servidor da inpagamentos.com";
}
```

### 3. Verificar Handler Principal

Verifique se o handler principal da Edge Function está processando corretamente o resultado do adapter:

```typescript
// O handler deve fazer algo assim:
const result = await adapter.verify(credentials, signal);

if (result.ok) {
  return new Response(
    JSON.stringify({
      success: true,
      gatewaySlug: adapter.slug,
      httpStatus: result.httpStatus,
      message: result.message,
      capabilities: result.capabilities,
      verifiedAt: new Date().toISOString(),
      environment: "production"
    }),
    { status: 200, headers: corsHeaders }
  );
} else {
  // IMPORTANTE: Mesmo em erro, retornar status 200 com success: false
  return new Response(
    JSON.stringify({
      success: false,
      gatewaySlug: adapter.slug,
      httpStatus: result.httpStatus,
      message: result.message,
      metadata: result.metadata
    }),
    { status: 200, headers: corsHeaders }  // ← Status 200 aqui!
  );
}
```

### 4. Aumentar Timeout

Se necessário, aumentar o timeout de 5s para 10s:

```typescript
function withTimeout(ms: number): AbortController {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  (controller as any)._timeoutId = id;
  return controller;
}

// Usar 10000 ao invés de 5000
const controller = withTimeout(10000);
```

---

## 📂 ARQUIVOS RELEVANTES

### Principal (onde está o bug)
```
supabase/functions/gateway-config-verify/index.ts
```
- Linha ~299: Definição do `paguexAdapter`
- Linha ~376: Registro no `adapters`
- Linha ~450+: Handler principal da Edge Function

### Referência (funcionando)
```
supabase/functions/process-payment/gateways/paguex/index.ts
- Este gateway de pagamento JÁ FUNCIONA perfeitamente
- Pode ser usado como referência de como fazer as chamadas à API

src/lib/gateways/gatewaysList.ts
- Lista de gateways no frontend com configurações

src/pages/app/checkout/GatewayConfigPage.tsx
- Página que chama a Edge Function de verificação
- Linha ~260: Onde faz supabase.functions.invoke('gateway-config-verify')
```

---

## 🔧 COMANDOS ÚTEIS

### Deploy Após Correção
```bash
cd C:\Users\dinho\Documents\GitHub\SyncAds
supabase functions deploy gateway-config-verify
```

### Ver Código Atual
```bash
# Ver adapter paguex completo
grep -A 100 "const paguexAdapter" supabase/functions/gateway-config-verify/index.ts

# Ver registro no adapters
grep -A 10 "const adapters" supabase/functions/gateway-config-verify/index.ts

# Ver handler principal
grep -A 50 "serve(async" supabase/functions/gateway-config-verify/index.ts
```

---

## 📊 INFORMAÇÕES DA API PAGUE-X

### Especificações Técnicas

**Base URL**: `https://api.inpagamentos.com/v1`

**Autenticação**: Basic Auth
- Formato: `Authorization: Basic base64(publicKey:secretKey)`
- Exemplo: `Basic cGtfbElNbGM1S0VCdWJpWUFFSwppX0R5bG1WdmlxbzU6c2tfZDFrRnBYU041SVAYX...`

**Endpoint de Teste**: `GET /v1/transactions?limit=1`

**Response Sucesso (200)**:
```json
{
  "pagination": {
    "total": 245,
    "page": 1,
    "limit": 1
  },
  "data": [
    {
      "id": 12345,
      "amount": 5000,
      "status": "paid",
      "paymentMethod": "pix",
      ...
    }
  ]
}
```

**Status Codes Possíveis**:
- **200**: Credenciais válidas ✅
- **401**: Unauthorized (credenciais inválidas)
- **403**: Forbidden (sem permissão)
- **404**: Not Found (endpoint errado)
- **429**: Too Many Requests (rate limit)
- **500**: Internal Server Error

---

## 🎯 RESULTADO ESPERADO

### Após a Correção

Quando o cliente:
1. Preencher `publicKey` e `secretKey`
2. Selecionar "Produção" no campo Ambiente
3. Clicar em "Verificar credenciais"

**Deve acontecer**:
- ✅ Edge Function faz requisição à API com sucesso
- ✅ API retorna status 200
- ✅ Edge Function processa e retorna `{ success: true, ... }`
- ✅ Frontend mostra "✓ Verificado" com check verde
- ✅ Campo "Ambiente" mostra "production"
- ✅ Botão "Salvar" fica habilitado
- ✅ Cliente pode marcar como gateway padrão
- ✅ Gateway fica pronto para processar pagamentos reais

### Resposta Esperada da Edge Function

```json
{
  "success": true,
  "gatewaySlug": "paguex",
  "httpStatus": 200,
  "message": "Credenciais Pague-X verificadas com sucesso",
  "capabilities": {
    "credit_card": true,
    "pix": true,
    "boleto": true,
    "wallet": false
  },
  "metadata": {
    "api_version": "v1",
    "provider": "inpagamentos.com"
  },
  "verifiedAt": "2025-01-31T12:34:56.789Z",
  "environment": "production"
}
```

---

## 💡 ALTERNATIVA RÁPIDA

Se a correção for muito complexa ou demorada, uma solução temporária é:

**Permitir salvar sem verificação**:
- Modificar frontend para não exigir verificação
- Cliente pode salvar credenciais direto
- Como já testamos e sabem que funcionam, não há risco
- Verificação é "nice to have", não é obrigatória

Mas o ideal é corrigir a Edge Function para melhor UX.

---

## 🚨 PRIORIDADE

**ALTA** - Cliente está aguardando para colocar gateway em produção e processar pagamentos reais.

---

## 📌 RESUMO EXECUTIVO

**Situação**: Gateway Pague-X implementado e funcional. Credenciais do cliente testadas e válidas (status 200). Mas Edge Function de verificação retorna erro "non-2xx status code".

**Problema**: Bug na Edge Function `gateway-config-verify` no adapter `paguexAdapter`.

**Solução**: Adicionar logs, verificar handler principal, garantir que response HTTP da Edge Function seja sempre 200 (com success true/false no body), e melhorar tratamento de erros.

**Ação**: Corrigir arquivo `supabase/functions/gateway-config-verify/index.ts` e fazer deploy.

**Urgência**: Alta - cliente esperando.

---

**Última atualização**: 31/01/2025
**Autor**: Engenheiro do SyncAds
**Status**: Aguardando correção