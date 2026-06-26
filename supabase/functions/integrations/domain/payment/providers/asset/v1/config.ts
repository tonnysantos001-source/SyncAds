// Endpoints e configurações para o provedor Asset
export const config = {
  endpoints: {
    production: "https://api.asset.com/v1",
    sandbox: "https://sandbox.asset.com/v1",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
