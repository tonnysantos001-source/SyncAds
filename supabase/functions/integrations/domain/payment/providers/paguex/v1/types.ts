// Tipos específicos para a API do Pague-X
export interface Credentials {
  publicKey: string;
  secretKey: string;
}

export interface PaymentRequestPayload {
  amount: number; // centavos
  currency: string;
  paymentMethod: string;
  installments: number;
  postbackUrl?: string;
  metadata?: string;
  externalRef?: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    document: {
      type: string;
      number: string;
    };
    address?: {
      street: string;
      streetNumber: string;
      complement: string;
      zipCode: string;
      neighborhood: string;
      city: string;
      state: string;
      country: string;
    };
  };
  items: Array<{
    title: string;
    unitPrice: number;
    quantity: number;
    tangible: boolean;
  }>;
  cardToken?: string;
  card?: {
    number: string;
    holderName: string;
    expMonth: number;
    expYear: number;
    cvv: string;
  };
}

export interface PaymentResponsePayload {
  id: number | string;
  secureId?: string;
  secureUrl?: string;
  status: string;
  paidAt?: string;
  authorizationCode?: string;
  pix?: {
    qrcode: string;
    qrcodeImage: string;
    expirationDate: string;
  };
  boleto?: {
    url: string;
    barcode: string;
    digitableLine: string;
    expirationDate: string;
  };
  currency?: string;
  amount?: number;
  createdAt?: string;
  updatedAt?: string;
  refundedAmount?: number;
}
