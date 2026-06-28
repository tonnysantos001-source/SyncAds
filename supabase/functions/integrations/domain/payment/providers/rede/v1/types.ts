// Tipos específicos para a API Rede
// Documentação: https://www.userede.com.br/desenvolvedores

export interface Credentials {
  pv: string;     // Código de afiliação do estabelecimento comercial Rede
  token: string;  // Token de autorização Bearer
}

export interface CreateTransactionPayload {
  capture?: boolean;
  kind: "pix" | "credit" | "debit" | "boleto";
  reference: string;
  amount: number; // Centavos
  installments?: number;
  cardHolderName?: string;
  cardNumber?: string;
  expirationMonth?: string; // MM
  expirationYear?: string;  // YYYY
  securityCode?: string;
  pix?: {
    expirationTime?: number;
  };
  boleto?: {
    expirationDate: string;
    instructions?: string;
  };
  urls?: Array<{
    kind: "callback";
    url: string;
  }>;
}

export interface PaymentResponse {
  tid?: string;
  nsu?: string;
  authorizationCode?: string;
  returnCode?: string;
  status?: string;
  amount?: number;
  kind?: string;
  dateTime?: string;
  pix?: {
    qrCode?: string;
    qrCodeBase64?: string;
  };
  boleto?: {
    url?: string;
    barcode?: string;
    digitableLine?: string;
    expirationDate?: string;
  };
  error?: {
    message?: string;
  };
  message?: string;
}
