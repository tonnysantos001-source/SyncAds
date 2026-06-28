// Endpoints e configurações para o provedor Appmax
// Documentação: https://api.appmax.com/docs
export const config = {
  endpoints: {
    production: "https://api.appmax.com/v1",
    sandbox: "https://sandbox.appmax.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
