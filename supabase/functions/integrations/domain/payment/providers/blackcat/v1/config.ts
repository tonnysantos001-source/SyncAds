// Endpoints e configurações para o provedor Blackcat
export const config = {
  endpoints: {
    production: "https://api.blackcat.com/v1",
    sandbox: "https://sandbox.blackcat.com/v1",
  },
  timeoutMs: 8000,
  maxRetries: 3,
};
