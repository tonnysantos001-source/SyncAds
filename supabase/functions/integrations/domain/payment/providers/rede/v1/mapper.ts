import { PaymentRequest, PaymentResponse, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { CreateTransactionPayload, TransactionResponse } from "./types.ts";

export class Mapper {
  static toTransactionPayload(request: PaymentRequest): CreateTransactionPayload {
    const isDebit = request.paymentMethod === "debit_card";
    const payload: CreateTransactionPayload = {
      kind: isDebit ? "debit" : "credit",
      reference: request.orderId,
      amount: Math.round(request.amount * 100),
      installments: request.installments || 1,
      capture: true,
      softDescriptor: `Pedido ${request.orderId}`.substring(0, 22),
    };
    if (request.card) {
      payload.card = {
        number: request.card.number.replace(/\D/g, ""),
        expirationMonth: String(request.card.expMonth).padStart(2, "0"),
        expirationYear: String(request.card.expYear),
        securityCode: request.card.cvv,
        holderName: request.card.holderName.toUpperCase(),
      };
    }
    return payload;
  }

  static toPaymentResponse(api: TransactionResponse, orderId: string): PaymentResponse {
    const approved = api.returnCode === "00" || api.status === "approved";
    if (!approved) {
      return { success: false, status: "failed", transactionId: orderId, message: api.returnMessage || "Rede recusou a transação.", errorCode: api.returnCode };
    }
    return {
      success: true, transactionId: orderId,
      gatewayTransactionId: api.tid || api.nsu || orderId,
      status: "approved",
      authCode: api.authorizationCode,
      message: `Rede: ${api.returnMessage || "Aprovado"}`,
      raw: api,
    };
  }

  static toPaymentStatusResponse(api: TransactionResponse): PaymentStatusResponse {
    return {
      transactionId: api.reference || "",
      gatewayTransactionId: api.tid || api.nsu || "",
      status: Mapper.toPaymentStatus(api.status || ""),
      amount: (api.amount || 0) / 100,
      currency: "BRL",
      paymentMethod: api.kind || "credit_card",
      createdAt: api.createdAt || new Date().toISOString(),
      updatedAt: api.createdAt || new Date().toISOString(),
    };
  }

  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      approved: "approved", captured: "approved", authorized: "approved",
      pending: "pending", waiting: "pending",
      canceled: "cancelled", cancelled: "cancelled", voided: "cancelled",
      denied: "failed", failed: "failed", error: "failed",
    };
    return map[status?.toLowerCase()] || "pending";
  }
}
