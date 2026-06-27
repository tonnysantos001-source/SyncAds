import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/atlaspay/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/atlaspay/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/atlaspay/v1/webhook.ts";

const validCreds = { apiId: "api_id_12345", apiSecret: "sec_key_xyz_777" };
const validRequest: any = {
  orderId: "ORDER-AT-001", amount: 150.00, paymentMethod: "credit_card", installments: 1,
  customer: { name: "Carla Souza", email: "carla@example.com", phone: "11988887777", document: "11122233344" },
  card: { number: "4111111111111111", holderName: "CARLA SOUZA", expMonth: "10", expYear: "2029", cvv: "123" },
};

describe("Atlas Pay Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita apiId vazio", () => expect(Validator.validateCredentials({ ...validCreds, apiId: "" }).isValid).toBe(false));
  it("rejeita apiSecret vazio", () => expect(Validator.validateCredentials({ ...validCreds, apiSecret: "" }).isValid).toBe(false));
  it("aceita pedido de cartão válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
  it("rejeita sem orderId", () => expect(Validator.validatePaymentRequest({ ...validRequest, orderId: "" }).isValid).toBe(false));
  it("rejeita cartão sem cvv", () => {
    const r = Validator.validatePaymentRequest({ ...validRequest, card: { ...validRequest.card, cvv: "" } });
    expect(r.isValid).toBe(false);
  });
});

describe("Atlas Pay Mapper", () => {
  it("converte amount para centavos", () => {
    const p = Mapper.toCreatePaymentPayload(validRequest);
    expect(p.amount).toBe(15000);
  });
  it("mapeia status Atlas Pay: approved → approved", () => expect(Mapper.toPaymentStatus("approved")).toBe("approved"));
  it("mapeia status Atlas Pay: failed → failed", () => expect(Mapper.toPaymentStatus("failed")).toBe("failed"));
  it("mapeia resposta de criação com sucesso", () => {
    const api = { id: "ch_555", reference_id: "ORDER-AT-001", status: "approved", amount: 15000 };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-AT-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.gatewayTransactionId).toBe("ch_555");
  });
});

describe("Atlas Pay WebhookHandler", () => {
  it("processa webhook de transação paga", () => {
    const payload = { id: "ch_555", status: "approved", reference_id: "ORDER-AT-001" };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("ORDER-AT-001");
  });
  it("rejeita webhook sem id", () => {
    expect(WebhookHandler.handle({ status: "approved" }).success).toBe(false);
  });
  it("validateSignature sempre true", () => {
    expect(WebhookHandler.validateSignature({}, undefined, undefined).isValid).toBe(true);
  });
});
