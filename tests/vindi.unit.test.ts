import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/vindi/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/vindi/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/vindi/v1/webhook.ts";

const validCreds = { apiKey: "vindi_test_key_abc123" };
const validRequest: any = {
  orderId: "ORDER-VD-001", amount: 79.90, paymentMethod: "credit_card", installments: 1,
  customer: { name: "Lucia Ferreira", email: "lucia@example.com", phone: "11955443322", document: "44455566677" },
  card: { number: "4111111111111111", holderName: "LUCIA FERREIRA", expMonth: "3", expYear: "2029", cvv: "456" },
};

describe("Vindi Validator", () => {
  it("aceita apiKey válida", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita apiKey vazia", () => expect(Validator.validateCredentials({ apiKey: "" }).isValid).toBe(false));
  it("aceita pedido válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
  it("rejeita sem orderId", () => expect(Validator.validatePaymentRequest({ ...validRequest, orderId: "" }).isValid).toBe(false));
  it("rejeita amount zero", () => expect(Validator.validatePaymentRequest({ ...validRequest, amount: 0 }).isValid).toBe(false));
  it("rejeita email inválido", () => {
    const r = Validator.validatePaymentRequest({ ...validRequest, customer: { ...validRequest.customer, email: "errado" } });
    expect(r.isValid).toBe(false);
  });
});

describe("Vindi Mapper", () => {
  it("monta VindiCustomer corretamente", () => {
    const c = Mapper.toVindiCustomer(validRequest);
    expect(c.name).toBe("Lucia Ferreira");
    expect(c.email).toBe("lucia@example.com");
    expect(c.registry_code).toBe("44455566677");
    expect(c.code).toBe("ORDER-VD-001");
  });

  it("monta BillPayload com credit_card", () => {
    const b = Mapper.toBillPayload(validRequest, 999, 888);
    expect(b.customer_id).toBe(999);
    expect(b.payment_method_code).toBe("credit_card");
    expect(b.payment_profile?.id).toBe(888);
    expect(b.payment_profile?.installments).toBe(1);
  });

  it("monta BillPayload com boleto (bank_slip)", () => {
    const req = { ...validRequest, paymentMethod: "boleto" };
    const b = Mapper.toBillPayload(req, 999);
    expect(b.payment_method_code).toBe("bank_slip");
  });

  it("mapeia BillResponse paga com sucesso", () => {
    const api = {
      bill: {
        id: 12345, code: "ORDER-VD-001", status: "paid", amount: 79.90,
        due_at: "2025-06-30",
        charges: [{ id: 1, status: "paid", amount: 79.90, payment_method_code: "credit_card", last_transaction: { id: 1, status: "success", gateway_authorization: "AUTH999" } }],
      },
    };
    const r = Mapper.toBillResponse(api as any, "ORDER-VD-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.gatewayTransactionId).toBe("12345");
  });

  it("mapeia BillResponse com erro", () => {
    const api = { errors: [{ id: "err1", message: "Cartão inválido" }] };
    const r = Mapper.toBillResponse(api as any, "ORDER-VD-001");
    expect(r.success).toBe(false);
    expect(r.status).toBe("failed");
  });

  it("'paid' → 'approved'", () => expect(Mapper.toPaymentStatus("paid")).toBe("approved"));
  it("'pending' → 'pending'", () => expect(Mapper.toPaymentStatus("pending")).toBe("pending"));
  it("'canceled' → 'cancelled'", () => expect(Mapper.toPaymentStatus("canceled")).toBe("cancelled"));
  it("'reviewing' → 'processing'", () => expect(Mapper.toPaymentStatus("reviewing")).toBe("processing"));
});

describe("Vindi WebhookHandler", () => {
  it("processa bill_paid", () => {
    const payload = { event_type: "bill.paid", data: { bill: { id: 12345, code: "ORDER-VD-001", status: "paid" } } };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("ORDER-VD-001");
  });

  it("processa bill.canceled", () => {
    const payload = { event_type: "bill.canceled", data: { bill: { id: 99, code: "ORDER-VD-002", status: "canceled" } } };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("cancelled");
  });

  it("rejeita webhook sem bill data", () => {
    const r = WebhookHandler.handle({ event_type: "bill.paid", data: {} });
    expect(r.success).toBe(false);
  });

  it("validateSignature sempre true", () => {
    expect(WebhookHandler.validateSignature({}, undefined, undefined).isValid).toBe(true);
  });
});
