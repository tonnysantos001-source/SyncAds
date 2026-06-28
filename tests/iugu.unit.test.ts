import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/iugu/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/iugu/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/iugu/v1/webhook.ts";

const validCreds = { apiToken: "iugu_api_token_xyz", accountId: "acc_12345" };
const validRequest: any = {
  orderId: "ORDER-IU-001", amount: 150.00, paymentMethod: "credit_card", installments: 1,
  customer: { name: "Carlos Silva", email: "carlos@example.com", phone: "11988887777", document: "11122233344" },
  card: { number: "4111111111111111", holderName: "CARLOS SILVA", expMonth: "10", expYear: "2029", cvv: "123" },
};

describe("Iugu Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita apiToken vazio", () => expect(Validator.validateCredentials({ ...validCreds, apiToken: "" }).isValid).toBe(false));
  it("rejeita accountId vazio", () => expect(Validator.validateCredentials({ ...validCreds, accountId: "" }).isValid).toBe(false));
  it("aceita pedido de cartão válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
  it("rejeita sem orderId", () => expect(Validator.validatePaymentRequest({ ...validRequest, orderId: "" }).isValid).toBe(false));
  it("rejeita cartão sem cvv", () => {
    const r = Validator.validatePaymentRequest({ ...validRequest, card: { ...validRequest.card, cvv: "" } });
    expect(r.isValid).toBe(false);
  });
});

describe("Iugu Mapper", () => {
  it("converte amount para centavos no charge payload", () => {
    const p = Mapper.toChargePayload(validRequest, "tok_card_123");
    expect(p.items[0].price_cents).toBe(15000);
  });
  it("converte amount para centavos no invoice payload", () => {
    const p = Mapper.toInvoicePayload({ ...validRequest, paymentMethod: "pix" });
    expect(p.items[0].price_cents).toBe(15000);
  });
  it("mapeia status Iugu: paid → approved", () => expect(Mapper.toPaymentStatus("paid")).toBe("approved"));
  it("mapeia status Iugu: canceled → cancelled", () => expect(Mapper.toPaymentStatus("canceled")).toBe("cancelled"));
  it("mapeia resposta de criação com sucesso (invoice)", () => {
    const api = { id: "inv_555", status: "pending", total_cents: 15000 };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-IU-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("pending");
    expect(r.gatewayTransactionId).toBe("inv_555");
  });
});

describe("Iugu WebhookHandler", () => {
  it("processa webhook de transação paga", () => {
    const payload = { event: "invoice.status_changed", id: "inv_555", status: "paid" };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("inv_555");
  });
  it("rejeita webhook sem id", () => {
    expect(WebhookHandler.handle({ status: "paid" }).success).toBe(false);
  });
  it("validateSignature sempre true", () => {
    expect(WebhookHandler.validateSignature({}, undefined, undefined).isValid).toBe(true);
  });
});
