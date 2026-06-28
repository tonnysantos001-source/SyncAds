import { PaymentRequest, PaymentResponse, PaymentStatusResponse } from "../../../../../types.ts";
import { TransactionPayload } from "./types.ts";

export class Mapper {
  static toCreateTransactionPayload(request: PaymentRequest): TransactionPayload {
    return {
      orderId: request.orderId,
      amount: Math.round(request.amount * 100), // convert to cents
      paymentMethod: request.paymentMethod,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: request.customer.document
      }
    };
  }

  static toPaymentStatus(status: string): string {
    const map: Record<string, string> = {
      paid: "approved",
      approved: "approved",
      succeeded: "approved",
      pending: "pending",
      failed: "failed",
      declined: "failed",
      canceled: "cancelled",
      refunded: "refunded"
    };
    return map[status?.toLowerCase()] || "pending";
  }

  static toPaymentResponse(apiResponse: any, orderId: string): PaymentResponse {
    const status = this.toPaymentStatus(apiResponse.status);
    return {
      success: status === "approved" || status === "pending",
      transactionId: orderId,
      gatewayTransactionId: apiResponse.id?.toString() || apiResponse.transactionId?.toString(),
      status: status as any,
      message: apiResponse.message || "Payment processed by Velipag",
      qrCode: apiResponse.qrCode,
      paymentUrl: apiResponse.paymentUrl,
      raw: apiResponse
    };
  }

  static toPaymentStatusResponse(apiResponse: any): PaymentStatusResponse {
    return {
      transactionId: apiResponse.orderId || "",
      gatewayTransactionId: apiResponse.id?.toString() || apiResponse.transactionId?.toString() || "",
      status: this.toPaymentStatus(apiResponse.status) as any,
      amount: apiResponse.amount ? apiResponse.amount / 100 : 0,
      currency: apiResponse.currency || "BRL",
      createdAt: apiResponse.createdAt || new Date().toISOString(),
      updatedAt: apiResponse.updatedAt || new Date().toISOString()
    };
  }
}
