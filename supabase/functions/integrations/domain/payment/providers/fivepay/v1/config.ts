// Endpoints e configurações para o provedor Fivepay
// Documentação: https://api.fivepay.com/docs
export const config = {
  endpoints: {
    production: "https://api.fivepay.com/v1",
    sandbox: "https://sandbox.fivepay.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
