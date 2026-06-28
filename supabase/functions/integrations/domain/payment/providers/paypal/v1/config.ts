// Endpoints e configurações para o provedor PayPal
// Documentação: https://developer.paypal.com
export const config = {
  endpoints: {
    production: "https://api.paypal.com",
    sandbox: "https://api.sandbox.paypal.com",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
