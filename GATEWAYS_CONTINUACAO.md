# 🚀 CONTINUAÇÃO - IMPLEMENTAÇÃO DOS GATEWAYS DE PAGAMENTO

## 📊 STATUS ATUAL

### ✅ BANCO DE DADOS - COMPLETO
- **53 gateways** cadastrados corretamente na tabela `Gateway`
- **42 gateways incorretos** deletados (bancos e outros que não fazem parte da plataforma)
- **GatewayConfig** criado para todos os 53 gateways
- Estrutura pronta para receber credenciais

### ✅ CÓDIGO IMPLEMENTADO (11/53 = 20.8%)

**Gateways com implementação COMPLETA:**
1. ✅ Cielo
2. ✅ GetNet
3. ✅ Iugu
4. ✅ Mercado Pago (NOVO)
5. ✅ Pagar.me
6. ✅ PagSeguro
7. ✅ PayPal
8. ✅ PicPay
9. ✅ Rede
10. ✅ Stone
11. ✅ Vindi

### ⏳ GATEWAYS PENDENTES (42/53 = 79.2%)

**Alta Prioridade (2):**
- ❌ Stripe
- ❌ Asaas

**Média Prioridade (40):**
- ❌ Wirecard (Moip)
- ❌ SafetyPay
- ❌ Allus
- ❌ Alpa
- ❌ Alphacash
- ❌ AnubisPay
- ❌ Appmax
- ❌ Asset
- ❌ Aston Pay
- ❌ Atlas Pay
- ❌ Axelpay
- ❌ Axion Pay
- ❌ Azcend
- ❌ Bestfy
- ❌ Blackcat
- ❌ Bravos Pay
- ❌ Braza Pay
- ❌ Bynet
- ❌ Carthero
- ❌ Centurion Pay
- ❌ Credpago
- ❌ Credwave
- ❌ Cúpula Hub
- ❌ Cyberhub
- ❌ Codiguz Hub
- ❌ Diasmarketplace
- ❌ Dom Pagamentos
- ❌ Dorapag
- ❌ Dubai Pay
- ❌ Efí
- ❌ Ever Pay
- ❌ Fast Pay
- ❌ Fire Pag
- ❌ Fivepay
- ❌ FlashPay
- ❌ Flowspay
- ❌ Fly Payments
- ❌ Fortrex
- ❌ FreePay
- ❌ FusionPay

---

## 🎯 COMO CONTINUAR

### Opção 1: Implementar Gateway por Gateway (Recomendado)

Implemente apenas os gateways que seus clientes irão usar primeiro. Isso economiza tempo e permite focar na qualidade.

**Ordem sugerida:**
1. **Stripe** (internacional, muito usado)
2. **Asaas** (nacional, crescendo)
3. **Wirecard (Moip)** (nacional, conhecido)
4. **Resto conforme demanda**

### Opção 2: Template Genérico para Todos

Crie uma implementação básica/genérica para todos os 42 gateways faltantes. Ajuste a integração quando um cliente configurar aquele gateway específico.

---

## 📝 TEMPLATE PARA NOVOS GATEWAYS

Use este template para criar novos gateways rapidamente:

### 1. Criar estrutura de diretório

```bash
cd supabase/functions/process-payment/gateways
mkdir nome-do-gateway
```

### 2. Criar arquivo `index.ts`

```typescript
// ============================================
// [NOME DO GATEWAY] GATEWAY
// ============================================
//
// Documentação: https://[gateway].com/docs
// Prioridade: [Alta/Média/Baixa]
// Tipo: payment_processor
// Escopo: [NACIONAL/GLOBAL/NACIONAL_GLOBAL]
//
// ============================================

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
  GatewayError,
} from "../types.ts";

/**
 * [Nome do Gateway] Gateway Implementation
 *
 * Métodos suportados:
 * - PIX
 * - Cartão de Crédito
 * - Boleto
 *
 * Credenciais necessárias:
 * - apiKey
 * - merchantId (ou outro campo conforme API)
 */
export class [ClassName]Gateway extends BaseGateway {
  name = "[Nome do Gateway]";
  slug = "[slug-do-gateway]";
  supportedMethods = [
    PaymentMethod.PIX,
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.BOLETO,
  ];

  endpoints = {
    production: "https://api.[gateway].com/v1",
    sandbox: "https://sandbox.api.[gateway].com/v1",
  };

  /**
   * Valida as credenciais do gateway
   */
  async validateCredentials(
    credentials: GatewayCredentials
  ): Promise<CredentialValidationResult> {
    try {
      if (!credentials.apiKey) {
        return {
          isValid: false,
          message: "API Key is required",
        };
      }

      // TODO: Implementar validação real com API do gateway
      this.log("info", "[Gateway] credentials accepted (offline validation)");
      return {
        isValid: true,
        message: "Credentials accepted (offline validation)",
      };
    } catch (error: any) {
      this.log("error", "[Gateway] credential validation failed", error);
      return {
        isValid: false,
        message: error.message || "Invalid credentials",
      };
    }
  }

  /**
   * Processa um pagamento
   */
  async processPayment(
    request: PaymentRequest,
    config: GatewayConfig
  ): Promise<PaymentResponse> {
    try {
      this.validatePaymentRequest(request);

      this.log("info", "Processing [Gateway] payment", {
        orderId: request.orderId,
        amount: request.amount,
        method: request.paymentMethod,
      });

      const endpoint = config.credentials.isSandbox
        ? this.endpoints.sandbox
        : this.endpoints.production;

      // TODO: Implementar chamada real à API do gateway
      // Estrutura base para payload:
      const payment: any = {
        reference_id: request.orderId,
        amount: Math.round(request.amount * 100), // Centavos
        currency: "BRL",
        description: `Pedido #${request.orderId}`,
        customer: {
          name: request.customer.name,
          email: request.customer.email,
          document: this.formatDocument(request.customer.document),
          phone: this.formatPhone(request.customer.phone || ""),
        },
        notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook/[slug]`,
        return_url: request.metadata?.returnUrl || `${Deno.env.get("SUPABASE_URL")}/checkout/success`,
      };

      // Configurar por método de pagamento
      switch (request.paymentMethod) {
        case PaymentMethod.PIX:
          payment.payment_method = "pix";
          payment.expires_in = 3600;
          break;

        case PaymentMethod.CREDIT_CARD:
          payment.payment_method = "credit_card";
          if (request.paymentDetails?.card) {
            payment.card = {
              number: request.paymentDetails.card.number,
              holder_name: request.paymentDetails.card.holderName,
              expiry_month: request.paymentDetails.card.expiryMonth,
              expiry_year: request.paymentDetails.card.expiryYear,
              cvv: request.paymentDetails.card.cvv,
            };
          }
          payment.installments = request.paymentDetails?.installments || 1;
          break;

        case PaymentMethod.BOLETO:
          payment.payment_method = "boleto";
          payment.due_date = new Date(Date.now() + 3 * 24 * 3600000).toISOString().split("T")[0];
          break;

        default:
          throw new GatewayError(
            `Payment method ${request.paymentMethod} not supported`,
            this.slug,
            "UNSUPPORTED_METHOD"
          );
      }

      const response = await this.makeRequest<any>(
        `${endpoint}/payments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${config.credentials.apiKey}`,
          },
          body: JSON.stringify(payment),
        }
      );

      return this.createSuccessResponse({
        transactionId: request.orderId,
        gatewayTransactionId: response.id || response.transaction_id,
        status: this.normalizeStatus(response.status),
        paymentUrl: response.payment_url,
        qrCode: response.pix?.qr_code,
        qrCodeBase64: response.pix?.qr_code_base64,
        boletoUrl: response.boleto?.pdf_url,
        boletoBarcode: response.boleto?.barcode,
        expiresAt: response.expires_at,
        message: "[Gateway] payment created successfully",
      });
    } catch (error: any) {
      return this.createErrorResponse(
        error,
        "Failed to process payment via [Gateway]"
      );
    }
  }

  /**
   * Processa webhook do gateway
   */
  async handleWebhook(
    payload: any,
    signature?: string
  ): Promise<WebhookResponse> {
    try {
      this.log("info", "Processing [Gateway] webhook", { payload });

      if (!payload.reference_id && !payload.transaction_id) {
        return {
          success: false,
          processed: false,
          message: "Missing payment identifier in webhook payload",
        };
      }

      return {
        success: true,
        processed: true,
        transactionId: payload.reference_id,
        gatewayTransactionId: payload.transaction_id || payload.id,
        status: this.normalizeStatus(payload.status),
        message: "[Gateway] webhook processed successfully",
      };
    } catch (error: any) {
      this.log("error", "[Gateway] webhook processing failed", error);
      return {
        success: false,
        processed: false,
        message: error.message,
      };
    }
  }

  /**
   * Consulta o status de um pagamento
   */
  async getPaymentStatus(
    gatewayTransactionId: string,
    config: GatewayConfig
  ): Promise<PaymentStatusResponse> {
    try {
      this.log("info", "Getting [Gateway] payment status", { gatewayTransactionId });

      const endpoint = config.credentials.isSandbox
        ? this.endpoints.sandbox
        : this.endpoints.production;

      const response = await this.makeRequest<any>(
        `${endpoint}/payments/${gatewayTransactionId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${config.credentials.apiKey}`,
          },
        }
      );

      return {
        transactionId: response.reference_id,
        gatewayTransactionId: response.id || response.transaction_id,
        status: this.normalizeStatus(response.status),
        amount: response.amount / 100,
        currency: response.currency || "BRL",
        paymentMethod: this.normalizePaymentMethod(response.payment_method),
        createdAt: response.created_at || new Date().toISOString(),
        updatedAt: response.updated_at || new Date().toISOString(),
        paidAt: response.paid_at,
      };
    } catch (error: any) {
      throw new GatewayError(
        `Failed to get [Gateway] payment status: ${error.message}`,
        this.slug,
        error.code,
        error.statusCode
      );
    }
  }

  /**
   * Cancela um pagamento
   */
  async cancelPayment(
    gatewayTransactionId: string,
    config: GatewayConfig
  ): Promise<PaymentResponse> {
    try {
      this.log("info", "Canceling [Gateway] payment", { gatewayTransactionId });

      const endpoint = config.credentials.isSandbox
        ? this.endpoints.sandbox
        : this.endpoints.production;

      await this.makeRequest<any>(
        `${endpoint}/payments/${gatewayTransactionId}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${config.credentials.apiKey}`,
          },
        }
      );

      return this.createSuccessResponse({
        transactionId: gatewayTransactionId,
        gatewayTransactionId: gatewayTransactionId,
        status: PaymentStatus.CANCELLED,
        message: "[Gateway] payment cancelled successfully",
      });
    } catch (error: any) {
      return this.createErrorResponse(
        error,
        "Failed to cancel [Gateway] payment"
      );
    }
  }

  /**
   * Normaliza o status do gateway para o status padrão
   */
  protected override normalizeStatus(gatewayStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      pending: PaymentStatus.PENDING,
      waiting_payment: PaymentStatus.PENDING,
      processing: PaymentStatus.PROCESSING,
      analyzing: PaymentStatus.PROCESSING,
      paid: PaymentStatus.APPROVED,
      approved: PaymentStatus.APPROVED,
      authorized: PaymentStatus.APPROVED,
      completed: PaymentStatus.APPROVED,
      cancelled: PaymentStatus.CANCELLED,
      canceled: PaymentStatus.CANCELLED,
      refunded: PaymentStatus.REFUNDED,
      expired: PaymentStatus.EXPIRED,
      failed: PaymentStatus.FAILED,
      rejected: PaymentStatus.FAILED,
      denied: PaymentStatus.FAILED,
    };

    return statusMap[gatewayStatus?.toLowerCase()] || PaymentStatus.PENDING;
  }

  /**
   * Normaliza o método de pagamento
   */
  private normalizePaymentMethod(method: string): PaymentMethod {
    const methodMap: Record<string, PaymentMethod> = {
      pix: PaymentMethod.PIX,
      credit_card: PaymentMethod.CREDIT_CARD,
      boleto: PaymentMethod.BOLETO,
    };

    return methodMap[method?.toLowerCase()] || PaymentMethod.PIX;
  }
}
```

### 3. Atualizar o Registry

Após criar cada gateway, adicione no arquivo `registry.ts`:

```typescript
// Importar o gateway
import { [ClassName]Gateway } from "./[slug]/index.ts";

// Adicionar no registry
export const gatewayRegistry: GatewayRegistry = {
  // ... outros gateways
  
  "[slug]": new [ClassName]Gateway(),
  
  // ...
};
```

---

## 🔧 COMANDOS ÚTEIS

### Criar múltiplos gateways rapidamente

```bash
# Na pasta gateways
cd supabase/functions/process-payment/gateways

# Criar estrutura para vários gateways de uma vez
for gateway in stripe asaas wirecard-moip safetypay allus alpa; do
  mkdir -p $gateway
  echo "Gateway $gateway criado"
done
```

### Verificar gateways implementados

```bash
# Contar pastas com index.ts
find . -name "index.ts" -path "*/gateways/*/index.ts" | wc -l
```

### Listar gateways pendentes

```bash
# Ver quais pastas não tem index.ts
for dir in */; do
  if [ ! -f "${dir}index.ts" ] && [ "$dir" != "base.ts" ]; then
    echo "❌ ${dir%/}"
  fi
done
```

---

## 📚 RECURSOS E DOCUMENTAÇÃO

### APIs dos principais gateways

- **Stripe**: https://stripe.com/docs/api
- **Asaas**: https://docs.asaas.com/
- **Mercado Pago**: https://www.mercadopago.com.br/developers
- **PagSeguro**: https://dev.pagseguro.uol.com.br/
- **Pagar.me**: https://docs.pagar.me/

### Padrões comuns entre gateways

**Estrutura de credenciais:**
- `apiKey` / `accessToken` - Token de autenticação
- `merchantId` / `sellerId` - ID do vendedor/comerciante
- `publicKey` - Chave pública (para frontend)
- `isSandbox` - Ambiente sandbox/produção

**Status comuns:**
- `pending` → PENDING
- `processing` → PROCESSING
- `approved/paid` → APPROVED
- `cancelled` → CANCELLED
- `refunded` → REFUNDED
- `failed/rejected` → FAILED

**Métodos de pagamento:**
- PIX → código QR + EMV
- Cartão → tokenização + processamento
- Boleto → PDF + código de barras

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

Para cada gateway novo:

- [ ] Criar pasta do gateway
- [ ] Criar `index.ts` com classe do gateway
- [ ] Implementar `validateCredentials()`
- [ ] Implementar `processPayment()` para PIX
- [ ] Implementar `processPayment()` para Cartão
- [ ] Implementar `processPayment()` para Boleto
- [ ] Implementar `handleWebhook()`
- [ ] Implementar `getPaymentStatus()`
- [ ] Implementar `cancelPayment()`
- [ ] Adicionar no `registry.ts`
- [ ] Testar em sandbox
- [ ] Documentar credenciais necessárias
- [ ] Configurar webhooks

---

## 🚀 PRÓXIMOS PASSOS

1. **Implementar Stripe e Asaas** (alta prioridade)
2. **Testar os 11 gateways já implementados** em sandbox
3. **Implementar sob demanda** os outros 40 conforme clientes solicitarem
4. **Configurar webhooks** para cada gateway ativo
5. **Adicionar logs** e monitoramento
6. **Documentar credenciais** de cada gateway no painel admin

---

## 💡 DICAS

- **Não implemente todos de uma vez** - Muitos gateways nunca serão usados
- **Use templates** - 80% do código é igual entre gateways
- **Teste em sandbox** - Sempre teste antes de ir para produção
- **Documente diferenças** - Cada API tem suas peculiaridades
- **Monitore webhooks** - Logs são essenciais para debug
- **Credenciais seguras** - Nunca commite API keys

---

## 📞 SUPORTE

Se precisar de ajuda com algum gateway específico:
1. Consulte a documentação oficial da API
2. Verifique exemplos de implementação nos gateways já feitos
3. Use o template fornecido neste documento
4. Ajuste conforme necessário para aquele gateway específico

---

**Última atualização:** Novembro 2025
**Gateways implementados:** 11/53 (20.8%)
**Status:** Estrutura base completa, implementação parcial