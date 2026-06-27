// Endpoints e configurações para o provedor Cúpula Hub
// Documentação: https://api.cupula-hub.com/docs
export const config = {
  endpoints: {
    production: "https://api.cupula-hub.com/v1",
    sandbox: "https://sandbox.cupula-hub.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
