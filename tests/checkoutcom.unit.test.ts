import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/checkoutcom/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/checkoutcom/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/checkoutcom/v1/webhook.ts";

const validCreds = { secretKey: "sk_123", publicKey: "pk_123" };
const validRequest: any = {
  orderId: "ORDER-CK-001",
  amount: 120.50,
  paymentMethod: "credit_card",
  customer: { name: "Alice Smith", email: "alice@example.com" },
  card: { number: "4111111111111111", holderName: "ALICE SMITH", expMonth: "08", expYear: "2030", cvv: "123" }
};

describe("Checkoutcom Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita secretKey vazia", () => expect(Validator.validateCredentials({ ...validCreds, secretKey: "" }).isValid).toBe(false));
  it("rejeita publicKey vazia", () => expect(Validator.validateCredentials({ ...validCreds, publicKey: "" }).isValid).toBe(false));
  it("aceita pedido de cartão válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
});

describe("Checkoutcom Mapper", () => {
  it("converte amount para centavos", () => {
    const p = Mapper.toCreatePaymentPayload(validRequest);
    expect(p.amount).toBe(12050);
  });
  it("mapeia status Checkoutcom: Captured → approved", () => expect(Mapper.toPaymentStatus("Captured")).toBe("approved"));
  it("mapeia status Checkoutcom: Declined → failed", () => expect(Mapper.toPaymentStatus("Declined")).toBe("failed"));
  it("mapeia resposta de criação com sucesso", () => {
    const api = { id: "pay_ck_123", status: "Captured", amount: 12050 };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-CK-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.gatewayTransactionId).toBe("pay_ck_123");
  });
});

describe("Checkoutcom WebhookHandler", () => {
  it("processa webhook de transação capturada", () => {
    const payload = { type: "payment_captured", data: { object: { id: "pay_ck_123", reference: "ORDER-CK-001", status: "Captured" } } };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("ORDER-CK-001");
  });
});
