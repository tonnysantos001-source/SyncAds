// Endpoints e configurações para o provedor Asaas
export const config = {
  endpoints: {
    production: "https://www.asaas.com/api/v3",
    sandbox: "https://sandbox.asaas.com/api/v3",
  },
  timeoutMs: 8000,
  maxRetries: 3,
};
