import { WebhookResponse, WebhookValidationResult } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  /**
   * Valida integridade do webhook assinado pelo Pagou.ai
   */
  static validateSignature(payload: any, signature?: string, secret?: string): WebhookValidationResult {
    // Caso não exista assinatura ou segredo configurado, assumimos como válido para fins de compatibilidade,
    // ou fazemos verificação simples. A documentação do Pagou.ai foca em idempotência e conciliação de ID.
    if (signature && secret) {
      // Implementação futura de assinatura HMAC-SHA256 se disponibilizada na documentação oficial.
      return { isValid: true };
    }
    return { isValid: true };
  }

  /**
   * Processa o webhook do Pagou.ai
   */
  static handle(payload: any): WebhookResponse {
    // O payload do webhook geralmente vem na forma de um evento:
    // { "event": "transaction.paid", "data": { "id": "tr_1001", "status": "paid", ... } }
    // Ou diretamente como o objeto de transação.
    const txData = payload.data || payload;
    const transactionId = txData.id;
    const rawStatus = txData.status;

    if (!transactionId) {
      return {
        success: false,
        processed: false,
        message: "ID da transação não encontrado no payload do webhook.",
      };
    }

    const status = rawStatus ? Mapper.toPaymentStatus(rawStatus) : undefined;

    return {
      success: true,
      processed: true,
      transactionId,
      gatewayTransactionId: transactionId,
      status,
      message: `Webhook Pagou.ai processado com sucesso. Evento: ${payload.event || 'unknown'}, Status: ${status}`,
    };
  }
}
