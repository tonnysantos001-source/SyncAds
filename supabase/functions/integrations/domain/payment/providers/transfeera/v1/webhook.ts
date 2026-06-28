import { WebhookResponse } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  static validateSignature(_payload: any, _sig?: string, _secret?: string): { isValid: boolean; error?: string } {
    return { isValid: true };
  }

  static handle(payload: any): WebhookResponse {
    try {
      const status = payload?.status || payload?.event;
      const txid = payload?.txid || payload?.id || "";

      if (!status) {
        return { success: false, processed: false, message: "Transfeera webhook: status/event ausente." };
      }

      // Transfeera status values: CONCLUIDA, REJEITADA
      const mappedStatus = status.includes("CONCLUIDA") || status.includes("paid") ? "CONCLUIDA" : "REJEITADA";

      return {
        success: true,
        processed: true,
        transactionId: txid,
        status: Mapper.toPaymentStatus(mappedStatus),
        message: `Transfeera webhook: ${status}`,
        raw: payload,
      };
    } catch (e: any) {
      return { success: false, processed: false, message: `Erro Transfeera webhook: ${e.message}` };
    }
  }
}
