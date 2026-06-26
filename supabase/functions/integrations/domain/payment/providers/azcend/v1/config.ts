// Endpoints e configurações para o provedor Azcend
export const config = {
  endpoints: {
    production: "https://api.azcend.com/v1",
    sandbox: "https://sandbox.azcend.com/v1",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
