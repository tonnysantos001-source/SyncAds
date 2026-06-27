import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/roxpay/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/roxpay/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/roxpay/v1/webhook.ts";

const validCreds = { clientId: "client_id_abc123", clientSecret: "client_secret_xyz987" };
const validRequest: any = {
  orderId: "ORDER-RX-001", amount: 199.90, paymentMethod: "credit_card", installments: 1,
  customer: { name: "Amanda Silva", email: "amanda@example.com", phone: "11988887777", document: "11122233344" },
  card: { number: "4111111111111111", holderName: "AMANDA SILVA", expMonth: "12", expYear: "2029", cvv: "123" },
};

describe("RoxPay Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita clientId vazio", () => expect(Validator.validateCredentials({ ...validCreds, clientId: "" }).isValid).toBe(false));
  it("rejeita clientSecret vazio", () => expect(Validator.validateCredentials({ ...validCreds, clientSecret: "" }).isValid).toBe(false));
  it("aceita pedido de cartão válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
  it("rejeita sem orderId", () => expect(Validator.validatePaymentRequest({ ...validRequest, orderId: "" }).isValid).toBe(false));
  it("rejeita cartão sem cvv", () => {
    const r = Validator.validatePaymentRequest({ ...validRequest, card: { ...validRequest.card, cvv: "" } });
    expect(r.isValid).toBe(false);
  });
});

describe("RoxPay Mapper", () => {
  it("converte amount para centavos", () => {
    const p = Mapper.toCreateChargePayload(validRequest);
    expect(p.amount).toBe(19990);
  });
  it("mapeia status RoxPay: approved → approved", () => expect(Mapper.toPaymentStatus("approved")).toBe("approved"));
  it("mapeia status RoxPay: failed → failed", () => expect(Mapper.toPaymentStatus("failed")).toBe("failed"));
  it("mapeia resposta de criação com sucesso", () => {
    const api = { id: "ch_123", reference_id: "ORDER-RX-001", status: "approved", amount: 19990 };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-RX-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.gatewayTransactionId).toBe("ch_123");
  });
});

describe("RoxPay WebhookHandler", () => {
  it("processa webhook de transação paga", () => {
    const payload = { id: "ch_123", status: "approved", reference_id: "ORDER-RX-001" };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("ORDER-RX-001");
  });
  it("rejeita webhook sem id", () => {
    expect(WebhookHandler.handle({ status: "approved" }).success).toBe(false);
  });
  it("validateSignature sempre true", () => {
    expect(WebhookHandler.validateSignature({}, undefined, undefined).isValid).toBe(true);
  });
});
