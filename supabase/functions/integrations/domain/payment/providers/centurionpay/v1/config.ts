// Endpoints e configurações para o provedor Centurion Pay
// Documentação: https://api.centurion-pay.com/docs
export const config = {
  endpoints: {
    production: "https://api.centurion-pay.com/v1",
    sandbox: "https://sandbox.centurion-pay.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
