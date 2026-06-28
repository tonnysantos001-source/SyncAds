import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/authorizenet/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/authorizenet/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/authorizenet/v1/webhook.ts";

const validCreds = { loginId: "auth_id_123", transactionKey: "auth_key_123" };
const validRequest: any = {
  orderId: "ORDER-AN-001",
  amount: 60.00,
  paymentMethod: "credit_card",
  customer: { name: "Frank White", email: "frank@example.com" },
  card: { number: "4111111111111111", holderName: "FRANK WHITE", expMonth: "09", expYear: "2031", cvv: "123" }
};

describe("AuthorizeNet Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita loginId vazio", () => expect(Validator.validateCredentials({ ...validCreds, loginId: "" }).isValid).toBe(false));
  it("rejeita transactionKey vazia", () => expect(Validator.validateCredentials({ ...validCreds, transactionKey: "" }).isValid).toBe(false));
  it("aceita pedido válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
});

describe("AuthorizeNet Mapper", () => {
  it("mapeia status AuthorizeNet: 1 → approved", () => expect(Mapper.toPaymentStatus("1")).toBe("approved"));
  it("mapeia status AuthorizeNet: 2 → failed", () => expect(Mapper.toPaymentStatus("2")).toBe("failed"));
  it("mapeia resposta de criação com sucesso", () => {
    const api = { messages: { resultCode: "Ok" }, transactionResponse: { responseCode: "1", transId: "an_tx_123" } };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-AN-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.gatewayTransactionId).toBe("an_tx_123");
  });
});

describe("AuthorizeNet WebhookHandler", () => {
  it("processa webhook de captura de pagamento", () => {
    const payload = { eventType: "net.authorize.payment.authcapture.created", payload: { id: "an_tx_123" } };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("an_tx_123");
  });
});
