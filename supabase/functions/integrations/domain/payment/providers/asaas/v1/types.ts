// Tipos específicos para a API do Asaas
export interface Credentials {
  apiKey: string;
}

export interface PaymentRequestPayload {
  customer: string;
  billingType: "PIX" | "CREDIT_CARD" | "BOLETO";
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  pixAddressKeyType?: string;
  expirationSeconds?: number;
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  };
}

export interface PaymentResponsePayload {
  id: string;
  status: string;
  value: number;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  nossoNumero?: string;
  identificationField?: string;
  dueDate: string;
}
