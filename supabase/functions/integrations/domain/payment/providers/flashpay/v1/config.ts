// Endpoints e configurações para o provedor FlashPay
export const config = {
  endpoints: {
    production: "https://api.flashpay.com/v1",
    sandbox: "https://sandbox.flashpay.com/v1",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
