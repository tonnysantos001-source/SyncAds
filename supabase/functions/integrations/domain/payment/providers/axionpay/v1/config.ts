// Endpoints e configurações para o provedor Axion Pay
export const config = {
  endpoints: {
    production: "https://api.axion-pay.com/v1",
    sandbox: "https://sandbox.axion-pay.com/v1",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
