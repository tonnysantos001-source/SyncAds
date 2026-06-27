// Tipos específicos para a API do PagHiper
// Documentação: https://dev.paghiper.com

export interface Credentials {
  // API Key da conta PagHiper (ex: apk_...)
  apiKey: string;
  // Token de segurança gerado no painel (Minha Conta > Credenciais)
  token: string;
}

// Item da cobrança PagHiper
export interface PagHiperItem {
  description: string;     // Descrição do produto/serviço
  quantity: number;        // Quantidade
  price_cents: number;     // Preço unitário em CENTAVOS (ex: 1000 = R$10,00)
  item_id?: string;        // ID interno do item (opcional)
}

// Payload base para criação de transação (Boleto / PIX)
export interface CreateTransactionPayload {
  apiKey: string;
  token: string;
  order_id: string;              // ID do pedido no seu sistema
  payer_email: string;           // E-mail do pagador
  payer_name: string;            // Nome completo do pagador
  payer_cpf_cnpj: string;        // CPF ou CNPJ (apenas dígitos)
  payer_phone?: string;          // Telefone do pagador
  payer_street?: string;         // Rua do pagador
  payer_number?: string;         // Número do endereço
  payer_complement?: string;     // Complemento
  payer_district?: string;       // Bairro
  payer_city?: string;           // Cidade
  payer_state?: string;          // UF (2 letras)
  payer_zip_code?: string;       // CEP (apenas dígitos)
  days_due_date: number;         // Dias até o vencimento (mín: 2 para boleto)
  type_bank_slip?: string;       // Tipo: "boletoA4" | "boletoHalfPage"
  notification_url?: string;     // URL de webhook para notificação
  discount_cents?: number;       // Desconto em centavos
  shipping_price_cents?: number; // Frete em centavos
  fixed_description?: boolean;   // Fixar descrição no boleto
  items: PagHiperItem[];
}

// Resposta de criação de transação PagHiper
export interface CreateTransactionResponse {
  create_request?: {
    result: string;              // "success" | "error"
    response_message: string;
    status: string;
    order_id: string;
    transaction_id: string;
    created_date: string;
    value_cents: string;
    status_date: string;
    due_date: string;
    bank_slip?: {
      digitable_line: string;
      url_slip: string;
      url_slip_pdf: string;
    };
    pix_code?: {
      qrcode_image_url: string;
      emv: string;              // Código PIX copia-e-cola
      bacen_url: string;
      pix_url: string;
    };
  };
  // PIX endpoint response
  pix_create_request?: {
    result: string;
    response_message: string;
    status: string;
    order_id: string;
    transaction_id: string;
    pix_code?: {
      emv: string;
      qrcode_image_url: string;
    };
  };
}

// Resposta de consulta de status
export interface StatusResponse {
  status_request?: {
    result: string;
    response_message: string;
    status: string;
    transaction_id: string;
    order_id: string;
    value_cents: string;
    created_date: string;
    status_date: string;
    due_date: string;
  };
}
