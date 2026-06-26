import { PaymentRequest, PaymentResponse, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { PaymentRequestPayload, PaymentResponsePayload } from "./types.ts";

export class Mapper {
  /**
   * Converte a request interna do SyncAds para o formato da API do Bynet
   */
  static toPaymentPayload(request: PaymentRequest): PaymentRequestPayload {
    const documentNum = request.customer.document.replace(/\D/g, "");
    const docType = documentNum.length > 11 ? "CNPJ" : "CPF";

    let phone = request.customer.phone ? request.customer.phone.replace(/\D/g, "") : undefined;
    if (phone && phone.length === 11 && !phone.startsWith("55")) {
      phone = "55" + phone;
    }

    let method: "PIX" | "BOLETO" | "CREDIT_CARD" = "PIX";
    if (request.paymentMethod === "boleto") {
      method = "BOLETO";
    } else if (request.paymentMethod === "credit_card") {
      method = "CREDIT_CARD";
    }

    return {
      amount: Math.round(request.amount * 100),
      paymentMethod: method,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: {
          number: documentNum,
          type: docType,
        },
        phone: phone,
        externalRef: request.orderId,
      },
      items: [
        {
          title: "Cobrança SyncAds",
          unitPrice: Math.round(request.amount * 100),
          quantity: 1,
        },
      ],
    };
  }

  /**
   * Converte a resposta da API do Bynet para o formato padronizado do SyncAds
   */
  static toPaymentResponse(response: PaymentResponsePayload): PaymentResponse {
    const isApproved = ["paid", "approved", "completed", "succeeded"].includes(response.status?.toLowerCase());
    
    return {
      success: isApproved,
      transactionId: response.id,
      gatewayTransactionId: response.id,
      status: Mapper.toPaymentStatus(response.status),
      qrCode: response.qrCode,
      paymentUrl: response.checkoutUrl || response.pdfUrl,
      barcodeNumber: response.digitableLine,
      message: `Pagamento processado com status: ${response.status}`,
    };
  }

  /**
   * Normaliza status
   */
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      paid: "approved",
      approved: "approved",
      completed: "approved",
      succeeded: "approved",
      pending: "pending",
      created: "pending",
      processing: "processing",
      failed: "failed",
      rejected: "failed",
      refunded: "refunded",
      reversed: "refunded",
    };
    return map[status?.toLowerCase()] || "pending";
  }

  /**
   * Normaliza a resposta da consulta de status
   */
  static toPaymentStatusResponse(response: any): PaymentStatusResponse {
    const data = response.data || response;
    return {
      status: Mapper.toPaymentStatus(data.status),
      gatewayStatus: data.status,
      message: `Consulta realizada com sucesso. Status atual: ${data.status}`,
    };
  }
}
