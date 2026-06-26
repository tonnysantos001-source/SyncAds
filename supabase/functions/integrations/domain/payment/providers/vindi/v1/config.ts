// Endpoints e configurações para o provedor Vindi
export const config = {
  endpoints: {
    production: "https://app.vindi.com.br/api/v1",
    sandbox: "https://sandbox-app.vindi.com.br/api/v1",
  },
  timeoutMs: 8000,
  maxRetries: 3,
};
