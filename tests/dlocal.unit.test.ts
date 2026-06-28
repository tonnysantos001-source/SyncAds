import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/dlocal/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/dlocal/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/dlocal/v1/webhook.ts";

const validCreds = { xLogin: "dl_login_123", xTransKey: "dl_key_123", secretKey: "dl_secret_123" };
const validRequest: any = {
  orderId: "ORDER-DL-001",
  amount: 199.00,
  paymentMethod: "credit_card",
  customer: { name: "John Smith", email: "john@example.com", document: "12345678909" },
  card: { number: "4111111111111111", holderName: "JOHN SMITH", expMonth: "04", expYear: "2031", cvv: "123" }
};

describe("dLocal Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita xLogin vazio", () => expect(Validator.validateCredentials({ ...validCreds, xLogin: "" }).isValid).toBe(false));
  it("rejeita xTransKey vazia", () => expect(Validator.validateCredentials({ ...validCreds, xTransKey: "" }).isValid).toBe(false));
  it("rejeita secretKey vazia", () => expect(Validator.validateCredentials({ ...validCreds, secretKey: "" }).isValid).toBe(false));
  it("aceita pedido válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
});

describe("dLocal Mapper", () => {
  it("mapeia payload de criação corretamente", () => {
    const p = Mapper.toCreatePaymentPayload(validRequest);
    expect(p.amount).toBe(199.00);
    expect(p.payment_method_id).toBe("CARD");
  });
  it("mapeia status dLocal: PAID → approved", () => expect(Mapper.toPaymentStatus("PAID")).toBe("approved"));
  it("mapeia status dLocal: REJECTED → failed", () => expect(Mapper.toPaymentStatus("REJECTED")).toBe("failed"));
  it("mapeia resposta de criação com sucesso", () => {
    const api = { id: "dl_pay_123", status: "PAID", amount: 199.00 };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-DL-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.gatewayTransactionId).toBe("dl_pay_123");
  });
});

describe("dLocal WebhookHandler", () => {
  it("processa webhook de status pago", () => {
    const payload = { status: "PAID", order_id: "ORDER-DL-001" };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("ORDER-DL-001");
  });
});
