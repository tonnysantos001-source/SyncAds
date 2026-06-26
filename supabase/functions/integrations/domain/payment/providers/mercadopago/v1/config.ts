// Configurações oficiais da API do Mercado Pago v1
export const config = {
  endpoints: {
    production: "https://api.mercadopago.com",
    sandbox: "https://api.mercadopago.com", // Mercado Pago usa a mesma URL base com chaves de teste
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
