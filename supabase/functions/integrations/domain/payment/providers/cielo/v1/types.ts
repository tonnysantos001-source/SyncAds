// Tipos específicos para a API Cielo E-commerce 3.0
// Documentação: https://developercielo.github.io/manual/cielo-ecommerce

export interface Credentials {
  merchantId: string;   // GUID do comerciante
  merchantKey: string;  // Chave de segurança do comerciante
}

export interface CreditCardData {
  cardNumber: string;
  holder: string;
  expirationDate: string; // Formato: "MM/YYYY"
  securityCode: string;
  brand: string;          // Visa, Master, Elo, Amex etc.
}

export interface CreateSalePayload {
  merchantOrderId: string; // Referência interna da transação (orderId)
  customer: {
    name: string;
    email?: string;
    identity?: string;     // CPF ou CNPJ
    identityType?: "CPF" | "CNPJ";
  };
  payment: {
    type: "CreditCard" | "DebitCard" | "Boleto" | "Pix";
    amount: number;        // Valor em centavos (ex: 1000 = R$10,00)
    installments: number;  // Quantidade de parcelas
    softDescriptor?: string; // Nome que aparece na fatura (máx 13 chars)
    capture?: boolean;     // Captura automática
    creditCard?: CreditCardData;
  };
}

export interface CreateSaleResponse {
  merchantOrderId?: string;
  customer?: {
    name: string;
  };
  payment?: {
    paymentId: string;
    type: string;
    amount: number;
    status: number;        // 1 = Autorizado, 2 = Pago, 3 = Negado, 10 = Pendente, 12 = Pendente de Consulta
    returnCode?: string;
    returnMessage?: string;
    authorizationCode?: string;
    proofOfSale?: string;  // NSU
    links?: Array<{ rel: string; href: string; method: string }>;
    qrCode?: string;       // Imagem em Base64
    qrCodeString?: string; // Payload do PIX (EMV)
  };
}

export interface QuerySaleResponse {
  merchantOrderId?: string;
  customer?: {
    name: string;
  };
  payment?: {
    paymentId: string;
    type: string;
    amount: number;
    status: number;
    returnCode?: string;
    returnMessage?: string;
    authorizationCode?: string;
    proofOfSale?: string;
    links?: Array<{ rel: string; href: string; method: string }>;
  };
}
