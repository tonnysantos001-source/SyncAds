// Endpoints e configurações para o provedor Braza Pay
// Documentação: https://api.braza-pay.com/docs
export const config = {
  endpoints: {
    production: "https://api.braza-pay.com/v1",
    sandbox: "https://sandbox.braza-pay.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
