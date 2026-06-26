// Tipos específicos para a API do Wirecard (Moip)
export interface Credentials {
  token: string;
  key: string;
}

export interface OrderRequestPayload {
  ownId: string;
  amount: {
    currency: string;
    total: number; // Em centavos
  };
  customer: {
    ownId: string;
    fullname: string;
    email: string;
    taxDocument: {
      type: "CPF" | "CNPJ";
      number: string;
    };
    phone?: {
      countryCode: string;
      areaCode: string;
      number: string;
    };
  };
  items: Array<{
    product: string;
    quantity: number;
    detail?: string;
    price: number; // Em centavos
  }>;
}

export interface PaymentRequestPayload {
  installmentCount: number;
  fundingInstrument: {
    method: "PIX" | "CREDIT_CARD" | "BOLETO";
    creditCard?: {
      hash?: string; // Token de cartão ou dados criptografados
      holder: {
        fullname: string;
        birthDate: string;
        taxDocument: {
          type: "CPF" | "CNPJ";
          number: string;
        };
        phone: {
          countryCode: string;
          areaCode: string;
          number: string;
        };
      };
    };
    boleto?: {
      expirationDate: string;
      instructionLines?: {
        first?: string;
        second?: string;
        third?: string;
      };
    };
  };
}

export interface PaymentResponsePayload {
  id: string;
  status: string;
  amount: {
    total: number;
    fees?: number;
    refunds?: number;
  };
  fundingInstrument: {
    method: string;
  };
  qrCode?: {
    text: string;
    image: string; // Base64
    expirationDate: string;
  };
  _links?: {
    payBoleto?: {
      pdf: string;
      print: string;
    };
  };
  events?: Array<{
    type: string;
    createdAt: string;
  }>;
}
