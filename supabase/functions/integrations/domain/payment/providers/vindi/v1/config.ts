// Endpoints e configurações para o provedor Vindi
// Documentação: https://app.vindi.com.br/api/v1/docs
// Especialidade: Pagamentos recorrentes (assinaturas) + cartão + boleto
export const config = {
  endpoints: {
    production: "https://app.vindi.com.br/api/v1",
    sandbox: "https://sandbox-app.vindi.com.br/api/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
