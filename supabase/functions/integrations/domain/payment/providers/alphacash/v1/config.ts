// Endpoints e configurações para o provedor Alphacash
// Documentação: https://api.alphacash.com/docs
export const config = {
  endpoints: {
    production: "https://api.alphacash.com/v1",
    sandbox: "https://sandbox.alphacash.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
