// Endpoints e configurações para o provedor CredPago
export const config = {
  endpoints: {
    production: "https://api.credpago.com/v1",
    sandbox: "https://sandbox.credpago.com/v1",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
