// Endpoints e configurações para o provedor PayPal
export const config = {
  endpoints: {
    production: "https://api.paypal.com",
    sandbox: "https://api.sandbox.paypal.com",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
