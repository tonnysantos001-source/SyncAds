export interface Credentials {
  clientId: string;
  clientSecret: string;
}

export interface CelcoinPixRequest {
  amount: number;
  clientRequestId: string;
  debitParty?: any;
  creditParty?: any;
  key?: string;
}

export interface CelcoinResponse {
  transactionId?: number;
  clientRequestId?: string;
  status?: string; // "PAID", "CREATED", "PROCESSING", "EXPIRED", "ERROR", "CANCELLED"
  amount?: number;
  qrCode?: { emv?: string; base64?: string };
  emv?: string;
  errorCode?: string;
  message?: string;
}
