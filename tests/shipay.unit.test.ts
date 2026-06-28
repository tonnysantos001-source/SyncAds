import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/shipay/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/shipay/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/shipay/v1/webhook.ts";

const validCreds = { accessKey: "sh_access_123", secretKey: "sh_secret_123", clientId: "sh_client_123" };
const validRequest: any = {
  orderId: "ORDER-SH-001",
  amount: 45.90,
  paymentMethod: "pix",
  customer: { name: "Luiza Ferreira", email: "luiza@example.com" }
};

describe("Shipay Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita accessKey vazia", () => expect(Validator.validateCredentials({ ...validCreds, accessKey: "" }).isValid).toBe(false));
  it("rejeita secretKey vazia", () => expect(Validator.validateCredentials({ ...validCreds, secretKey: "" }).isValid).toBe(false));
  it("rejeita clientId vazio", () => expect(Validator.validateCredentials({ ...validCreds, clientId: "" }).isValid).toBe(false));
  it("aceita pedido válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
});

describe("Shipay Mapper", () => {
  it("mapeia payload de Pix corretamente", () => {
    const p = Mapper.toPixBillingPayload(validRequest);
    expect(p.total).toBe(45.90);
  });
  it("mapeia status Shipay: approved → approved", () => expect(Mapper.toPaymentStatus("approved")).toBe("approved"));
  it("mapeia status Shipay: pending → pending", () => expect(Mapper.toPaymentStatus("pending")).toBe("pending"));
  it("mapeia resposta de criação com sucesso", () => {
    const api = { order_id: "sh_ord_123", status: "pending", total: 45.90, qr_code: "pix-qr-code-payload" };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-SH-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("pending");
    expect(r.gatewayTransactionId).toBe("sh_ord_123");
    expect(r.qrCode).toBe("pix-qr-code-payload");
  });
});

describe("Shipay WebhookHandler", () => {
  it("processa webhook de transação paga", () => {
    const payload = { status: "approved", order_id: "sh_ord_123" };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("sh_ord_123");
  });
});
