// Tipos específicos para a API do PicPay
export interface Credentials {
  picpayToken: string;
  sellerToken: string;
}

export interface PaymentRequestPayload {
  referenceId: string;
  callbackUrl: string;
  returnUrl?: string;
  value: number;
  expiresAt: string;
  buyer: {
    firstName: string;
    lastName: string;
    document: string;
    email: string;
    phone?: string;
  };
  channel?: string;
}

export interface PaymentResponsePayload {
  referenceId: string;
  paymentUrl: string;
  expiresAt: string;
  qrcode?: {
    content: string;
    base64: string;
  };
}
