// Endpoints e configurações para o provedor Azcend
// Documentação: https://api.azcend.com/docs
export const config = {
  endpoints: {
    production: "https://api.azcend.com/v1",
    sandbox: "https://sandbox.azcend.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
