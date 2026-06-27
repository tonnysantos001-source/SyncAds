import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/cielo/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/cielo/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/cielo/v1/webhook.ts";

const validCreds = { merchantId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", merchantKey: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" };
const validRequest: any = {
  orderId: "ORDER-CL-001", amount: 150.00, paymentMethod: "credit_card", installments: 2,
  customer: { name: "Marcos Pereira", email: "marcos@example.com", phone: "11988887777", document: "11122233344" },
  card: { number: "4111111111111111", holderName: "MARCOS PEREIRA", expMonth: "10", expYear: "2028", cvv: "123" },
};

describe("Cielo Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita merchantId vazio", () => expect(Validator.validateCredentials({ ...validCreds, merchantId: "" }).isValid).toBe(false));
  it("rejeita merchantKey vazio", () => expect(Validator.validateCredentials({ ...validCreds, merchantKey: "" }).isValid).toBe(false));
  it("aceita pedido de cartão válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
  it("rejeita sem orderId", () => expect(Validator.validatePaymentRequest({ ...validRequest, orderId: "" }).isValid).toBe(false));
  it("rejeita cartão sem cvv", () => {
    const r = Validator.validatePaymentRequest({ ...validRequest, card: { ...validRequest.card, cvv: "" } });
    expect(r.isValid).toBe(false);
  });
});

describe("Cielo Mapper", () => {
  it("converte amount para centavos", () => {
    const p = Mapper.toCreateSalePayload(validRequest);
    expect(p.payment.amount).toBe(15000);
  });
  it("detecta bandeiras corretamente", () => {
    expect(Mapper.detectCardBrand("4111111111111111")).toBe("Visa");
    expect(Mapper.detectCardBrand("5111111111111111")).toBe("Master");
    expect(Mapper.detectCardBrand("341111111111111")).toBe("Amex");
    expect(Mapper.detectCardBrand("6061111111111111")).toBe("Hipercard");
  });
  it("mapeia status Cielo: 2 → approved", () => expect(Mapper.toPaymentStatus(2)).toBe("approved"));
  it("mapeia status Cielo: 3 → failed", () => expect(Mapper.toPaymentStatus(3)).toBe("failed"));
  it("mapeia status Cielo: 10 → cancelled", () => expect(Mapper.toPaymentStatus(10)).toBe("cancelled"));
  it("mapeia resposta de criação com sucesso", () => {
    const api = { payment: { paymentId: "pay123", type: "CreditCard", amount: 15000, status: 2, authorizationCode: "AUTH123", returnMessage: "Operation Successful" } };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-CL-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.gatewayTransactionId).toBe("pay123");
  });
});

describe("Cielo WebhookHandler", () => {
  it("processa webhook de transação paga", () => {
    const payload = { PaymentId: "pay123", Status: 2, MerchantOrderId: "ORDER-CL-001" };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("ORDER-CL-001");
  });
  it("rejeita webhook sem PaymentId", () => {
    expect(WebhookHandler.handle({ Status: 2 }).success).toBe(false);
  });
  it("validateSignature sempre true", () => {
    expect(WebhookHandler.validateSignature({}, undefined, undefined).isValid).toBe(true);
  });
});
