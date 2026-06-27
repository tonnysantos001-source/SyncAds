// Tipos específicos para a API Rede (e.Rede)
// Documentação: https://developer.userede.com.br

export interface Credentials {
  clientId: string;     // Client ID OAuth 2.0 — fornecido pela Rede
  clientSecret: string; // Client Secret OAuth 2.0 — fornecido pela Rede
  filiation?: string;   // Número de filiação/afiliação junto à Rede (PV)
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface CreateTransactionPayload {
  kind: "credit" | "debit";           // Tipo de transação
  reference: string;                   // Referência do pedido (orderId)
  amount: number;                      // Valor em centavos
  installments?: number;               // Parcelas (1–12)
  softDescriptor?: string;             // Nome na fatura do cartão
  capture?: boolean;                   // true = captura imediata
  card?: {
    number: string;
    expirationMonth: string;           // "MM"
    expirationYear: string;            // "YYYY"
    securityCode: string;
    holderName: string;
  };
  threeDSecure?: { embedded: boolean };
  urls?: Array<{ kind: "three-ds-callback" | "notification"; url: string }>;
}

export interface TransactionResponse {
  returnCode?: string;         // "00" = aprovado
  returnMessage?: string;
  tid?: string;                // Transaction ID
  nsu?: string;                // Número de série único
  authorizationCode?: string;
  kind?: string;
  reference?: string;
  amount?: number;
  status?: string;             // "approved" | "canceled" | "denied" | "pending"
  installments?: number;
  createdAt?: string;
}
