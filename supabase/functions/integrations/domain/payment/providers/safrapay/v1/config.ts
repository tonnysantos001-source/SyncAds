// Endpoints e configurações para o provedor SafraPay
// Documentação: https://www.safrapay.com.br/desenvolvedor
// Suporte: integracao.ecommerce@safra.com.br
export const config = {
  endpoints: {
    production: "https://api.safrapay.com.br/v1",
    sandbox: "https://sandbox.api.safrapay.com.br/v1",
    // OAuth 2.0 token
    oauthProduction: "https://api.safrapay.com.br/oauth/token",
    oauthSandbox: "https://sandbox.api.safrapay.com.br/oauth/token",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
