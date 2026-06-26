// Endpoints e configurações para o provedor Ever Pay
export const config = {
  endpoints: {
    production: "https://api.everpayinc.com/v1",
    sandbox: "https://api.everpayinc.com/v1",
  },
  timeoutMs: 8000,
  maxRetries: 3,
};

