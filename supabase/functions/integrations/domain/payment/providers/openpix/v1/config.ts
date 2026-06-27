// Endpoints e configurações para o provedor OpenPix (Woovi)
// Documentação oficial: https://developers.woovi.com
// Plataforma: https://app.woovi.com
export const config = {
  endpoints: {
    production: "https://api.openpix.com.br/api/openpix/v1",
    sandbox: "https://api.woovi-sandbox.com/api/openpix/v1",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
