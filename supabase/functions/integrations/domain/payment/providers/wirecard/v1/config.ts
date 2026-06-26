// Endpoints e configurações para o provedor Wirecard (Moip)
export const config = {
  endpoints: {
    production: "https://api.moip.com.br/v2",
    sandbox: "https://sandbox.moip.com.br/v2",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
