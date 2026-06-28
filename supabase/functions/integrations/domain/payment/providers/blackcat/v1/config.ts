// Endpoints e configurações para o provedor Blackcat
// Documentação: https://api.blackcat.com/docs
export const config = {
  endpoints: {
    production: "https://api.blackcat.com/v1",
    sandbox: "https://sandbox.blackcat.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
