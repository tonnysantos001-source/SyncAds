export interface Credentials {
  credencial: string; // Conta
  chave: string; // Chave secreta
}

export interface PJBankBoletoPayload {
  vencimento: string;
  valor: number;
  juros?: number;
  multa?: number;
  desconto?: number;
  nome_cliente: string;
  cpf_cliente: string;
  email_cliente?: string;
  telefone_cliente?: string;
  numero_pedido?: string;
  url_retorno?: string;
}

export interface PJBankCardPayload {
  valor: number;
  opcao_sigla: string; // e.g. "VI" (Visa), "MC" (Mastercard)
  numero_cartao: string;
  titular_cartao: string;
  vencimento_cartao: string; // MM/AAAA
  cvv_cartao: string;
  parcelas?: number;
  nome_cliente: string;
  email_cliente?: string;
  cpf_cliente: string;
  numero_pedido?: string;
}

export interface PJBankResponse {
  status?: number;
  msg?: string;
  nosso_numero?: string;
  linha_digitavel?: string;
  link_boleto?: string;
  id_unico?: string;
  tid?: string;
  autorizado?: string; // "true" or "false"
}
