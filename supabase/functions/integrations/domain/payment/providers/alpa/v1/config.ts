// Endpoints e configurações para o provedor Alpa
// Documentação: https://api.alpa.com/docs
export const config = {
  endpoints: {
    production: "https://api.alpa.com/v1",
    sandbox: "https://sandbox.alpa.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
