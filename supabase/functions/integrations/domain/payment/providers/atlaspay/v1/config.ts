// Endpoints e configurações para o provedor Atlas Pay
export const config = {
  endpoints: {
    production: "https://api.atlas-pay.com/v1",
    sandbox: "https://sandbox.atlas-pay.com/v1",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
