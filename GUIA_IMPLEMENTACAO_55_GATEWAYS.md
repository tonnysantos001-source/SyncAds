# 📘 GUIA COMPLETO DE IMPLEMENTAÇÃO - 55 GATEWAYS DE PAGAMENTO

**Versão:** 1.0  
**Data:** Janeiro 2025  
**Projeto:** SyncAds - Sistema de Checkout  
**Autor:** Equipe SyncAds

---

## 📚 ÍNDICE

1. [Introdução](#introdução)
2. [Padrão de Implementação](#padrão-de-implementação)
3. [Gateways Brasileiros - Alta Prioridade](#gateways-brasileiros---alta-prioridade)
4. [Gateways Brasileiros - Média Prioridade](#gateways-brasileiros---média-prioridade)
5. [Gateways Brasileiros - Baixa Prioridade](#gateways-brasileiros---baixa-prioridade)
6. [Bancos](#bancos)
7. [Carteiras Digitais](#carteiras-digitais)
8. [Gateways Internacionais](#gateways-internacionais)
9. [Gateways Especializados](#gateways-especializados)
10. [Webhooks](#webhooks)
11. [Testes](#testes)
12. [Troubleshooting](#troubleshooting)

---

## 📖 INTRODUÇÃO

Este guia contém informações detalhadas para implementar cada um dos 55 gateways de pagamento do SyncAds.

### Estrutura de Cada Gateway

Para cada gateway, você encontrará:

- ✅ **Nome e Slug** - Identificação única
- 🌐 **Endpoints** - URLs de produção e sandbox
- 🔑 **Credenciais** - Campos necessários
- 💳 **Métodos de Pagamento** - PIX, Cartão, Boleto, etc.
- 📄 **Documentação Oficial** - Links para docs da API
- 🔧 **Exemplo de Implementação** - Código base
- ⚠️ **Observações** - Pontos de atenção

---

## 🎯 PADRÃO DE IMPLEMENTAÇÃO

### Template Base

Todos os gateways devem seguir este padrão:

```typescript
import { BaseGateway } from "../base.ts";
import {
  GatewayCredentials,
  GatewayConfig,
  PaymentRequest,
  PaymentResponse,
  PaymentMethod,
  PaymentStatus,
  PaymentStatusResponse,
  WebhookResponse,
  CredentialValidationResult,
} from "../types.ts";

export class [Nome]Gateway extends BaseGateway {
  name = "[Nome do Gateway]";
  slug = "[slug-gateway]";
  supportedMethods = [PaymentMethod.PIX, PaymentMethod.CREDIT_CARD, PaymentMethod.BOLETO];
  
  endpoints = {
    production: "https://api.[gateway].com",
    sandbox: "https://sandbox.api.[gateway].com",
  };

  async validateCredentials(credentials: GatewayCredentials): Promise<CredentialValidationResult> {
    // Implementar validação
  }

  async processPayment(request: PaymentRequest, config: GatewayConfig): Promise<PaymentResponse> {
    // Implementar processamento
  }

  async handleWebhook(payload: any, signature?: string): Promise<WebhookResponse> {
    // Implementar webhook
  }

  async getPaymentStatus(gatewayTransactionId: string, config: GatewayConfig): Promise<PaymentStatusResponse> {
    // Implementar consulta de status
  }
}
```

### Passo a Passo

1. **Criar pasta do gateway** em `supabase/functions/process-payment/gateways/[slug]/`
2. **Criar arquivo index.ts** com a classe do gateway
3. **Implementar métodos obrigatórios**
4. **Adicionar ao registry** em `supabase/functions/process-payment/gateways/index.ts`
5. **Criar testes**
6. **Atualizar documentação**

---

## 🇧🇷 GATEWAYS BRASILEIROS - ALTA PRIORIDADE

### 1. PagSeguro

**Status:** ❌ Não Implementado (stub existe)  
**Slug:** `pagseguro`  
**Prioridade:** 🔴 Alta

#### Endpoints
```typescript
production: "https://api.pagseguro.com"
sandbox: "https://sandbox.api.pagseguro.com"
```

#### Credenciais Necessárias
```typescript
{
  email: string,        // Email da conta PagSeguro
  token: string,        // Token de integração
  environment: "production" | "sandbox"
}
```

#### Métodos Suportados
- ✅ PIX
- ✅ Cartão de Crédito
- ✅ Cartão de Débito
- ✅ Boleto

#### Documentação Oficial
- **API Reference:** https://dev.pagseguro.uol.com.br/reference/api-reference
- **Guia de Integração:** https://dev.pagseguro.uol.com.br/docs
- **Sandbox:** https://sandbox.pagseguro.uol.com.br/

#### Exemplo de Implementação

```typescript
// Criar cobrança
const charge = {
  reference_id: request.orderId,
  customer: {
    name: request.customer.name,
    email: request.customer.email,
    tax_id: this.formatDocument(request.customer.document),
  },
  items: [
    {
      reference_id: request.orderId,
      name: `Pedido ${request.orderId}`,
      quantity: 1,
      unit_amount: this.formatAmountToCents(request.amount),
    },
  ],
  charges: [
    {
      reference_id: request.orderId,
      description: `Pagamento do pedido ${request.orderId}`,
      amount: {
        value: this.formatAmountToCents(request.amount),
        currency: "BRL",
      },
      payment_method: {
        type: this.mapPaymentMethod(request.paymentMethod),
      },
    },
  ],
};

const response = await this.makeRequest(
  `${this.getEndpoint(config)}/orders`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.credentials.token}`,
    },
    body: JSON.stringify(charge),
  }
);
```

#### Observações
- PagSeguro requer cadastro e validação de conta
- Taxa padrão: 4.99% + R$ 0.40 por transação
- Suporta split de pagamento
- Webhook requer URL pública com HTTPS

---

### 2. PagBank

**Status:** ❌ Não Implementado  
**Slug:** `pagbank`  
**Prioridade:** 🔴 Alta

#### Endpoints
```typescript
production: "https://api.pagbank.com"
sandbox: "https://sandbox.api.pagbank.com"
```

#### Credenciais Necessárias
```typescript
{
  token: string,        // Token de acesso OAuth2
  environment: "production" | "sandbox"
}
```

#### Métodos Suportados
- ✅ PIX
- ✅ Cartão de Crédito
- ✅ Cartão de Débito
- ✅ Boleto

#### Documentação Oficial
- **API Reference:** https://dev.pagbank.uol.com.br/reference
- **OAuth2:** https://dev.pagbank.uol.com.br/docs/autenticacao

#### Exemplo de Implementação

```typescript
// PagBank usa nova API v4
const order = {
  reference_id: request.orderId,
  customer: {
    name: request.customer.name,
    email: request.customer.email,
    tax_id: this.formatDocument(request.customer.document),
    phones: [
      {
        country: "55",
        area: request.customer.phone?.substring(0, 2),
        number: request.customer.phone?.substring(2),
        type: "MOBILE",
      },
    ],
  },
  items: [
    {
      name: `Pedido ${request.orderId}`,
      quantity: 1,
      unit_amount: this.formatAmountToCents(request.amount),
    },
  ],
  qr_codes: [
    {
      amount: {
        value: this.formatAmountToCents(request.amount),
      },
    },
  ],
};
```

---

### 3. Pagar.me

**Status:** ❌ Não Implementado  
**Slug:** `pagarme`  
**Prioridade:** 🔴 Alta

#### Endpoints
```typescript
production: "https://api.pagar.me/core/v5"
sandbox: "https://api.pagar.me/core/v5" // Usa chave de teste
```

#### Credenciais Necessárias
```typescript
{
  apiKey: string,           // API Key (sk_test_xxx ou sk_live_xxx)
  encryptionKey: string,    // Encryption Key (ek_test_xxx ou ek_live_xxx)
}
```

#### Métodos Suportados
- ✅ PIX
- ✅ Cartão de Crédito
- ✅ Cartão de Débito
- ✅ Boleto

#### Documentação Oficial
- **API V5:** https://docs.pagar.me/reference/api-reference
- **PIX:** https://docs.pagar.me/docs/pix-api-1
- **Cartão:** https://docs.pagar.me/docs/creditcard-api

#### Exemplo de Implementação

```typescript
// Criar order
const order = {
  code: request.orderId,
  customer: {
    name: request.customer.name,
    email: request.customer.email,
    document: this.formatDocument(request.customer.document),
    type: this.getDocumentType(request.customer.document) === "CPF" ? "individual" : "company",
    phones: {
      mobile_phone: {
        country_code: "55",
        area_code: request.customer.phone?.substring(0, 2),
        number: request.customer.phone?.substring(2),
      },
    },
  },
  items: [
    {
      code: request.orderId,
      description: `Pedido ${request.orderId}`,
      amount: this.formatAmountToCents(request.amount),
      quantity: 1,
    },
  ],
  payments: [
    {
      payment_method: request.paymentMethod === PaymentMethod.PIX ? "pix" : "credit_card",
      pix: request.paymentMethod === PaymentMethod.PIX ? {
        expires_in: 3600,
      } : undefined,
      credit_card: request.paymentMethod === PaymentMethod.CREDIT_CARD ? {
        card: {
          number: request.card.number,
          holder_name: request.card.holderName,
          exp_month: parseInt(request.card.expiryMonth),
          exp_year: parseInt(request.card.expiryYear),
          cvv: request.card.cvv,
        },
      } : undefined,
    },
  ],
};

const response = await this.makeRequest(
  `${this.getEndpoint(config)}/orders`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${btoa(config.credentials.apiKey + ":")}`,
    },
    body: JSON.stringify(order),
  }
);
```

---

### 4. Cielo

**Status:** ❌ Não Implementado  
**Slug:** `cielo`  
**Prioridade:** 🔴 Alta

#### Endpoints
```typescript
production: "https://api.cieloecommerce.cielo.com.br"
sandbox: "https://apisandbox.cieloecommerce.cielo.com.br"
productionQuery: "https://apiquery.cieloecommerce.cielo.com.br"
sandboxQuery: "https://apiquerysandbox.cieloecommerce.cielo.com.br"
```

#### Credenciais Necessárias
```typescript
{
  merchantId: string,      // MerchantId
  merchantKey: string,     // MerchantKey
  environment: "production" | "sandbox"
}
```

#### Métodos Suportados
- ✅ PIX
- ✅ Cartão de Crédito
- ✅ Cartão de Débito
- ✅ Boleto

#### Documentação Oficial
- **API E-commerce:** https://developercielo.github.io/manual/cielo-ecommerce
- **PIX:** https://developercielo.github.io/manual/pix
- **Postman Collection:** https://desenvolvedores.cielo.com.br/

#### Exemplo de Implementação

```typescript
const payment = {
  MerchantOrderId: request.orderId,
  Customer: {
    Name: request.customer.name,
    Email: request.customer.email,
    Identity: this.formatDocument(request.customer.document),
    IdentityType: this.getDocumentType(request.customer.document),
  },
  Payment: {
    Type: request.paymentMethod === PaymentMethod.PIX ? "Pix" : "CreditCard",
    Amount: this.formatAmountToCents(request.amount),
    Installments: 1,
    Capture: true,
    Pix: request.paymentMethod === PaymentMethod.PIX ? {
      ExpirationTime: 3600,
    } : undefined,
    CreditCard: request.paymentMethod === PaymentMethod.CREDIT_CARD ? {
      CardNumber: request.card.number,
      Holder: request.card.holderName,
      ExpirationDate: `${request.card.expiryMonth}/${request.card.expiryYear}`,
      SecurityCode: request.card.cvv,
      Brand: request.card.brand,
    } : undefined,
  },
};

const response = await this.makeRequest(
  `${this.getEndpoint(config)}/1/sales`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      MerchantId: config.credentials.merchantId,
      MerchantKey: config.credentials.merchantKey,
    },
    body: JSON.stringify(payment),
  }
);
```

#### Observações
- Cielo tem duas APIs: antiga (3.0) e nova (E-commerce)
- Requer cadastro como estabelecimento comercial
- Taxas variam por volume de transações
- Suporta antifraude integrado

---

### 5. PayPal

**Status:** ❌ Não Implementado (stub existe)  
**Slug:** `paypal`  
**Prioridade:** 🔴 Alta

#### Endpoints
```typescript
production: "https://api.paypal.com"
sandbox: "https://api.sandbox.paypal.com"
```

#### Credenciais Necessárias
```typescript
{
  clientId: string,        // Client ID
  clientSecret: string,    // Client Secret
  environment: "production" | "sandbox"
}
```

#### Métodos Suportados
- ✅ PayPal (Carteira)
- ✅ Cartão de Crédito (via PayPal)
- ❌ PIX (não suporta)
- ❌ Boleto (não suporta)

#### Documentação Oficial
- **API Reference:** https://developer.paypal.com/api/rest/
- **Orders API:** https://developer.paypal.com/docs/api/orders/v2/
- **Checkout:** https://developer.paypal.com/docs/checkout/

#### Exemplo de Implementação

```typescript
// 1. Obter token OAuth2
const authResponse = await fetch(
  `${this.getEndpoint(config)}/v1/oauth2/token`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${config.credentials.clientId}:${config.credentials.clientSecret}`)}`,
    },
    body: "grant_type=client_credentials",
  }
);

const { access_token } = await authResponse.json();

// 2. Criar order
const order = {
  intent: "CAPTURE",
  purchase_units: [
    {
      reference_id: request.orderId,
      amount: {
        currency_code: request.currency || "USD",
        value: request.amount.toFixed(2),
      },
      description: `Pedido ${request.orderId}`,
    },
  ],
  application_context: {
    return_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook/paypal/success`,
    cancel_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook/paypal/cancel`,
  },
};

const response = await this.makeRequest(
  `${this.getEndpoint(config)}/v2/checkout/orders`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify(order),
  }
);

return {
  success: true,
  transactionId: response.id,
  gatewayTransactionId: response.id,
  status: PaymentStatus.PENDING,
  redirectUrl: response.links.find((l: any) => l.rel === "approve")?.href,
  message: "Order created successfully",
};
```

---

## 🇧🇷 GATEWAYS BRASILEIROS - MÉDIA PRIORIDADE

### 6. Getnet

**Slug:** `getnet`  
**Endpoints:** `https://api.getnet.com.br` / `https://api-sandbox.getnet.com.br`  
**Credenciais:** `sellerId`, `clientId`, `clientSecret`  
**Docs:** https://developers.getnet.com.br/

### 7. Rede

**Slug:** `rede`  
**Endpoints:** `https://api.userede.com.br` / `https://sandbox.userede.com.br`  
**Credenciais:** `pv`, `token`  
**Docs:** https://www.userede.com.br/desenvolvedores

### 8. Stone

**Slug:** `stone`  
**Endpoints:** `https://api.stone.com.br` / `https://sandbox.api.stone.com.br`  
**Credenciais:** `merchantId`, `apiKey`  
**Docs:** https://docs.stone.com.br/

### 9. Iugu

**Slug:** `iugu`  
**Endpoints:** `https://api.iugu.com/v1`  
**Credenciais:** `apiToken`, `accountId`  
**Docs:** https://dev.iugu.com/

### 10. Juno

**Slug:** `juno`  
**Endpoints:** `https://api.juno.com.br` / `https://sandbox.juno.com.br`  
**Credenciais:** `clientId`, `clientSecret`, `privateToken`  
**Docs:** https://dev.juno.com.br/

### 11. Vindi

**Slug:** `vindi`  
**Endpoints:** `https://app.vindi.com.br/api/v1`  
**Credenciais:** `apiKey`  
**Docs:** https://vindi.github.io/api-docs/

---

## 🏦 BANCOS

### 12. Banco do Brasil

**Slug:** `banco-do-brasil`  
**Endpoints:** `https://api.bb.com.br/cobrancas/v2`  
**Credenciais:** `developerApplicationKey`, `clientId`, `clientSecret`  
**Docs:** https://developers.bb.com.br/

**Observações Importantes:**
- Requer certificado digital
- Disponível apenas para empresas
- Suporta PIX e Boleto principalmente
- Processo de credenciamento complexo

### 13. Itaú

**Slug:** `itau`  
**Endpoints:** `https://api.itau.com.br`  
**Credenciais:** `clientId`, `clientSecret`, `certificate`  
**Docs:** https://devportal.itau.com.br/

**Observações Importantes:**
- Requer certificado digital
- Open Banking para PIX
- Processo de credenciamento via portal
- Necessita conta PJ no Itaú

### 14. Bradesco

**Slug:** `bradesco`  
**Endpoints:** `https://proxy.api.prebanco.com.br`  
**Credenciais:** `merchantId`, `apiKey`, `certificate`  
**Docs:** https://banco.bradesco/api

### 15. Caixa Econômica

**Slug:** `caixa`  
**Endpoints:** `https://api.caixa.gov.br`  
**Credenciais:** `clientId`, `clientSecret`  
**Docs:** https://www.caixa.gov.br/api

### 16. Santander

**Slug:** `santander`  
**Endpoints:** `https://api.santander.com.br`  
**Credenciais:** `clientId`, `clientSecret`, `certificate`  
**Docs:** https://developer.santander.com.br/

---

## 💳 CARTEIRAS DIGITAIS

### 17. PicPay

**Slug:** `picpay`  
**Prioridade:** 🔴 Alta

**Endpoints:**
```typescript
production: "https://appws.picpay.com/ecommerce/public"
```

**Credenciais:**
```typescript
{
  picpayToken: string,      // X-PicPay-Token
  sellerToken: string,      // X-Seller-Token
}
```

**Métodos:** PIX, Carteira Digital

**Documentação:** https://ecommerce.picpay.com/doc/

**Exemplo:**
```typescript
const payment = {
  referenceId: request.orderId,
  callbackUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook/picpay`,
  returnUrl: "https://seusite.com/checkout/success",
  value: request.amount,
  buyer: {
    firstName: request.customer.name.split(" ")[0],
    lastName: request.customer.name.split(" ").slice(1).join(" "),
    document: this.formatDocument(request.customer.document),
    email: request.customer.email,
    phone: this.formatPhone(request.customer.phone),
  },
};

const response = await this.makeRequest(
  `${this.endpoints.production}/payments`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-picpay-token": config.credentials.picpayToken,
      "x-seller-token": config.credentials.sellerToken,
    },
    body: JSON.stringify(payment),
  }
);
```

### 18. Ame Digital

**Slug:** `ame-digital`  
**Endpoints:** `https://api.ame.com.br`  
**Credenciais:** `apiKey`, `merchantId`  
**Docs:** https://developers.amedigital.com/

### 19. Apple Pay

**Slug:** `apple-pay`  
**Endpoints:** Via Stripe/Adyen/Braintree  
**Credenciais:** Integração via gateway principal  
**Docs:** https://developer.apple.com/apple-pay/

**Observação:** Apple Pay requer integração com gateway que suporte (Stripe, Adyen, Braintree)

### 20. Google Pay

**Slug:** `google-pay`  
**Endpoints:** Via Stripe/Adyen/Braintree  
**Credenciais:** Integração via gateway principal  
**Docs:** https://developers.google.com/pay

**Observação:** Google Pay requer integração com gateway que suporte

---

## 🌍 GATEWAYS INTERNACIONAIS

### 21. Adyen

**Slug:** `adyen`  
**Endpoints:** `https://checkout-test.adyen.com` / `https://checkout-live.adyen.com`  
**Credenciais:** `apiKey`, `merchantAccount`  
**Docs:** https://docs.adyen.com/

### 22. Authorize.net

**Slug:** `authorize-net`  
**Endpoints:** `https://api.authorize.net/xml/v1/request.api`  
**Credenciais:** `apiLoginId`, `transactionKey`  
**Docs:** https://developer.authorize.net/

### 23. Braintree

**Slug:** `braintree`  
**Endpoints:** `https://api.braintreegateway.com`  
**Credenciais:** `merchantId`, `publicKey`, `privateKey`  
**Docs:** https://developer.paypal.com/braintree/docs

### 24. Square

**Slug:** `square`  
**Endpoints:** `https://connect.squareup.com`  
**Credenciais:** `accessToken`, `locationId`  
**Docs:** https://developer.squareup.com/

### 25. WorldPay

**Slug:** `worldpay`  
**Endpoints:** `https://api.worldpay.com`  
**Credenciais:** `merchantCode`, `xmlPassword`  
**Docs:** https://developer.worldpay.com/

### 26. 2Checkout

**Slug:** `2checkout`  
**Endpoints:** `https://api.2checkout.com`  
**Credenciais:** `sellerId`, `secretKey`  
**Docs:** https://www.2checkout.com/documentation/

---

## 🎯 GATEWAYS ESPECIALIZADOS

### 27. OpenPix (PIX Only)

**Slug:** `openpix`  
**Métodos:** PIX exclusivamente

**Endpoints:**
```typescript
production: "https://api.openpix.com.br/api/v1"
```

**Credenciais:**
```typescript
{
  appId: string,      // App ID
  apiKey: string,     // API Key
}
```

**Documentação:** https://developers.openpix.com.br/

**Exemplo:**
```typescript
const charge = {
  correlationID: request.orderId,
  value: Math.round(request.amount * 100), // centavos
  customer: {
    name: request.customer.name,
    email: request.customer.email,
    taxID: this.formatDocument(request.customer.document),
  },
};

const response = await this.makeRequest(
  `${this.endpoints.production}/charge`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: config.credentials.apiKey,
    },
    body: JSON.stringify(charge),
  }
);

return {
  success: true,
  transactionId: response.charge.correlationID,
  gatewayTransactionId: response.charge.identifier,
  status: PaymentStatus.PENDING,
  qrCode: response.charge.brCode,
  qrCodeBase64: response.charge.qrCodeImage,
  message: "PIX created successfully",
};
```

### 28. Paghiper (Boleto Only)

**Slug:** `paghiper`  
**Métodos:** Boleto exclusivamente  
**Endpoints:** `https://api.paghiper.com`  
**Credenciais:** `apiKey`, `token`  
**Docs:** https://dev.paghiper.com/

### 29. Pix Manual

**Slug:** `pix-manual`  
**Métodos:** PIX manual (QR Code estático)

**Implementação Especial:**
```typescript
// Não faz chamadas à API
// Retorna QR Code e chave PIX cadastrada
async processPayment(request: PaymentRequest, config: GatewayConfig): Promise<PaymentResponse> {
  return {
    success: true,
    transactionId: this.generateTransactionId(),
    status: PaymentStatus.PENDING,
    pixKey: config.credentials.pixKey,
    message: "Manual PIX - aguardando confirmação manual",
  };
}
```

---

## 🔔 WEBHOOKS

### Estrutura Geral de Webhook

Todos os gateways devem implementar webhook seguindo este padrão:

```typescript
async handleWebhook(payload: any, signature?: string): Promise<WebhookResponse> {
  try {
    // 1. Validar assinatura
    if (signature) {
      const isValid = await this.validateWebhookSignature(payload, signature);
      if (!isValid) {
        return {
          success: false,
          processed: false,
          message: "Invalid signature",
        };
      }
    }

    // 2. Extrair dados do webhook
    const event = this.parseWebhookEvent(payload);
    
    // 3. Normalizar status
    const status = this.normalizeStatus(event.status);
    
    // 4. Retornar resposta
    return {
      success: true,
      processed: true,
      transactionId: event.transactionId,
      message: "Webhook processed successfully",
    };
  } catch (error: any) {
    this.log("error", "Webhook error", error);
    return {
      success: false,
      processed: false,
      message: error.message,
    };
  }
}
```

### URLs de Webhook por Gateway

Configure no painel de cada gateway:

```
https://[seu-projeto].supabase.co/functions/v1/payment-webhook/[gateway-slug]
```

Exemplos:
- Mercado Pago: `.../payment-webhook/mercado-pago`
- Stripe: `.../payment-webhook/stripe`
- PagSeguro: `.../payment-webhook/pagseguro`

---

## 🧪 TESTES

### Credenciais de Teste por Gateway

#### Stripe
```
Publishable Key: pk_test_...
Secret Key: sk_test_...
Cartão de teste: 4242 4242 4242 4242
```

#### Mercado Pago
```
Public Key: TEST-...
Access Token: TEST-...
```

#### PagSeguro
```
Email: sandbox@pagseguro.com.br
Token: (obter no painel sandbox)
```

#### Pagar.me
```
API Key: sk_test_...
```

### Script de Teste Genérico

```typescript
// test-gateway.ts
import { [Gateway]Gateway } from "./gateways/[slug]/index.ts";

const gateway = new [Gateway]Gateway();

// Teste de validação de credenciais
const credentials = {