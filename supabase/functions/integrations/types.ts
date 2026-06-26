// =========================================================================
// MÓDULO DE INTEGRAÇÕES GLOBAL - TIPOS E INTERFACES BASE (SyncAds AI)
// =========================================================================

export type IntegrationCategory =
  | "payment"
  | "logistics"
  | "crm"
  | "antifraud"
  | "notification";

export type IntegrationPluginStatus =
  | "active"
  | "beta"
  | "deprecated"
  | "waiting_docs"
  | "private_api";

export interface ConfigFieldOption {
  label: string;
  value: string;
}

export interface ConfigFieldSpecification {
  name: string;
  label: string;
  type: "text" | "password" | "select" | "checkbox";
  required: boolean;
  placeholder?: string;
  options?: ConfigFieldOption[];
}

export interface IntegrationCapabilities {
  [key: string]: boolean | number | string | undefined;
}

export interface IntegrationPluginMetadata {
  name: string;
  slug: string;
  version: string;
  category: IntegrationCategory;
  logoUrl?: string;
  description?: string;
  status: IntegrationPluginStatus;
  configFields: ConfigFieldSpecification[];
  capabilities: IntegrationCapabilities;
}

export interface IntegrationConfig {
  id: string;
  userId: string;
  integrationPluginId: string;
  credentials: Record<string, any>;
  isActive: boolean;
  isTestMode: boolean;
  settings: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CredentialValidationResult {
  isValid: boolean;
  message: string;
  details?: Array<{
    field: string;
    error: string;
  }>;
}

// =========================================================================
// DEPENDENCY INJECTION (DI) INTERFACES
// =========================================================================

export interface HttpClientOptions {
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  backoff?: boolean;
}

export interface HttpClientInterface {
  request(
    url: string,
    options?: RequestInit & HttpClientOptions
  ): Promise<Response>;
}

export interface LoggerInterface {
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(message: string, error?: Error, context?: Record<string, any>): void;
  sanitize(data: any): any;
}

export interface CryptoInterface {
  encrypt(plaintext: any): Promise<string>;
  decrypt(ciphertext: string): Promise<any>;
}

export interface CacheInterface {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface MetricsInterface {
  increment(metricName: string, count?: number, tags?: Record<string, string>): void;
  timing(metricName: string, durationMs: number, tags?: Record<string, string>): void;
  recordSuccess(pluginSlug: string, operation: string, durationMs: number): void;
  recordFailure(pluginSlug: string, operation: string, durationMs: number, error: string): void;
}

// =========================================================================
// EVENT BUS INTERFACES (Segregated Commands & Events)
// =========================================================================

export interface Command {
  readonly commandName: string;
  readonly timestamp: string;
  readonly payload: Record<string, any>;
}

export interface Event {
  readonly eventName: string;
  readonly timestamp: string;
  readonly payload: Record<string, any>;
}

export type CommandHandler<T extends Command = Command> = (command: T) => Promise<any>;
export type EventHandler<T extends Event = Event> = (event: T) => Promise<void>;

export interface EventBusInterface {
  // Comandos (Ponto a Ponto - Apenas um handler ativo)
  registerCommandHandler(commandName: string, handler: CommandHandler): void;
  sendCommand(command: Command): Promise<any>;

  // Eventos (Broadcast - Múltiplos subscribers)
  subscribe(eventName: string, handler: EventHandler): void;
  publish(event: Event): Promise<void>;
}

// =========================================================================
// SUBDOMÍNIO DE PAGAMENTOS (Padrões Comuns)
// =========================================================================

export type PaymentMethod =
  | "credit_card"
  | "debit_card"
  | "pix"
  | "boleto"
  | "wallet"
  | "paypal";

export type PaymentStatus =
  | "pending"
  | "processing"
  | "approved"
  | "failed"
  | "cancelled"
  | "refunded"
  | "expired";

export interface PaymentRequest {
  userId: string;
  orderId: string;
  amount: number;
  currency?: string;
  paymentMethod: PaymentMethod;
  idempotencyKey?: string;
  customer: {
    name: string;
    email: string;
    document: string; -- CPF/CNPJ/Passport
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
  installments?: number;
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
  qrCode?: string;
  qrCodeBase64?: string;
  pixKey?: string;
  pixData?: PixData;
  paymentUrl?: string;
  barcodeNumber?: string;
  digitableLine?: string;
  boletoData?: BoletoData;
  authorizationCode?: string;
  nsu?: string;
  tid?: string;
  redirectUrl?: string;
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
  amount?: number; -- Opcional (se null, estorno total)
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

export interface WebhookResponse {
  success: boolean;
  processed: boolean;
  transactionId?: string;
  gatewayTransactionId?: string;
  status?: PaymentStatus;
  message: string;
}

export interface WebhookValidationResult {
  isValid: boolean;
  error?: string;
}
