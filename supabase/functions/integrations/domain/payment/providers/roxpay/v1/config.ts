// Endpoints e configurações para o provedor RoxPay
// Documentação: https://app.roxpay.eu/apidocs/
export const config = {
  endpoints: {
    production: "https://api.roxpay.eu/v1",
    sandbox: "https://sandbox-api.roxpay.eu/v1",
    // OAuth 2.0 token
    oauthProduction: "https://api.roxpay.eu/v1/auth/token",
    oauthSandbox: "https://sandbox-api.roxpay.eu/v1/auth/token",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
