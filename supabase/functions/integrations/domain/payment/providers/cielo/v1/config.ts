// Endpoints e configurações para o provedor Cielo (API 3.0)
// Documentação: https://developercielo.github.io/manual/cielo-ecommerce
// Sandbox: https://cadastrosandbox.cieloecommerce.cielo.com.br
export const config = {
  endpoints: {
    production: "https://api.cieloecommerce.cielo.com.br/1",
    productionQuery: "https://apiquery.cieloecommerce.cielo.com.br/1",
    sandbox: "https://apisandbox.cieloecommerce.cielo.com.br/1",
    sandboxQuery: "https://apiquerysandbox.cieloecommerce.cielo.com.br/1",
  },
  timeoutMs: 15000,
  maxRetries: 3,
};
