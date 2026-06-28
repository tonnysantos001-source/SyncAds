export interface Credentials {
  projectId: string;
  privateKey: string; // PEM format private key
}

export interface StarkPixRequest {
  amount: number;
  name: string;
  taxId: string;
  bankCode?: string;
  branchCode?: string;
  accountNumber?: string;
  accountType?: string;
  externalId: string;
  tags?: string[];
}

export interface StarkInvoiceRequest {
  amount: number;
  name: string;
  taxId: string;
  due?: string;
  expiratory?: number;
  tags?: string[];
}

export interface StarkResponse {
  id?: string;
  status?: string;
  amount?: number;
  fee?: number;
  taxId?: string;
  name?: string;
  brcode?: string; // Pix copy/paste code
  pdf?: string; // Invoice PDF
  nominalAmount?: number;
  error?: string;
  errors?: Array<{ code: string; message: string }>;
}
