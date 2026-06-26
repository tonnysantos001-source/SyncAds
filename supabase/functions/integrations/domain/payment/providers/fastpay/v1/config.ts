// Endpoints e configurações para o provedor Fast Pay
export const config = {
  endpoints: {
    production: "https://api-global.fastpaybrasil.com/v1",
    sandbox: "https://api-global.fastpaybrasil.com/v1", // Utiliza a mesma URL base com credenciais de sandbox
  },
  timeoutMs: 8000,
  maxRetries: 3,
};
