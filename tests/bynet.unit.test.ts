import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/bynet/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/bynet/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/bynet/v1/webhook.ts";

const validCreds = { clientId: "by_client_id_12345", clientSecret: "sec_key_xyz_777" };
const validRequest: any = {
  orderId: "ORDER-BY-001", amount: 150.00, paymentMethod: "credit_card", installments: 1,
  customer: { name: "Carlos Silva", email: "carlos@example.com", phone: "11988887777", document: "11122233344" },
  card: { number: "4111111111111111", holderName: "CARLOS SILVA", expMonth: "10", expYear: "2029", cvv: "123" },
};

describe("Bynet Validator", () => {
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

describe("Bynet Mapper", () => {
  it("converte amount para centavos", () => {
    const p = Mapper.toCreatePaymentPayload(validRequest);
    expect(p.amount).toBe(15000);
  });
  it("mapeia status Bynet: approved → approved", () => expect(Mapper.toPaymentStatus("approved")).toBe("approved"));
  it("mapeia status Bynet: failed → failed", () => expect(Mapper.toPaymentStatus("failed")).toBe("failed"));
  it("mapeia resposta de criação com sucesso", () => {
    const api = { id: "ch_555", transaction_id: "ORDER-BY-001", status: "approved", amount: 15000 };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-BY-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.gatewayTransactionId).toBe("ch_555");
  });
});

describe("Bynet WebhookHandler", () => {
  it("processa webhook de transação paga", () => {
    const payload = { id: "ch_555", status: "approved", transaction_id: "ORDER-BY-001" };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("ORDER-BY-001");
  });
  it("rejeita webhook sem id/transaction_id", () => {
    expect(WebhookHandler.handle({ status: "approved" }).success).toBe(false);
  });
  it("validateSignature sempre true", () => {
    expect(WebhookHandler.validateSignature({}, undefined, undefined).isValid).toBe(true);
  });
});
