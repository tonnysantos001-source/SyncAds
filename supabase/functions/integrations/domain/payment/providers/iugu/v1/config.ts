// Endpoints e configurações para o provedor Iugu
// Documentação: https://dev.iugu.com
export const config = {
  endpoints: {
    production: "https://api.iugu.com/v1",
    sandbox: "https://api.iugu.com/v1", // Iugu usa mesma base variando token/modo
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
