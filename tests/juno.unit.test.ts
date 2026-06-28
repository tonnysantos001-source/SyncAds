import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/juno/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/juno/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/juno/v1/webhook.ts";

const validCreds = { clientId: "jn_client_123", clientSecret: "jn_secret_123", resourceToken: "jn_token_123" };
const validRequest: any = {
  orderId: "ORDER-JN-001",
  amount: 220.00,
  paymentMethod: "boleto",
  customer: { name: "Pedro de Alcantara", email: "pedro@example.com", document: "12345678909" }
};

describe("Juno Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita clientId vazio", () => expect(Validator.validateCredentials({ ...validCreds, clientId: "" }).isValid).toBe(false));
  it("rejeita clientSecret vazio", () => expect(Validator.validateCredentials({ ...validCreds, clientSecret: "" }).isValid).toBe(false));
  it("rejeita resourceToken vazio", () => expect(Validator.validateCredentials({ ...validCreds, resourceToken: "" }).isValid).toBe(false));
  it("aceita pedido válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
});

describe("Juno Mapper", () => {
  it("mapeia payload de criação corretamente", () => {
    const p = Mapper.toChargePayload(validRequest);
    expect(p.charge.amount).toBe(220.00);
    expect(p.charge.paymentTypes).toEqual(["BOLETO"]);
  });
  it("mapeia status Juno: PAID → approved", () => expect(Mapper.toPaymentStatus("PAID")).toBe("approved"));
  it("mapeia status Juno: ACTIVE → pending", () => expect(Mapper.toPaymentStatus("ACTIVE")).toBe("pending"));
  it("mapeia resposta de criação com sucesso", () => {
    const api = { id: "chr_123", code: "JN-001", status: "ACTIVE", amount: 220.00 };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-JN-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("pending");
    expect(r.gatewayTransactionId).toBe("chr_123");
  });
});

describe("Juno WebhookHandler", () => {
  it("processa webhook de pagamento", () => {
    const payload = { eventType: "CHARGE_STATUS_CHANGED_PAID", data: { charge: { id: "chr_123", code: "JN-001" } } };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("JN-001");
  });
});
