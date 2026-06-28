// Endpoints e configurações para o provedor Asset
// Documentação: https://api.asset.com/docs
export const config = {
  endpoints: {
    production: "https://api.asset.com/v1",
    sandbox: "https://sandbox.asset.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
