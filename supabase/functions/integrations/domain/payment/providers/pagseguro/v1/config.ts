// Endpoints e configurações para o provedor PagSeguro
export const config = {
  endpoints: {
    production: "https://api.pagseguro.com",
    sandbox: "https://sandbox.api.pagseguro.com",
  },
  timeoutMs: 8000,
  maxRetries: 3,
};
