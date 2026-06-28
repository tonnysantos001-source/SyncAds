import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/picpay/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/picpay/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/picpay/v1/webhook.ts";

const validCreds = { picpayToken: "picpay_token_xyz", sellerToken: "sell_12345" };
const validRequest: any = {
  orderId: "ORDER-PIC-001", amount: 150.00, paymentMethod: "pix",
  customer: { name: "Carlos Silva", email: "carlos@example.com", phone: "11988887777", document: "11122233344" },
};

describe("PicPay Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita picpayToken vazio", () => expect(Validator.validateCredentials({ ...validCreds, picpayToken: "" }).isValid).toBe(false));
  it("rejeita sellerToken vazio", () => expect(Validator.validateCredentials({ ...validCreds, sellerToken: "" }).isValid).toBe(false));
  it("aceita pedido válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
  it("rejeita sem orderId", () => expect(Validator.validatePaymentRequest({ ...validRequest, orderId: "" }).isValid).toBe(false));
  it("rejeita sem documento", () => {
    const r = Validator.validatePaymentRequest({ ...validRequest, customer: { ...validRequest.customer, document: "" } });
    expect(r.isValid).toBe(false);
  });
});

describe("PicPay Mapper", () => {
  it("converte amount para valor decimal", () => {
    const p = Mapper.toCreatePaymentPayload(validRequest);
    expect(p.value).toBe(150.00);
  });
  it("mapeia status PicPay: paid → approved", () => expect(Mapper.toPaymentStatus("paid")).toBe("approved"));
  it("mapeia status PicPay: cancelled → cancelled", () => expect(Mapper.toPaymentStatus("cancelled")).toBe("cancelled"));
  it("mapeia resposta de criação com sucesso", () => {
    const api = { referenceId: "ord_555", status: "created", paymentUrl: "https://picpay.com/pay/ord_555" };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-PIC-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("pending");
    expect(r.paymentUrl).toBe("https://picpay.com/pay/ord_555");
  });
});

describe("PicPay WebhookHandler", () => {
  it("processa webhook de transação paga", () => {
    const payload = { referenceId: "ord_555", status: "paid" };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("ord_555");
  });
  it("rejeita webhook sem referenceId", () => {
    expect(WebhookHandler.handle({ status: "paid" }).success).toBe(false);
  });
  it("validateSignature sempre true", () => {
    expect(WebhookHandler.validateSignature({}, undefined, undefined).isValid).toBe(true);
  });
});
