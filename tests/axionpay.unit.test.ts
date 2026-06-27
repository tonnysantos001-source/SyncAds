import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/axionpay/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/axionpay/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/axionpay/v1/webhook.ts";

const validCreds = { apiKey: "sk_live_test_key_xyz_777" };
const validRequest: any = {
  orderId: "ORDER-AX-001", amount: 150.00, paymentMethod: "credit_card", installments: 1,
  customer: { name: "Carlos Silva", email: "carlos@example.com", phone: "11988887777", document: "11122233344" },
  card: { number: "4111111111111111", holderName: "CARLOS SILVA", expMonth: "10", expYear: "2029", cvv: "123" },
};

describe("Axion Pay Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita apiKey vazia", () => expect(Validator.validateCredentials({ apiKey: "" }).isValid).toBe(false));
  it("aceita pedido de cartão válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
  it("rejeita sem orderId", () => expect(Validator.validatePaymentRequest({ ...validRequest, orderId: "" }).isValid).toBe(false));
  it("rejeita cartão sem cvv", () => {
    const r = Validator.validatePaymentRequest({ ...validRequest, card: { ...validRequest.card, cvv: "" } });
    expect(r.isValid).toBe(false);
  });
});

describe("Axion Pay Mapper", () => {
  it("converte amount para centavos", () => {
    const p = Mapper.toCreateChargePayload(validRequest);
    expect(p.amount).toBe(15000);
  });
  it("mapeia status Axion Pay: approved → approved", () => expect(Mapper.toPaymentStatus("approved")).toBe("approved"));
  it("mapeia status Axion Pay: failed → failed", () => expect(Mapper.toPaymentStatus("failed")).toBe("failed"));
  it("mapeia resposta de criação com sucesso", () => {
    const api = { id: "ch_555", reference_id: "ORDER-AX-001", status: "approved", amount: 15000 };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-AX-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.gatewayTransactionId).toBe("ch_555");
  });
});

describe("Axion Pay WebhookHandler", () => {
  it("processa webhook de transação paga", () => {
    const payload = { id: "ch_555", status: "approved", reference_id: "ORDER-AX-001" };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("ORDER-AX-001");
  });
  it("rejeita webhook sem id", () => {
    expect(WebhookHandler.handle({ status: "approved" }).success).toBe(false);
  });
  it("validateSignature sempre true", () => {
    expect(WebhookHandler.validateSignature({}, undefined, undefined).isValid).toBe(true);
  });
});
