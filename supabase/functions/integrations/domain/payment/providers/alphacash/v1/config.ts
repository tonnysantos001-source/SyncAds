// Endpoints e configurações para o provedor Alphacash
export const config = {
  endpoints: {
    production: "https://api.alphacash.com/v1",
    sandbox: "https://sandbox.alphacash.com/v1",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
