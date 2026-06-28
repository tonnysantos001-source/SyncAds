// Endpoints e configurações para o provedor Ever Pay
// Documentação: https://api.ever-pay.com/docs
export const config = {
  endpoints: {
    production: "https://api.ever-pay.com/v1",
    sandbox: "https://sandbox.ever-pay.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
