// Endpoints e configurações para o provedor Stone
// Documentação: https://docs.stone.com.br
export const config = {
  endpoints: {
    production: "https://api.stone.com.br",
    sandbox: "https://sandbox.api.stone.com.br",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
