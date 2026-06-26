// Endpoints e configurações para o provedor HyperCash
export const config = {
  endpoints: {
    production: "https://api.hypercashbrasil.com.br",
    sandbox: "https://api.hypercashbrasil.com.br", // Usa a mesma API com chaves de teste ou sandbox
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
