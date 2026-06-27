// Endpoints e configurações para o provedor Dorapag
export const config = {
  endpoints: {
    production: "https://api.dorapag.com/v1",
    sandbox: "https://sandbox.dorapag.com/v1",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
