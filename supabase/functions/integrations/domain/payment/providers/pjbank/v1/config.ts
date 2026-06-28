export const config = {
  endpoints: {
    production: "https://api.pjbank.com.br",
    sandbox: "https://api.pjbank.com.br", // PJBank uses separate test credentials on the same endpoint
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
