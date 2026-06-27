import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/openpix/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/openpix/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/openpix/v1/webhook.ts";

const validCredentials = { appId: "Q2xpZW50X0lkOkNsaWVudF9TZWNyZXQ=" };

const validRequest: any = {
  orderId: "ORDER-OP-001",
  amount: 49.90,
  paymentMethod: "pix",
  customer: {
    name: "Carlos Mendes",
    email: "carlos@example.com",
    phone: "11977665544",
    document: "11122233344",
  },
  items: [{ name: "Assinatura Mensal", unitPrice: 49.90, quantity: 1 }],
};

describe("OpenPix Validator", () => {
  it("aceita credenciais válidas", () => {
    const r = Validator.validateCredentials(validCredentials);
    expect(r.isValid).toBe(true);
  });

  it("rejeita appId vazio", () => {
    const r = Validator.validateCredentials({ appId: "" });
    expect(r.isValid).toBe(false);
    expect(r.errors.some((e) => e.includes("appId"))).toBe(true);
  });

  it("rejeita pedido sem orderId", () => {
    const r = Validator.validatePaymentRequest({ ...validRequest, orderId: "" });
    expect(r.isValid).toBe(false);
  });

  it("rejeita pedido com amount zero", () => {
    const r = Validator.validatePaymentRequest({ ...validRequest, amount: 0 });
    expect(r.isValid).toBe(false);
  });

  it("rejeita pedido com email inválido", () => {
    const r = Validator.validatePaymentRequest({
      ...validRequest, customer: { ...validRequest.customer, email: "invalido" },
    });
    expect(r.isValid).toBe(false);
  });

  it("aceita pedido válido", () => {
    const r = Validator.validatePaymentRequest(validRequest);
    expect(r.isValid).toBe(true);
  });
});

describe("OpenPix Mapper", () => {
  it("monta payload correto com valor em centavos", () => {
    const payload = Mapper.toChargePayload(validRequest);
    expect(payload.correlationID).toBe("ORDER-OP-001");
    expect(payload.value).toBe(4990); // R$49,90 → 4990 centavos
    expect(payload.customer?.name).toBe("Carlos Mendes");
    expect(payload.customer?.phone).toMatch(/^\+55/);
    expect(payload.expiresIn).toBe(3600);
  });

  it("adiciona +55 ao telefone sem código de país", () => {
    const payload = Mapper.toChargePayload(validRequest);
    expect(payload.customer?.phone).toBe("+5511977665544");
  });

  it("mapeia resposta de criação de cobrança com sucesso", () => {
    const apiResponse = {
      charge: {
        correlationID: "ORDER-OP-001",
        value: 4990,
        status: "ACTIVE",
        identifier: "charge_abc123",
        qrCodeImage: "https://api.openpix.com.br/qr/charge_abc123.png",
        brCode: "00020126580014br.gov.bcb.pix0136abc@openpix",
        paymentLinkUrl: "https://openpix.com.br/pay/charge_abc123",
        expiresDate: "2025-12-31T23:59:59Z",
      },
    };
    const result = Mapper.toPaymentResponse(apiResponse as any, "ORDER-OP-001");
    expect(result.success).toBe(true);
    expect(result.status).toBe("pending");
    expect(result.qrCode).toContain("00020126");
    expect(result.pixData?.qrCodeImage).toContain("openpix.com.br");
    expect(result.gatewayTransactionId).toBe("charge_abc123");
  });

  it("retorna falha se charge estiver ausente na resposta", () => {
    const result = Mapper.toPaymentResponse({ error: "Invalid appId" } as any, "ORDER-OP-001");
    expect(result.success).toBe(false);
    expect(result.status).toBe("failed");
  });

  it("mapeia status de cobrança consultada", () => {
    const apiResponse = {
      charge: {
        correlationID: "ORDER-OP-001",
        value: 4990,
        status: "COMPLETED",
        identifier: "charge_abc123",
        paidAt: "2025-06-01T10:00:00Z",
        createdAt: "2025-06-01T09:00:00Z",
      },
    };
    const result = Mapper.toPaymentStatusResponse(apiResponse as any);
    expect(result.status).toBe("approved");
    expect(result.amount).toBe(49.90);
  });

  it("'ACTIVE' → 'pending'", () => expect(Mapper.toPaymentStatus("ACTIVE")).toBe("pending"));
  it("'COMPLETED' → 'approved'", () => expect(Mapper.toPaymentStatus("COMPLETED")).toBe("approved"));
  it("'EXPIRED' → 'expired'", () => expect(Mapper.toPaymentStatus("EXPIRED")).toBe("expired"));
  it("'REMOVED_BY_MERCHANT' → 'cancelled'", () => expect(Mapper.toPaymentStatus("REMOVED_BY_MERCHANT")).toBe("cancelled"));
  it("desconhecido → 'pending'", () => expect(Mapper.toPaymentStatus("UNKNOWN")).toBe("pending"));
});

describe("OpenPix WebhookHandler", () => {
  it("processa CHARGE_COMPLETED corretamente", () => {
    const payload = {
      event: "OPENPIX:CHARGE_COMPLETED",
      charge: { correlationID: "ORDER-OP-001", status: "COMPLETED", identifier: "charge_abc123", value: 4990 },
    };
    const result = WebhookHandler.handle(payload as any);
    expect(result.success).toBe(true);
    expect(result.status).toBe("approved");
    expect(result.transactionId).toBe("ORDER-OP-001");
  });

  it("processa CHARGE_EXPIRED corretamente", () => {
    const payload = {
      event: "OPENPIX:CHARGE_EXPIRED",
      charge: { correlationID: "ORDER-OP-002", status: "EXPIRED", identifier: "charge_xyz", value: 1000 },
    };
    const result = WebhookHandler.handle(payload as any);
    expect(result.success).toBe(true);
    expect(result.status).toBe("expired");
  });

  it("rejeita webhook sem campo 'event'", () => {
    const result = WebhookHandler.handle({ charge: { correlationID: "X" } } as any);
    expect(result.success).toBe(false);
    expect(result.processed).toBe(false);
  });

  it("rejeita webhook sem correlationID no charge", () => {
    const result = WebhookHandler.handle({ event: "OPENPIX:CHARGE_COMPLETED", charge: {} } as any);
    expect(result.success).toBe(false);
  });

  it("validateSignature sempre retorna isValid=true", () => {
    expect(WebhookHandler.validateSignature({}, undefined, undefined).isValid).toBe(true);
  });
});
