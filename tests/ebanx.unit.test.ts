import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/ebanx/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/ebanx/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/ebanx/v1/webhook.ts";

const validCreds = { integrationKey: "eb_int_123", publicIntegrationKey: "eb_pub_123" };
const validRequest: any = {
  orderId: "ORDER-EB-001",
  amount: 150.00,
  paymentMethod: "credit_card",
  customer: { name: "Maria Silva", email: "maria@example.com", document: "12345678909" },
  card: { number: "4111111111111111", holderName: "MARIA SILVA", expMonth: "10", expYear: "2030", cvv: "123" }
};

describe("EBANX Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita integrationKey vazia", () => expect(Validator.validateCredentials({ ...validCreds, integrationKey: "" }).isValid).toBe(false));
  it("rejeita publicIntegrationKey vazia", () => expect(Validator.validateCredentials({ ...validCreds, publicIntegrationKey: "" }).isValid).toBe(false));
  it("aceita pedido válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
});

describe("EBANX Mapper", () => {
  it("mapeia payload de criação corretamente", () => {
    const p = Mapper.toCreatePaymentPayload(validRequest, "eb_int_123");
    expect(p.payment.amount_total).toBe("150.00");
    expect(p.payment.payment_type_code).toBe("creditcard");
  });
  it("mapeia status EBANX: CO → approved", () => expect(Mapper.toPaymentStatus("CO")).toBe("approved"));
  it("mapeia status EBANX: CA → cancelled", () => expect(Mapper.toPaymentStatus("CA")).toBe("cancelled"));
  it("mapeia resposta de criação com sucesso", () => {
    const api = { payment: { hash: "eb_hash_123", status: "CO", amount_br: "150.00" } };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-EB-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.gatewayTransactionId).toBe("eb_hash_123");
  });
});

describe("EBANX WebhookHandler", () => {
  it("processa webhook de status confirmado", () => {
    const payload = { payment: { status: "CO", hash: "eb_hash_123", merchant_payment_code: "ORDER-EB-001" } };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("ORDER-EB-001");
  });
});
