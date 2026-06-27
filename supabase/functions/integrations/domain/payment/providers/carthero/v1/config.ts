// Endpoints e configurações para o provedor Carthero
export const config = {
  endpoints: {
    production: "https://api.carthero.com/v1",
    sandbox: "https://sandbox.carthero.com/v1",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
