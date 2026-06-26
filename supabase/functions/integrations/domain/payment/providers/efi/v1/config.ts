// Endpoints e configurações para o provedor Efí
export const config = {
  endpoints: {
    production: "https://api.efi.com/v1",
    sandbox: "https://sandbox.efi.com/v1",
  },
  timeoutMs: 8000,
  maxRetries: 3,
};
