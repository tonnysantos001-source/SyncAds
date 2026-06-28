// Endpoints e configurações para o provedor Flowspay
// Documentação: https://api.flowspay.com/docs
export const config = {
  endpoints: {
    production: "https://api.flowspay.com/v1",
    sandbox: "https://sandbox.flowspay.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
