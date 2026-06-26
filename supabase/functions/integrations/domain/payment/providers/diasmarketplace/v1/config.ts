// Endpoints e configurações para o provedor Dias Marketplace
export const config = {
  endpoints: {
    production: "https://api.diasmarketplace.com.br/v1",
    sandbox: "https://sandbox.diasmarketplace.com.br/v1",
  },
  timeoutMs: 8000,
  maxRetries: 3,
};
