// Endpoints e configurações para o provedor Allus
export const config = {
  endpoints: {
    production: "https://api.allus.com/v1",
    sandbox: "https://sandbox.allus.com/v1",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
