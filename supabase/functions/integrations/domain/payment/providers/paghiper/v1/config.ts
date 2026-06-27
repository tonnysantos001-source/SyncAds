// Endpoints e configurações para o provedor PagHiper
// Documentação oficial: https://dev.paghiper.com
// Suporte: suporte@paghiper.com | (11) 4063-8785
export const config = {
  endpoints: {
    // Boleto e Boleto Híbrido (com QR PIX)
    createTransaction: "https://api.paghiper.com/transaction/create/",
    // PIX dedicado
    createPix: "https://pix.paghiper.com/invoice/create/",
    // Consulta de status
    getStatus: "https://api.paghiper.com/transaction/status/",
    // Cancelamento
    cancelTransaction: "https://api.paghiper.com/transaction/cancel/",
    // Retorno automático (webhook configurado pelo painel)
    notificationUrl: "https://api.paghiper.com/transaction/notification/",
  },
  timeoutMs: 12000,
  maxRetries: 3,
};
