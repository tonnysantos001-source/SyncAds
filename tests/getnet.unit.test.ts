import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/getnet/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/getnet/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/getnet/v1/webhook.ts";

const validCreds = { clientId: "getnet_client_id_xyz", clientSecret: "sec_12345", sellerId: "sell_999" };
const validRequest: any = {
  orderId: "ORDER-GN-001", amount: 150.00, paymentMethod: "credit_card", installments: 1,
  customer: { name: "Carlos Silva", email: "carlos@example.com", phone: "11988887777", document: "11122233344" },
  card: { number: "4111111111111111", holderName: "CARLOS SILVA", expMonth: "10", expYear: "2029", cvv: "123" },
};

describe("GetNet Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita clientId vazio", () => expect(Validator.validateCredentials({ ...validCreds, clientId: "" }).isValid).toBe(false));
  it("rejeita sellerId vazio", () => expect(Validator.validateCredentials({ ...validCreds, sellerId: "" }).isValid).toBe(false));
  it("aceita pedido de cartão válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
  it("rejeita sem orderId", () => expect(Validator.validatePaymentRequest({ ...validRequest, orderId: "" }).isValid).toBe(false));
  it("rejeita cartão sem cvv", () => {
    const r = Validator.validatePaymentRequest({ ...validRequest, card: { ...validRequest.card, cvv: "" } });
    expect(r.isValid).toBe(false);
  });
});

describe("GetNet Mapper", () => {
  it("converte amount para centavos", () => {
    const p = Mapper.toCreatePaymentPayload(validRequest, "sell_999");
    expect(p.amount).toBe(15000);
  });
  it("mapeia status GetNet: APPROVED → approved", () => expect(Mapper.toPaymentStatus("APPROVED")).toBe("approved"));
  it("mapeia status GetNet: DENIED → failed", () => expect(Mapper.toPaymentStatus("DENIED")).toBe("failed"));
  it("mapeia resposta de criação com sucesso", () => {
    const api = { payment_id: "ch_555", status: "APPROVED", amount: 15000 };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-GN-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.gatewayTransactionId).toBe("ch_555");
  });
});

describe("GetNet WebhookHandler", () => {
  it("processa webhook de transação paga", () => {
    const payload = { payment_id: "ch_555", status: "APPROVED" };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("ch_555");
  });
  it("rejeita webhook sem payment_id", () => {
    expect(WebhookHandler.handle({ status: "APPROVED" }).success).toBe(false);
  });
  it("validateSignature sempre true", () => {
    expect(WebhookHandler.validateSignature({}, undefined, undefined).isValid).toBe(true);
  });
});
