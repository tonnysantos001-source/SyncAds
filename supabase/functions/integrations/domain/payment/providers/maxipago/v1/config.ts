// Endpoints e configurações para o provedor MaxiPago!
// Documentação: https://www.maxipago.com/developers/apidocs/
// API via XML — POST com Content-Type: text/xml
export const config = {
  endpoints: {
    production: "https://api.maxipago.net/UniversalAPI/postXML",
    sandbox: "https://testapi.maxipago.net/UniversalAPI/postXML",
    // Endpoint de consulta de relatórios/status
    productionReport: "https://api.maxipago.net/ReportsAPI/servlet/RPTRequest",
    sandboxReport: "https://testapi.maxipago.net/ReportsAPI/servlet/RPTRequest",
  },
  // processorID 1 = Simulador de Teste (sandbox), 2 = Rede, 4 = Cielo
  processorID: {
    sandbox: "1",
    production: "2",
  },
  timeoutMs: 15000,
  maxRetries: 3,
};
