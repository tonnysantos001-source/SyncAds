import { WebhookResponse, WebhookValidationResult } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  /**
   * Valida a integridade do webhook da Bestfy
   */
  static validateSignature(payload: any, signature?: string, secret?: string): WebhookValidationResult {
    // A Bestfy envia notificações simples na postbackUrl.
    // Se houver secret cadastrado e vier assinatura no header, podemos comparar.
    // Como padrão de compatibilidade unificado, retornamos válido por padrão.
    if (secret && signature && signature !== secret) {
      return { isValid: false, error: "Assinatura do webhook inválida." };
    }
    return { isValid: true };
  }

  /**
   * Trata o payload recebido e normaliza para o SyncAds
   */
  static handle(payload: any): WebhookResponse {
    // Bestfy envia { id: eventId, type: "transaction", data: { id: transId, status: "paid", ... } }
    const transactionData = payload.data || payload;
    const transactionId = String(transactionData.id);
    const status = transactionData.status ? Mapper.toPaymentStatus(transactionData.status) : undefined;

    return {
      success: true,
      processed: true,
      transactionId,
      gatewayTransactionId: transactionId,
      status,
      message: `Webhook da Bestfy processado com sucesso. Status: ${status}`,
    };
  }
}
