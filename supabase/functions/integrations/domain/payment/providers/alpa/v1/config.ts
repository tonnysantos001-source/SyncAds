// Endpoints e configurações para o provedor Alpa
export const config = {
  endpoints: {
    production: "https://api.alpa.com/v1",
    sandbox: "https://sandbox.alpa.com/v1",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
