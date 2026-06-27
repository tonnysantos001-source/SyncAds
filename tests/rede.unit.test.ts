import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/rede/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/rede/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/rede/v1/webhook.ts";

const validCreds = { clientId: "rede_client_test", clientSecret: "rede_secret_test" };
const validRequest: any = {
  orderId: "ORDER-RD-001", amount: 350.00, paymentMethod: "credit_card", installments: 3,
  customer: { name: "Roberto Dias", email: "roberto@example.com", phone: "11944332211", document: "55566677788" },
  card: { number: "5500000000000004", holderName: "ROBERTO DIAS", expMonth: "9", expYear: "2026", cvv: "789" },
};

describe("Rede Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita clientId vazio", () => expect(Validator.validateCredentials({ ...validCreds, clientId: "" }).isValid).toBe(false));
  it("rejeita clientSecret vazio", () => expect(Validator.validateCredentials({ ...validCreds, clientSecret: "" }).isValid).toBe(false));
  it("aceita pedido válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
  it("rejeita sem amount", () => expect(Validator.validatePaymentRequest({ ...validRequest, amount: 0 }).isValid).toBe(false));
  it("rejeita cartão sem number", () => {
    const r = Validator.validatePaymentRequest({ ...validRequest, card: { ...validRequest.card, number: "" } });
    expect(r.isValid).toBe(false);
  });
});

describe("Rede Mapper", () => {
  it("converte amount para centavos", () => {
    const p = Mapper.toTransactionPayload(validRequest);
    expect(p.amount).toBe(35000);
  });
  it("usa kind 'credit' para cartão de crédito", () => {
    const p = Mapper.toTransactionPayload(validRequest);
    expect(p.kind).toBe("credit");
  });
  it("usa kind 'debit' para cartão de débito", () => {
    const req = { ...validRequest, paymentMethod: "debit_card" };
    const p = Mapper.toTransactionPayload(req);
    expect(p.kind).toBe("debit");
  });
  it("formata mês de expiração com 2 dígitos", () => {
    const p = Mapper.toTransactionPayload(validRequest);
    expect(p.card?.expirationMonth).toBe("09");
  });
  it("torna holderName maiúsculo", () => {
    const p = Mapper.toTransactionPayload({ ...validRequest, card: { ...validRequest.card, holderName: "roberto dias" } });
    expect(p.card?.holderName).toBe("ROBERTO DIAS");
  });
  it("mapeia returnCode '00' → approved", () => {
    const api = { returnCode: "00", returnMessage: "Aprovado", tid: "TXN999", authorizationCode: "AUTH123" };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-RD-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.gatewayTransactionId).toBe("TXN999");
  });
  it("mapeia returnCode diferente de '00' → failed", () => {
    const api = { returnCode: "51", returnMessage: "Crédito insuficiente" };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-RD-001");
    expect(r.success).toBe(false);
    expect(r.status).toBe("failed");
  });
  it("'approved' → 'approved'", () => expect(Mapper.toPaymentStatus("approved")).toBe("approved"));
  it("'denied' → 'failed'", () => expect(Mapper.toPaymentStatus("denied")).toBe("failed"));
  it("'canceled' → 'cancelled'", () => expect(Mapper.toPaymentStatus("canceled")).toBe("cancelled"));
});

describe("Rede WebhookHandler", () => {
  it("processa webhook aprovado", () => {
    const payload = { tid: "TXN001", reference: "ORDER-RD-001", status: "approved" };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("ORDER-RD-001");
  });
  it("rejeita webhook sem reference/tid", () => {
    expect(WebhookHandler.handle({ status: "approved" }).success).toBe(false);
  });
  it("validateSignature sempre true", () => {
    expect(WebhookHandler.validateSignature({}, undefined, undefined).isValid).toBe(true);
  });
});
