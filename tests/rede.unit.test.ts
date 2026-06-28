import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/rede/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/rede/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/rede/v1/webhook.ts";

const validCreds = { pv: "rede_pv_xyz", token: "sec_12345" };
const validRequest: any = {
  orderId: "ORDER-RE-001", amount: 150.00, paymentMethod: "credit_card", installments: 1,
  customer: { name: "Carlos Silva", email: "carlos@example.com", phone: "11988887777", document: "11122233344" },
  card: { number: "4111111111111111", holderName: "CARLOS SILVA", expMonth: "10", expYear: "2029", cvv: "123" },
};

describe("Rede Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita pv vazio", () => expect(Validator.validateCredentials({ ...validCreds, pv: "" }).isValid).toBe(false));
  it("rejeita token vazio", () => expect(Validator.validateCredentials({ ...validCreds, token: "" }).isValid).toBe(false));
  it("aceita pedido de cartão válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
  it("rejeita sem orderId", () => expect(Validator.validatePaymentRequest({ ...validRequest, orderId: "" }).isValid).toBe(false));
  it("rejeita cartão sem cvv", () => {
    const r = Validator.validatePaymentRequest({ ...validRequest, card: { ...validRequest.card, cvv: "" } });
    expect(r.isValid).toBe(false);
  });
});

describe("Rede Mapper", () => {
  it("converte amount para centavos", () => {
    const p = Mapper.toCreateTransactionPayload(validRequest);
    expect(p.amount).toBe(15000);
  });
  it("mapeia status Rede: 00 → approved", () => expect(Mapper.toPaymentStatus("00")).toBe("approved"));
  it("mapeia status Rede: 05 → failed", () => expect(Mapper.toPaymentStatus("05")).toBe("failed"));
  it("mapeia resposta de criação com sucesso", () => {
    const api = { tid: "tid_555", returnCode: "00", amount: 15000 };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-RE-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.gatewayTransactionId).toBe("tid_555");
  });
});

describe("Rede WebhookHandler", () => {
  it("processa webhook de transação paga", () => {
    const payload = { tid: "tid_555", returnCode: "00" };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("tid_555");
  });
  it("rejeita webhook sem tid", () => {
    expect(WebhookHandler.handle({ returnCode: "00" }).success).toBe(false);
  });
  it("validateSignature sempre true", () => {
    expect(WebhookHandler.validateSignature({}, undefined, undefined).isValid).toBe(true);
  });
});
