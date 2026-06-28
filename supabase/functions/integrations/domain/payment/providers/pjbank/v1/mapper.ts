import { PaymentRequest, PaymentResponse as IPR, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { PJBankBoletoPayload, PJBankCardPayload, PJBankResponse } from "./types.ts";

export class Mapper {
  static toBoletoPayload(r: PaymentRequest, webhookUrl?: string): PJBankBoletoPayload {
    const due = new Date();
    due.setDate(due.getDate() + 3);
    const dueStr = due.toLocaleDateString("pt-BR"); // e.g. "31/12/2026"

    return {
      vencimento: dueStr,
      valor: r.amount,
      nome_cliente: r.customer.name,
      cpf_cliente: r.customer.document?.replace(/\D/g, "") || "",
      email_cliente: r.customer.email,
      telefone_cliente: r.customer.phone || "",
      numero_pedido: r.orderId,
      url_retorno: webhookUrl || "",
    };
  }

  static toCardPayload(r: PaymentRequest): PJBankCardPayload {
    const expMonth = String(r.card?.expMonth || r.card?.expiryMonth || "").padStart(2, "0");
    const expYear = String(r.card?.expYear || r.card?.expiryYear || "");
    const expStr = `${expMonth}/${expYear.length === 2 ? "20" + expYear : expYear}`;

    return {
      valor: r.amount,
      opcao_sigla: "VI", // default to Visa, will auto-detect on PJBank end usually or accept VI
      numero_cartao: r.card?.number?.replace(/\D/g, "") || "",
      titular_cartao: r.card?.holderName?.toUpperCase() || "",
      vencimento_cartao: expStr,
      cvv_cartao: r.card?.cvv || "",
      parcelas: 1,
      nome_cliente: r.customer.name,
      email_cliente: r.customer.email,
      cpf_cliente: r.customer.document?.replace(/\D/g, "") || "",
      numero_pedido: r.orderId,
    };
  }

  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      pago: "approved",
      vencido: "expired",
      aguardando: "pending",
      cancelado: "cancelled",
      recusado: "failed",
    };
    return map[status?.toLowerCase()] || "pending";
  }

  static toPaymentResponse(api: PJBankResponse, orderId: string, method: string): IPR {
    if (api.status >= 400 || api.autorizado === "false") {
      return {
        success: false,
        status: "failed",
        message: api.msg || "PJBank recusou o pagamento.",
        raw: api,
      };
    }
    const status = api.nosso_numero ? "pending" : (api.autorizado === "true" ? "approved" : "pending");
    const resp: IPR = {
      success: true,
      transactionId: orderId,
      gatewayTransactionId: api.id_unico || api.nosso_numero || api.tid || "",
      status: Mapper.toPaymentStatus(status === "approved" ? "pago" : "aguardando"),
      message: api.msg || `PJBank: ${status}`,
      raw: api,
    };

    if (method === "boleto" && api.link_boleto) {
      resp.paymentUrl = api.link_boleto;
    }

    return resp;
  }

  static toPaymentStatusResponse(api: PJBankResponse): PaymentStatusResponse {
    return {
      transactionId: api.id_unico || "",
      gatewayTransactionId: api.id_unico || api.nosso_numero || "",
      status: Mapper.toPaymentStatus(api.nosso_numero ? "aguardando" : "pago"),
      amount: 0,
      currency: "BRL",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
