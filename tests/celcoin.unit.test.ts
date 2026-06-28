import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/celcoin/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/celcoin/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/celcoin/v1/webhook.ts";

const validCreds = { clientId: "cel_client_123", clientSecret: "cel_secret_123" };
const validRequest: any = {
  orderId: "ORDER-CEL-001",
  amount: 100.00,
  paymentMethod: "pix",
  customer: { name: "Marcos Souza", email: "marcos@example.com" }
};

describe("Celcoin Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita clientId vazio", () => expect(Validator.validateCredentials({ ...validCreds, clientId: "" }).isValid).toBe(false));
  it("rejeita clientSecret vazio", () => expect(Validator.validateCredentials({ ...validCreds, clientSecret: "" }).isValid).toBe(false));
  it("aceita pedido válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
});

describe("Celcoin Mapper", () => {
  it("converte amount corretamente", () => {
    const p = Mapper.toPixRequestPayload(validRequest);
    expect(p.amount).toBe(100.00);
  });
  it("mapeia status Celcoin: PAID → approved", () => expect(Mapper.toPaymentStatus("PAID")).toBe("approved"));
  it("mapeia status Celcoin: CREATED → pending", () => expect(Mapper.toPaymentStatus("CREATED")).toBe("pending"));
  it("mapeia resposta de criação com sucesso", () => {
    const api = { transactionId: 112233, status: "CREATED", amount: 100.00, qrCode: { emv: "emv-payload" } };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-CEL-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("pending");
    expect(r.gatewayTransactionId).toBe("112233");
    expect(r.qrCode).toBe("emv-payload");
  });
});

describe("Celcoin WebhookHandler", () => {
  it("processa webhook de transação paga", () => {
    const payload = { status: "PAID", transactionId: 112233, clientRequestId: "ORDER-CEL-001" };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("ORDER-CEL-001");
  });
});
