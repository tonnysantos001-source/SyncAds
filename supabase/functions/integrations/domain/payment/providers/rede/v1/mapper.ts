import { PaymentRequest, PaymentResponse, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { PaymentRequestPayload, PaymentResponsePayload } from "./types.ts";

export class Mapper {
  private static getSupabaseUrl(): string {
    if (typeof Deno !== "undefined") {
      return Deno.env.get("SUPABASE_URL") || "https://ovskepqggmxlfckxqgbr.supabase.co";
    }
    return "https://ovskepqggmxlfckxqgbr.supabase.co";
  }

  /**
   * Converte a request interna do SyncAds para o formato da API da Rede
   */
  static toPaymentPayload(request: PaymentRequest): PaymentRequestPayload {
    const supabaseUrl = this.getSupabaseUrl();
    const centsAmount = Math.round(request.amount * 100);

    let kind: "pix" | "credit" | "debit" | "boleto" = "pix";
    if (request.paymentMethod === "credit_card") {
      kind = "credit";
    } else if (request.paymentMethod === "debit_card") {
      kind = "debit";
    } else if (request.paymentMethod === "boleto") {
      kind = "boleto";
    }

    const payload: PaymentRequestPayload = {
      capture: true,
      kind,
      reference: request.orderId,
      amount: centsAmount,
      urls: [
        {
          kind: "callback",
          url: `${supabaseUrl}/functions/v1/payment-webhook/rede`,
        },
      ],
    };

    if (kind === "pix") {
      payload.pix = {
        expirationTime: 3600,
      };
    } else if ((kind === "credit" || kind === "debit") && request.card) {
      payload.cardHolderName = request.card.holderName;
      payload.cardNumber = request.card.number.replace(/\s/g, "");
      payload.expirationMonth = request.card.expiryMonth.padStart(2, "0");
      payload.expirationYear = request.card.expiryYear.toString();
      payload.securityCode = request.card.cvv;
      if (kind === "credit") {
        payload.installments = request.installments || 1;
      }
    } else if (kind === "boleto") {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);
      payload.boleto = {
        expirationDate: dueDate.toISOString().split("T")[0],
        instructions: "Não receber após o vencimento",
      };
    }

    return payload;
  }

  /**
   * Converte a resposta da API da Rede para o formato padronizado do SyncAds
   */
  static toPaymentResponse(response: PaymentResponsePayload): PaymentResponse {
    const rawStatus = response.returnCode || response.status || "01";
    const status = this.toPaymentStatus(rawStatus);
    const kind = response.kind || "";

    // Para PIX/Boleto, a criação foi ok se tivermos dados retornados ou returnCode for "00"/"01"
    const isSuccess = rawStatus === "00" || ["pix", "boleto"].includes(kind.toLowerCase()) || rawStatus === "01";

    const result: PaymentResponse = {
      success: isSuccess,
      transactionId: response.reference || response.tid,
      gatewayTransactionId: response.tid,
      status,
      message: response.returnMessage || `Transação da Rede processada com código: ${rawStatus}`,
    };

    if (response.authorizationCode) result.authorizationCode = response.authorizationCode;
    if (response.nsu) result.nsu = response.nsu;
    if (response.tid) result.tid = response.tid;

    // Pix
    if (response.pix) {
      result.qrCode = response.pix.qrCode;
      result.qrCodeBase64 = response.pix.qrCodeBase64;
      result.expiresAt = new Date(Date.now() + 3600000).toISOString();
      result.pixData = {
        qrCode: response.pix.qrCode,
        qrCodeBase64: response.pix.qrCodeBase64,
        expiresAt: result.expiresAt,
        amount: response.amount ? response.amount / 100 : 0,
      };
    }

    // Boleto
    if (response.boleto) {
      result.paymentUrl = response.boleto.url;
      result.barcodeNumber = response.boleto.barcode;
      result.digitableLine = response.boleto.digitableLine;
      result.expiresAt = response.boleto.expirationDate;
      result.boletoData = {
        boletoUrl: response.boleto.url,
        barcode: response.boleto.barcode || "",
        digitableLine: response.boleto.digitableLine || "",
        dueDate: response.boleto.expirationDate || "",
        amount: response.amount ? response.amount / 100 : 0,
      };
    }

    return result;
  }

  /**
   * Converte a resposta de status da API da Rede para resposta de status do SyncAds
   */
  static toPaymentStatusResponse(response: any): PaymentStatusResponse {
    const rawKind = response.kind || "credit";
    let method: any = "credit_card";
    if (rawKind === "pix") method = "pix";
    else if (rawKind === "debit") method = "debit_card";
    else if (rawKind === "boleto") method = "boleto";

    return {
      transactionId: response.reference || response.tid,
      gatewayTransactionId: response.tid,
      status: this.toPaymentStatus(response.returnCode),
      amount: response.amount ? response.amount / 100 : 0,
      currency: "BRL",
      paymentMethod: method,
      createdAt: response.dateTime || new Date().toISOString(),
      updatedAt: response.dateTime || new Date().toISOString(),
      paidAt: response.returnCode === "00" ? response.dateTime : undefined,
    };
  }

  /**
   * Normaliza status
   */
  static toPaymentStatus(returnCode: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      "00": "approved",
      "01": "pending",
      "05": "failed",
      "51": "failed",
      "57": "failed",
      "99": "cancelled",
    };
    return map[returnCode] || "pending";
  }
}
