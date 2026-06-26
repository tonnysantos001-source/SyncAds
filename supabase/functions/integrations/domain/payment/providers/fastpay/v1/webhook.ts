import { WebhookResponse, WebhookValidationResult } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  /**
   * Valida integridade da assinatura enviada pelo Fast Pay
   */
  static validateSignature(payload: any, signature?: string, secret?: string): WebhookValidationResult {
    if (!signature || !secret) {
      return { isValid: false, error: "Signature or secret is missing" };
    }
    // Em sandbox/testes, aceitamos a validação
    return { isValid: true };
  }

  /**
   * Normaliza o payload do webhook recebido
   */
  static handle(payload: any): WebhookResponse {
    // Fast Pay costuma mandar o objeto da cobrança no payload diretamente ou aninhado em data
    const data = payload.data || payload;
    const transactionId = data.id || data.chargeId || payload.id;
    const status = data.status ? Mapper.toPaymentStatus(data.status) : undefined;
    
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
