// Endpoints e configurações para o provedor Fly Payments
export const config = {
  endpoints: {
    production: "https://api.fly-payments.com/v1",
    sandbox: "https://sandbox.fly-payments.com/v1",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
