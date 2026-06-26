// Tipos específicos para a API da Cielo
export interface Credentials {
  merchantId: string;
  merchantKey: string;
}

export interface PaymentRequestPayload {
  MerchantOrderId: string;
  Customer: {
    Name: string;
    Email: string;
    Identity: string;
    IdentityType: "CPF" | "CNPJ";
    Address?: {
      Street: string;
      Number: string;
      Complement?: string;
      District: string;
      City: string;
      State: string;
      Country: string;
      ZipCode: string;
    };
  };
  Payment: {
    Type: "Pix" | "CreditCard" | "DebitCard" | "Boleto";
    Amount: number;
    Currency?: string;
    Country?: string;
    QrCodeExpiration?: number;
    Installments?: number;
    Capture?: boolean;
    SoftDescriptor?: string;
    Authenticate?: boolean;
    ReturnUrl?: string;
    CreditCard?: {
      CardNumber: string;
      Holder: string;
      ExpirationDate: string;
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
    Boleto?: {
      Provider: string;
      BoletoNumber?: string;
      Assignor?: string;
      Demonstrative?: string;
      ExpirationDate?: string;
      Instruction?: string;
    };
  };
}

export interface PaymentResponsePayload {
  MerchantOrderId: string;
  Customer: {
    Name: string;
    Identity: string;
  };
  Payment: {
    PaymentId: string;
    Type: string;
    Amount: number;
    Status: number;
    QrCodeString?: string;
    QrCodeBase64Image?: string;
    Url?: string;
    BarCodeNumber?: string;
    DigitableLine?: string;
    ExpirationDate?: string;
    AuthorizationCode?: string;
    ProofOfSale?: string;
    Tid?: string;
    AuthenticationUrl?: string;
    ReturnMessage?: string;
    BoletoNumber?: string;
  };
}
