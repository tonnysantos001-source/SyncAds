// Endpoints e configurações para o provedor Cyberhub
export const config = {
  endpoints: {
    production: "https://api.cyberhub.com/v1",
    sandbox: "https://sandbox.cyberhub.com/v1",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
