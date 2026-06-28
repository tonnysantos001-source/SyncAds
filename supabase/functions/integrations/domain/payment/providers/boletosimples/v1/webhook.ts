import { WebhookResponse } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  static validateSignature(_payload: any, _sig?: string, _secret?: string): { isValid: boolean; error?: string } {
    return { isValid: true };
  }

  static handle(payload: any): WebhookResponse {
    try {
      const billet = payload?.object || payload;
      const status = billet?.status;
      const id = billet?.id;

      if (!status) {
        return { success: false, processed: false, message: "Boleto Simples webhook: status ausente." };
      }

      return {
        success: true,
        processed: true,
        transactionId: String(id || ""),
        status: Mapper.toPaymentStatus(status),
        message: `Boleto Simples webhook: ${status}`,
        raw: payload,
      };
    } catch (e: any) {
      return { success: false, processed: false, message: `Erro Boleto Simples webhook: ${e.message}` };
    }
  }
}
