// Endpoints e configurações para o provedor FreePay
export const config = {
  endpoints: {
    production: "https://api.freepay.com/v1",
    sandbox: "https://sandbox.freepay.com/v1",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
