// Tipos específicos para a API Cielo
// Documentação: https://developercielo.github.io/manual/cielo-ecommerce

export interface Credentials {
  merchantId: string;   // ID do estabelecimento comercial Cielo
  merchantKey: string;  // Chave de autenticação Cielo
}

export interface CreatePaymentPayload {
  MerchantOrderId: string;
  Customer: {
    Name: string;
    Email: string;
    Identity?: string;
    IdentityType?: string;
    Address?: {
      Street: string;
      Number: string;
      Complement?: string;
      District: string;
      City: string;
      State: string;
      Country: "BRA";
      ZipCode: string;
    };
  };
  Payment: {
    Type: "CreditCard" | "DebitCard" | "Boleto" | "Pix";
    Amount: number; // Em centavos
    Currency?: "BRL";
    Country?: "BRA";
    Installments?: number;
    Capture?: boolean;
    Authenticate?: boolean;
    ReturnUrl?: string;
    SoftDescriptor?: string;
    Provider?: string;
    BoletoNumber?: string;
    Assignor?: string;
    Demonstrative?: string;
    ExpirationDate?: string;
    Identification?: string;
    Instructions?: string;
    QrCodeExpiration?: number;
    CreditCard?: {
      CardNumber: string;
      Holder: string;
      ExpirationDate: string; // MM/YYYY
      SecurityCode: string;
      Brand: string;
    };
    DebitCard?: {
      CardNumber: string;
      Holder: string;
      ExpirationDate: string;
      SecurityCode: string;
      Brand: string;
    };
  };
}

export interface PaymentResponse {
  MerchantOrderId?: string;
  Customer?: any;
  Payment?: {
    PaymentId?: string;
    Type?: string;
    Amount?: number;
    ReceivedDate?: string;
    CapturedDate?: string;
    Status?: number;
    ReturnCode?: string;
    ReturnMessage?: string;
    QrCodeString?: string;
    QrCodeBase64Image?: string;
    AuthenticationUrl?: string;
    Url?: string; // Boleto url
    BarCodeNumber?: string;
    DigitableLine?: string;
    ExpirationDate?: string;
    AuthorizationCode?: string;
    ProofOfSale?: string;
    Tid?: string;
  };
}
