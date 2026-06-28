// Endpoints e configurações para o provedor Fast Pay
// Documentação: https://api.fast-pay.com/docs
export const config = {
  endpoints: {
    production: "https://api.fast-pay.com/v1",
    sandbox: "https://sandbox.fast-pay.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
