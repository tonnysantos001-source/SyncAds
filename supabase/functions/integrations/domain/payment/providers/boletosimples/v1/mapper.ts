import { PaymentRequest, PaymentResponse as IPR, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { BoletoSimplesResponse } from "./types.ts";

export class Mapper {
  static toBoletoPayload(r: PaymentRequest): any {
    const due = new Date();
    due.setDate(due.getDate() + 3);

    return {
      amount: r.amount,
      expire_at: due.toISOString().split("T")[0],
      description: `Pedido ${r.orderId} - SyncAds`,
      customer_name: r.customer.name,
      customer_cpf_cnpj: r.customer.document?.replace(/\D/g, "") || "",
      customer_email: r.customer.email,
    };
  }

  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      paid: "approved",
      opened: "pending",
      draft: "pending",
      canceled: "cancelled",
      overdue: "expired",
    };
    return map[status?.toLowerCase()] || "pending";
  }

  static toPaymentResponse(api: BoletoSimplesResponse, orderId: string): IPR {
    if (api.errors || api.error) {
      const msg = api.error || JSON.stringify(api.errors);
      return {
        success: false,
        status: "failed",
        message: msg || "Boleto Simples recusou o pagamento.",
        raw: api,
      };
    }
    const status = Mapper.toPaymentStatus(api.status || "opened");
    return {
      success: status === "approved" || status === "pending",
      transactionId: orderId,
      gatewayTransactionId: String(api.id || ""),
      status,
      message: `Boleto Simples: ${api.status || "aberto"}`,
      paymentUrl: api.url || api.pdf || api.shorten_url || "",
      raw: api,
    };
  }

  static toPaymentStatusResponse(api: BoletoSimplesResponse): PaymentStatusResponse {
    return {
      transactionId: String(api.id || ""),
      gatewayTransactionId: String(api.id || ""),
      status: Mapper.toPaymentStatus(api.status || "opened"),
      amount: api.amount || 0,
      currency: "BRL",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
