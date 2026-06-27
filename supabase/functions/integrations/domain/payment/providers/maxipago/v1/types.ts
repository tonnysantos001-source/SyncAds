// Tipos específicos para a API MaxiPago!
// API baseada em XML — documentação: https://www.maxipago.com/developers/apidocs/

export interface Credentials {
  merchantId: string;   // ID do lojista fornecido pela MaxiPago!
  merchantKey: string;  // Chave de segurança do lojista
}

export interface CardData {
  number: string;       // Número do cartão (apenas dígitos)
  expMonth: string;     // Mês de expiração (2 dígitos, ex: "12")
  expYear: string;      // Ano de expiração (4 dígitos, ex: "2027")
  cvvNumber: string;    // Código de segurança
  holderName: string;   // Nome do titular
}

// Parâmetros de uma transação de venda (sale) ou autorização (auth)
export interface TransactionParams {
  referenceNum: string;        // Referência do pedido no sistema do lojista
  chargeTotal: string;         // Valor total no formato "10.00"
  processorID: string;         // ID do processador/adquirente
  numberOfInstallments?: string; // Parcelas (default "1")
  card?: CardData;
  billing?: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    postalcode?: string;
    country?: string;
  };
}

// Resposta XML parseada da MaxiPago
export interface TransactionResponse {
  orderID?: string;            // ID do pedido na MaxiPago
  referenceNum?: string;       // Referência do pedido
  transactionID?: string;      // ID da transação
  authCode?: string;           // Código de autorização
  responseCode?: string;       // "0" = aprovado
  responseMessage?: string;    // Mensagem de retorno
  processorCode?: string;      // Código do processador
  processorMessage?: string;   // Mensagem do processador
  processorTransactionID?: string;
  errorMessage?: string;       // Mensagem de erro (se houver)
}
