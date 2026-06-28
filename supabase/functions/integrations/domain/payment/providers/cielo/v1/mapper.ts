import {
  PaymentRequest,
  PaymentResponse as InternalPaymentResponse,
  PaymentStatus,
  PaymentStatusResponse,
  PaymentMethod,
} from "../../../../../types.ts";
import { CreatePaymentPayload, PaymentResponse } from "./types.ts";

export class Mapper {
  /**
   * Converte PaymentRequest no payload da Cielo.
   */
  static toCreatePaymentPayload(request: PaymentRequest, callbackUrl?: string): CreatePaymentPayload {
    const docClean = (request.customer.document || "").replace(/\D/g, "");
    const docType = docClean.length > 11 ? "CNPJ" : "CPF";

    const paymentTypeMap: Record<string, "CreditCard" | "DebitCard" | "Boleto" | "Pix"> = {
      pix: "Pix",
      boleto: "Boleto",
      credit_card: "CreditCard",
      debit_card: "DebitCard",
    };

    const type = paymentTypeMap[request.paymentMethod] || "CreditCard";

    const payload: CreatePaymentPayload = {
      MerchantOrderId: request.orderId,
      Customer: {
        Name: request.customer.name,
        Email: request.customer.email,
        Identity: docClean,
        IdentityType: docType,
      },
      Payment: {
        Type: type,
        Amount: Math.round(request.amount * 100),
      },
    };

    if (request.billingAddress) {
      payload.Customer.Address = {
        Street: request.billingAddress.street,
        Number: String(request.billingAddress.number),
        Complement: request.billingAddress.complement || undefined,
        District: request.billingAddress.neighborhood,
        City: request.billingAddress.city,
        State: request.billingAddress.state,
        Country: "BRA",
        ZipCode: (request.billingAddress.zipCode || "").replace(/\D/g, ""),
      };
    }

    if (type === "Pix") {
      payload.Payment.QrCodeExpiration = 3600;
    } else if (type === "Boleto") {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);
      payload.Payment.Provider = "Bradesco2";
      payload.Payment.Assignor = "SyncAds";
      payload.Payment.Demonstrative = `Pedido ${request.orderId}`;
      payload.Payment.ExpirationDate = dueDate.toISOString().split("T")[0];
      payload.Payment.Identification = docClean;
      payload.Payment.Instructions = "Não receber após o vencimento";
    } else if (type === "CreditCard" && request.card) {
      payload.Payment.Currency = "BRL";
      payload.Payment.Country = "BRA";
      payload.Payment.Installments = request.installments || 1;
      payload.Payment.Capture = true;
      payload.Payment.SoftDescriptor = `PED${request.orderId.substring(0, 10)}`;
      payload.Payment.CreditCard = {
        CardNumber: request.card.number.replace(/\D/g, ""),
        Holder: request.card.holderName.toUpperCase(),
        ExpirationDate: `${String(request.card.expMonth || request.card.expiryMonth).padStart(2, "0")}/${request.card.expYear || request.card.expiryYear}`,
        SecurityCode: request.card.cvv,
        Brand: Mapper.detectCardBrand(request.card.number),
      };
    } else if (type === "DebitCard" && request.card) {
      payload.Payment.Authenticate = true;
      // Retorna a URL de retorno para autenticação 3DS do banco
      payload.Payment.ReturnUrl = callbackUrl || "https://syncads.com.br";
      payload.Payment.DebitCard = {
        CardNumber: request.card.number.replace(/\D/g, ""),
        Holder: request.card.holderName.toUpperCase(),
        ExpirationDate: `${String(request.card.expMonth || request.card.expiryMonth).padStart(2, "0")}/${request.card.expYear || request.card.expiryYear}`,
        SecurityCode: request.card.cvv,
        Brand: Mapper.detectCardBrand(request.card.number),
      };
    }

    return payload;
  }

  /**
   * Converte resposta da Cielo para o padrão interno.
   */
  static toPaymentResponse(
    apiResponse: PaymentResponse,
    orderId: string
  ): InternalPaymentResponse {
    const payment = apiResponse.Payment;

    if (!payment || (!payment.PaymentId && !payment.ReturnCode)) {
      return {
        success: false,
        status: "failed",
        message: "Cielo recusou o pagamento (sem dados de pagamento retornados).",
        errorCode: "NO_PAYMENT_DATA",
        raw: apiResponse,
      };
    }

    // Código 1 (Authorized) ou 2 (PaymentConfirmed) representam aprovação ou pendente para PIX/Boleto
    const statusVal = Mapper.toPaymentStatus(payment.Status ?? 0);

    const response: InternalPaymentResponse = {
      success: statusVal === "approved" || statusVal === "pending",
      transactionId: orderId,
      gatewayTransactionId: payment.PaymentId || "",
      status: statusVal,
      message: payment.ReturnMessage || `Cielo status: ${payment.Status}`,
      raw: apiResponse,
    };

    if (payment.AuthorizationCode) response.authorizationCode = payment.AuthorizationCode;
    if (payment.ProofOfSale) response.nsu = payment.ProofOfSale;
    if (payment.Tid) response.tid = payment.Tid;

    if (payment.QrCodeString) {
      response.qrCode = payment.QrCodeString;
      response.pixData = {
        qrCode: payment.QrCodeString,
        qrCodeImage: payment.QrCodeBase64Image,
        amount: (payment.Amount || 0) / 100,
      };
    }

    if (payment.Url) {
      response.paymentUrl = payment.Url;
      response.redirectUrl = payment.Url;
      response.barcodeNumber = payment.BarCodeNumber;
      response.digitableLine = payment.DigitableLine;
      response.expiresAt = payment.ExpirationDate;
    } else if (payment.AuthenticationUrl) {
      // Usado para redirecionamento do Débito 3DS
      response.paymentUrl = payment.AuthenticationUrl;
      response.redirectUrl = payment.AuthenticationUrl;
    }

    return response;
  }

  /**
   * Converte resposta de consulta para PaymentStatusResponse.
   */
  static toPaymentStatusResponse(apiResponse: PaymentResponse): PaymentStatusResponse {
    const payment = apiResponse.Payment || {};
    return {
      transactionId: apiResponse.MerchantOrderId || "",
      gatewayTransactionId: payment.PaymentId || "",
      status: Mapper.toPaymentStatus(payment.Status ?? 0),
      amount: (payment.Amount || 0) / 100,
      currency: "BRL",
      paymentMethod: Mapper.mapCieloPaymentMethod(payment.Type || ""),
      createdAt: payment.ReceivedDate || new Date().toISOString(),
      updatedAt: payment.CapturedDate || payment.ReceivedDate || new Date().toISOString(),
      paidAt: payment.CapturedDate,
    };
  }

  /**
   * Normaliza os códigos de status da Cielo.
   */
  static toPaymentStatus(status: number | string): PaymentStatus {
    const code = Number(status);
    const map: Record<number, PaymentStatus> = {
      0: "pending",     // NotFinished
      1: "approved",    // Authorized
      2: "approved",    // PaymentConfirmed
      3: "failed",      // Denied
      10: "cancelled",  // Voided
      11: "refunded",   // Refunded
      12: "pending",     // Pending
      13: "cancelled",  // Aborted
      20: "pending",     // Scheduled
    };
    return map[code] || "pending";
  }

  /**
   * Mapeia tipo de pagamento da Cielo.
   */
  private static mapCieloPaymentMethod(type: string): PaymentMethod {
    const map: Record<string, PaymentMethod> = {
      Pix: PaymentMethod.PIX,
      CreditCard: PaymentMethod.CREDIT_CARD,
      DebitCard: PaymentMethod.DEBIT_CARD,
      Boleto: PaymentMethod.BOLETO,
    };
    return map[type] || PaymentMethod.CREDIT_CARD;
  }

  /**
   * Detecta a bandeira do cartão.
   */
  private static detectCardBrand(cardNumber?: string): string {
    if (!cardNumber) return "Visa";
    const num = cardNumber.replace(/\D/g, "");
    if (/^4/.test(num)) return "Visa";
    if (/^5[1-5]/.test(num)) return "Master";
    if (/^3[47]/.test(num)) return "Amex";
    if (/^6(?:011|5)/.test(num)) return "Discover";
    if (/^3(?:0[0-5]|[68])/.test(num)) return "Diners";
    if (/^35/.test(num)) return "JCB";
    if (/^636/.test(num)) return "Elo";
    if (/^606282/.test(num)) return "Hipercard";
    return "Visa";
  }
}
