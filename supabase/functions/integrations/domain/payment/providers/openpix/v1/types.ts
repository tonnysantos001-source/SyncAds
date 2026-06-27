// Tipos específicos para a API OpenPix (Woovi)
// Documentação: https://developers.woovi.com

export interface Credentials {
  // AppID gerado em app.woovi.com > API/Plugins > Nova Aplicação
  appId: string;
}

// Customer para cobranças OpenPix
export interface OpenPixCustomer {
  name: string;
  email?: string;
  taxID?: string;       // CPF ou CNPJ (apenas dígitos)
  phone?: string;       // Ex: "+5511999887766"
}

// Payload para criar uma cobrança PIX
export interface CreateChargePayload {
  correlationID: string;     // ID único de controle (seu orderId)
  value: number;             // Valor em CENTAVOS (ex: 1000 = R$10,00)
  comment?: string;          // Descrição da cobrança
  expiresIn?: number;        // Tempo de expiração em segundos (padrão: 3600)
  customer?: OpenPixCustomer;
  additionalInfo?: Array<{ key: string; value: string }>;
}

// Resposta de criação de cobrança
export interface CreateChargeResponse {
  charge?: {
    correlationID: string;
    value: number;
    status: string;         // "ACTIVE" | "COMPLETED" | "EXPIRED"
    identifier: string;
    qrCodeImage: string;    // URL da imagem do QR code
    brCode: string;         // PIX copia e cola (EMV)
    transactionID?: string;
    paymentLinkUrl?: string;
    expiresDate?: string;
    createdAt?: string;
  };
  error?: string;
}

// Resposta de consulta de cobrança
export interface GetChargeResponse {
  charge?: {
    correlationID: string;
    value: number;
    status: string;
    identifier: string;
    brCode?: string;
    qrCodeImage?: string;
    paymentLinkUrl?: string;
    transactionID?: string;
    paidAt?: string;
    createdAt?: string;
    expiresDate?: string;
  };
  error?: string;
}

// Payload de webhook enviado pela OpenPix
export interface WebhookPayload {
  event: string;            // "OPENPIX:CHARGE_COMPLETED" | "OPENPIX:CHARGE_EXPIRED" | etc.
  charge?: {
    correlationID: string;
    status: string;
    identifier: string;
    value: number;
    transactionID?: string;
    paidAt?: string;
  };
  pix?: {
    transactionID: string;
    value: number;
    status?: string;
  };
}
