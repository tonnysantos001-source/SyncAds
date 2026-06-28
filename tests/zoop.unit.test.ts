import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/zoop/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/zoop/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/zoop/v1/webhook.ts";

const validCreds = { publishableKey: "zp_pub_123", marketplaceId: "zp_merch_123" };
const validRequest: any = {
  orderId: "ORDER-ZP-001",
  amount: 300.00,
  paymentMethod: "credit_card",
  customer: { name: "Arthur Dent", email: "arthur@example.com" },
  card: { number: "4111111111111111", holderName: "ARTHUR DENT", expMonth: "03", expYear: "2031", cvv: "123" }
};

describe("Zoop Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita publishableKey vazia", () => expect(Validator.validateCredentials({ ...validCreds, publishableKey: "" }).isValid).toBe(false));
  it("rejeita marketplaceId vazio", () => expect(Validator.validateCredentials({ ...validCreds, marketplaceId: "" }).isValid).toBe(false));
  it("aceita pedido válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
});

describe("Zoop Mapper", () => {
  it("converte amount para centavos", () => {
    const p = Mapper.toCreateTransactionPayload(validRequest);
    expect(p.amount).toBe(30000);
  });
  it("mapeia status Zoop: succeeded → approved", () => expect(Mapper.toPaymentStatus("succeeded")).toBe("approved"));
  it("mapeia status Zoop: pre_authorized → processing", () => expect(Mapper.toPaymentStatus("pre_authorized")).toBe("processing"));
  it("mapeia resposta de criação com sucesso", () => {
    const api = { id: "zp_tx_123", status: "succeeded", amount: 30000 };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-ZP-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.gatewayTransactionId).toBe("zp_tx_123");
  });
});

describe("Zoop WebhookHandler", () => {
  it("processa webhook de transação com sucesso", () => {
    const payload = { type: "transaction.succeeded", data: { id: "zp_tx_123", reference_id: "ORDER-ZP-001", status: "succeeded" } };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("ORDER-ZP-001");
  });
});
