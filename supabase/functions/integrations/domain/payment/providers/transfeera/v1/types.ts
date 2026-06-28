export interface Credentials {
  clientId: string;
  clientSecret: string;
}

export interface TransfeeraPixRequest {
  valor: number;
  chave: string;
  descricao?: string;
  infoAdicional?: Array<{ nome: string; valor: string }>;
}

export interface TransfeeraResponse {
  id?: string;
  status?: string; // "ATIVA", "CONCLUIDA", "REMANESCIDA", "REJEITADA", "EM_PROCESSAMENTO"
  valor?: number;
  pixCopiaECola?: string;
  qrCodeBase64?: string;
  txid?: string;
  mensagem?: string;
  error?: string;
}
