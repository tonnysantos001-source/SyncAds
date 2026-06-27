// Endpoints e configurações para o provedor Centurion Pay
export const config = {
  endpoints: {
    production: "https://api.centurion-pay.com/v1",
    sandbox: "https://sandbox.centurion-pay.com/v1",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
