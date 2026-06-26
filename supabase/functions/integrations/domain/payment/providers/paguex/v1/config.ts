// Endpoints e configurações para o provedor Pague-X
export const config = {
  endpoints: {
    production: "https://api.inpagamentos.com/v1",
    sandbox: "https://api.inpagamentos.com/v1",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
