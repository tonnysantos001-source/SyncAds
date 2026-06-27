import { WebhookResponse } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  static validateSignature(_payload: any, _sig: any, _secret: any): { isValid: boolean; error?: string } {
    return { isValid: true };
  }

  /**
   * MaxiPago envia notificações XML via webhook configurado no portal.
   */
  static handle(payload: any): WebhookResponse {
    try {
      // Payload pode vir como XML string ou objeto já parseado
      const xmlText = typeof payload === "string" ? payload : JSON.stringify(payload);
      const parsed = Mapper.parseXmlResponse(xmlText);

      const transactionId = parsed.orderID || parsed.referenceNum;
      if (!transactionId) {
        return { success: false, processed: false, message: "Webhook MaxiPago: orderID ausente." };
      }

      const status = Mapper.toPaymentStatus(parsed.responseCode || "999");
      return {
        success: true,
        processed: true,
        transactionId,
        status,
        message: `Webhook MaxiPago processado. Código: ${parsed.responseCode} → ${status}`,
        raw: parsed,
      };
    } catch (err: any) {
      return { success: false, processed: false, message: `Erro webhook MaxiPago: ${err.message}` };
    }
  }
}
