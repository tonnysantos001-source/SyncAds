import {
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  PaymentStatusResponse,
} from "../../../../../types.ts";
import { PaymentRequestPayload, PaymentResponsePayload } from "./types.ts";

export class Mapper {
  /**
   * Converte a request do SyncAds para payload da API do Mercado Pago
   */
  static toPaymentPayload(request: PaymentRequest): PaymentRequestPayload {
    const cleanDoc = request.customer.document.replace(/\D/g, "");
    const docType = cleanDoc.length > 11 ? "CNPJ" : "CPF";

    // Split de nome do cliente
    const nameParts = request.customer.name.trim().split(" ");
    const firstName = nameParts[0] || "Cliente";
    const lastName = nameParts.slice(1).join(" ") || "SyncAds";

    const payload: PaymentRequestPayload = {
      transaction_amount: request.amount,
      payment_method_id: this.mapPaymentMethodId(request),
      description: `Pedido SyncAds AI #${request.orderId}`,
      payer: {
        email: request.customer.email,
        first_name: firstName,
        last_name: lastName,
        identification: {
          type: docType as "CPF" | "CNPJ",
          number: cleanDoc,
        },
      },
      external_reference: request.orderId,
    };

    // Mapeamentos específicos por método
    if (request.paymentMethod === "credit_card" && request.card) {
      payload.installments = request.installments || 1;
      // O token do cartão é gerado no frontend pelo SDK do Mercado Pago e injetado em request.metadata.token
      payload.token = request.metadata?.token;
    }

    if (request.paymentMethod === "boleto" && request.billingAddress) {
      payload.payer.address = {
        zip_code: request.billingAddress.zipCode.replace(/\D/g, ""),
        street_name: request.billingAddress.street,
        street_number: request.billingAddress.number,
        neighborhood: request.billingAddress.neighborhood,
        city: request.billingAddress.city,
        federal_unit: request.billingAddress.state,
      };
    }

    return payload;
  }

  /**
   * Converte a resposta da API do Mercado Pago para o formato padronizado do SyncAds
   */
  static toPaymentResponse(response: PaymentResponsePayload): PaymentResponse {
    const status = this.toPaymentStatus(response.status);
    const success = status === "approved";

    const paymentResponse: PaymentResponse = {
      success,
      transactionId: String(response.id),
      gatewayTransactionId: String(response.id),
      status,
      message: `Pagamento processado: ${response.status_detail || response.status}`,
      expiresAt: response.date_of_expiration,
    };

    // Mapeamento Pix
    if (response.payment_method_id === "pix" && response.point_of_interaction?.transaction_data) {
      const txData = response.point_of_interaction.transaction_data;
      paymentResponse.qrCode = txData.qr_code;
      paymentResponse.qrCodeBase64 = txData.qr_code_base64;
      paymentResponse.pixKey = txData.qr_code; // alias comum
      paymentResponse.pixData = {
        qrCode: txData.qr_code || "",
        qrCodeBase64: txData.qr_code_base64,
        expiresAt: response.date_of_expiration,
        amount: response.transaction_amount,
      };
    }

    // Mapeamento Boleto
    if (response.payment_method_id.includes("bol") && response.transaction_details) {
      const details = response.transaction_details;
      const barcode = details.bar_code?.content || response.barcode?.content || "";
      const ticketUrl = details.external_resource_url || response.point_of_interaction?.transaction_data?.ticket_url || "";
      
      paymentResponse.paymentUrl = ticketUrl;
      paymentResponse.barcodeNumber = barcode;
      paymentResponse.digitableLine = barcode; // Boleto simples
      paymentResponse.boletoData = {
        boletoUrl: ticketUrl,
        barcode: barcode,
        digitableLine: barcode,
        dueDate: response.date_of_expiration || new Date(Date.now() + 3*24*60*60*1000).toISOString(),
        amount: response.transaction_amount,
      };
    }

    // Mapeamento Cartão
    if (response.card) {
      paymentResponse.nsu = String(response.id);
      paymentResponse.authorizationCode = response.status_detail;
    }

    return paymentResponse;
  }

  /**
   * Converte a resposta da consulta de status da API do Mercado Pago
   */
  static toPaymentStatusResponse(response: PaymentResponsePayload): PaymentStatusResponse {
    const internalMethodMap: Record<string, any> = {
      pix: "pix",
      bolbradesco: "boleto",
      pec: "boleto",
    };

    return {
      transactionId: String(response.id),
      gatewayTransactionId: String(response.id),
      status: this.toPaymentStatus(response.status),
      amount: response.transaction_amount,
      currency: "BRL",
      paymentMethod: internalMethodMap[response.payment_method_id] || "credit_card",
      createdAt: response.date_created,
      updatedAt: new Date().toISOString(),
      paidAt: response.date_approved,
    };
  }

  /**
   * Mapeia status do Mercado Pago para status interno
   */
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      pending: "pending",
      in_process: "processing",
      in_mediation: "processing",
      approved: "approved",
      cancelled: "cancelled",
      refunded: "refunded",
      charged_back: "failed",
      rejected: "failed",
    };
    return map[status.toLowerCase()] || "pending";
  }

  private static mapPaymentMethodId(request: PaymentRequest): string {
    switch (request.paymentMethod) {
      case "pix":
        return "pix";
      case "boleto":
        return "bolbradesco";
      case "credit_card":
        // Mercado Pago exige o ID da bandeira correspondente (ex: visa, master, amex)
        return request.card?.brand?.toLowerCase() || "visa";
      default:
        return "pix";
    }
  }
}
