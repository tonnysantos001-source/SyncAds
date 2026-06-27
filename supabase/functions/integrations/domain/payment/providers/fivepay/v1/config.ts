// Endpoints e configurações para o provedor Fivepay
export const config = {
  endpoints: {
    production: "https://api.fivepay.com/v1",
    sandbox: "https://sandbox.fivepay.com/v1",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
