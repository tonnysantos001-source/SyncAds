import {
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  PaymentStatusResponse,
} from "../../../../../types.ts";
import { CreateLinkPayload, CreateLinkResponse, PaymentCheckResponse } from "./types.ts";

export class Mapper {
  /**
   * Converte um PaymentRequest no payload do Checkout Integrado InfinitePay.
   * A InfinitePay usa "items" com amount em CENTAVOS e quantity.
   */
  static toCreateLinkPayload(
    request: PaymentRequest,
    handle: string,
    returnUrl?: string
  ): CreateLinkPayload {
    // Montar lista de items — se o request não tiver items, criar um item genérico
    const items = request.items && request.items.length > 0
      ? request.items.map((item) => ({
          name: item.name || "Produto",
          amount: Math.round((item.unitPrice || request.amount) * 100),
          quantity: item.quantity || 1,
        }))
      : [
          {
            name: "Pedido " + request.orderId,
            amount: Math.round(request.amount * 100),
            quantity: 1,
          },
        ];

    // Formatar telefone para +5511999887766
    const rawPhone = (request.customer.phone || "").replace(/\D/g, "");
    const formattedPhone = rawPhone.startsWith("55") ? `+${rawPhone}` : `+55${rawPhone}`;

    return {
      handle,
      order_nsu: request.orderId,
      redirect_url: returnUrl || request.metadata?.returnUrl,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        phone_number: formattedPhone,
      },
      items,
    };
  }

  /**
   * Converte a resposta da criação de link para o padrão interno PaymentResponse.
   */
  static toPaymentResponse(
    apiResponse: CreateLinkResponse,
    orderNsu: string
  ): PaymentResponse {
    return {
      success: true,
      transactionId: orderNsu,
      gatewayTransactionId: apiResponse.id || orderNsu,
      status: "pending",
      paymentUrl: apiResponse.payment_url,
      redirectUrl: apiResponse.payment_url,
      message: "Link de pagamento InfinitePay gerado com sucesso.",
      expiresAt: apiResponse.expires_at,
      raw: apiResponse,
    };
  }

  /**
   * Converte a resposta de payment_check para o padrão interno PaymentStatusResponse.
   */
  static toPaymentStatusResponse(
    apiResponse: PaymentCheckResponse
  ): PaymentStatusResponse {
    return {
      transactionId: apiResponse.order_nsu,
      gatewayTransactionId: apiResponse.order_nsu,
      status: Mapper.toPaymentStatus(apiResponse.status),
      amount: apiResponse.amount ? apiResponse.amount / 100 : 0,
      currency: "BRL",
      paymentMethod: apiResponse.payment_method || "unknown",
      createdAt: apiResponse.created_at || new Date().toISOString(),
      updatedAt: apiResponse.paid_at || new Date().toISOString(),
      paidAt: apiResponse.paid_at,
    };
  }

  /**
   * Normaliza os status da InfinitePay para o padrão interno.
   * Status InfinitePay: "paid" | "pending" | "expired" | "cancelled" | "processing"
   */
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      paid: "approved",
      approved: "approved",
      success: "approved",
      pending: "pending",
      processing: "processing",
      waiting: "pending",
      expired: "expired",
      cancelled: "cancelled",
      canceled: "cancelled",
      failed: "failed",
      error: "failed",
      refunded: "refunded",
    };
    return map[status?.toLowerCase()] || "pending";
  }
}
