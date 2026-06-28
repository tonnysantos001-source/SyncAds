import { WebhookResponse } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  static validateSignature(_payload: any, _sig?: string, _secret?: string): { isValid: boolean; error?: string } {
    return { isValid: true };
  }

  static handle(payload: any): WebhookResponse {
    try {
      const status = payload?.status_pagamento || payload?.status;
      const nossoNumero = payload?.nosso_numero || payload?.id_unico || "";
      const pedido = payload?.numero_pedido || payload?.pedido || "";

      if (!status) {
        return { success: false, processed: false, message: "PJBank webhook: status ausente." };
      }

      // PJBank returns "pago" or "vencido"
      const mappedStatus = status === "pago" || status === "1" ? "pago" : status === "vencido" ? "vencido" : "aguardando";

      return {
        success: true,
        processed: true,
        transactionId: pedido || nossoNumero,
        status: Mapper.toPaymentStatus(mappedStatus),
        message: `PJBank webhook: ${status}`,
        raw: payload,
      };
    } catch (e: any) {
      return { success: false, processed: false, message: `Erro PJBank webhook: ${e.message}` };
    }
  }
}
