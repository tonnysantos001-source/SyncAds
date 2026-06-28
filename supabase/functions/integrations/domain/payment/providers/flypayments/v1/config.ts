// Endpoints e configurações para o provedor Flypayments
// Documentação: https://api.fly-payments.com/docs
export const config = {
  endpoints: {
    production: "https://api.fly-payments.com/v1",
    sandbox: "https://sandbox.fly-payments.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
