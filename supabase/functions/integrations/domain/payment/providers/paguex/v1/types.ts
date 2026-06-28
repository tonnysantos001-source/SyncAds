// Tipos específicos para a API Pague-X
// Documentação: https://api.inpagamentos.com/docs

export interface Credentials {
  publicKey: string;    // Chave pública Pague-X
  secretKey: string;    // Chave secreta Pague-X
}

export interface CreatePaymentPayload {
  amount: number;         // Valor em centavos
  currency: "BRL";
  paymentMethod: "credit_card" | "pix" | "boleto";
  installments?: number;
  postbackUrl?: string;
  externalRef?: string;
  metadata?: string;      // JSON stringified
  customer: {
    name: string;
    email: string;
    phone: string;
    document: {
      type: "cpf" | "cnpj";
      number: string;     // CPF/CNPJ limpo
    };
    address?: {
      street: string;
      streetNumber: string;
      complement?: string;
      zipCode: string;
      neighborhood: string;
      city: string;
      state: string;
      country: "BR";
    };
  };
  card?: {
    number: string;
    holderName: string;
    expMonth: number;     // MM (number)
    expYear: number;      // YYYY (number)
    cvv: string;
  };
  cardToken?: string;     // Se gerado no frontend
  items?: Array<{
    title: string;
    unitPrice: number;    // Centavos
    quantity: number;
    tangible?: boolean;
  }>;
}

export interface PaymentResponse {
  id?: number | string;
  secureId?: string;
  status?: string;        // "waiting_payment" | "pending" | "approved" | "refused" | "refunded"
  secureUrl?: string;
  paidAt?: string;
  authorizationCode?: string;
  pix?: {
    qrcode?: string;
    qrcodeImage?: string;
    expirationDate?: string;
  };
  boleto?: {
    url?: string;
    barcode?: string;
    digitableLine?: string;
    expirationDate?: string;
  };
  error?: {
    message?: string;
    code?: string;
  };
  message?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
}
