// Endpoints e configurações para o provedor Rede
// Documentação: https://www.userede.com.br/desenvolvedores
export const config = {
  endpoints: {
    production: "https://api.userede.com.br",
    sandbox: "https://sandbox.userede.com.br",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
