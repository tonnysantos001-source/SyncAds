// Endpoints e configurações para o provedor SafetyPay
export const config = {
  endpoints: {
    production: "https://api.safetypay.com/v1",
    sandbox: "https://sandbox.safetypay.com/v1",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
