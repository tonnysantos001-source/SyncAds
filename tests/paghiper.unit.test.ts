import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/paghiper/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/paghiper/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/paghiper/v1/webhook.ts";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const validCredentials = {
  apiKey: "apk_test_abc123def456",
  token: "token_test_xyz789",
};

const validRequest: any = {
  orderId: "ORDER-PH-001",
  amount: 99.90,
  paymentMethod: "boleto",
  customer: {
    name: "Maria Oliveira",
    email: "maria@example.com",
    phone: "11988776655",
    document: "98765432100",
  },
  items: [{ name: "Curso Online", unitPrice: 99.90, quantity: 1 }],
};

// ─── Validator ────────────────────────────────────────────────────────────────

describe("PagHiper Validator", () => {
  describe("validateCredentials", () => {
    it("deve aceitar credenciais válidas", () => {
      const r = Validator.validateCredentials(validCredentials);
      expect(r.isValid).toBe(true);
      expect(r.errors).toHaveLength(0);
    });

    it("deve rejeitar apiKey vazia", () => {
      const r = Validator.validateCredentials({ ...validCredentials, apiKey: "" });
      expect(r.isValid).toBe(false);
      expect(r.errors.some((e) => e.includes("apiKey"))).toBe(true);
    });

    it("deve rejeitar token vazio", () => {
      const r = Validator.validateCredentials({ ...validCredentials, token: "" });
      expect(r.isValid).toBe(false);
      expect(r.errors.some((e) => e.includes("token"))).toBe(true);
    });

    it("deve acumular múltiplos erros", () => {
      const r = Validator.validateCredentials({});
      expect(r.isValid).toBe(false);
      expect(r.errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("validatePaymentRequest", () => {
    it("deve aceitar pedido válido", () => {
      const r = Validator.validatePaymentRequest(validRequest);
      expect(r.isValid).toBe(true);
    });

    it("deve rejeitar orderId vazio", () => {
      const r = Validator.validatePaymentRequest({ ...validRequest, orderId: "" });
      expect(r.isValid).toBe(false);
    });

    it("deve rejeitar amount zero", () => {
      const r = Validator.validatePaymentRequest({ ...validRequest, amount: 0 });
      expect(r.isValid).toBe(false);
    });

    it("deve rejeitar email inválido", () => {
      const r = Validator.validatePaymentRequest({
        ...validRequest,
        customer: { ...validRequest.customer, email: "invalido" },
      });
      expect(r.isValid).toBe(false);
    });

    it("deve rejeitar documento com menos de 11 dígitos", () => {
      const r = Validator.validatePaymentRequest({
        ...validRequest,
        customer: { ...validRequest.customer, document: "123" },
      });
      expect(r.isValid).toBe(false);
    });

    it("deve rejeitar lista de items vazia", () => {
      const r = Validator.validatePaymentRequest({ ...validRequest, items: [] });
      expect(r.isValid).toBe(false);
    });
  });
});

// ─── Mapper ───────────────────────────────────────────────────────────────────

describe("PagHiper Mapper", () => {
  describe("toTransactionPayload", () => {
    it("deve montar payload correto para boleto", () => {
      const payload = Mapper.toTransactionPayload(
        validRequest,
        validCredentials,
        "https://webhook.exemplo.com"
      );
      expect(payload.apiKey).toBe(validCredentials.apiKey);
      expect(payload.token).toBe(validCredentials.token);
      expect(payload.order_id).toBe("ORDER-PH-001");
      expect(payload.payer_email).toBe("maria@example.com");
      expect(payload.payer_cpf_cnpj).toBe("98765432100");
      expect(payload.days_due_date).toBe(2);
      expect(payload.items).toHaveLength(1);
      expect(payload.items[0].price_cents).toBe(9990); // R$99,90 em centavos
    });

    it("deve criar item genérico se items não for fornecido", () => {
      const req = { ...validRequest, items: undefined };
      const payload = Mapper.toTransactionPayload(req, validCredentials);
      expect(payload.items).toHaveLength(1);
      expect(payload.items[0].description).toContain("Pedido");
    });
  });

  describe("toBoletoResponse", () => {
    it("deve mapear resposta de boleto com sucesso", () => {
      const apiResponse = {
        create_request: {
          result: "success",
          response_message: "transaction created",
          status: "pending",
          order_id: "ORDER-PH-001",
          transaction_id: "HF97T5BMKIIVO4DC",
          created_date: "2025-06-01 10:00:00",
          value_cents: "9990",
          status_date: "2025-06-01 10:00:00",
          due_date: "2025-06-03",
          bank_slip: {
            digitable_line: "34191.75402 23950.470278 96000.000003 6 90000000009990",
            url_slip: "https://www.paghiper.com/checkout/boleto/HF97T5BMKIIVO4DC",
            url_slip_pdf: "https://www.paghiper.com/checkout/boleto/HF97T5BMKIIVO4DC/pdf",
          },
        },
      };
      const result = Mapper.toBoletoResponse(apiResponse as any, "ORDER-PH-001");
      expect(result.success).toBe(true);
      expect(result.status).toBe("pending");
      expect(result.gatewayTransactionId).toBe("HF97T5BMKIIVO4DC");
      expect(result.paymentUrl).toContain("paghiper.com");
      expect(result.barcodeNumber).toContain("34191");
    });

    it("deve retornar falha se result não for success", () => {
      const apiResponse = {
        create_request: { result: "reject", response_message: "Invalid apiKey" },
      };
      const result = Mapper.toBoletoResponse(apiResponse as any, "ORDER-PH-001");
      expect(result.success).toBe(false);
      expect(result.status).toBe("failed");
    });
  });

  describe("toPaymentStatus", () => {
    it("'completed' → 'approved'", () => expect(Mapper.toPaymentStatus("completed")).toBe("approved"));
    it("'paid' → 'approved'", () => expect(Mapper.toPaymentStatus("paid")).toBe("approved"));
    it("'pending' → 'pending'", () => expect(Mapper.toPaymentStatus("pending")).toBe("pending"));
    it("'reserved' → 'processing'", () => expect(Mapper.toPaymentStatus("reserved")).toBe("processing"));
    it("'canceled' → 'cancelled'", () => expect(Mapper.toPaymentStatus("canceled")).toBe("cancelled"));
    it("'refunded' → 'refunded'", () => expect(Mapper.toPaymentStatus("refunded")).toBe("refunded"));
    it("desconhecido → 'pending'", () => expect(Mapper.toPaymentStatus("xyz")).toBe("pending"));
  });
});

// ─── WebhookHandler ───────────────────────────────────────────────────────────

describe("PagHiper WebhookHandler", () => {
  it("deve processar webhook com transaction_id e status", () => {
    const payload = {
      notification_request: {
        transaction_id: "HF97T5BMKIIVO4DC",
        order_id: "ORDER-PH-001",
        status: "completed",
        value_cents: "9990",
      },
    };
    const result = WebhookHandler.handle(payload);
    expect(result.success).toBe(true);
    expect(result.processed).toBe(true);
    expect(result.transactionId).toBe("HF97T5BMKIIVO4DC");
    expect(result.status).toBe("approved");
  });

  it("deve rejeitar webhook sem transaction_id", () => {
    const result = WebhookHandler.handle({ notification_request: { status: "completed" } });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar webhook sem status", () => {
    const result = WebhookHandler.handle({ notification_request: { transaction_id: "TX123" } });
    expect(result.success).toBe(false);
  });

  it("deve processar payload plano (sem notification_request)", () => {
    const payload = { transaction_id: "TX456", order_id: "ORD-001", status: "pending" };
    const result = WebhookHandler.handle(payload);
    expect(result.success).toBe(true);
    expect(result.status).toBe("pending");
  });

  it("validateSignature sempre retorna isValid=true", () => {
    expect(WebhookHandler.validateSignature({}, undefined, undefined).isValid).toBe(true);
  });
});
