// Endpoints e configurações para o provedor Bravos Pay
export const config = {
  endpoints: {
    production: "https://api.bravos-pay.com/v1",
    sandbox: "https://sandbox.bravos-pay.com/v1",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
