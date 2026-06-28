import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/starkbank/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/starkbank/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/starkbank/v1/webhook.ts";

const validCreds = { projectId: "st_proj_123", privateKey: "st_pem_123" };
const validRequest: any = {
  orderId: "ORDER-STB-001",
  amount: 500.00,
  paymentMethod: "pix",
  customer: { name: "Maria Clara", email: "maria@example.com", document: "12345678909" }
};

describe("StarkBank Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita projectId vazio", () => expect(Validator.validateCredentials({ ...validCreds, projectId: "" }).isValid).toBe(false));
  it("rejeita privateKey vazia", () => expect(Validator.validateCredentials({ ...validCreds, privateKey: "" }).isValid).toBe(false));
  it("aceita pedido válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
});

describe("StarkBank Mapper", () => {
  it("converte amount para centavos", () => {
    const p = Mapper.toPixRequestPayload(validRequest);
    expect(p.amount).toBe(50000);
  });
  it("mapeia status StarkBank: paid → approved", () => expect(Mapper.toPaymentStatus("paid")).toBe("approved"));
  it("mapeia status StarkBank: created → pending", () => expect(Mapper.toPaymentStatus("created")).toBe("pending"));
  it("mapeia resposta de criação com sucesso", () => {
    const api = { id: "st_inv_123", status: "created", amount: 50000, brcode: "pix-br-code" };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-STB-001", "pix");
    expect(r.success).toBe(true);
    expect(r.status).toBe("pending");
    expect(r.gatewayTransactionId).toBe("st_inv_123");
    expect(r.qrCode).toBe("pix-br-code");
  });
});

describe("StarkBank WebhookHandler", () => {
  it("processa webhook de transação paga", () => {
    const payload = { event: { log: { type: "paid", invoice: { id: "st_inv_123", tags: ["ORDER-STB-001"], status: "paid" } } } };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("ORDER-STB-001");
  });
});
