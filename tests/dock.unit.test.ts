import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/dock/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/dock/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/dock/v1/webhook.ts";

const validCreds = { clientId: "dk_client_123", clientSecret: "dk_secret_123" };
const validRequest: any = {
  orderId: "ORDER-DK-001",
  amount: 350.00,
  paymentMethod: "pix",
  customer: { name: "Juliana Silva", email: "juliana@example.com", document: "12345678909" }
};

describe("Dock Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita clientId vazio", () => expect(Validator.validateCredentials({ ...validCreds, clientId: "" }).isValid).toBe(false));
  it("rejeita clientSecret vazio", () => expect(Validator.validateCredentials({ ...validCreds, clientSecret: "" }).isValid).toBe(false));
  it("aceita pedido válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
});

describe("Dock Mapper", () => {
  it("mapeia payload de criação de pagamento corretamente", () => {
    const p = Mapper.toCreatePaymentPayload(validRequest);
    expect(p.amount).toBe(350.00);
    expect(p.payment_method).toBe("PIX");
  });
  it("mapeia status Dock: APPROVED → approved", () => expect(Mapper.toPaymentStatus("APPROVED")).toBe("approved"));
  it("mapeia status Dock: PENDING → pending", () => expect(Mapper.toPaymentStatus("PENDING")).toBe("pending"));
  it("mapeia resposta de criação com sucesso", () => {
    const api = { id: "dk_pay_123", status: "PENDING", amount: 350.00, qr_code: "pix-qr-code" };
    const r = Mapper.toPaymentResponse(api as any, "ORDER-DK-001");
    expect(r.success).toBe(true);
    expect(r.status).toBe("pending");
    expect(r.gatewayTransactionId).toBe("dk_pay_123");
    expect(r.qrCode).toBe("pix-qr-code");
  });
});

describe("Dock WebhookHandler", () => {
  it("processa webhook de transação aprovada", () => {
    const payload = { status: "APPROVED", id: "dk_pay_123", external_id: "ORDER-DK-001" };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.status).toBe("approved");
    expect(r.transactionId).toBe("ORDER-DK-001");
  });
});
