// Endpoints e configurações para o provedor Carthero
// Documentação: https://api.carthero.com/docs
export const config = {
  endpoints: {
    production: "https://api.carthero.com/v1",
    sandbox: "https://sandbox.carthero.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
