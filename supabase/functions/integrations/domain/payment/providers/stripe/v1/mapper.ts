import { PaymentRequest, PaymentResponse, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { PaymentResponsePayload } from "./types.ts";

export class Mapper {
  /**
   * Converte a request interna do SyncAds para o formato da API do Stripe
   */
  static toPaymentPayload(request: PaymentRequest): Record<string, any> {
    // Stripe espera valor em centavos
    const amountInCents = Math.round(request.amount * 100);
    const paymentMethodMap: Record<string, string> = {
      credit_card: "card",
      debit_card: "card",
      pix: "pix",
      boleto: "boleto",
    };

    const type = paymentMethodMap[request.paymentMethod] || "card";

    const payload: Record<string, any> = {
      amount: amountInCents,
      currency: "brl",
      "payment_method_types[0]": type,
      "metadata[order_id]": request.orderId,
    };

    return payload;
  }

  /**
   * Converte a resposta da API do Stripe para o formato padronizado do SyncAds
   */
  static toPaymentResponse(response: PaymentResponsePayload): PaymentResponse {
    const rawStatus = response.status || "requires_payment_method";
    const status = this.toPaymentStatus(rawStatus);
    const success = !response.error && ["succeeded", "processing", "requires_action", "requires_capture", "requires_confirmation"].includes(rawStatus);

    const result: PaymentResponse = {
      success,
      transactionId: response.id,
      gatewayTransactionId: response.id,
      status,
      message: response.error?.message || `Transação processada com status: ${rawStatus}`,
    };

    if (response.next_action?.redirect_to_url?.url) {
      result.paymentUrl = response.next_action.redirect_to_url.url;
      result.redirectUrl = response.next_action.redirect_to_url.url;
    }

    return result;
  }

  /**
   * Converte a resposta de status da API do Stripe para resposta de status do SyncAds
   */
  static toPaymentStatusResponse(response: any): PaymentStatusResponse {
    return {
      transactionId: response.id,
      gatewayTransactionId: response.id,
      status: this.toPaymentStatus(response.status),
      amount: (response.amount || 0) / 100,
      currency: response.currency?.toUpperCase() || "BRL",
      paymentMethod: response.payment_method_types?.[0] || "card",
      createdAt: new Date((response.created || 0) * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Normaliza status
   */
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      succeeded: "approved",
      processing: "processing",
      requires_action: "pending",
      requires_confirmation: "pending",
      requires_payment_method: "pending",
      requires_capture: "pending",
      canceled: "cancelled",
      failed: "failed",
    };
    return map[status] || "pending";
  }
}
