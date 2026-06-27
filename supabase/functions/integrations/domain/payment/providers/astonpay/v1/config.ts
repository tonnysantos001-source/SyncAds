// Endpoints e configurações para o provedor Aston Pay
// Documentação: https://astonpay.com/developers
export const config = {
  endpoints: {
    production: "https://api.astonpay.com/v1",
    sandbox: "https://sandbox-api.astonpay.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
