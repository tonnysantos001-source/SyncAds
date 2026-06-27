// Endpoints e configurações para o provedor Credpago
// Documentação: https://api.credpago.com/docs
export const config = {
  endpoints: {
    production: "https://api.credpago.com/v1",
    sandbox: "https://sandbox.credpago.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
