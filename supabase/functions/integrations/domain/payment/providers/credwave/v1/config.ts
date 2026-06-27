// Endpoints e configurações para o provedor Credwave
export const config = {
  endpoints: {
    production: "https://api.credwave.com/v1",
    sandbox: "https://sandbox.credwave.com/v1",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
