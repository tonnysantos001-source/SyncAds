import {
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  PaymentStatusResponse,
} from "../../../../../types.ts";
import { CreateSalePayload, CreateSaleResponse, QuerySaleResponse } from "./types.ts";

export class Mapper {
  /**
   * Converte PaymentRequest no payload da Cielo API 3.0.
   */
  static toCreateSalePayload(request: PaymentRequest): CreateSalePayload {
    const isDebit = request.paymentMethod === "debit_card";
    const isPix = request.paymentMethod === "pix";
    const isBoleto = request.paymentMethod === "boleto";

    let type: "CreditCard" | "DebitCard" | "Boleto" | "Pix" = "CreditCard";
    if (isDebit) type = "DebitCard";
    else if (isPix) type = "Pix";
    else if (isBoleto) type = "Boleto";

    const docClean = (request.customer.document || "").replace(/\D/g, "");
    const docType = docClean.length > 11 ? "CNPJ" : "CPF";

    const payload: CreateSalePayload = {
      merchantOrderId: request.orderId,
      customer: {
        name: request.customer.name,
        email: request.customer.email || undefined,
        identity: docClean || undefined,
        identityType: docClean ? (docType as any) : undefined,
      },
      payment: {
        type,
        amount: Math.round(request.amount * 100),
        installments: request.installments || 1,
        softDescriptor: `Ped ${request.orderId}`.substring(0, 13), // Máximo 13 caracteres na Cielo
        capture: true, // Captura automática por padrão
      },
    };

    // Mapear cartão de crédito ou débito
    if (request.card && (type === "CreditCard" || type === "DebitCard")) {
      const cardBrand = Mapper.detectCardBrand(request.card.number);
      payload.payment.creditCard = {
        cardNumber: request.card.number.replace(/\D/g, ""),
        holder: request.card.holderName.toUpperCase(),
        expirationDate: `${String(request.card.expMonth).padStart(2, "0")}/${request.card.expYear}`,
        securityCode: request.card.cvv,
        brand: cardBrand,
      };
    }

    return payload;
  }

  /**
   * Detecta a bandeira do cartão simplificadamente pelo prefixo do número.
   */
  static detectCardBrand(cardNumber: string): string {
    const clean = cardNumber.replace(/\D/g, "");
    if (clean.startsWith("4")) return "Visa";
    if (/^(5[1-5]|2[2-7])/.test(clean)) return "Master";
    if (/^(34|37)/.test(clean)) return "Amex";
    if (/^(6011|622|64|65)/.test(clean)) return "Discover";
    if (/^(3841|6061)/.test(clean)) return "Hipercard";
    if (/^(50|60|63|65)/.test(clean)) return "Elo";
    if (/^(30[0-5]|[368])/.test(clean)) return "Diners";
    return "Visa"; // Padrão fall-back
  }

  /**
   * Mapeia resposta de criação de cobrança para PaymentResponse.
   */
  static toPaymentResponse(
    apiResponse: CreateSaleResponse,
    orderId: string
  ): PaymentResponse {
    const payment = apiResponse.payment;
    if (!payment) {
      return {
        success: false,
        status: "failed",
        message: "Cielo não retornou objeto de pagamento.",
        errorCode: "NO_PAYMENT_OBJ",
      };
    }

    const statusVal = Mapper.toPaymentStatus(payment.status);
    const success = statusVal === "approved" || statusVal === "pending" || statusVal === "processing";

    const response: PaymentResponse = {
      success,
      transactionId: orderId,
      gatewayTransactionId: payment.paymentId,
      status: statusVal,
      authCode: payment.authorizationCode,
      message: payment.returnMessage || `Status Cielo: ${payment.status}`,
      raw: apiResponse,
    };

    // Caso seja PIX
    if (payment.type === "Pix" || payment.qrCodeString) {
      response.qrCode = payment.qrCodeString;
      response.pixData = {
        qrCode: payment.qrCodeString || "",
        qrCodeImage: payment.qrCode, // A Cielo retorna imagem base64 ou URL em qrCode
        amount: payment.amount / 100,
      };
    }

    // Caso seja Boleto
    const boletoLink = payment.links?.find((l) => l.rel === "boleto" || l.rel === "self");
    if (payment.type === "Boleto" && boletoLink) {
      response.paymentUrl = boletoLink.href;
      response.redirectUrl = boletoLink.href;
    }

    return response;
  }

  /**
   * Converte resposta de consulta para PaymentStatusResponse.
   */
  static toPaymentStatusResponse(apiResponse: QuerySaleResponse): PaymentStatusResponse {
    const payment = apiResponse.payment;
    if (!payment) throw new Error("Transação não encontrada na Cielo.");

    return {
      transactionId: apiResponse.merchantOrderId || "",
      gatewayTransactionId: payment.paymentId,
      status: Mapper.toPaymentStatus(payment.status),
      amount: payment.amount / 100,
      currency: "BRL",
      paymentMethod: payment.type || "unknown",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Normaliza os códigos de status da Cielo API 3.0.
   * Status Cielo:
   * 0 = NotFinished | 1 = Authorized | 2 = PaymentConfirmed | 3 = Denied
   * 10 = Voided | 11 = Refunded | 12 = Pending | 13 = Aborted | 20 = Scheduled
   */
  static toPaymentStatus(status: number): PaymentStatus {
    switch (status) {
      case 1:
      case 2:
        return "approved";
      case 0:
      case 12:
      case 20:
        return "pending";
      case 3:
      case 13:
        return "failed";
      case 10:
        return "cancelled";
      case 11:
        return "refunded";
      default:
        return "pending";
    }
  }
}
