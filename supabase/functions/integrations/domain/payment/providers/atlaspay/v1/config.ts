// Endpoints e configurações para o provedor Atlas Pay
// Documentação: https://www.atlaspay.com.br
export const config = {
  endpoints: {
    production: "https://api.atlaspay.com.br/v1",
    sandbox: "https://sandbox-api.atlaspay.com.br/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
