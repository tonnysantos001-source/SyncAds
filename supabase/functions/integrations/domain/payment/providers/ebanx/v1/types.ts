export interface Credentials { integrationKey: string; publicIntegrationKey: string; }
export interface EBANXPaymentPayload {
  integration_key: string; operation: string; mode: string;
  payment: {
    name: string; email: string; document: string; birth_date?: string;
    phone_number?: string; currency_code: string; amount_total: string;
    payment_type_code: string; merchant_payment_code: string;
    creditcard?: { card_number: string; card_name: string; card_due_date: string; card_cvv: string };
    zipcode?: string; address?: string; street_number?: string; city?: string; state?: string; country?: string;
  };
}
export interface EBANXPaymentResponse {
  payment?: { hash?: string; pin?: string; merchant_payment_code?: string; status?: string; amount_br?: string; amount_ext?: string; boleto_url?: string; boleto_barcode?: string; pix_qr_code?: string; pix_qr_code_image?: string };
  status?: string; status_code?: string; status_message?: string;
}
