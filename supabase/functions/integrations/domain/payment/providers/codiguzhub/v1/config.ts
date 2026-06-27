// Endpoints e configurações para o provedor Codiguz Hub
export const config = {
  endpoints: {
    production: "https://api.codiguz-hub.com/v1",
    sandbox: "https://sandbox.codiguz-hub.com/v1",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
