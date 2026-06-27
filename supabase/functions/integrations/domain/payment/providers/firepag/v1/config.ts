// Endpoints e configurações para o provedor Firepag
// Documentação: https://api.fire-pag.com/docs
export const config = {
  endpoints: {
    production: "https://api.fire-pag.com/v1",
    sandbox: "https://sandbox.fire-pag.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
