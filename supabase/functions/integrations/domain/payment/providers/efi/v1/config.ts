// Endpoints e configurações para o provedor Efí
// Documentação: https://api.efi.com.br/docs
export const config = {
  endpoints: {
    production: "https://api.efi.com/v1",
    sandbox: "https://sandbox.efi.com/v1",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
