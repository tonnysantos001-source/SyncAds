// Tipos específicos para a API do Stripe
export interface Credentials {
  publishableKey: string;
  secretKey: string;
  webhookSecret?: string;
}

export interface PaymentRequestPayload {
  amount: number;
  currency: string;
  payment_method_types: string[];
  metadata?: Record<string, any>;
}

export interface PaymentResponsePayload {
  id: string;
  status: string;
  client_secret?: string;
  next_action?: {
    type: string;
    use_stripe_sdk?: any;
    redirect_to_url?: {
      url: string;
      return_url?: string;
    };
  };
  charges?: {
    data: Array<{
      outcome?: {
        seller_message?: string;
      };
    }>;
  };
  error?: {
    message: string;
    type: string;
  };
}
