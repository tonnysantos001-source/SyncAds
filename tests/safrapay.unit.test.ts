import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/safrapay/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/safrapay/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/safrapay/v1/webhook.ts";

const validCreds = { clientId: "client_test_abc", clientSecret: "secret_test_xyz" };
const validRequest: any = {
  orderId: "ORDER-SP-001", amount: 120.00, paymentMethod: "credit_card", installments: 2,
  customer: { name: "Pedro Lima", email: "pedro@example.com", phone: "11966554433", document: "33344455566" },
  card: { number: "4111111111111111", holderName: "PEDRO LIMA", expMonth: "6", expYear: "2028", cvv: "321" },
};

describe("SafraPay Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita clientId vazio", () => {
    const r = Validator.validateCredentials({ ...validCreds, clientId: "" });
    expect(r.isValid).toBe(false);
    expect(r.errors.some(e => e.includes("clientId"))).toBe(true);
  });
  it("rejeita clientSecret vazio", () => expect(Validator.validateCredentials({ ...validCreds, clientSecret: "" }).isValid).toBe(false));
  it("aceita pedido de cartão válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
  it("rejeita pedido sem documento", () => {
    const r = Validator.validatePaymentRequest({ ...validRequest, customer: { ...validRequest.customer, document: "" } });
    expect(r.isValid).toBe(false);
  });
  it("rejeita pedido de cartão sem número do cartão", () => {
    const r = Validator.validatePaymentRequest({ ...validRequest, card: { ...validRequest.card, number: "" } });
    expect(r.isValid).toBe(false);
  });
});

describe("SafraPay Mapper", () => {
  it("converte amount para centavos", () => {
    const p = Mapper.toPaymentPayload(validRequest, undefined, undefined);
    expect(p.amount).toBe(12000);
  });
  it("remove formatação do documento", () => {
    const req = { ...validRequest, customer: { ...validRequest.customer, document: "333.444.555-66" } };
    const p = Mapper.toPaymentPayload(req, undefined, undefined);
    expect(p.customer.document).toBe("33344455566");
  });
  it("formata mês de expiração com 2 dígitos", () => {
    const p = Mapper.toPaymentPayload(validRequest, undefined, undefined);
    expect(p.card?.exp_month).toBe("06");
  });
  it("mapeia resposta de pagamento aprovado", () => {
    const api = { id: "pay_abc123", reference_id: "ORDER-SP-001", status: "authorized", amount: 12000, authorization_code: "AUTH456" };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-SP-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.gatewayTransactionId).toBe("pay_abc123");
  });
  it("mapeia resposta com erro", () => {
    const api = { error: { code: "DECLINED", message: "Cartão recusado" } };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-SP-001");
    expect(r.success).toBe(false);
    expect(r.status).toBe("failed");
  });
  it("mapeia resposta PIX com qrCode", () => {
    const api = { id: "pix_abc", reference_id: "ORD-001", status: "pending", amount: 12000, pix: { qr_code: "00020126...", qr_code_url: "https://api.safra/qr.png" } };
    const r = Mapper.toPaymentResponse(api as any, "ORD-001");
    expect(r.qrCode).toBe("00020126...");
    expect(r.pixData?.qrCodeImage).toContain("safra");
  });
  it("'authorized' → 'approved'", () => expect(Mapper.toPaymentStatus("authorized")).toBe("approved"));
  it("'declined' → 'failed'", () => expect(Mapper.toPaymentStatus("declined")).toBe("failed"));
  it("'voided' → 'cancelled'", () => expect(Mapper.toPaymentStatus("voided")).toBe("cancelled"));
  it("'refunded' → 'refunded'", () => expect(Mapper.toPaymentStatus("refunded")).toBe("refunded"));
});

describe("SafraPay WebhookHandler", () => {
  it("processa webhook de pagamento pago", () => {
    const payload = { id: "pay_abc123", reference_id: "ORDER-SP-001", status: "paid" };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("ORDER-SP-001");
  });
  it("rejeita webhook sem id", () => {
    expect(WebhookHandler.handle({ status: "paid" }).success).toBe(false);
  });
  it("rejeita webhook sem status", () => {
    expect(WebhookHandler.handle({ id: "pay_123" }).success).toBe(false);
  });
  it("validateSignature sempre true", () => {
    expect(WebhookHandler.validateSignature({}, undefined, undefined).isValid).toBe(true);
  });
});
