import { PaymentRequest, PaymentResponse, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { PaymentResponsePayload } from "./types.ts";


export class Mapper {
  /**
   * Converte a request do SyncAds para os dados do cliente Appmax
   */
  static toCustomerPayload(request: PaymentRequest) {
    // Limpar caracteres não numéricos do telefone e CPF/CNPJ
    const document = request.customer.document.replace(/\D/g, "");
    
    // Garantir telefone no formato correto (DDI + DDD + Número)
    let phone = request.customer.phone.replace(/\D/g, "");
    if (phone.length === 11 && !phone.startsWith("55")) {
      phone = "55" + phone;
    } else if (phone.length === 9) {
      phone = "5511" + phone; // DDD padrão fictício se vier apenas número
    }

    return {
      name: request.customer.name,
      email: request.customer.email,
      document_number: document,
      phone: phone,
    };
  }

  /**
   * Converte a request do SyncAds para a lista de produtos do pedido Appmax
   */
  static toOrderPayload(request: PaymentRequest) {
    return {
      products: [
        {
          sku: request.orderId || "product_1",
          name: "Cobrança SyncAds",
          qty: 1,
          price: request.amount, // Valor decimal
          digital_product: 1, // Produto digital por padrão
        },
      ],
    };
  }

  /**
   * Retorna os dados do método de pagamento específico para a Appmax
   */
  static toPaymentPayload(request: PaymentRequest, cardToken?: string): any {
    const document = request.customer.document.replace(/\D/g, "");
    const method = request.paymentMethod;

    if (method === "pix") {
      return {
        Pix: {
          document_number: document,
        },
      };
    } else if (method === "boleto") {
      return {
        Boleto: {
          document_number: document,
        },
      };
    } else if (method === "credit_card" && request.card) {
      return {
        CreditCard: {
          token: cardToken || "dummy_token",
          document_number: document,
          installments: request.installments || 1,
          soft_descriptor: "SYNCADS",
        },
      };
    }

    throw new Error(`Método de pagamento não suportado pela Appmax: ${method}`);
  }

  /**
   * Converte a resposta da API da Appmax para o formato padronizado do SyncAds
   */
  static toPaymentResponse(response: PaymentResponsePayload): PaymentResponse {
    const data = response.data;
    if (!data) {
      return {
        success: false,
        status: "failed",
        message: "Resposta da Appmax não contém dados da transação.",
      };
    }

    const isApproved = ["approved", "paid", "autorizado"].includes(data.status?.toLowerCase());
    
    return {
      success: isApproved,
      transactionId: String(data.id),
      gatewayTransactionId: String(data.id),
      status: Mapper.toPaymentStatus(data.status),
      qrCode: data.pix_code,
      paymentUrl: data.pdf_url,
      barcodeNumber: data.digitable_line,
      message: `Pagamento processado com status: ${data.status}`,
    };
  }

  /**
   * Normaliza status de pagamento da Appmax
   */
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      approved: "approved",
      paid: "approved",
      autorizado: "approved",
      pending: "pending",
      processing: "processing",
      aguardando_pagamento: "pending",
      processamento: "processing",
      boleto_gerado: "pending",
      pix_gerado: "pending",
      rejected: "failed",
      failed: "failed",
      recusado: "failed",
      refunded: "refunded",
      estornado: "refunded",
      devolvido: "refunded",
    };
    return map[status?.toLowerCase()] || "pending";
  }

  /**
   * Normaliza a resposta da consulta de pagamento
   */
  static toPaymentStatusResponse(response: any): PaymentStatusResponse {
    const data = response.data || response;
    return {
      status: Mapper.toPaymentStatus(data.status),
      gatewayStatus: data.status,
      message: `Consulta realizada com sucesso. Status atual: ${data.status}`,
    };
  }
}


