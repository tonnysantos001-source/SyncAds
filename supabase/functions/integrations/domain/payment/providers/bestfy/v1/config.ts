// Endpoints e configurações para o provedor Bestfy
export const config = {
  endpoints: {
    production: "https://api.bestfybr.com.br/v1",
    sandbox: "https://api.bestfybr.com.br/v1", // Utiliza a mesma API com tokens de teste
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
