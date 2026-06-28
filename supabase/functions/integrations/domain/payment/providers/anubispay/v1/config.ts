// Endpoints e configurações para o provedor AnubisPay
// Documentação: https://api.anubispay.com/docs
export const config = {
  endpoints: {
    production: "https://api.anubispay.com/v1",
    sandbox: "https://sandbox.anubispay.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
