// Endpoints e configurações para o provedor Bynet
// Documentação: https://api.bynet.com/docs
export const config = {
  endpoints: {
    production: "https://api.bynet.com/v1",
    sandbox: "https://sandbox.bynet.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
