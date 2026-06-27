// Endpoints e configurações para o provedor Dubaipay
export const config = {
  endpoints: {
    production: "https://api.dubai-pay.com/v1",
    sandbox: "https://sandbox.dubai-pay.com/v1",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
