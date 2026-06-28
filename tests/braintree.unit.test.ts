import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/braintree/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/braintree/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/braintree/v1/webhook.ts";

const validCreds = { merchantId: "merch_123", publicKey: "pub_123", privateKey: "priv_123" };
const validRequest: any = {
  orderId: "ORDER-BT-001",
  amount: 99.90,
  paymentMethod: "credit_card",
  customer: { name: "John Doe", email: "john@example.com" },
  card: { number: "4111111111111111", holderName: "JOHN DOE", expMonth: "12", expYear: "29", cvv: "123" }
};

describe("Braintree Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita merchantId vazio", () => expect(Validator.validateCredentials({ ...validCreds, merchantId: "" }).isValid).toBe(false));
  it("rejeita publicKey vazia", () => expect(Validator.validateCredentials({ ...validCreds, publicKey: "" }).isValid).toBe(false));
  it("rejeita privateKey vazia", () => expect(Validator.validateCredentials({ ...validCreds, privateKey: "" }).isValid).toBe(false));
  it("aceita pedido válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
});

describe("Braintree Mapper", () => {
  it("mapeia amount para string decimal", () => {
    const p = Mapper.toCreateTransactionPayload(validRequest);
    expect(p.amount).toBe("99.90");
  });
  it("mapeia status Braintree: settled → approved", () => expect(Mapper.toPaymentStatus("settled")).toBe("approved"));
  it("mapeia status Braintree: voided → cancelled", () => expect(Mapper.toPaymentStatus("voided")).toBe("cancelled"));
  it("mapeia resposta de criação com sucesso", () => {
    const api = { success: true, transaction: { id: "tx_123", status: "settled", amount: "99.90" } };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-BT-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.gatewayTransactionId).toBe("tx_123");
  });
});

describe("Braintree WebhookHandler", () => {
  it("processa webhook de transação liquidada", () => {
    const payload = { kind: "transaction_settled", transaction: { id: "tx_123" } };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("tx_123");
  });
});
