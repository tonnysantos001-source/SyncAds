import {
  PaymentRequest,
  PaymentResponse as InternalPaymentResponse,
  PaymentStatus,
  PaymentStatusResponse,
  PaymentMethod,
} from "../../../../../types.ts";
import { CreateTransactionPayload, PaymentResponse } from "./types.ts";

export class Mapper {
  /**
   * Converte PaymentRequest no payload da Rede.
   */
  static toCreateTransactionPayload(request: PaymentRequest, callbackUrl?: string): CreateTransactionPayload {
    const paymentMethodMap: Record<string, "pix" | "credit" | "debit" | "boleto"> = {
      pix: "pix",
      boleto: "boleto",
      credit_card: "credit",
      debit_card: "debit",
    };

    const kind = paymentMethodMap[request.paymentMethod] || "credit";

    const payload: CreateTransactionPayload = {
      capture: true,
      kind,
      reference: request.orderId,
      amount: Math.round(request.amount * 100),
    };

    if (callbackUrl) {
      payload.urls = [
        {
          kind: "callback",
          url: callbackUrl,
        },
      ];
    }

    if (kind === "pix") {
      payload.pix = {
        expirationTime: 3600,
      };
    } else if (kind === "boleto") {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);
      payload.boleto = {
        expirationDate: dueDate.toISOString().split("T")[0],
        instructions: "Não receber após o vencimento",
      };
    } else if ((kind === "credit" || kind === "debit") && request.card) {
      const expMonth = String(request.card.expMonth || request.card.expiryMonth).padStart(2, "0");
      const expYear = String(request.card.expYear || request.card.expiryYear);

      payload.installments = request.installments || 1;
      payload.cardHolderName = request.card.holderName.toUpperCase();
      payload.cardNumber = request.card.number.replace(/\D/g, "");
      payload.expirationMonth = expMonth;
      payload.expirationYear = expYear;
      payload.securityCode = request.card.cvv;
    }

    return payload;
  }

  /**
   * Converte resposta da Rede para o padrão interno.
   */
  static toPaymentResponse(
    apiResponse: PaymentResponse,
    orderId: string
  ): InternalPaymentResponse {
    if (apiResponse.error || !apiResponse.tid) {
      return {
        success: false,
        status: "failed",
        message: apiResponse.error?.message || apiResponse.message || "Rede recusou a transação.",
        errorCode: apiResponse.returnCode || "PAYMENT_ERROR",
        raw: apiResponse,
      };
    }

    const statusVal = Mapper.toPaymentStatus(apiResponse.returnCode || "01");

    const response: InternalPaymentResponse = {
      success: statusVal === "approved" || statusVal === "pending",
      transactionId: orderId,
      gatewayTransactionId: apiResponse.tid || "",
      status: statusVal,
      message: apiResponse.message || `Rede status: ${apiResponse.returnCode}`,
      raw: apiResponse,
    };

    if (apiResponse.authorizationCode) response.authorizationCode = apiResponse.authorizationCode;
    if (apiResponse.nsu) response.nsu = apiResponse.nsu;
    if (apiResponse.tid) response.tid = apiResponse.tid;

    if (apiResponse.pix?.qrCode) {
      response.qrCode = apiResponse.pix.qrCode;
      response.pixData = {
        qrCode: apiResponse.pix.qrCode,
        qrCodeImage: apiResponse.pix.qrCodeBase64,
        amount: (apiResponse.amount || 0) / 100,
      };
    }

    if (apiResponse.boleto?.url) {
      response.paymentUrl = apiResponse.boleto.url;
      response.redirectUrl = apiResponse.boleto.url;
      response.barcodeNumber = apiResponse.boleto.barcode;
      response.digitableLine = apiResponse.boleto.digitableLine;
      response.expiresAt = apiResponse.boleto.expirationDate;
    }

    return response;
  }

  /**
   * Converte resposta de consulta para PaymentStatusResponse.
   */
  static toPaymentStatusResponse(apiResponse: PaymentResponse): PaymentStatusResponse {
    return {
      transactionId: apiResponse.tid || "",
      gatewayTransactionId: apiResponse.tid || "",
      status: Mapper.toPaymentStatus(apiResponse.returnCode || "01"),
      amount: (apiResponse.amount || 0) / 100,
      currency: "BRL",
      paymentMethod: Mapper.mapRedePaymentMethod(apiResponse.kind || ""),
      createdAt: apiResponse.dateTime || new Date().toISOString(),
      updatedAt: apiResponse.dateTime || new Date().toISOString(),
      paidAt: apiResponse.returnCode === "00" ? apiResponse.dateTime : undefined,
    };
  }

  /**
   * Normaliza os códigos de status da Rede.
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

  /**
   * Mapeia tipo de pagamento da Rede.
   */
  private static mapRedePaymentMethod(kind: string): PaymentMethod {
    const map: Record<string, PaymentMethod> = {
      pix: PaymentMethod.PIX,
      credit: PaymentMethod.CREDIT_CARD,
      debit: PaymentMethod.DEBIT_CARD,
      boleto: PaymentMethod.BOLETO,
    };
    return map[kind?.toLowerCase()] || PaymentMethod.CREDIT_CARD;
  }
}
