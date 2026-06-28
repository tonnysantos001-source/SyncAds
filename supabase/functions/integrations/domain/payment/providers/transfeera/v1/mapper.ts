import { PaymentRequest, PaymentResponse as IPR, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { TransfeeraPixRequest, TransfeeraResponse } from "./types.ts";

export class Mapper {
  static toPixBillingPayload(r: PaymentRequest): TransfeeraPixRequest {
    return {
      valor: r.amount,
      chave: "transfeera-pix-key-placeholder", // Pix Key
      descricao: `Pedido ${r.orderId} - SyncAds`,
      infoAdicional: [
        { nome: "OrderId", valor: r.orderId },
        { nome: "Cliente", valor: r.customer.name },
      ],
    };
  }

  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      CONCLUIDA: "approved",
      ATIVA: "pending",
      EM_PROCESSAMENTO: "processing",
      REMANESCIDA: "pending",
      REJEITADA: "failed",
    };
    return map[status?.toUpperCase()] || "pending";
  }

  static toPaymentResponse(api: TransfeeraResponse, orderId: string): IPR {
    if (api.error) {
      return {
        success: false,
        status: "failed",
        message: api.mensagem || api.error || "Transfeera recusou o pagamento.",
        raw: api,
      };
    }
    const status = Mapper.toPaymentStatus(api.status || "ATIVA");
    const resp: IPR = {
      success: status === "approved" || status === "pending" || status === "processing",
      transactionId: orderId,
      gatewayTransactionId: api.txid || api.id || "",
      status,
      message: `Transfeera: ${api.status || "ativa"}`,
      raw: api,
    };

    if (api.pixCopiaECola) {
      resp.qrCode = api.pixCopiaECola;
      resp.pixData = {
        qrCode: api.pixCopiaECola,
        amount: api.valor || 0,
      };
    }

    return resp;
  }

  static toPaymentStatusResponse(api: TransfeeraResponse): PaymentStatusResponse {
    return {
      transactionId: api.txid || "",
      gatewayTransactionId: api.txid || api.id || "",
      status: Mapper.toPaymentStatus(api.status || "ATIVA"),
      amount: api.valor || 0,
      currency: "BRL",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
