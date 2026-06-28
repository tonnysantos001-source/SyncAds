import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/square/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/square/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/square/v1/webhook.ts";

const validCreds = { accessToken: "sq_token_123", locationId: "sq_loc_123" };
const validRequest: any = {
  orderId: "ORDER-SQ-001",
  amount: 85.00,
  paymentMethod: "credit_card",
  customer: { name: "Bob Martin", email: "bob@example.com" },
  card: { number: "4111111111111111", holderName: "BOB MARTIN", expMonth: "11", expYear: "2029", cvv: "123" }
};

describe("Square Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita accessToken vazio", () => expect(Validator.validateCredentials({ ...validCreds, accessToken: "" }).isValid).toBe(false));
  it("rejeita locationId vazio", () => expect(Validator.validateCredentials({ ...validCreds, locationId: "" }).isValid).toBe(false));
  it("aceita pedido de cartão válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
});

describe("Square Mapper", () => {
  it("converte amount para centavos", () => {
    const p = Mapper.toCreatePaymentPayload(validRequest, "sq_loc_123");
    expect(p.amount_money.amount).toBe(8500);
  });
  it("mapeia status Square: COMPLETED → approved", () => expect(Mapper.toPaymentStatus("COMPLETED")).toBe("approved"));
  it("mapeia status Square: FAILED → failed", () => expect(Mapper.toPaymentStatus("FAILED")).toBe("failed"));
  it("mapeia resposta de criação com sucesso", () => {
    const api = { payment: { id: "sq_pay_123", status: "COMPLETED", amount_money: { amount: 8500, currency: "BRL" }, order_id: "ORDER-SQ-001" } };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-SQ-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.gatewayTransactionId).toBe("sq_pay_123");
  });
});

describe("Square WebhookHandler", () => {
  it("processa webhook de transação completa", () => {
    const payload = { type: "payment.completed", data: { object: { payment: { id: "sq_pay_123", status: "COMPLETED" } } } };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("sq_pay_123");
  });
});
