// Endpoints e configurações para o provedor Fire Pag
export const config = {
  endpoints: {
    production: "https://api.fire-pag.com/v1",
    sandbox: "https://sandbox.fire-pag.com/v1",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
