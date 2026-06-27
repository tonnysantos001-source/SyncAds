// Endpoints e configurações para o provedor Axelpay
export const config = {
  endpoints: {
    production: "https://api.axelpay.com/v1",
    sandbox: "https://sandbox.axelpay.com/v1",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
