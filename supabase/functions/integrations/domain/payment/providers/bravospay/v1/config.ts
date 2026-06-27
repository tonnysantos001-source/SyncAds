// Endpoints e configurações para o provedor Bravos Pay
// Documentação: https://bravospay.com.br
export const config = {
  endpoints: {
    production: "https://api.bravospay.com.br/v1",
    sandbox: "https://sandbox-api.bravospay.com.br/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
