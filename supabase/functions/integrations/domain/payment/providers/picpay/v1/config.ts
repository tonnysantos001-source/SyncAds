// Endpoints e configurações para o provedor PicPay
export const config = {
  endpoints: {
    production: "https://appws.picpay.com/ecommerce/public",
    sandbox: "https://appws.picpay.com/ecommerce/public",
  },
  timeoutMs: 8000,
  maxRetries: 3,
};
