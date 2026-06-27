// Endpoints e configurações para o provedor Cyberhub
// Documentação: https://api.cyberhub.com/docs
export const config = {
  endpoints: {
    production: "https://api.cyberhub.com/v1",
    sandbox: "https://sandbox.cyberhub.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
