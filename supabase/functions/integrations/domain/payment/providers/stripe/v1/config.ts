// Endpoints e configurações para o provedor Stripe
export const config = {
  endpoints: {
    production: "https://api.stripe.com/v1",
    sandbox: "https://api.stripe.com/v1", // Stripe uses the same endpoint for production and sandbox (credentials separate them)
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
