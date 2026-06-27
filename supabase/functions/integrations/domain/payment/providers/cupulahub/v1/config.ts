// Endpoints e configurações para o provedor Cupulahub
export const config = {
  endpoints: {
    production: "https://api.cupula-hub.com/v1",
    sandbox: "https://sandbox.cupula-hub.com/v1",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
