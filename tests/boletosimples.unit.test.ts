import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/boletosimples/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/boletosimples/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/boletosimples/v1/webhook.ts";

const validCreds = { accessToken: "bs_token_123", userAgent: "suporte@test.com" };
const validRequest: any = {
  orderId: "ORDER-BS-001",
  amount: 110.00,
  paymentMethod: "boleto",
  customer: { name: "Renato Silva", email: "renato@example.com", document: "12345678909" }
};

describe("BoletoSimples Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita accessToken vazio", () => expect(Validator.validateCredentials({ ...validCreds, accessToken: "" }).isValid).toBe(false));
  it("aceita pedido válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
});

describe("BoletoSimples Mapper", () => {
  it("mapeia payload de boleto corretamente", () => {
    const p = Mapper.toBoletoPayload(validRequest);
    expect(p.amount).toBe(110.00);
    expect(p.customer_name).toBe("Renato Silva");
  });
  it("mapeia status BoletoSimples: paid → approved", () => expect(Mapper.toPaymentStatus("paid")).toBe("approved"));
  it("mapeia status BoletoSimples: opened → pending", () => expect(Mapper.toPaymentStatus("opened")).toBe("pending"));
  it("mapeia resposta de criação com sucesso", () => {
    const api = { id: 12345, status: "opened", amount: 110.00, url: "https://boletosimples.com.br/boleto" };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-BS-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("pending");
    expect(r.paymentUrl).toBe("https://boletosimples.com.br/boleto");
  });
});

describe("BoletoSimples WebhookHandler", () => {
  it("processa webhook de status pago", () => {
    const payload = { object: { id: 12345, status: "paid" } };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("12345");
  });
});
