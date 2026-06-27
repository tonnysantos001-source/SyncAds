// Endpoints e configurações para o provedor InfinitePay
// Documentação: https://www.infinitepay.io/desenvolvedores
// Empresa: CloudWalk, Inc.
export const config = {
  endpoints: {
    // Checkout Integrado (Links de pagamento) - sem ambiente sandbox separado
    createLink: "https://api.checkout.infinitepay.io/links",
    paymentCheck: "https://api.checkout.infinitepay.io/payment_check",
    // API de transações (legado com clientId/clientSecret)
    production: "https://api.infinitepay.io/v2",
    sandbox: "https://api.infinitepay.io/v2", // InfinitePay não tem sandbox separado
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
