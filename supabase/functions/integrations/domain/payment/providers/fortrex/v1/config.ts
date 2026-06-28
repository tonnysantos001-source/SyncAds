// Endpoints e configurações para o provedor Fortrex
// Documentação: https://api.fortrex.com/docs
export const config = {
  endpoints: {
    production: "https://api.fortrex.com/v1",
    sandbox: "https://sandbox.fortrex.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
