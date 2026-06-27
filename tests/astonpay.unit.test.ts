import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/astonpay/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/astonpay/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/astonpay/v1/webhook.ts";

const validCreds = { merchantCode: "mc_123456", apiKey: "ap_key_secret_999" };
const validRequest: any = {
  orderId: "ORDER-AS-001", amount: 299.90, paymentMethod: "credit_card", installments: 1,
  customer: { name: "Beatriz Santos", email: "beatriz@example.com", phone: "11988887777", document: "11122233344" },
  card: { number: "4111111111111111", holderName: "BEATRIZ SANTOS", expMonth: "10", expYear: "2029", cvv: "123" },
};

describe("Aston Pay Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita merchantCode vazio", () => expect(Validator.validateCredentials({ ...validCreds, merchantCode: "" }).isValid).toBe(false));
  it("rejeita apiKey vazio", () => expect(Validator.validateCredentials({ ...validCreds, apiKey: "" }).isValid).toBe(false));
  it("aceita pedido de cartão válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
  it("rejeita sem orderId", () => expect(Validator.validatePaymentRequest({ ...validRequest, orderId: "" }).isValid).toBe(false));
  it("rejeita cartão sem cvv", () => {
    const r = Validator.validatePaymentRequest({ ...validRequest, card: { ...validRequest.card, cvv: "" } });
    expect(r.isValid).toBe(false);
  });
});

describe("Aston Pay Mapper", () => {
  it("converte amount para centavos", () => {
    const p = Mapper.toCreateChargePayload(validRequest);
    expect(p.amount).toBe(29990);
  });
  it("mapeia status Aston Pay: approved → approved", () => expect(Mapper.toPaymentStatus("approved")).toBe("approved"));
  it("mapeia status Aston Pay: failed → failed", () => expect(Mapper.toPaymentStatus("failed")).toBe("failed"));
  it("mapeia resposta de criação com sucesso", () => {
    const api = { id: "ch_987", reference_id: "ORDER-AS-001", status: "approved", amount: 29990 };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-AS-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.gatewayTransactionId).toBe("ch_987");
  });
});

describe("Aston Pay WebhookHandler", () => {
  it("processa webhook de transação paga", () => {
    const payload = { id: "ch_987", status: "approved", reference_id: "ORDER-AS-001" };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("ORDER-AS-001");
  });
  it("rejeita webhook sem id", () => {
    expect(WebhookHandler.handle({ status: "approved" }).success).toBe(false);
  });
  it("validateSignature sempre true", () => {
    expect(WebhookHandler.validateSignature({}, undefined, undefined).isValid).toBe(true);
  });
});
