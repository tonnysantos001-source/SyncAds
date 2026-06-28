// Endpoints e configurações para o provedor Freepay
// Documentação: https://api.freepay.com/docs
export const config = {
  endpoints: {
    production: "https://api.freepay.com/v1",
    sandbox: "https://sandbox.freepay.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
