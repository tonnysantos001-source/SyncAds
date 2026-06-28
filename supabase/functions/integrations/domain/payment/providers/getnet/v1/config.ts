// Endpoints e configurações para o provedor GetNet
// Documentação: https://api.getnet.com.br
export const config = {
  endpoints: {
    production: "https://api.getnet.com.br",
    sandbox: "https://api-sandbox.getnet.com.br",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
