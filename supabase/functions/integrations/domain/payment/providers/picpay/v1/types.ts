// Tipos específicos para a API PicPay
// Documentação: https://ecommerce.picpay.com/doc/

export interface Credentials {
  picpayToken: string;  // x-picpay-token
  sellerToken: string;  // x-seller-token
}

export interface CreatePaymentPayload {
  referenceId: string;
  callbackUrl: string;
  returnUrl?: string;
  value: number; // ex: 150.00 (decimal)
  expiresAt?: string;
  buyer: {
    firstName: string;
    lastName: string;
    document: string;
    email: string;
    phone?: string;
  };
  channel?: "ecommerce";
}

export interface PaymentResponse {
  referenceId?: string;
  paymentUrl?: string;
  qrcode?: {
    content?: string;
    base64?: string;
  };
  expiresAt?: string;
  status?: string; // "created" | "analysis" | "paid" | "completed" | "refunded" | "expired" | "cancelled"
  authorizationId?: string;
  value?: number;
  createdAt?: string;
  updatedAt?: string;
  message?: string;
  error?: {
    message?: string;
  };
}
