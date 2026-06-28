// Endpoints e configurações para o provedor SafetyPay
// Documentação: https://api.safetypay.com/v1
export const config = {
  endpoints: {
    production: "https://api.safetypay.com/v1",
    sandbox: "https://sandbox.safetypay.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
