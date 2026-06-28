import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/payu/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/payu/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/payu/v1/webhook.ts";

const validCreds = { apiKey: "payu_key_123", apiLogin: "payu_login_123", merchantId: "payu_merch_123" };
const validRequest: any = {
  orderId: "ORDER-PU-001",
  amount: 320.00,
  paymentMethod: "credit_card",
  customer: { name: "Grace Hopper", email: "grace@example.com" },
  card: { number: "4111111111111111", holderName: "GRACE HOPPER", expMonth: "05", expYear: "2030", cvv: "123" }
};

describe("PayU Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita apiKey vazia", () => expect(Validator.validateCredentials({ ...validCreds, apiKey: "" }).isValid).toBe(false));
  it("rejeita apiLogin vazio", () => expect(Validator.validateCredentials({ ...validCreds, apiLogin: "" }).isValid).toBe(false));
  it("rejeita merchantId vazio", () => expect(Validator.validateCredentials({ ...validCreds, merchantId: "" }).isValid).toBe(false));
  it("aceita pedido de cartão válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
});

describe("PayU Mapper", () => {
  it("converte amount corretamente", () => {
    const p = Mapper.toTransactionRequest(validRequest, validCreds, true);
    expect(p.transaction.order.additionalValues.TX_VALUE.value).toBe(320.00);
  });
  it("mapeia status PayU: APPROVED → approved", () => expect(Mapper.toPaymentStatus("APPROVED")).toBe("approved"));
  it("mapeia status PayU: DECLINED → failed", () => expect(Mapper.toPaymentStatus("DECLINED")).toBe("failed"));
  it("mapeia resposta de criação com sucesso", () => {
    const api = { code: "SUCCESS", transactionResponse: { orderId: 789, transactionId: "pu_tx_123", state: "APPROVED", responseCode: "APPROVED" } };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-PU-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.gatewayTransactionId).toBe("pu_tx_123");
  });
});

describe("PayU WebhookHandler", () => {
  it("processa webhook de transação aprovada", () => {
    const payload = { referenceCode: "ORDER-PU-001", state: "APPROVED" };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("ORDER-PU-001");
  });
});
