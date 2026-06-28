// Endpoints e configurações para o provedor Adyen
// Documentação: https://docs.adyen.com
export const config = {
  endpoints: {
    production: "https://checkout-live.adyen.com/v71",
    sandbox: "https://checkout-test.adyen.com/v71",
  },
  timeoutMs: 15000,
  maxRetries: 3,
};
