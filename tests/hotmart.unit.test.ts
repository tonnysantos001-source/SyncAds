import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/hotmart/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/hotmart/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/hotmart/v1/webhook.ts";

const validCreds = { clientId: "test_clientId_value", clientSecret: "test_clientSecret_value", token: "test_token_value" };
const validRequest: any = {
  orderId: "ORDER-HOTMART-001",
  amount: 150.00,
  paymentMethod: "pix",
  customer: { name: "Maria Santos", email: "maria@example.com", document: "12345678909" }
};

describe("Hotmart Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita credenciais inválidas", () => expect(Validator.validateCredentials({ clientId: "", clientSecret: "val", token: "val" }).isValid).toBe(false));
  it("aceita pedido de pagamento válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
  it("rejeita pedido sem orderId", () => expect(Validator.validatePaymentRequest({ ...validRequest, orderId: "" }).isValid).toBe(false));
});

describe("Hotmart Mapper", () => {
  it("converte valor para centavos", () => {
    const p = Mapper.toCreateTransactionPayload(validRequest);
    expect(p.amount).toBe(15000);
  });
  it("mapeia status de aprovado", () => expect(Mapper.toPaymentStatus("approved")).toBe("approved"));
  it("mapeia status de pendente", () => expect(Mapper.toPaymentStatus("pending")).toBe("pending"));
  it("mapeia resposta de criacao de pagamento", () => {
    const api = { id: "tx_123", status: "approved", amount: 15000 };
    const r = Mapper.toPaymentResponse(api, "ORDER-HOTMART-001");
    expect(r.success).toBe(true);
    expect(r.gatewayTransactionId).toBe("tx_123");
    expect(r.status).toBe("approved");
  });
});

describe("Hotmart WebhookHandler", () => {
  it("processa webhook de aprovacao", () => {
    const payload = { transaction: { orderId: "ORDER-HOTMART-001", status: "approved" } };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.transactionId).toBe("ORDER-HOTMART-001");
  });
});
