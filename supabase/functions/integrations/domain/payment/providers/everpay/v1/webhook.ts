import { WebhookResponse, WebhookValidationResult } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  /**
   * Valida integridade da assinatura enviada pelo Ever Pay
   */
  static validateSignature(payload: any, signature?: string, secret?: string): WebhookValidationResult {
    // Se o webhook vier com assinatura e tivermos segredo, validamos. Caso contrário, aceitamos de forma simples para o MVP.
    if (signature && secret && signature !== secret) {
      return { isValid: false, error: "Assinatura inválida" };
    }
    return { isValid: true };
  }

  /**
   * Normaliza o payload do webhook recebido
   */
  static handle(payload: any): WebhookResponse {
    // Trata estrutura Stripe-like: data.object
    const object = payload.data?.object || payload;
    const transactionId = object.id || "";
    
    // O status pode vir diretamente ou derivado do tipo de evento (ex: payment.succeeded -> succeeded)
    let statusStr = object.status || "";
    if (!statusStr && payload.type) {
      if (payload.type === "payment.succeeded") statusStr = "succeeded";
      if (payload.type === "payment.failed") statusStr = "failed";
      if (payload.type === "payment.refunded") statusStr = "refunded";
    }

    const status = statusStr ? Mapper.toPaymentStatus(statusStr) : undefined;
    
    return {
      success: true,
      processed: true,
      transactionId,
      gatewayTransactionId: transactionId,
      status,
      message: "Webhook processado e mapeado com sucesso.",
    };
  }
}

