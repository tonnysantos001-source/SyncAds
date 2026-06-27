import {
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  PaymentStatusResponse,
} from "../../../../../types.ts";
import { TransactionParams, TransactionResponse } from "./types.ts";
import { config } from "./config.ts";

export class Mapper {
  /**
   * Converte PaymentRequest no payload de transação MaxiPago.
   * O valor deve ser formatado como string "10.00" (não centavos).
   */
  static toTransactionParams(
    request: PaymentRequest,
    isTestMode: boolean
  ): TransactionParams {
    const chargeTotal = request.amount.toFixed(2);
    const processorID = isTestMode ? config.processorID.sandbox : config.processorID.production;

    const params: TransactionParams = {
      referenceNum: request.orderId,
      chargeTotal,
      processorID,
      numberOfInstallments: String(request.installments || 1),
      billing: {
        name: request.customer.name,
        email: request.customer.email,
        phone: (request.customer.phone || "").replace(/\D/g, ""),
        address: request.customer.address?.street || "",
        city: request.customer.address?.city || "",
        state: request.customer.address?.state || "",
        postalcode: (request.customer.address?.zipCode || "").replace(/\D/g, ""),
        country: "BR",
      },
    };

    if (request.card) {
      params.card = {
        number: request.card.number.replace(/\D/g, ""),
        expMonth: String(request.card.expMonth).padStart(2, "0"),
        expYear: String(request.card.expYear),
        cvvNumber: request.card.cvv,
        holderName: request.card.holderName,
      };
    }

    return params;
  }

  /**
   * Parseia a resposta XML da MaxiPago para o objeto TransactionResponse.
   * Usa regex simples pois Deno não tem DOMParser nativo de XML.
   */
  static parseXmlResponse(xmlText: string): TransactionResponse {
    const extract = (tag: string): string | undefined => {
      const match = xmlText.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
      return match ? match[1].trim() : undefined;
    };

    return {
      orderID: extract("orderID"),
      referenceNum: extract("referenceNum"),
      transactionID: extract("transactionID"),
      authCode: extract("authCode"),
      responseCode: extract("responseCode"),
      responseMessage: extract("responseMessage"),
      processorCode: extract("processorCode"),
      processorMessage: extract("processorMessage"),
      processorTransactionID: extract("processorTransactionID"),
      errorMessage: extract("errorMessage"),
    };
  }

  /**
   * Converte TransactionResponse para PaymentResponse interno.
   * responseCode "0" = aprovado na MaxiPago.
   */
  static toPaymentResponse(
    parsed: TransactionResponse,
    orderId: string
  ): PaymentResponse {
    const isApproved = parsed.responseCode === "0";
    const hasError = !!parsed.errorMessage;

    if (hasError || (!isApproved && parsed.responseCode !== undefined)) {
      return {
        success: false,
        status: "failed",
        transactionId: orderId,
        gatewayTransactionId: parsed.orderID,
        message: parsed.errorMessage || parsed.responseMessage || `Código de resposta: ${parsed.responseCode}`,
        errorCode: parsed.responseCode || "UNKNOWN_ERROR",
        raw: parsed,
      };
    }

    return {
      success: true,
      transactionId: orderId,
      gatewayTransactionId: parsed.orderID || parsed.transactionID || orderId,
      status: isApproved ? "approved" : "pending",
      message: parsed.responseMessage || "Transação MaxiPago processada com sucesso.",
      authCode: parsed.authCode,
      raw: parsed,
    };
  }

  /**
   * Normaliza os códigos de resposta MaxiPago para o padrão interno.
   * responseCode "0" = aprovado, demais = falha.
   */
  static toPaymentStatus(responseCode: string): PaymentStatus {
    if (responseCode === "0") return "approved";
    if (responseCode === "1") return "pending"; // Pendente
    if (responseCode === "5") return "cancelled";
    return "failed";
  }

  static toPaymentStatusResponse(parsed: TransactionResponse): PaymentStatusResponse {
    return {
      transactionId: parsed.referenceNum || "",
      gatewayTransactionId: parsed.orderID || parsed.transactionID || "",
      status: Mapper.toPaymentStatus(parsed.responseCode || "999"),
      amount: 0,
      currency: "BRL",
      paymentMethod: "credit_card",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
