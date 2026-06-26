// Tipos específicos para a API da Rede
export interface Credentials {
  pv: string;
  token: string;
}

export interface PaymentRequestPayload {
  capture: boolean;
  kind: "pix" | "credit" | "debit" | "boleto";
  reference: string;
  amount: number; // Em centavos
  installments?: number;
  cardHolderName?: string;
  cardNumber?: string;
  expirationMonth?: string;
  expirationYear?: string;
  securityCode?: string;
  pix?: {
    expirationTime: number;
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

export interface PaymentResponsePayload {
  tid: string;
  reference: string;
  status: string;
  returnCode: string;
  returnMessage?: string;
  authorizationCode?: string;
  nsu?: string;
  amount?: number;
  kind?: string;
  dateTime?: string;
  pix?: {
    qrCode: string;
    qrCodeBase64: string;
  };
  boleto?: {
    url: string;
    barcode: string;
    digitableLine: string;
    expirationDate: string;
  };
}
