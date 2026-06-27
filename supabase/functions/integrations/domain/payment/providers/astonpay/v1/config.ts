// Endpoints e configurações para o provedor Aston Pay
export const config = {
  endpoints: {
    production: "https://api.aston-pay.com/v1",
    sandbox: "https://sandbox.aston-pay.com/v1",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
