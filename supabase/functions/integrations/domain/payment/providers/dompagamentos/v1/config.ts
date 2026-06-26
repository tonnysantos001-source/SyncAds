// Endpoints e configurações para o provedor Dom Pagamentos
export const config = {
  endpoints: {
    production: "https://apiv3.dompagamentos.com.br/checkout/production",
    sandbox: "https://hml-apiv3.dompagamentos.com.br/checkout/sandbox",
  },
  timeoutMs: 8000,
  maxRetries: 3,
};
