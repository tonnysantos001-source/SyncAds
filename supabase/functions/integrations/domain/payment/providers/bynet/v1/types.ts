// Tipos específicos para a API do Bynet
export interface Credentials {
  apiKey: string; // Mapeada para x-api-key
}

export interface PaymentRequestPayload {
  amount: number; // Em centavos (inteiro) ou decimal
  paymentMethod: "PIX" | "BOLETO" | "CREDIT_CARD";
  customer: {
    name: string;
    email: string;
    document: {
      number: string;
      type: "CPF" | "CNPJ";
    };
    phone?: string;
    externalRef?: string;
  };
  items: Array<{
    title: string;
    unitPrice: number;
    quantity: number;
  }>;
}

export interface PaymentResponsePayload {
  id: string;
  status: string;
  amount: number;
  qrCode?: string; // QR code text (copia e cola)
  checkoutUrl?: string; // payment link
  pdfUrl?: string; // boleto PDF url
  digitableLine?: string; // boleto digitable line
  created_at?: string;
}

