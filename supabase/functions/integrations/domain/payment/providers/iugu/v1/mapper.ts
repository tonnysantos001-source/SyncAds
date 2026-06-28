import {
  PaymentRequest,
  PaymentResponse as InternalPaymentResponse,
  PaymentStatus,
  PaymentStatusResponse,
} from "../../../../../types.ts";
import { PaymentResponse, InvoicePayload, ChargePayload } from "./types.ts";

export class Mapper {
  /**
   * Converte PaymentRequest no payload de Fatura (invoice) da Iugu para Pix/Boleto.
   */
  static toInvoicePayload(request: PaymentRequest, customerId?: string): InvoicePayload {
    const docClean = (request.customer.document || "").replace(/\D/g, "");
    const phoneClean = (request.customer.phone || "").replace(/\D/g, "");
    const prefix = phoneClean.substring(0, 2) || "11";
    const phone = phoneClean.substring(2) || "999999999";

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    const payload: InvoicePayload = {
      email: request.customer.email,
      customer_id: customerId,
      due_date: dueDate.toISOString().split("T")[0],
      items: [
        {
          description: `Pedido ${request.orderId}`,
          quantity: 1,
          price_cents: Math.round(request.amount * 100),
        },
      ],
      payer: {
        cpf_cnpj: docClean,
        name: request.customer.name,
        phone_prefix: prefix,
        phone,
        email: request.customer.email,
      },
      ensure_workday_due_date: false,
      payable_with: request.paymentMethod === "pix" ? "pix" : "bank_slip",
    };

    if (request.billingAddress) {
      payload.payer!.address = {
        street: request.billingAddress.street,
        number: String(request.billingAddress.number),
        district: request.billingAddress.neighborhood,
        city: request.billingAddress.city,
        state: request.billingAddress.state,
        zip_code: (request.billingAddress.zipCode || "").replace(/\D/g, ""),
      };
    }

    return payload;
  }

  /**
   * Converte PaymentRequest no payload de Cobrança direta (charge) da Iugu para Cartão.
   */
  static toChargePayload(request: PaymentRequest, token: string): ChargePayload {
    const docClean = (request.customer.document || "").replace(/\D/g, "");
    const phoneClean = (request.customer.phone || "").replace(/\D/g, "");
    const prefix = phoneClean.substring(0, 2) || "11";
    const phone = phoneClean.substring(2) || "999999999";

    const payload: ChargePayload = {
      token,
      email: request.customer.email,
      months: 1,
      items: [
        {
          description: `Pedido ${request.orderId}`,
          quantity: 1,
          price_cents: Math.round(request.amount * 100),
        },
      ],
      payer: {
        cpf_cnpj: docClean,
        name: request.customer.name,
        phone_prefix: prefix,
        phone,
        email: request.customer.email,
      },
    };

    if (request.billingAddress) {
      payload.payer!.address = {
        street: request.billingAddress.street,
        number: String(request.billingAddress.number),
        district: request.billingAddress.neighborhood,
        city: request.billingAddress.city,
        state: request.billingAddress.state,
        zip_code: (request.billingAddress.zipCode || "").replace(/\D/g, ""),
        country: "Brasil",
      };
    }

    return payload;
  }

  /**
   * Converte resposta da Iugu para o padrão interno.
   */
  static toPaymentResponse(
    apiResponse: PaymentResponse,
    orderId: string
  ): InternalPaymentResponse {
    if (apiResponse.error || (!apiResponse.id && !apiResponse.invoice_id)) {
      return {
        success: false,
        status: "failed",
        message: apiResponse.error?.message || apiResponse.message || "Iugu recusou o pagamento.",
        errorCode: apiResponse.error?.code || "PAYMENT_ERROR",
        raw: apiResponse,
      };
    }

    // Se success === false em resposta de charge
    if (apiResponse.success === false) {
      return {
        success: false,
        status: "failed",
        message: apiResponse.message || "Cobrança via cartão recusada pela Iugu.",
        raw: apiResponse,
      };
    }

    const statusVal = Mapper.toPaymentStatus(apiResponse.status || "pending");

    const response: InternalPaymentResponse = {
      success: statusVal === "approved" || statusVal === "pending",
      transactionId: orderId,
      gatewayTransactionId: apiResponse.id || apiResponse.invoice_id || "",
      status: statusVal,
      message: apiResponse.message || `Iugu status: ${apiResponse.status}`,
      raw: apiResponse,
    };

    if (apiResponse.pix) {
      response.qrCode = apiResponse.pix.qrcode;
      response.pixData = {
        qrCode: apiResponse.pix.qrcode || "",
        qrCodeImage: apiResponse.pix.qrcode_image_url,
        amount: (apiResponse.total_cents || 0) / 100,
      };
      response.expiresAt = apiResponse.due_date;
    }

    if (apiResponse.bank_slip) {
      response.paymentUrl = apiResponse.secure_url;
      response.redirectUrl = apiResponse.secure_url;
      response.barcodeNumber = apiResponse.bank_slip.barcode;
      response.digitableLine = apiResponse.bank_slip.digitable_line;
      response.expiresAt = apiResponse.due_date;
    } else if (apiResponse.secure_url) {
      response.paymentUrl = apiResponse.secure_url;
      response.redirectUrl = apiResponse.secure_url;
    }

    return response;
  }

  /**
   * Converte resposta de consulta para PaymentStatusResponse.
   */
  static toPaymentStatusResponse(apiResponse: PaymentResponse): PaymentStatusResponse {
    return {
      transactionId: apiResponse.id || "",
      gatewayTransactionId: apiResponse.id || "",
      status: Mapper.toPaymentStatus(apiResponse.status || "pending"),
      amount: (apiResponse.total_cents || 0) / 100,
      currency: "BRL",
      paymentMethod: apiResponse.payable_with || "unknown",
      createdAt: apiResponse.created_at || new Date().toISOString(),
      updatedAt: apiResponse.updated_at || new Date().toISOString(),
      paidAt: apiResponse.paid_at,
    };
  }

  /**
   * Normaliza os códigos de status da Iugu.
   */
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      pending: "pending",
      paid: "approved",
      canceled: "cancelled",
      partially_paid: "pending",
      refunded: "refunded",
      expired: "expired",
      in_analysis: "processing",
      in_protest: "processing",
      chargeback: "refunded",
    };
    return map[status?.toLowerCase()] || "pending";
  }
}
