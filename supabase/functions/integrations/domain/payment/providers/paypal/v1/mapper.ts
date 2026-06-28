import {
  PaymentRequest,
  PaymentResponse as InternalPaymentResponse,
  PaymentStatus,
  PaymentStatusResponse,
} from "../../../../../types.ts";
import { CreateOrderPayload, PaymentResponse } from "./types.ts";

export class Mapper {
  /**
   * Converte PaymentRequest no payload do PayPal.
   */
  static toCreateOrderPayload(request: PaymentRequest, callbackUrl?: string): CreateOrderPayload {
    const currency = request.currency || "USD";
    const amountVal = request.amount.toFixed(2);

    const payload: CreateOrderPayload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: request.orderId,
          description: `Pedido ${request.orderId}`,
          custom_id: request.orderId,
          soft_descriptor: "SYNCADS",
          amount: {
            currency_code: currency,
            value: amountVal,
            breakdown: {
              item_total: {
                currency_code: currency,
                value: amountVal,
              },
            },
          },
          items: request.items
            ? request.items.map((item) => ({
                name: item.name,
                description: item.name,
                unit_amount: {
                  currency_code: currency,
                  value: item.unitPrice.toFixed(2),
                },
                quantity: item.quantity.toString(),
              }))
            : [
                {
                  name: `Pedido ${request.orderId}`,
                  description: `Pagamento do pedido ${request.orderId}`,
                  unit_amount: {
                    currency_code: currency,
                    value: amountVal,
                  },
                  quantity: "1",
                },
              ],
        },
      ],
      application_context: {
        brand_name: "SyncAds",
        locale: "pt-BR",
        landing_page: "BILLING",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        return_url: callbackUrl || "https://syncads.com.br/success",
        cancel_url: callbackUrl ? `${callbackUrl}/cancel` : "https://syncads.com.br/cancel",
      },
    };

    if (request.paymentMethod === "credit_card" && request.card) {
      const expMonth = String(request.card.expMonth || request.card.expiryMonth).padStart(2, "0");
      const expYear = String(request.card.expYear || request.card.expiryYear);

      payload.payment_source = {
        card: {
          number: request.card.number.replace(/\D/g, ""),
          expiry: `${expYear}-${expMonth}`,
          security_code: request.card.cvv,
          name: request.card.holderName.toUpperCase(),
        },
      };

      if (request.billingAddress) {
        payload.payment_source.card.billing_address = {
          address_line_1: `${request.billingAddress.street}, ${request.billingAddress.number}`,
          address_line_2: request.billingAddress.complement || undefined,
          admin_area_2: request.billingAddress.city,
          admin_area_1: request.billingAddress.state,
          postal_code: (request.billingAddress.zipCode || "").replace(/\D/g, ""),
          country_code: request.billingAddress.country || "BR",
        };
      }
    }

    return payload;
  }

  /**
   * Converte resposta do PayPal para o padrão interno.
   */
  static toPaymentResponse(
    apiResponse: PaymentResponse,
    orderId: string
  ): InternalPaymentResponse {
    if (apiResponse.error_description || (!apiResponse.id && !apiResponse.purchase_units)) {
      return {
        success: false,
        status: "failed",
        message: apiResponse.error_description || apiResponse.error?.message || "PayPal recusou o pagamento.",
        errorCode: apiResponse.error?.name || "PAYMENT_ERROR",
        raw: apiResponse,
      };
    }

    const statusVal = Mapper.toPaymentStatus(apiResponse.status || "CREATED");
    const capture = apiResponse.purchase_units?.[0]?.payments?.captures?.[0];

    const response: InternalPaymentResponse = {
      success: statusVal === "approved" || statusVal === "pending" || statusVal === "processing",
      transactionId: orderId,
      gatewayTransactionId: capture?.id || apiResponse.id || "",
      status: statusVal,
      message: `PayPal status: ${apiResponse.status}`,
      raw: apiResponse,
    };

    if (capture?.id) {
      response.authorizationCode = capture.id;
    }

    const approveLink = apiResponse.links?.find((link) => link.rel === "approve");
    if (approveLink) {
      response.paymentUrl = approveLink.href;
      response.redirectUrl = approveLink.href;
    }

    return response;
  }

  /**
   * Converte resposta de consulta para PaymentStatusResponse.
   */
  static toPaymentStatusResponse(apiResponse: PaymentResponse): PaymentStatusResponse {
    const purchaseUnit = apiResponse.purchase_units?.[0];
    const amountVal = parseFloat(purchaseUnit?.amount?.value || "0");
    const capture = purchaseUnit?.payments?.captures?.[0];

    return {
      transactionId: apiResponse.id || "",
      gatewayTransactionId: capture?.id || apiResponse.id || "",
      status: Mapper.toPaymentStatus(apiResponse.status || "CREATED"),
      amount: amountVal,
      currency: purchaseUnit?.amount?.currency_code || "USD",
      paymentMethod: "wallet",
      createdAt: new Date().toISOString(), // PayPal responde com create_time se consultado completo
      updatedAt: new Date().toISOString(),
      paidAt: apiResponse.status === "COMPLETED" ? new Date().toISOString() : undefined,
    };
  }

  /**
   * Normaliza os códigos de status do PayPal.
   */
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      CREATED: "pending",
      SAVED: "pending",
      APPROVED: "processing",
      VOIDED: "cancelled",
      COMPLETED: "approved",
      PAYER_ACTION_REQUIRED: "pending",
    };
    return map[status?.toUpperCase()] || "pending";
  }
}
