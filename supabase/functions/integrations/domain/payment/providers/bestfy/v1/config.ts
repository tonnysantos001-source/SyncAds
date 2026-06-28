// Endpoints e configurações para o provedor Bestfy
// Documentação: https://api.bestfy.com/docs
export const config = {
  endpoints: {
    production: "https://api.bestfy.com/v1",
    sandbox: "https://sandbox.bestfy.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
