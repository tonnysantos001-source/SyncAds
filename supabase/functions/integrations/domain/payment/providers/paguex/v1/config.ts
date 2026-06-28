// Endpoints e configurações para o provedor Pague-X
// Documentação: https://api.inpagamentos.com/docs
export const config = {
  endpoints: {
    production: "https://api.inpagamentos.com/v1",
    sandbox: "https://api.inpagamentos.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
