// Endpoints e configurações para o provedor PicPay
// Documentação: https://ecommerce.picpay.com/doc/
export const config = {
  endpoints: {
    production: "https://appws.picpay.com/ecommerce/public",
    sandbox: "https://appws.picpay.com/ecommerce/public", // PicPay geralmente usa ambiente único ou validação por chave
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
