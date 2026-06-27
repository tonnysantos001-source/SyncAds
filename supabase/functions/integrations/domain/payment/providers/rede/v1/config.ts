// Endpoints e configurações para o provedor Rede (e.Rede)
// Documentação: https://developer.userede.com.br
// Suporte técnico: produtosapi@userede.com.br
export const config = {
  endpoints: {
    production: "https://api.userede.com.br/redelabs/v2",
    sandbox: "https://sandbox-erede.useredecloud.com.br/v2",
    oauthProduction: "https://api.userede.com.br/oauth/token",
    oauthSandbox: "https://sandbox-erede.useredecloud.com.br/oauth/token",
  },
  timeoutMs: 15000,
  maxRetries: 3,
};
