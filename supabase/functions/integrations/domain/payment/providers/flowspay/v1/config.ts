// Endpoints e configurações para o provedor Flowspay
export const config = {
  endpoints: {
    production: "https://api.flowspay.com/v1",
    sandbox: "https://sandbox.flowspay.com/v1",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
