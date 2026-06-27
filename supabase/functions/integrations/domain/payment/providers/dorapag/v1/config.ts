// Endpoints e configurações para o provedor Dorapag
// Documentação: https://api.dorapag.com/docs
export const config = {
  endpoints: {
    production: "https://api.dorapag.com/v1",
    sandbox: "https://sandbox.dorapag.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
