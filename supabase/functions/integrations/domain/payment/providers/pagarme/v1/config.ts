// Endpoints e configurações para o provedor Pagar.me
export const config = {
  endpoints: {
    production: "https://api.pagar.me/core/v5",
    sandbox: "https://api.pagar.me/core/v5",
  },
  timeoutMs: 8000,
  maxRetries: 3,
};
