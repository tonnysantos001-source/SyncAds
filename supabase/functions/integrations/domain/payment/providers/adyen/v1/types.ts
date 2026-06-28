// Tipos específicos para a API Adyen
export interface Credentials {
  apiKey: string;
  merchantAccount: string;
}

export interface CreatePaymentPayload {
  amount: { value: number; currency: string };
  merchantAccount: string;
  reference: string;
  paymentMethod: Record<string, any>;
  returnUrl?: string;
  shopperEmail?: string;
  shopperName?: { firstName: string; lastName: string };
  shopperReference?: string;
  countryCode?: string;
  additionalData?: Record<string, string>;
}

export interface PaymentResponse {
  pspReference?: string;
  resultCode?: string; // "Authorised" | "Refused" | "Pending" | "Received" | "Error"
  action?: { type: string; url?: string; qrCodeData?: string; paymentData?: string };
  amount?: { value: number; currency: string };
  refusalReason?: string;
  errorCode?: string;
  message?: string;
}
