export interface Credentials {
  accessToken: string;
  userAgent: string; // User agent email/URL is required by Boleto Simples API guidelines
}

export interface BoletoSimplesRequest {
  amount: number;
  expireAt: string; // YYYY-MM-DD
  description?: string;
  customerName: string;
  customerCpfCnpj: string;
  customerEmail?: string;
  customerAddress?: string;
}

export interface BoletoSimplesResponse {
  id?: number;
  status?: string; // "draft", "opened", "paid", "canceled", "overdue"
  amount?: number;
  url?: string;
  pdf?: string;
  shorten_url?: string;
  our_number?: string;
  bank_billet_account_id?: number;
  error?: string;
  errors?: Record<string, string[]>;
}
