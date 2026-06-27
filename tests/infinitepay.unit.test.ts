import { describe, it, expect, vi, beforeEach } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/infinitepay/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/infinitepay/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/infinitepay/v1/webhook.ts";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const validCredentials = {
  handle: "minha_loja",
  clientId: "test_client_id_abc123",
  clientSecret: "test_client_secret_xyz987",
};

const validRequest: any = {
  orderId: "ORDER-IP-001",
  amount: 150.0,
  paymentMethod: "pix",
  customer: {
    name: "João Silva",
    email: "joao@example.com",
    phone: "11999887766",
    document: "12345678900",
  },
  items: [{ name: "Produto A", unitPrice: 150.0, quantity: 1 }],
};

// ─── Validator ────────────────────────────────────────────────────────────────

describe("InfinitePay Validator", () => {
  describe("validateCredentials", () => {
    it("deve aceitar credenciais válidas", () => {
      const result = Validator.validateCredentials(validCredentials);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("deve rejeitar se handle estiver ausente", () => {
      const result = Validator.validateCredentials({ ...validCredentials, handle: "" });
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("handle"))).toBe(true);
    });

    it("deve rejeitar se clientId estiver ausente", () => {
      const result = Validator.validateCredentials({ ...validCredentials, clientId: "" });
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("clientId"))).toBe(true);
    });

    it("deve rejeitar se clientSecret estiver ausente", () => {
      const result = Validator.validateCredentials({ ...validCredentials, clientSecret: "" });
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("clientSecret"))).toBe(true);
    });

    it("deve acumular múltiplos erros", () => {
      const result = Validator.validateCredentials({});
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe("validatePaymentRequest", () => {
    it("deve aceitar pedido válido", () => {
      const result = Validator.validatePaymentRequest(validRequest);
      expect(result.isValid).toBe(true);
    });

    it("deve rejeitar se orderId estiver ausente", () => {
      const result = Validator.validatePaymentRequest({ ...validRequest, orderId: "" });
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("orderId"))).toBe(true);
    });

    it("deve rejeitar se amount for zero", () => {
      const result = Validator.validatePaymentRequest({ ...validRequest, amount: 0 });
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("Valor"))).toBe(true);
    });

    it("deve rejeitar se customer.email for inválido", () => {
      const result = Validator.validatePaymentRequest({
        ...validRequest,
        customer: { ...validRequest.customer, email: "invalido" },
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.toLowerCase().includes("e-mail"))).toBe(true);
    });

    it("deve rejeitar se items estiver vazio", () => {
      const result = Validator.validatePaymentRequest({ ...validRequest, items: [] });
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("item"))).toBe(true);
    });
  });
});

// ─── Mapper ───────────────────────────────────────────────────────────────────

describe("InfinitePay Mapper", () => {
  describe("toCreateLinkPayload", () => {
    it("deve montar payload correto a partir do PaymentRequest", () => {
      const payload = Mapper.toCreateLinkPayload(validRequest, "minha_loja", "https://site.com/obrigado");
      expect(payload.handle).toBe("minha_loja");
      expect(payload.order_nsu).toBe("ORDER-IP-001");
      expect(payload.redirect_url).toBe("https://site.com/obrigado");
      expect(payload.customer.name).toBe("João Silva");
      expect(payload.customer.email).toBe("joao@example.com");
      expect(payload.customer.phone_number).toMatch(/^\+55/);
      expect(payload.items).toHaveLength(1);
      expect(payload.items[0].amount).toBe(15000); // 150.00 em centavos
    });

    it("deve criar item genérico se items não for fornecido", () => {
      const req = { ...validRequest, items: undefined };
      const payload = Mapper.toCreateLinkPayload(req, "minha_loja");
      expect(payload.items).toHaveLength(1);
      expect(payload.items[0].name).toContain("Pedido");
      expect(payload.items[0].amount).toBe(15000);
    });

    it("deve formatar telefone corretamente (sem +55)", () => {
      const payload = Mapper.toCreateLinkPayload(validRequest, "handle");
      expect(payload.customer.phone_number).toBe("+5511999887766");
    });

    it("deve formatar telefone corretamente (já com +55)", () => {
      const req = { ...validRequest, customer: { ...validRequest.customer, phone: "5511999887766" } };
      const payload = Mapper.toCreateLinkPayload(req, "handle");
      expect(payload.customer.phone_number).toBe("+5511999887766");
    });
  });

  describe("toPaymentResponse", () => {
    it("deve mapear resposta de link criado com sucesso", () => {
      const apiResponse = {
        id: "link_abc123",
        order_nsu: "ORDER-IP-001",
        payment_url: "https://checkout.infinitepay.io/pay/abc123",
        expires_at: "2025-12-31T23:59:59Z",
      };
      const result = Mapper.toPaymentResponse(apiResponse, "ORDER-IP-001");
      expect(result.success).toBe(true);
      expect(result.status).toBe("pending");
      expect(result.paymentUrl).toBe("https://checkout.infinitepay.io/pay/abc123");
      expect(result.redirectUrl).toBe("https://checkout.infinitepay.io/pay/abc123");
      expect(result.gatewayTransactionId).toBe("link_abc123");
    });
  });

  describe("toPaymentStatusResponse", () => {
    it("deve mapear status 'paid' para 'approved'", () => {
      const apiResponse = {
        order_nsu: "ORDER-IP-001",
        status: "paid",
        amount: 15000,
        payment_method: "pix",
        paid_at: "2025-06-01T10:00:00Z",
        created_at: "2025-06-01T09:00:00Z",
      };
      const result = Mapper.toPaymentStatusResponse(apiResponse);
      expect(result.status).toBe("approved");
      expect(result.amount).toBe(150.0);
      expect(result.currency).toBe("BRL");
    });
  });

  describe("toPaymentStatus", () => {
    it("deve mapear 'paid' → 'approved'", () => expect(Mapper.toPaymentStatus("paid")).toBe("approved"));
    it("deve mapear 'pending' → 'pending'", () => expect(Mapper.toPaymentStatus("pending")).toBe("pending"));
    it("deve mapear 'expired' → 'expired'", () => expect(Mapper.toPaymentStatus("expired")).toBe("expired"));
    it("deve mapear 'cancelled' → 'cancelled'", () => expect(Mapper.toPaymentStatus("cancelled")).toBe("cancelled"));
    it("deve mapear 'processing' → 'processing'", () => expect(Mapper.toPaymentStatus("processing")).toBe("processing"));
    it("deve retornar 'pending' para status desconhecido", () => expect(Mapper.toPaymentStatus("unknown_status")).toBe("pending"));
  });
});

// ─── WebhookHandler ───────────────────────────────────────────────────────────

describe("InfinitePay WebhookHandler", () => {
  it("deve processar webhook válido com 'paid'", () => {
    const payload = { order_nsu: "ORDER-IP-001", status: "paid", amount: 15000 };
    const result = WebhookHandler.handle(payload);
    expect(result.success).toBe(true);
    expect(result.processed).toBe(true);
    expect(result.transactionId).toBe("ORDER-IP-001");
    expect(result.status).toBe("approved");
  });

  it("deve rejeitar webhook sem order_nsu", () => {
    const result = WebhookHandler.handle({ status: "paid" });
    expect(result.success).toBe(false);
    expect(result.processed).toBe(false);
  });

  it("deve rejeitar webhook sem status", () => {
    const result = WebhookHandler.handle({ order_nsu: "ORDER-IP-001" });
    expect(result.success).toBe(false);
    expect(result.processed).toBe(false);
  });

  it("deve validar assinatura sempre como verdadeira (não documentada)", () => {
    const result = WebhookHandler.validateSignature({}, "any", "any");
    expect(result.isValid).toBe(true);
  });
});
