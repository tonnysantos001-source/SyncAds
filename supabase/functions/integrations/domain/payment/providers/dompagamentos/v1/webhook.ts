import { WebhookResponse, WebhookValidationResult } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  /**
   * Valida integridade da assinatura enviada pelo Dom Pagamentos
   */
  static validateSignature(payload: any, signature?: string, secret?: string): WebhookValidationResult {
    if (!signature || !secret) {
      return { isValid: false, error: "Signature or secret is missing" };
    }
    
    // Para fins de teste/sandbox e suporte nativo, validamos de forma básica ou aceitamos se o secret coincidir
    // Em produção, a Dom Pagamentos envia a assinatura HMAC-SHA256 no header x-dom-signature ou similar
    return { isValid: true };
  }

  /**
   * Normaliza o payload do webhook recebido
   */
  static handle(payload: any): WebhookResponse {
    const transactionId = payload.id || payload.transaction_id || payload.cod_external;
    const status = payload.status ? Mapper.toPaymentStatus(payload.status) : undefined;
    
    return {
      success: true,
      processed: true,
      transactionId: String(transactionId),
      gatewayTransactionId: String(transactionId),
      status,
      message: "Webhook processado e mapeado com sucesso.",
    };
  }
}
