import { PaymentRequest, PaymentResponse, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { PaymentRequestPayload, PaymentResponsePayload } from "./types.ts";

export class Mapper {
  /**
   * Converte a request interna do SyncAds para o formato da API do Ever Pay
   */
  static toPaymentPayload(request: PaymentRequest, cardToken?: string): PaymentRequestPayload {
    const document = request.customer.document.replace(/\D/g, "");
    
    const payload: PaymentRequestPayload = {
      amount: Math.round(request.amount * 100),
      currency: "brl",
      payment_method: cardToken || request.paymentMethod,
      description: `Pedido SyncAds #${request.orderId}`,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: document,
        phone: request.customer.phone ? request.customer.phone.replace(/\D/g, "") : undefined,
      },
    };

    return payload;
  }

  /**
   * Converte a resposta da API do Ever Pay para o formato padronizado do SyncAds
   */
  static toPaymentResponse(response: PaymentResponsePayload): PaymentResponse {
    const isApproved = ["succeeded", "approved", "paid"].includes(response.status?.toLowerCase());
    
    return {
      success: isApproved,
      transactionId: response.id,
      gatewayTransactionId: response.id,
      status: Mapper.toPaymentStatus(response.status),
      qrCode: response.qr_code || response.pix_code,
      paymentUrl: response.payment_url || response.pdf_url,
      barcodeNumber: response.barcode || response.digitable_line,
      message: `Pagamento processado com status: ${response.status}`,
    };
  }

  /**
   * Normaliza status
   */
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      succeeded: "approved",
      approved: "approved",
      paid: "approved",
      pending: "pending",
      processing: "processing",
      rejected: "failed",
      failed: "failed",
      refunded: "refunded",
    };
    return map[status?.toLowerCase()] || "pending";
  }

  /**
   * Normaliza a resposta da consulta de status
   */
  static toPaymentStatusResponse(response: any): PaymentStatusResponse {
    return {
      status: Mapper.toPaymentStatus(response.status),
      gatewayStatus: response.status,
      message: `Consulta realizada com sucesso. Status atual: ${response.status}`,
    };
  }
}

