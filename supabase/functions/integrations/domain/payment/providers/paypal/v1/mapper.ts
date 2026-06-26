import { PaymentRequest, PaymentResponse, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { PaymentRequestPayload, PaymentResponsePayload } from "./types.ts";

export class Mapper {
  private static getSupabaseUrl(): string {
    if (typeof Deno !== "undefined") {
      return Deno.env.get("SUPABASE_URL") || "https://ovskepqggmxlfckxqgbr.supabase.co";
    }
    return "https://ovskepqggmxlfckxqgbr.supabase.co";
  }

  private static formatZipCode(zip: string): string {
    return zip.replace(/\D/g, "");
  }

  /**
   * Converte a request interna do SyncAds para o formato da API do PayPal
   */
  static toPaymentPayload(request: PaymentRequest): PaymentRequestPayload {
    const currency = request.currency || "BRL";
    const supabaseUrl = this.getSupabaseUrl();

    const payload: PaymentRequestPayload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: request.orderId,
          description: `Pedido ${request.orderId}`,
          custom_id: request.orderId,
          soft_descriptor: "SYNCADS",
          amount: {
            currency_code: currency,
            value: request.amount.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: currency,
                value: request.amount.toFixed(2),
              },
            },
          },
          items: [
            {
              name: `Pedido ${request.orderId}`,
              description: `Pagamento do pedido ${request.orderId}`,
              unit_amount: {
                currency_code: currency,
                value: request.amount.toFixed(2),
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
        return_url: `${supabaseUrl}/functions/v1/payment-webhook/paypal/success`,
        cancel_url: `${supabaseUrl}/functions/v1/payment-webhook/paypal/cancel`,
      },
    };

    if (request.paymentMethod === "credit_card" && request.card) {
      payload.payment_source = {
        card: {
          number: request.card.number.replace(/\s/g, ""),
          expiry: `${request.card.expiryYear}-${request.card.expiryMonth.padStart(2, "0")}`,
          security_code: request.card.cvv,
          name: request.card.holderName,
        },
      };

      if (request.billingAddress) {
        payload.payment_source.card.billing_address = {
          address_line_1: `${request.billingAddress.street}, ${request.billingAddress.number}`,
          address_line_2: request.billingAddress.complement || "",
          admin_area_2: request.billingAddress.city,
          admin_area_1: request.billingAddress.state,
          postal_code: this.formatZipCode(request.billingAddress.zipCode),
          country_code: request.billingAddress.country || "BR",
        };
      }
    }

    return payload;
  }

  /**
   * Converte a resposta da API do PayPal para o formato padronizado do SyncAds
   */
  static toPaymentResponse(response: PaymentResponsePayload): PaymentResponse {
    const rawStatus = response.status || "CREATED";
    const status = this.toPaymentStatus(rawStatus);
    const success = ["COMPLETED", "APPROVED"].includes(rawStatus);

    const approveLink = response.links?.find((link) => link.rel === "approve");

    const result: PaymentResponse = {
      success: true, // A criação do pedido PayPal em si foi bem sucedida
      transactionId: response.id,
      gatewayTransactionId: response.id,
      status,
      message: `Pedido PayPal criado com status: ${rawStatus}`,
    };

    if (approveLink) {
      result.redirectUrl = approveLink.href;
    }

    const capture = response.purchase_units?.[0]?.payments?.captures?.[0];
    if (capture) {
      result.gatewayTransactionId = capture.id;
      result.authorizationCode = capture.id;
      if (capture.status === "COMPLETED") {
        result.status = "approved";
      }
    }

    return result;
  }

  /**
   * Converte a resposta de status da API do PayPal para resposta de status do SyncAds
   */
  static toPaymentStatusResponse(response: any): PaymentStatusResponse {
    const purchaseUnit = response.purchase_units?.[0];
    const amount = parseFloat(purchaseUnit?.amount?.value || "0");
    const method = response.payment_source?.card ? "credit_card" : "paypal";

    return {
      transactionId: response.id,
      gatewayTransactionId: response.id,
      status: this.toPaymentStatus(response.status),
      amount: amount,
      currency: purchaseUnit?.amount?.currency_code || "BRL",
      paymentMethod: method as any,
      createdAt: response.create_time || new Date().toISOString(),
      updatedAt: response.update_time || response.create_time || new Date().toISOString(),
      paidAt: response.status === "COMPLETED" ? response.update_time : undefined,
    };
  }

  /**
   * Normaliza status
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
    return map[status] || "pending";
  }
}
