import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/paypal/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/paypal/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/paypal/v1/webhook.ts";

const validCreds = { clientId: "paypal_client_id_xyz", clientSecret: "sec_12345" };
const validRequest: any = {
  orderId: "ORDER-PP-001", amount: 150.00, paymentMethod: "credit_card", currency: "USD",
  customer: { name: "Carlos Silva", email: "carlos@example.com", phone: "11988887777", document: "11122233344" },
  card: { number: "4111111111111111", holderName: "CARLOS SILVA", expMonth: "10", expYear: "2029", cvv: "123" },
};

describe("PayPal Validator", () => {
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

describe("PayPal Mapper", () => {
  it("converte amount para string com 2 casas decimais", () => {
    const p = Mapper.toCreateOrderPayload(validRequest);
    expect(p.purchase_units[0].amount.value).toBe("150.00");
  });
  it("mapeia status PayPal: COMPLETED → approved", () => expect(Mapper.toPaymentStatus("COMPLETED")).toBe("approved"));
  it("mapeia status PayPal: VOIDED → cancelled", () => expect(Mapper.toPaymentStatus("VOIDED")).toBe("cancelled"));
  it("mapeia resposta de criação de ordem com redirecionamento de approve", () => {
    const api = { id: "ord_555", status: "CREATED", links: [{ href: "https://paypal.com/approve/ord_555", rel: "approve", method: "GET" }] };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-PP-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("pending");
    expect(r.paymentUrl).toBe("https://paypal.com/approve/ord_555");
  });
});

describe("PayPal WebhookHandler", () => {
  it("processa webhook de captura de pagamento com sucesso", () => {
    const payload = { event_type: "PAYMENT.CAPTURE.COMPLETED", resource: { id: "cap_555" } };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("cap_555");
  });
  it("rejeita webhook sem resource id", () => {
    expect(WebhookHandler.handle({ event_type: "PAYMENT.CAPTURE.COMPLETED" }).success).toBe(false);
  });
  it("validateSignature sempre true", () => {
    expect(WebhookHandler.validateSignature({}, undefined, undefined).isValid).toBe(true);
  });
});
