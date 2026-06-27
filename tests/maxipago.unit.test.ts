import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/maxipago/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/maxipago/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/maxipago/v1/webhook.ts";

const validCredentials = { merchantId: "100", merchantKey: "21212121212121212121212121212121" };

const validRequest: any = {
  orderId: "ORDER-MP-001",
  amount: 250.00,
  paymentMethod: "credit_card",
  installments: 3,
  customer: { name: "Ana Souza", email: "ana@example.com", phone: "11966554433", document: "22233344455" },
  card: { number: "4111111111111111", expMonth: "12", expYear: "2027", cvv: "123", holderName: "ANA SOUZA" },
};

describe("MaxiPago Validator", () => {
  it("aceita credenciais válidas", () => {
    expect(Validator.validateCredentials(validCredentials).isValid).toBe(true);
  });
  it("rejeita merchantId vazio", () => {
    expect(Validator.validateCredentials({ ...validCredentials, merchantId: "" }).isValid).toBe(false);
  });
  it("rejeita merchantKey vazio", () => {
    expect(Validator.validateCredentials({ ...validCredentials, merchantKey: "" }).isValid).toBe(false);
  });
  it("aceita pedido de cartão válido", () => {
    expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true);
  });
  it("rejeita pedido sem número de cartão", () => {
    const r = Validator.validatePaymentRequest({ ...validRequest, card: { ...validRequest.card, number: "" } });
    expect(r.isValid).toBe(false);
  });
  it("rejeita pedido sem CVV", () => {
    const r = Validator.validatePaymentRequest({ ...validRequest, card: { ...validRequest.card, cvv: "" } });
    expect(r.isValid).toBe(false);
  });
});

describe("MaxiPago Mapper", () => {
  it("formata chargeTotal como string com 2 decimais", () => {
    const p = Mapper.toTransactionParams(validRequest, true);
    expect(p.chargeTotal).toBe("250.00");
  });
  it("usa processorID '1' em modo sandbox", () => {
    const p = Mapper.toTransactionParams(validRequest, true);
    expect(p.processorID).toBe("1");
  });
  it("usa processorID '2' em modo produção", () => {
    const p = Mapper.toTransactionParams(validRequest, false);
    expect(p.processorID).toBe("2");
  });
  it("remove espaços do número do cartão", () => {
    const req = { ...validRequest, card: { ...validRequest.card, number: "4111 1111 1111 1111" } };
    const p = Mapper.toTransactionParams(req, true);
    expect(p.card?.number).toBe("4111111111111111");
  });
  it("parseia XML de resposta aprovada", () => {
    const xml = `<transaction-response>
      <orderID>1234567</orderID><referenceNum>ORDER-MP-001</referenceNum>
      <transactionID>TXN001</transactionID><authCode>ABC123</authCode>
      <responseCode>0</responseCode><responseMessage>AUTHORIZED</responseMessage>
    </transaction-response>`;
    const parsed = Mapper.parseXmlResponse(xml);
    expect(parsed.orderID).toBe("1234567");
    expect(parsed.responseCode).toBe("0");
    expect(parsed.authCode).toBe("ABC123");
  });
  it("mapeia responseCode '0' → PaymentResponse aprovado", () => {
    const parsed = { orderID: "123", responseCode: "0", responseMessage: "AUTHORIZED" };
    const result = Mapper.toPaymentResponse(parsed as any, "ORDER-MP-001");
    expect(result.success).toBe(true);
    expect(result.status).toBe("approved");
  });
  it("mapeia responseCode '1024' → PaymentResponse falha", () => {
    const parsed = { orderID: "123", responseCode: "1024", responseMessage: "DECLINED" };
    const result = Mapper.toPaymentResponse(parsed as any, "ORDER-MP-001");
    expect(result.success).toBe(false);
    expect(result.status).toBe("failed");
  });
  it("toPaymentStatus: '0' → approved", () => expect(Mapper.toPaymentStatus("0")).toBe("approved"));
  it("toPaymentStatus: '5' → cancelled", () => expect(Mapper.toPaymentStatus("5")).toBe("cancelled"));
  it("toPaymentStatus: outro → failed", () => expect(Mapper.toPaymentStatus("999")).toBe("failed"));
});

describe("MaxiPago WebhookHandler", () => {
  it("processa XML de webhook aprovado", () => {
    const xml = `<notification><orderID>ORD-001</orderID><responseCode>0</responseCode></notification>`;
    const result = WebhookHandler.handle(xml);
    expect(result.success).toBe(true);
    expect(result.status).toBe("approved");
  });
  it("rejeita webhook sem orderID", () => {
    const result = WebhookHandler.handle("<notification><responseCode>0</responseCode></notification>");
    expect(result.success).toBe(false);
  });
  it("validateSignature sempre true", () => {
    expect(WebhookHandler.validateSignature({}, undefined, undefined).isValid).toBe(true);
  });
});
