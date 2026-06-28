import { PaymentRequest, PaymentResponse as InternalPaymentResponse, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { CreatePaymentPayload, PaymentResponse } from "./types.ts";

export class Mapper {
  static toCreatePaymentPayload(request: PaymentRequest, merchantAccount: string, returnUrl?: string): CreatePaymentPayload {
    const amountCents = Math.round(request.amount * 100);
    const method = request.paymentMethod;

    let paymentMethod: Record<string, any> = { type: "scheme" };
    if (method === "pix") paymentMethod = { type: "pix" };
    else if (method === "boleto") paymentMethod = { type: "boletobancario" };
    else if (method === "credit_card" && request.card) {
      const [expMonth, expYear] = [
        String(request.card.expMonth || request.card.expiryMonth).padStart(2, "0"),
        String(request.card.expYear || request.card.expiryYear),
      ];
      paymentMethod = {
        type: "scheme",
        number: request.card.number.replace(/\D/g, ""),
        expiryMonth: expMonth,
        expiryYear: expYear.length === 2 ? `20${expYear}` : expYear,
        cvc: request.card.cvv,
        holderName: request.card.holderName.toUpperCase(),
      };
    }

    return {
      amount: { value: amountCents, currency: "BRL" },
      merchantAccount,
      reference: request.orderId,
      paymentMethod,
      returnUrl: returnUrl || "https://syncads.com.br/checkout/return",
      shopperEmail: request.customer.email,
      shopperName: {
        firstName: request.customer.name.split(" ")[0],
        lastName: request.customer.name.split(" ").slice(1).join(" ") || "-",
      },
      countryCode: "BR",
    };
  }

  static toPaymentStatus(resultCode: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      Authorised: "approved",
      authorised: "approved",
      Received: "pending",
      Pending: "pending",
      PresentToShopper: "pending",
      Refused: "failed",
      Error: "failed",
      Cancelled: "cancelled",
    };
    return map[resultCode] || "pending";
  }

  static toPaymentResponse(api: PaymentResponse, orderId: string): InternalPaymentResponse {
    if (api.errorCode || api.resultCode === "Error") {
      return {
        success: false,
        status: "failed",
        message: api.message || api.refusalReason || "Adyen recusou o pagamento.",
        errorCode: api.errorCode || "ERROR",
        raw: api,
      };
    }
    const status = Mapper.toPaymentStatus(api.resultCode || "Pending");
    const resp: InternalPaymentResponse = {
      success: status === "approved" || status === "pending",
      transactionId: orderId,
      gatewayTransactionId: api.pspReference || "",
      status,
      message: `Adyen: ${api.resultCode}`,
      raw: api,
    };
    if (api.action?.type === "qrCode" && api.action.qrCodeData) {
      resp.qrCode = api.action.qrCodeData;
      resp.pixData = { qrCode: api.action.qrCodeData, amount: (api.amount?.value || 0) / 100 };
    }
    if (api.action?.url) resp.paymentUrl = api.action.url;
    return resp;
  }

  static toPaymentStatusResponse(api: PaymentResponse): PaymentStatusResponse {
    return {
      transactionId: api.pspReference || "",
      gatewayTransactionId: api.pspReference || "",
      status: Mapper.toPaymentStatus(api.resultCode || "Pending"),
      amount: (api.amount?.value || 0) / 100,
      currency: api.amount?.currency || "BRL",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
