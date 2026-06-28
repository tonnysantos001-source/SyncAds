// Endpoints e configurações para o provedor Allus
// Documentação: https://api.allus.com/docs
export const config = {
  endpoints: {
    production: "https://api.allus.com/v1",
    sandbox: "https://sandbox.allus.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
