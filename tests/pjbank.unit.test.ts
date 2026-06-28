import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/pjbank/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/pjbank/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/pjbank/v1/webhook.ts";

const validCreds = { credencial: "pj_cred_123", chave: "pj_chave_123" };
const validRequest: any = {
  orderId: "ORDER-PJ-001",
  amount: 88.00,
  paymentMethod: "boleto",
  customer: { name: "Guilherme Santos", email: "guilherme@example.com", document: "12345678909" }
};

describe("PJBank Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita credencial vazia", () => expect(Validator.validateCredentials({ ...validCreds, credencial: "" }).isValid).toBe(false));
  it("rejeita chave vazia", () => expect(Validator.validateCredentials({ ...validCreds, chave: "" }).isValid).toBe(false));
  it("aceita pedido válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
});

describe("PJBank Mapper", () => {
  it("mapeia payload de boleto corretamente", () => {
    const p = Mapper.toBoletoPayload(validRequest);
    expect(p.valor).toBe(88.00);
    expect(p.nome_cliente).toBe("Guilherme Santos");
  });
  it("mapeia status PJBank: pago → approved", () => expect(Mapper.toPaymentStatus("pago")).toBe("approved"));
  it("mapeia status PJBank: aguardando → pending", () => expect(Mapper.toPaymentStatus("aguardando")).toBe("pending"));
  it("mapeia resposta de criação com sucesso", () => {
    const api = { status: 201, nosso_numero: "11223344", link_boleto: "https://pjbank.com.br/boleto" };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-PJ-001", "boleto");
    expect(r.success).toBe(true);
    expect(r.status).toBe("pending");
    expect(r.paymentUrl).toBe("https://pjbank.com.br/boleto");
  });
});

describe("PJBank WebhookHandler", () => {
  it("processa webhook de transação paga", () => {
    const payload = { status_pagamento: "pago", nosso_numero: "11223344", numero_pedido: "ORDER-PJ-001" };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("ORDER-PJ-001");
  });
});
