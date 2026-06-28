import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/klarna/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/klarna/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/klarna/v1/webhook.ts";

const validCreds = { username: "kl_uid_123", password: "kl_password_123" };
const validRequest: any = {
  orderId: "ORDER-KL-001",
  amount: 450.00,
  paymentMethod: "credit_card",
  customer: { name: "David Miller", email: "david@example.com" }
};

describe("Klarna Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita username vazio", () => expect(Validator.validateCredentials({ ...validCreds, username: "" }).isValid).toBe(false));
  it("rejeita password vazio", () => expect(Validator.validateCredentials({ ...validCreds, password: "" }).isValid).toBe(false));
  it("aceita pedido de pagamento válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
});

describe("Klarna Mapper", () => {
  it("converte amount para centavos", () => {
    const p = Mapper.toCreateSessionPayload(validRequest);
    expect(p.order_amount).toBe(45000);
  });
  it("mapeia status Klarna: AUTHORIZED → approved", () => expect(Mapper.toPaymentStatus("AUTHORIZED")).toBe("approved"));
  it("mapeia status Klarna: CANCELLED → cancelled", () => expect(Mapper.toPaymentStatus("CANCELLED")).toBe("cancelled"));
  it("mapeia resposta de criação de sessão com sucesso", () => {
    const api = { session_id: "kl_sess_123", client_token: "kl_token_abc" };
    const r = Mapper.sessionToPaymentResponse(api as any, "ORDER-KL-001");
    expect(r.success).toBe(true);
    expect(r.gatewayTransactionId).toBe("kl_sess_123");
  });
});

describe("Klarna WebhookHandler", () => {
  it("processa webhook de pedido aceito", () => {
    const payload = { event_type: "ORDER_ACCEPTED", order: { merchant_reference1: "ORDER-KL-001", order_id: "kl_order_123", status: "AUTHORIZED" } };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("ORDER-KL-001");
  });
});
