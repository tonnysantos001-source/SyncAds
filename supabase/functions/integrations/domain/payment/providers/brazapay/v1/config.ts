// Endpoints e configurações para o provedor Braza Pay
export const config = {
  endpoints: {
    production: "https://api.brazapay.com.br/v1",
    sandbox: "https://sandbox.brazapay.com.br/v1",
  },
  timeoutMs: 8000,
  maxRetries: 3,
};
