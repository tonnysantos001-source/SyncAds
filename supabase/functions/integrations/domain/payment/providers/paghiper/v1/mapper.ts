import {
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  PaymentStatusResponse,
} from "../../../../../types.ts";
import {
  CreateTransactionPayload,
  PagHiperItem,
  CreateTransactionResponse,
  StatusResponse,
} from "./types.ts";

export class Mapper {
  /**
   * Converte PaymentRequest em payload PagHiper para Boleto ou PIX.
   * Valores devem ser em CENTAVOS no PagHiper.
   */
  static toTransactionPayload(
    request: PaymentRequest,
    credentials: { apiKey: string; token: string },
    notificationUrl?: string
  ): CreateTransactionPayload {
    const docClean = (request.customer.document || "").replace(/\D/g, "");
    const phoneClean = (request.customer.phone || "").replace(/\D/g, "");

    // Montar items — mínimo 1 item obrigatório
    const items: PagHiperItem[] =
      request.items && request.items.length > 0
        ? request.items.map((item, idx) => ({
            item_id: String(idx + 1),
            description: item.name || "Produto",
            quantity: item.quantity || 1,
            price_cents: Math.round((item.unitPrice || request.amount) * 100),
          }))
        : [
            {
              item_id: "1",
              description: `Pedido ${request.orderId}`,
              quantity: 1,
              price_cents: Math.round(request.amount * 100),
            },
          ];

    return {
      apiKey: credentials.apiKey,
      token: credentials.token,
      order_id: request.orderId,
      payer_email: request.customer.email,
      payer_name: request.customer.name,
      payer_cpf_cnpj: docClean,
      payer_phone: phoneClean || undefined,
      days_due_date: 2, // Mínimo 2 dias para boleto
      notification_url: notificationUrl,
      items,
    };
  }

  /**
   * Converte a resposta de criação de boleto para PaymentResponse.
   */
  static toBoletoResponse(
    apiResponse: CreateTransactionResponse,
    orderId: string
  ): PaymentResponse {
    const req = apiResponse.create_request;
    if (!req || req.result !== "success") {
      return {
        success: false,
        status: "failed",
        message: req?.response_message || "PagHiper rejeitou a criação do boleto.",
        errorCode: "BOLETO_ERROR",
      };
    }

    return {
      success: true,
      transactionId: orderId,
      gatewayTransactionId: req.transaction_id,
      status: Mapper.toPaymentStatus(req.status),
      paymentUrl: req.bank_slip?.url_slip,
      redirectUrl: req.bank_slip?.url_slip,
      barcodeNumber: req.bank_slip?.digitable_line,
      digitableLine: req.bank_slip?.digitable_line,
      qrCode: req.pix_code?.emv,
      pixData: req.pix_code
        ? {
            qrCode: req.pix_code.emv,
            qrCodeImage: req.pix_code.qrcode_image_url,
            amount: Number(req.value_cents) / 100,
          }
        : undefined,
      expiresAt: req.due_date,
      message: "Boleto PagHiper gerado com sucesso.",
      raw: apiResponse,
    };
  }

  /**
   * Converte a resposta de criação de PIX para PaymentResponse.
   */
  static toPixResponse(
    apiResponse: CreateTransactionResponse,
    orderId: string
  ): PaymentResponse {
    const req = apiResponse.pix_create_request;
    if (!req || req.result !== "success") {
      return {
        success: false,
        status: "failed",
        message: req?.response_message || "PagHiper rejeitou a criação do PIX.",
        errorCode: "PIX_ERROR",
      };
    }

    return {
      success: true,
      transactionId: orderId,
      gatewayTransactionId: req.transaction_id,
      status: Mapper.toPaymentStatus(req.status),
      qrCode: req.pix_code?.emv,
      pixData: req.pix_code
        ? {
            qrCode: req.pix_code.emv,
            qrCodeImage: req.pix_code.qrcode_image_url,
            amount: 0,
          }
        : undefined,
      message: "PIX PagHiper gerado com sucesso.",
      raw: apiResponse,
    };
  }

  /**
   * Converte a resposta de status para PaymentStatusResponse.
   */
  static toPaymentStatusResponse(apiResponse: StatusResponse): PaymentStatusResponse {
    const req = apiResponse.status_request;
    if (!req) throw new Error("Resposta de status inválida da PagHiper.");

    return {
      transactionId: req.order_id,
      gatewayTransactionId: req.transaction_id,
      status: Mapper.toPaymentStatus(req.status),
      amount: Number(req.value_cents) / 100,
      currency: "BRL",
      paymentMethod: "boleto",
      createdAt: req.created_date,
      updatedAt: req.status_date,
    };
  }

  /**
   * Normaliza os status da PagHiper para o padrão interno.
   * Status PagHiper: "pending", "reserved", "completed", "canceled", "refunded", "processing"
   */
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      pending: "pending",
      reserved: "processing",
      processing: "processing",
      completed: "approved",
      paid: "approved",
      success: "approved",
      confirmed: "approved",
      canceled: "cancelled",
      cancelled: "cancelled",
      refunded: "refunded",
      failed: "failed",
      error: "failed",
      expired: "expired",
    };
    return map[status?.toLowerCase()] || "pending";
  }
}
