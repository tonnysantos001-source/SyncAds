export interface Credentials {
  accessKey: string;
  secretKey: string;
  clientId: string;
}

export interface ShipayPixRequest {
  address_key: string;
  total: number;
  order_ref: string;
  callback_url?: string;
}

export interface ShipayResponse {
  order_id?: string;
  status?: string; // "approved", "pending", "cancelled", "expired"
  total?: number;
  qr_code?: string;
  qr_code_text?: string;
  error?: string;
  message?: string;
}
