// Endpoints e configurações para o provedor Dubaipay
// Documentação: https://api.dubai-pay.com/docs
export const config = {
  endpoints: {
    production: "https://api.dubai-pay.com/v1",
    sandbox: "https://sandbox.dubai-pay.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
