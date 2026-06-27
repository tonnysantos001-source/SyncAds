// Endpoints e configurações para o provedor Dom Pagamentos
// Documentação: https://api.dom-pagamentos.com/docs
export const config = {
  endpoints: {
    production: "https://api.dom-pagamentos.com/v1",
    sandbox: "https://sandbox.dom-pagamentos.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
