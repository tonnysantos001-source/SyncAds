// Endpoints e configurações para o provedor Fortrex
export const config = {
  endpoints: {
    production: "https://api.fortrex.com/v1",
    sandbox: "https://sandbox.fortrex.com/v1",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
