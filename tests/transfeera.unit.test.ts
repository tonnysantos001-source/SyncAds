import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/transfeera/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/transfeera/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/transfeera/v1/webhook.ts";

const validCreds = { clientId: "tf_client_123", clientSecret: "tf_secret_123" };
const validRequest: any = {
  orderId: "ORDER-TF-001",
  amount: 25.50,
  paymentMethod: "pix",
  customer: { name: "Eduardo Silva", email: "eduardo@example.com" }
};

describe("Transfeera Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita clientId vazio", () => expect(Validator.validateCredentials({ ...validCreds, clientId: "" }).isValid).toBe(false));
  it("rejeita clientSecret vazio", () => expect(Validator.validateCredentials({ ...validCreds, clientSecret: "" }).isValid).toBe(false));
  it("aceita pedido válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
});

describe("Transfeera Mapper", () => {
  it("mapeia payload de Pix corretamente", () => {
    const p = Mapper.toPixBillingPayload(validRequest);
    expect(p.valor).toBe(25.50);
  });
  it("mapeia status Transfeera: CONCLUIDA → approved", () => expect(Mapper.toPaymentStatus("CONCLUIDA")).toBe("approved"));
  it("mapeia status Transfeera: ATIVA → pending", () => expect(Mapper.toPaymentStatus("ATIVA")).toBe("pending"));
  it("mapeia resposta de criação com sucesso", () => {
    const api = { txid: "tf_tx_123", status: "ATIVA", valor: 25.50, pixCopiaECola: "pix-copia-cola-code" };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-TF-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("pending");
    expect(r.gatewayTransactionId).toBe("tf_tx_123");
    expect(r.qrCode).toBe("pix-copia-cola-code");
  });
});

describe("Transfeera WebhookHandler", () => {
  it("processa webhook de transação concluída", () => {
    const payload = { status: "CONCLUIDA", txid: "tf_tx_123" };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("tf_tx_123");
  });
});
