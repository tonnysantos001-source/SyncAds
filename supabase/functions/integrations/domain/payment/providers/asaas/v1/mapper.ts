import { PaymentRequest, PaymentResponse, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { PaymentRequestPayload, PaymentResponsePayload } from "./types.ts";

export class Mapper {
  /**
   * Converte a request interna do SyncAds para o formato da API do Asaas
   */
  static toPaymentPayload(request: PaymentRequest, customerId: string): PaymentRequestPayload {
    let billingType: "PIX" | "CREDIT_CARD" | "BOLETO" = "PIX";
    if (request.paymentMethod === "credit_card") {
      billingType = "CREDIT_CARD";
    } else if (request.paymentMethod === "boleto") {
      billingType = "BOLETO";
    }

    const dueDate = new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
      .toISOString()
      .split("T")[0];

    const payload: PaymentRequestPayload = {
      customer: customerId,
      billingType,
      value: request.amount,
      dueDate,
      description: `Pedido #${request.orderId}`,
      externalReference: request.orderId,
    };

    if (billingType === "PIX") {
      payload.pixAddressKeyType = "RANDOM";
      payload.expirationSeconds = 1800;
    } else if (billingType === "CREDIT_CARD" && request.paymentDetails?.card) {
      const card = request.paymentDetails.card;
      const cleanCpfCnpj = request.customer.document.replace(/\D/g, "");
      payload.creditCard = {
        holderName: card.holderName,
        number: card.number.replace(/\D/g, ""),
        expiryMonth: card.expiryMonth.toString().padStart(2, "0"),
        expiryYear: card.expiryYear.toString().slice(-2), // 2 digits
        ccv: card.cvv,
      };
      payload.creditCardHolderInfo = {
        name: request.customer.name,
        email: request.customer.email,
        cpfCnpj: cleanCpfCnpj,
        postalCode: request.billingAddress?.zipCode?.replace(/\D/g, "") || "01000000",
        addressNumber: request.billingAddress?.number || "100",
        phone: request.customer.phone || "",
      };
    }

    return payload;
  }

  /**
   * Converte a resposta da API do Asaas para o formato padronizado do SyncAds
   */
  static toPaymentResponse(response: PaymentResponsePayload, pixData?: any): PaymentResponse {
    const status = Mapper.toPaymentStatus(response.status);
    const success = ["approved", "paid", "confirmed", "received"].includes(response.status.toLowerCase());

    const result: PaymentResponse = {
      success,
      transactionId: response.externalReference || response.id,
      gatewayTransactionId: response.id,
      status,
      paymentUrl: response.invoiceUrl || response.bankSlipUrl,
      barcodeNumber: response.nossoNumero,
      digitableLine: response.identificationField,
      message: `Cobrança criada com status: ${response.status}`,
    };

    if (pixData) {
      result.qrCode = pixData.payload || "";
      result.qrCodeBase64 = pixData.encodedImage || "";
      result.expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      result.pixData = {
        qrCode: pixData.payload || "",
        qrCodeBase64: pixData.encodedImage || "",
        expiresAt: result.expiresAt,
        amount: response.value,
      };
    }

    if (response.billingType === "BOLETO" || response.bankSlipUrl) {
      result.boletoData = {
        boletoUrl: response.bankSlipUrl || response.invoiceUrl || "",
        barcode: response.nossoNumero || "",
        digitableLine: response.identificationField || "",
        dueDate: response.dueDate,
        amount: response.value,
      };
    }

    return result;
  }

  /**
   * Converte a resposta da API do Asaas para resposta de status do SyncAds
   */
  static toPaymentStatusResponse(response: any): PaymentStatusResponse {
    let method: "pix" | "credit_card" | "boleto" = "pix";
    if (response.billingType === "CREDIT_CARD") {
      method = "credit_card";
    } else if (response.billingType === "BOLETO") {
      method = "boleto";
    }

    return {
      transactionId: response.externalReference || response.id,
      gatewayTransactionId: response.id,
      status: this.toPaymentStatus(response.status),
      amount: response.value,
      currency: "BRL",
      paymentMethod: method,
      createdAt: response.dateCreated || new Date().toISOString(),
      updatedAt: response.lastUpdated || response.dateCreated || new Date().toISOString(),
    };
  }

  /**
   * Normaliza status
   */
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      pending: "pending",
      paid: "approved",
      confirmed: "approved",
      received: "approved",
      overdue: "failed",
      refunded: "refunded",
      refund_requested: "processing",
      chargeback_requested: "processing",
      chargeback_disputed: "processing",
      refund_in_progress: "processing",
      failed: "failed",
      canceled: "cancelled",
    };
    return map[status.toLowerCase()] || "pending";
  }
}
