// Endpoints e configurações para o provedor Credwave
// Documentação: https://api.credwave.com/docs
export const config = {
  endpoints: {
    production: "https://api.credwave.com/v1",
    sandbox: "https://sandbox.credwave.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
