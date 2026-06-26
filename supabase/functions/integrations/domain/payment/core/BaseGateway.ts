// =========================================================================
// SUBDOMÍNIO DE PAGAMENTOS - CLASSE BASE ABSTRATA (SyncAds AI)
// =========================================================================

import {
  GatewayProvider,
  IntegrationConfig,
  CredentialValidationResult,
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
  PaymentStatusResponse,
  WebhookResponse,
  HttpClientInterface,
  LoggerInterface,
  CryptoInterface,
  CacheInterface,
  MetricsInterface,
} from "../../../types.ts";

export abstract class BaseGateway implements GatewayProvider {
  constructor(
    protected http: HttpClientInterface,
    protected logger: LoggerInterface,
    protected crypto: CryptoInterface,
    protected cache: CacheInterface,
    protected metrics: MetricsInterface
  ) {}

  /**
   * Nome do gateway (definido na classe filha)
   */
  abstract readonly name: string;

  /**
   * Slug único do gateway (definido na classe filha)
   */
  abstract readonly slug: string;

  /**
   * Valida credenciais brutas fornecidas pelo usuário antes de salvar (chamada real à API)
   */
  abstract validateCredentials(credentials: any): Promise<CredentialValidationResult>;

  /**
   * Conecta e testa a conexão usando a configuração salva (health check rápido)
   */
  async connect(config: IntegrationConfig): Promise<CredentialValidationResult> {
    this.logger.info(`[${this.name}] Starting health connection test...`);
    try {
      const resolvedCreds = await this.resolveCredentials(config);
      return await this.validateCredentials(resolvedCreds);
    } catch (err: any) {
      this.logger.error(`[${this.name}] Health check failed:`, err);
      return {
        isValid: false,
        message: `Connection failed: ${err.message}`,
      };
    }
  }

  /**
   * Criação genérica de pagamento. Encaminha para o método específico.
   */
  async createPayment(
    request: PaymentRequest,
    config: IntegrationConfig
  ): Promise<PaymentResponse> {
    const startTime = Date.now();
    this.logger.info(`[${this.name}] Creating payment for order: ${request.orderId}`);
    
    try {
      let response: PaymentResponse;

      switch (request.paymentMethod) {
        case "pix":
          response = await this.createPix(request, config);
          break;
        case "credit_card":
          response = await this.createCreditCard(request, config);
          break;
        case "boleto":
          response = await this.createBoleto(request, config);
          break;
        default:
          throw new Error(`Payment method "${request.paymentMethod}" not supported by this gateway.`);
      }

      const duration = Date.now() - startTime;
      if (response.success) {
        this.metrics.recordSuccess(this.slug, "createPayment", duration);
      } else {
        this.metrics.recordFailure(this.slug, "createPayment", duration, response.message);
      }

      return response;
    } catch (err: any) {
      const duration = Date.now() - startTime;
      this.metrics.recordFailure(this.slug, "createPayment", duration, err.message);
      this.logger.error(`[${this.name}] Critical payment exception:`, err);
      return {
        success: false,
        status: "failed",
        message: `Critical payment exception: ${err.message}`,
      };
    }
  }

  // Métodos que podem ser opcionalmente implementados pelas subclasses
  
  async cancelPayment(
    _gatewayTransactionId: string,
    _config: IntegrationConfig
  ): Promise<PaymentResponse> {
    throw new Error(`[${this.name}] cancelPayment method is not implemented.`);
  }

  async refundPayment(
    _request: RefundRequest,
    _config: IntegrationConfig
  ): Promise<RefundResponse> {
    throw new Error(`[${this.name}] refundPayment method is not implemented.`);
  }

  async consultPayment(
    _gatewayTransactionId: string,
    _config: IntegrationConfig
  ): Promise<PaymentStatusResponse> {
    throw new Error(`[${this.name}] consultPayment method is not implemented.`);
  }

  async createPix(
    _request: PaymentRequest,
    _config: IntegrationConfig
  ): Promise<PaymentResponse> {
    throw new Error(`[${this.name}] createPix method is not supported.`);
  }

  async createCreditCard(
    _request: PaymentRequest,
    _config: IntegrationConfig
  ): Promise<PaymentResponse> {
    throw new Error(`[${this.name}] createCreditCard method is not supported.`);
  }

  async createBoleto(
    _request: PaymentRequest,
    _config: IntegrationConfig
  ): Promise<PaymentResponse> {
    throw new Error(`[${this.name}] createBoleto method is not supported.`);
  }

  async handleWebhook(
    _payload: any,
    _signature?: string,
    _secret?: string
  ): Promise<WebhookResponse> {
    throw new Error(`[${this.name}] handleWebhook method is not implemented.`);
  }

  /**
   * Helper para descriptografar credenciais sob demanda (segurança máxima, sem cache de chaves cruas)
   */
  protected async resolveCredentials(config: IntegrationConfig): Promise<any> {
    if (!config) return {};

    // 1. Se contiver chaves legíveis diretamente na config, usar
    if (
      config.credentials &&
      Object.keys(config.credentials).length > 0 &&
      !config.credentials.apiKey?.includes("****")
    ) {
      return config.credentials;
    }

    // 2. Senão, tentar descriptografar em tempo de execução
    const enc = (config as any).credentialsEncrypted;
    if (enc) {
      const decrypted = await this.crypto.decrypt(enc);
      if (decrypted) {
        return decrypted;
      }
    }

    return config.credentials || {};
  }
}
