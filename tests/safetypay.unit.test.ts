import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/safetypay/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/safetypay/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/safetypay/v1/webhook.ts";

const validCreds = { apiKey: "safetypay_api_key_xyz", signatureKey: "sec_12345" };
const validRequest: any = {
  orderId: "ORDER-SP-001", amount: 150.00, paymentMethod: "pix",
  customer: { name: "Carlos Silva", email: "carlos@example.com", phone: "11988887777", document: "11122233344" },
};

describe("SafetyPay Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita apiKey vazia", () => expect(Validator.validateCredentials({ ...validCreds, apiKey: "" }).isValid).toBe(false));
  it("rejeita signatureKey vazia", () => expect(Validator.validateCredentials({ ...validCreds, signatureKey: "" }).isValid).toBe(false));
  it("aceita pedido válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
  it("rejeita sem orderId", () => expect(Validator.validatePaymentRequest({ ...validRequest, orderId: "" }).isValid).toBe(false));
  it("rejeita sem e-mail válido", () => {
    const r = Validator.validatePaymentRequest({ ...validRequest, customer: { ...validRequest.customer, email: "carlos" } });
    expect(r.isValid).toBe(false);
  });
});

describe("SafetyPay Mapper", () => {
  it("mapeia valor decimal de amount", () => {
    const p = Mapper.toCreatePaymentPayload(validRequest);
    expect(p.amount).toBe(150.00);
  });
  it("mapeia status SafetyPay: success → approved", () => expect(Mapper.toPaymentStatus("success")).toBe("approved"));
  it("mapeia status SafetyPay: declined → failed", () => expect(Mapper.toPaymentStatus("declined")).toBe("failed"));
  it("mapeia resposta de criação com sucesso", () => {
    const api = { id: "tx_555", status: "success", payment_url: "https://safetypay.com/pay/tx_555", amount: 150.00 };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-SP-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.gatewayTransactionId).toBe("tx_555");
  });
});

describe("SafetyPay WebhookHandler", () => {
  it("processa webhook de transação paga", () => {
    const payload = { id: "tx_555", status: "success" };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("tx_555");
  });
  it("rejeita webhook sem id", () => {
    expect(WebhookHandler.handle({ status: "success" }).success).toBe(false);
  });
  it("validateSignature sempre true", () => {
    expect(WebhookHandler.validateSignature({}, undefined, undefined).isValid).toBe(true);
  });
});
