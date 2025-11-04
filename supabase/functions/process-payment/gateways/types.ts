// ============================================
// TIPOS E INTERFACES BASE PARA GATEWAYS
// ============================================
//
// Este arquivo define a estrutura comum que todos
// os 55 gateways de pagamento devem seguir.
//
// Mantém consistência e facilita a adição de novos gateways.
// ============================================

// ===== ENUMS =====

export enum PaymentStatus {
  PENDING = "pending",
  APPROVED = "approved",
  FAILED = "failed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
  PROCESSING = "processing",
  EXPIRED = "expired",
}

export enum PaymentMethod {
  CREDIT_CARD = "credit_card",
  DEBIT_CARD = "debit_card",
  PIX = "pix",
  BOLETO = "boleto",
  WALLET = "wallet",
  BANK_TRANSFER = "bank_transfer",
  PAYPAL = "paypal",
}

export enum GatewayEnvironment {
  PRODUCTION = "production",
  SANDBOX = "sandbox",
  TEST = "test",
}

export enum WebhookEventType {
  PAYMENT_CREATED = "payment.created",
  PAYMENT_APPROVED = "payment.approved",
  PAYMENT_FAILED = "payment.failed",
  PAYMENT_CANCELLED = "payment.cancelled",
  PAYMENT_REFUNDED = "payment.refunded",
  PAYMENT_CHARGEBACK = "payment.chargeback",
}

// ===== REQUEST & RESPONSE INTERFACES =====

export interface PaymentRequest {
  userId: string;
  orderId: string;
  amount: number;
  currency?: string;
  paymentMethod: PaymentMethod;

  customer: {
    name: string;
    email: string;
    document: string; // CPF/CNPJ/Passport
    phone?: string;
    birthDate?: string;
  };

  card?: {
    number: string;
    holderName: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    brand?: string;
  };

  billingAddress?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };

  shippingAddress?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };

  items?: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;

  metadata?: Record<string, any>;
}

export interface PixData {
  qrCode: string;
  qrCodeBase64?: string;
  expiresAt?: string;
  amount: number;
}

export interface BoletoData {
  boletoUrl: string;
  barcode: string;
  digitableLine: string;
  dueDate: string;
  amount: number;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  gatewayTransactionId?: string;
  status: PaymentStatus;

  // Para PIX
  qrCode?: string;
  qrCodeBase64?: string;
  pixKey?: string;
  pixData?: PixData;

  // Para Boleto/Invoice
  paymentUrl?: string;
  barcodeNumber?: string;
  digitableLine?: string;
  boletoData?: BoletoData;

  // Para Cartão
  authorizationCode?: string;
  nsu?: string;
  tid?: string;

  // URLs de redirecionamento
  redirectUrl?: string;
  successUrl?: string;
  failureUrl?: string;

  // Informações adicionais
  message: string;
  error?: string;
  errorCode?: string;
  expiresAt?: string;

  metadata?: Record<string, any>;
}

export interface PaymentStatusResponse {
  transactionId: string;
  gatewayTransactionId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  metadata?: Record<string, any>;
}

export interface RefundRequest {
  transactionId: string;
  gatewayTransactionId: string;
  amount?: number; // Se não informado, reembolsa total
  reason?: string;
}

export interface RefundResponse {
  success: boolean;
  refundId?: string;
  gatewayRefundId?: string;
  amount: number;
  status: "pending" | "approved" | "failed";
  message: string;
  error?: string;
}

// ===== WEBHOOK INTERFACES =====

export interface WebhookPayload {
  event: WebhookEventType;
  gatewayTransactionId: string;
  status: PaymentStatus;
  amount?: number;
  metadata?: Record<string, any>;
  rawPayload: any; // Payload original do gateway
  signature?: string;
  timestamp?: string;
}

export interface WebhookResponse {
  success: boolean;
  processed: boolean;
  transactionId?: string;
  message: string;
}

export interface WebhookValidationResult {
  isValid: boolean;
  error?: string;
}

// ===== GATEWAY CONFIG INTERFACES =====

export interface GatewayCredentials {
  [key: string]: any;

  // Campos comuns (nem todos os gateways usam todos)
  apiKey?: string;
  secretKey?: string;
  publicKey?: string;
  accessToken?: string;
  merchantId?: string;
  clientId?: string;
  clientSecret?: string;
  email?: string;
  token?: string;
  environment?: GatewayEnvironment;
}

export interface GatewayConfig {
  id: string;
  userId: string;
  gatewayId: string;
  credentials: GatewayCredentials;
  isActive: boolean;
  isDefault: boolean;
  testMode?: boolean;
  webhookUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GatewayInfo {
  id: string;
  name: string;
  slug: string;
  type: string;
  supportsPix: boolean;
  supportsCreditCard: boolean;
  supportsBoleto: boolean;
  supportsDebit: boolean;
  isActive: boolean;
}

// ===== VALIDATION INTERFACES =====

export interface CredentialValidationResult {
  isValid: boolean;
  message: string;
  details?: {
    field: string;
    error: string;
  }[];
}

export interface PaymentValidationResult {
  isValid: boolean;
  errors: string[];
}

// ===== GATEWAY PROCESSOR INTERFACE =====

/**
 * Interface base que TODOS os gateways devem implementar
 *
 * Cada gateway deve criar uma classe que implementa esta interface
 *
 * Exemplo:
 * ```typescript
 * export class StripeGateway implements GatewayProcessor {
 *   name = "Stripe"
 *   slug = "stripe"
 *
 *   async validateCredentials(credentials) { ... }
 *   async processPayment(request, config) { ... }
 *   async handleWebhook(payload) { ... }
 *   async getPaymentStatus(transactionId, config) { ... }
 *   async refundPayment(request, config) { ... }
 * }
 * ```
 */
export interface GatewayProcessor {
  /** Nome do gateway */
  name: string;

  /** Slug único do gateway */
  slug: string;

  /** Métodos de pagamento suportados */
  supportedMethods: PaymentMethod[];

  /**
   * Valida as credenciais do gateway
   * Faz uma chamada de teste à API para verificar se as credenciais são válidas
   */
  validateCredentials(
    credentials: GatewayCredentials,
  ): Promise<CredentialValidationResult>;

  /**
   * Processa um pagamento
   * Este é o método principal que cria a transação no gateway
   */
  processPayment(
    request: PaymentRequest,
    config: GatewayConfig,
  ): Promise<PaymentResponse>;

  /**
   * Processa webhooks do gateway
   * Recebe notificações de mudança de status de pagamento
   */
  handleWebhook(payload: any, signature?: string): Promise<WebhookResponse>;

  /**
   * Consulta o status de um pagamento
   * Útil para sincronizar o status quando não houver webhook
   */
  getPaymentStatus(
    gatewayTransactionId: string,
    config: GatewayConfig,
  ): Promise<PaymentStatusResponse>;

  /**
   * Reembolsa um pagamento (opcional)
   * Nem todos os gateways suportam reembolso via API
   */
  refundPayment?(
    request: RefundRequest,
    config: GatewayConfig,
  ): Promise<RefundResponse>;

  /**
   * Cancela um pagamento pendente (opcional)
   */
  cancelPayment?(
    gatewayTransactionId: string,
    config: GatewayConfig,
  ): Promise<PaymentResponse>;

  /**
   * Valida assinatura do webhook (opcional mas recomendado)
   */
  validateWebhookSignature?(
    payload: any,
    signature: string,
    secret: string,
  ): WebhookValidationResult;
}

// ===== HELPER TYPES =====

export type GatewayFactory = () => GatewayProcessor;

export interface GatewayRegistry {
  [slug: string]: GatewayProcessor;
}

export interface PaymentMethodCapabilities {
  pix: boolean;
  creditCard: boolean;
  debitCard: boolean;
  boleto: boolean;
  wallet: boolean;
  bankTransfer: boolean;
}

export interface GatewayEndpoints {
  production: string;
  sandbox?: string;
  test?: string;
}

export interface GatewayLimits {
  minAmount?: number;
  maxAmount?: number;
  maxInstallments?: number;
}

// ===== ERROR TYPES =====

export class GatewayError extends Error {
  constructor(
    message: string,
    public gatewaySlug: string,
    public errorCode?: string,
    public statusCode?: number,
    public originalError?: any,
  ) {
    super(message);
    this.name = "GatewayError";
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public gatewaySlug: string,
  ) {
    super(message);
    this.name = "AuthenticationError";
  }
}

// ===== UTILITY TYPES =====

export type Awaitable<T> = T | Promise<T>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
