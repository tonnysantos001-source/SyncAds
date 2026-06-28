// Endpoints e configurações para o provedor Cielo
// Documentação: https://developercielo.github.io/manual/cielo-ecommerce
export const config = {
  endpoints: {
    production: "https://api.cieloecommerce.cielo.com.br",
    sandbox: "https://apisandbox.cieloecommerce.cielo.com.br",
  },
  queryEndpoints: {
    production: "https://apiquery.cieloecommerce.cielo.com.br",
    sandbox: "https://apiquerysandbox.cieloecommerce.cielo.com.br",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
