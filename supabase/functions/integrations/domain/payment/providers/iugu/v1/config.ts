// Endpoints e configurações para o provedor Iugu
export const config = {
  endpoints: {
    production: "https://api.iugu.com/v1",
    sandbox: "https://api.iugu.com/v1", // Iugu utiliza a mesma URL com tokens de teste
  },
  timeoutMs: 8000,
  maxRetries: 3,
};
