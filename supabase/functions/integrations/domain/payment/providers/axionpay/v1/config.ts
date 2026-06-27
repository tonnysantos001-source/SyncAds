// Endpoints e configurações para o provedor Axion Pay (Axiopay)
// Documentação: https://axiopay.com.br
export const config = {
  endpoints: {
    production: "https://api.axiopay.com.br/v1",
    sandbox: "https://sandbox.axiopay.com.br/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
