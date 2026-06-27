// Endpoints e configurações para o provedor Dias Marketplace
// Documentação: https://api.diasmarketplace.com/docs
export const config = {
  endpoints: {
    production: "https://api.diasmarketplace.com/v1",
    sandbox: "https://sandbox.diasmarketplace.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
