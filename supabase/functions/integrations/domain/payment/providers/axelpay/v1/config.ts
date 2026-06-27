// Endpoints e configurações para o provedor Axelpay
// Documentação: https://www.axelpay.com
export const config = {
  endpoints: {
    production: "https://api.axelpay.com/v1",
    sandbox: "https://sandbox-api.axelpay.com/v1",
  },
  timeoutMs: 12500,
  maxRetries: 3,
};
