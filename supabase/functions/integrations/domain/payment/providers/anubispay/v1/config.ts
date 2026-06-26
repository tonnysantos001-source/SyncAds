// Endpoints e configurações para o provedor AnubisPay
export const config = {
  endpoints: {
    production: "https://api.anubispay.com/v1",
    sandbox: "https://sandbox.anubispay.com/v1",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};
