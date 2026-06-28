// Tipos específicos para a API PayPal
// Documentação: https://developer.paypal.com

export interface Credentials {
  clientId: string;
  clientSecret: string;
}

export interface CreateOrderPayload {
  intent: "CAPTURE" | "AUTHORIZE";
  purchase_units: Array<{
    reference_id: string;
    description?: string;
    custom_id?: string;
    soft_descriptor?: string;
    amount: {
      currency_code: string;
      value: string; // ex: "150.00"
      breakdown?: {
        item_total: {
          currency_code: string;
          value: string;
        };
      };
    };
    items?: Array<{
      name: string;
      description?: string;
      unit_amount: {
        currency_code: string;
        value: string;
      };
      quantity: string;
    }>;
  }>;
  payment_source?: {
    card?: {
      number: string;
      expiry: string; // YYYY-MM
      security_code: string;
      name: string;
      billing_address?: {
        address_line_1: string;
        address_line_2?: string;
        admin_area_2: string; // Cidade
        admin_area_1: string; // Estado
        postal_code: string;
        country_code: string;
      };
    };
  };
  application_context?: {
    brand_name?: string;
    locale?: string;
    landing_page?: "BILLING" | "LOGIN";
    shipping_preference?: "NO_SHIPPING" | "GET_FROM_FILE" | "SET_PROVIDED_ADDRESS";
    user_action?: "PAY_NOW" | "CONTINUE";
    return_url?: string;
    cancel_url?: string;
  };
}

export interface PaymentResponse {
  id?: string;
  status?: string; // "CREATED" | "SAVED" | "APPROVED" | "VOIDED" | "COMPLETED" | "PAYER_ACTION_REQUIRED"
  links?: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
  purchase_units?: Array<{
    reference_id: string;
    amount?: {
      currency_code?: string;
      value?: string;
    };
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount?: {
          currency_code?: string;
          value?: string;
        };
      }>;
    };
  }>;
  error?: {
    message?: string;
    name?: string;
  };
  error_description?: string;
}
