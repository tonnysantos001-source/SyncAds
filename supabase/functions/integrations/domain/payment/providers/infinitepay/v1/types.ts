// Tipos específicos para a API do InfinitePay
// Baseado na documentação oficial: https://www.infinitepay.io/desenvolvedores

export interface Credentials {
  // InfiniteTag: identificador único da conta no app InfinitePay (ex: "minha_loja")
  handle: string;
  // Client ID obtido em Configurações > Credenciais no painel
  clientId: string;
  // Client Secret obtido em Configurações > Credenciais no painel
  clientSecret: string;
}

// Payload para criação de link de pagamento (Checkout Integrado)
export interface CreateLinkPayload {
  handle: string;           // InfiniteTag da conta
  order_nsu: string;        // Número único do pedido (referência interna)
  redirect_url?: string;    // URL de redirecionamento após pagamento
  customer: {
    name: string;
    email: string;
    phone_number: string;   // Formato: +5511999887766
  };
  items: Array<{
    name: string;           // Nome do produto/serviço
    amount: number;         // Valor em centavos (ex: 1000 = R$10,00)
    quantity: number;
  }>;
}

// Resposta da criação do link de pagamento
export interface CreateLinkResponse {
  id?: string;
  order_nsu: string;
  payment_url: string;      // Link de pagamento gerado
  status?: string;
  created_at?: string;
  expires_at?: string;
}

// Payload para consulta de status de pagamento
export interface PaymentCheckPayload {
  order_nsu: string;        // NSU do pedido para consulta
  handle: string;
}

// Resposta da consulta de status
export interface PaymentCheckResponse {
  order_nsu: string;
  status: string;           // "paid" | "pending" | "expired" | "cancelled"
  amount?: number;
  payment_method?: string;
  paid_at?: string;
  created_at?: string;
}
