import { PaymentRequest, PaymentResponse, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { VindiCustomer, CreateBillPayload, BillResponse } from "./types.ts";

export class Mapper {
  static toVindiCustomer(request: PaymentRequest): VindiCustomer {
    const doc = (request.customer.document || "").replace(/\D/g, "");
    return {
      name: request.customer.name,
      email: request.customer.email,
      registry_code: doc || undefined,
      phone: (request.customer.phone || "").replace(/\D/g, "") || undefined,
      code: request.orderId,
    };
  }

  static toBillPayload(request: PaymentRequest, customerId: number, paymentProfileId?: number): CreateBillPayload {
    const method = request.paymentMethod === "pix" ? "pix" : request.paymentMethod === "boleto" ? "bank_slip" : "credit_card";
    return {
      customer_id: customerId,
      payment_method_code: method as any,
      code: request.orderId,
      bill_items: request.items?.length
        ? request.items.map(i => ({ description: i.name || "Produto", amount: i.unitPrice || request.amount, quantity: i.quantity || 1 }))
        : [{ description: `Pedido ${request.orderId}`, amount: request.amount, quantity: 1 }],
      payment_profile: paymentProfileId ? { id: paymentProfileId, installments: request.installments || 1 } : undefined,
    };
  }

  static toBillResponse(api: BillResponse, orderId: string): PaymentResponse {
    const bill = api.bill;
    if (!bill || api.errors?.length) {
      const errMsg = api.errors?.map(e => e.message).join(", ") || "Vindi rejeitou a cobrança.";
      return { success: false, status: "failed", message: errMsg };
    }
    const charge = bill.charges?.[0];
    const tx = charge?.last_transaction;
    const status = Mapper.toPaymentStatus(bill.status);
    return {
      success: status !== "failed",
      transactionId: orderId,
      gatewayTransactionId: String(bill.id),
      status,
      paymentUrl: bill.period?.bank_slip_url,
      authCode: tx?.gateway_authorization,
      message: `Vindi: ${bill.status}`,
      raw: api,
    };
  }

  static toPaymentStatusResponse(api: BillResponse): PaymentStatusResponse {
    const bill = api.bill;
    if (!bill) throw new Error("Fatura Vindi não encontrada.");
    return {
      transactionId: bill.code,
      gatewayTransactionId: String(bill.id),
      status: Mapper.toPaymentStatus(bill.status),
      amount: bill.amount,
      currency: "BRL",
      paymentMethod: bill.charges?.[0]?.payment_method_code || "unknown",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      paid: "approved", active: "approved",
      pending: "pending", reviewing: "processing", waiting: "pending",
      canceled: "cancelled", cancelled: "cancelled",
      failed: "failed",
    };
    return map[status?.toLowerCase()] || "pending";
  }
}
