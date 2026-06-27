// Endpoints e configurações para o provedor Codiguz Hub
// Documentação: https://api.codiguz-hub.com/docs
export const config = {
  endpoints: {
    production: "https://api.codiguz-hub.com/v1",
    sandbox: "https://sandbox.codiguz-hub.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
