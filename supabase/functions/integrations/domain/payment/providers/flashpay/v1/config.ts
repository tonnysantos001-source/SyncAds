// Endpoints e configurações para o provedor Flashpay
// Documentação: https://api.flashpay.com/docs
export const config = {
  endpoints: {
    production: "https://api.flashpay.com/v1",
    sandbox: "https://sandbox.flashpay.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
