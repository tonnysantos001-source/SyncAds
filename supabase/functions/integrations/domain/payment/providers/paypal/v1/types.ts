// Tipos específicos para a API do PayPal
export interface Credentials {
  clientId: string;
  clientSecret: string;
}

export interface PaymentRequestPayload {
  intent: "CAPTURE" | "AUTHORIZE";
  purchase_units: Array<{
    reference_id: string;
    description?: string;
    custom_id?: string;
    soft_descriptor?: string;
    amount: {
      currency_code: string;
      value: string;
      breakdown?: any;
    };
    items?: Array<any>;
    payment_source?: any;
  }>;
  payment_source?: {
    card?: {
      number: string;
      expiry: string;
      security_code: string;
      name: string;
      billing_address?: {
        address_line_1: string;
        address_line_2?: string;
        admin_area_2: string;
        admin_area_1: string;
        postal_code: string;
        country_code: string;
      };
    };
  };
  application_context?: {
    brand_name?: string;
    locale?: string;
    landing_page?: string;
    shipping_preference?: string;
    user_action?: string;
    return_url: string;
    cancel_url: string;
  };
}

export interface PaymentResponsePayload {
  id: string;
  status: string;
  links?: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
  purchase_units?: Array<{
    reference_id: string;
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount?: {
          value: string;
          currency_code: string;
        };
      }>;
    };
  }>;
}
