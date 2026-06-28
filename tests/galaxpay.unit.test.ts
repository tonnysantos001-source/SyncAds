import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/galaxpay/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/galaxpay/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/galaxpay/v1/webhook.ts";

const validCreds = { galaxId: "gp_id_123", galaxHash: "gp_hash_123" };
const validRequest: any = {
  orderId: "ORDER-GP-001",
  amount: 75.00,
  paymentMethod: "pix",
  customer: { name: "Julia Santos", email: "julia@example.com", document: "12345678909" }
};

describe("GalaxPay Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita galaxId vazio", () => expect(Validator.validateCredentials({ ...validCreds, galaxId: "" }).isValid).toBe(false));
  it("rejeita galaxHash vazio", () => expect(Validator.validateCredentials({ ...validCreds, galaxHash: "" }).isValid).toBe(false));
  it("aceita pedido válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
});

describe("GalaxPay Mapper", () => {
  it("converte amount para centavos", () => {
    const p = Mapper.toCreateTransactionPayload(validRequest);
    expect(p.value).toBe(7500);
  });
  it("mapeia status GalaxPay: payedPix → approved", () => expect(Mapper.toPaymentStatus("payedPix")).toBe("approved"));
  it("mapeia status GalaxPay: waitingPayment → pending", () => expect(Mapper.toPaymentStatus("waitingPayment")).toBe("pending"));
  it("mapeia resposta de criação com sucesso", () => {
    const api = { galaxPayId: 998877, status: "waitingPayment", value: 7500 };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-GP-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("pending");
    expect(r.gatewayTransactionId).toBe("998877");
  });
});

describe("GalaxPay WebhookHandler", () => {
  it("processa webhook de transação paga", () => {
    const payload = { Transaction: { myId: "ORDER-GP-001", status: "payedPix", id: 998877 } };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("ORDER-GP-001");
  });
});
