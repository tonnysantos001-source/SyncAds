/**
 * PYTHON SERVICE CLIENT
 * Cliente robusto para integração com Python Service (Railway)
 * Suporta todos os endpoints, retry automático, health checks e métricas
 */

import { PromptModule } from './prompt-library/registry';

// ==================== TIPOS ====================

export interface PythonServiceConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  enableMetrics?: boolean;
  enableHealthCheck?: boolean;
  healthCheckInterval?: number;
}

export interface ExecutionRequest {
  module: string;
  function: string;
  parameters: Record<string, any>;
  promptSystem?: any;
  timeout?: number;
}

export interface ExecutionResponse {
  success: boolean;
  result: any;
  error?: string;
  executionTime: number;
  moduleUsed: string;
  metadata?: Record<string, any>;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'unknown';
  uptime: number;
  version: string;
  modules_available: number;
  last_check: number;
}

export interface ServiceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastRequestTime: number;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  healthStatus: HealthStatus | null;
}

// ==================== CLIENT ====================

export class PythonServiceClient {
  private config: PythonServiceConfig;
  private metrics: ServiceMetrics;
  private healthCheckTimer: any;
  private isHealthy: boolean = false;

  constructor(config: Partial<PythonServiceConfig> = {}) {
    this.config = {
      baseUrl: config.baseUrl || process.env.VITE_PYTHON_SERVICE_URL || 'http://localhost:8000',
      apiKey: config.apiKey || process.env.VITE_PYTHON_SERVICE_KEY,
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      enableMetrics: config.enableMetrics ?? true,
      enableHealthCheck: config.enableHealthCheck ?? true,
      healthCheckInterval: config.healthCheckInterval || 30000,
    };

    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastRequestTime: 0,
      connectionStatus: 'disconnected',
      healthStatus: null,
    };

    if (this.config.enableHealthCheck) {
      this.startHealthCheck();
    }
  }

  // ==================== HEALTH CHECK ====================

  private async startHealthCheck(): Promise<void> {
    // Check immediately
    await this.checkHealth();

    // Then check periodically
    this.healthCheckTimer = setInterval(async () => {
      await this.checkHealth();
    }, this.config.healthCheckInterval);
  }

  public async checkHealth(): Promise<HealthStatus> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        this.isHealthy = true;
        this.metrics.connectionStatus = 'connected';
        this.metrics.healthStatus = {
          status: 'healthy',
          uptime: data.uptime || 0,
          version: data.version || 'unknown',
          modules_available: data.modules_available || 0,
          last_check: Date.now(),
        };
        return this.metrics.healthStatus;
      } else {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error: any) {
      this.isHealthy = false;
      this.metrics.connectionStatus = 'disconnected';
      this.metrics.healthStatus = {
        status: 'unhealthy',
        uptime: 0,
        version: 'unknown',
        modules_available: 0,
        last_check: Date.now(),
      };
      return this.metrics.healthStatus;
    }
  }

  public stopHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  // ==================== CORE EXECUTION ====================

  public async execute(request: ExecutionRequest): Promise<ExecutionResponse> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const response = await this.makeRequest('/api/execute', request);

        // Update metrics on success
        const executionTime = Date.now() - startTime;
        this.metrics.successfulRequests++;
        this.metrics.lastRequestTime = Date.now();
        this.updateAverageResponseTime(executionTime);

        return {
          success: true,
          result: response.result,
          executionTime,
          moduleUsed: request.module,
          metadata: response.metadata,
        };
      } catch (error: any) {
        lastError = error;

        // If it's last attempt, don't retry
        if (attempt === this.config.maxRetries - 1) {
          break;
        }

        // Wait before retry (exponential backoff)
        const delay = this.config.retryDelay * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }

    // All retries failed
    this.metrics.failedRequests++;
    const executionTime = Date.now() - startTime;

    return {
      success: false,
      result: null,
      error: lastError?.message || 'Unknown error',
      executionTime,
      moduleUsed: request.module,
    };
  }

  // ==================== MODULE EXECUTION ====================

  public async executeWithModule(
    module: PromptModule,
    functionName: string,
    parameters: Record<string, any>
  ): Promise<ExecutionResponse> {
    return this.execute({
      module: module.packageName,
      function: functionName,
      parameters,
      promptSystem: module.promptSystem,
      timeout: this.config.timeout,
    });
  }

  // ==================== SPECIALIZED ENDPOINTS ====================

  // Image Processing
  public async processImage(
    operation: 'resize' | 'optimize' | 'filter' | 'watermark',
    imageBase64: string,
    options: Record<string, any> = {}
  ): Promise<ExecutionResponse> {
    return this.makeRequest(`/api/images/${operation}`, {
      image_base64: imageBase64,
      ...options,
    });
  }

  // PDF Generation
  public async generatePDF(
    content: string,
    options: Record<string, any> = {}
  ): Promise<ExecutionResponse> {
    return this.makeRequest('/api/pdf/generate', {
      content,
      ...options,
    });
  }

  // Web Scraping
  public async scrapeWebsite(
    url: string,
    options: {
      javascript?: boolean;
      extractImages?: boolean;
      extractLinks?: boolean;
      screenshot?: boolean;
    } = {}
  ): Promise<ExecutionResponse> {
    return this.makeRequest('/api/scraping/scrape', {
      url,
      javascript: options.javascript || false,
      extract_images: options.extractImages || false,
      extract_links: options.extractLinks || false,
      screenshot: options.screenshot || false,
    });
  }

  // Machine Learning
  public async predictROI(campaignData: Record<string, any>): Promise<ExecutionResponse> {
    return this.makeRequest('/api/ml/predict-roi', campaignData);
  }

  // NLP
  public async analyzeSentiment(text: string): Promise<ExecutionResponse> {
    return this.makeRequest('/api/nlp/sentiment', { text });
  }

  // Data Analysis
  public async analyzeData(
    data: any[],
    analysisType: 'describe' | 'correlation' | 'outliers' = 'describe'
  ): Promise<ExecutionResponse> {
    return this.makeRequest('/api/data/analyze', {
      data,
      analysis_type: analysisType,
    });
  }

  // Video Processing
  public async processVideo(
    operation: 'cut' | 'concatenate' | 'resize',
    videoPath: string,
    options: Record<string, any> = {}
  ): Promise<ExecutionResponse> {
    return this.makeRequest(`/api/video/${operation}`, {
      video_path: videoPath,
      ...options,
    });
  }

  // ==================== RAW REQUEST ====================

  private async makeRequest(endpoint: string, data: any): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.timeout}ms`);
      }

      throw error;
    }
  }

  // ==================== BATCH OPERATIONS ====================

  public async executeBatch(requests: ExecutionRequest[]): Promise<ExecutionResponse[]> {
    // Execute in parallel with limit
    const batchSize = 5;
    const results: ExecutionResponse[] = [];

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((req) => this.execute(req))
      );
      results.push(...batchResults);
    }

    return results;
  }

  // ==================== METRICS & STATUS ====================

  public getMetrics(): ServiceMetrics {
    return { ...this.metrics };
  }

  public isConnected(): boolean {
    return this.isHealthy && this.metrics.connectionStatus === 'connected';
  }

  public getConnectionStatus(): string {
    return this.metrics.connectionStatus;
  }

  public resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastRequestTime: 0,
      connectionStatus: this.metrics.connectionStatus,
      healthStatus: this.metrics.healthStatus,
    };
  }

  private updateAverageResponseTime(responseTime: number): void {
    const totalTime =
      this.metrics.averageResponseTime * (this.metrics.successfulRequests - 1) +
      responseTime;
    this.metrics.averageResponseTime = totalTime / this.metrics.successfulRequests;
  }

  // ==================== UTILITIES ====================

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public updateConfig(config: Partial<PythonServiceConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart health check if interval changed
    if (config.healthCheckInterval && this.config.enableHealthCheck) {
      this.stopHealthCheck();
      this.startHealthCheck();
    }
  }

  public destroy(): void {
    this.stopHealthCheck();
  }
}

// ==================== SINGLETON INSTANCE ====================

let clientInstance: PythonServiceClient | null = null;

export function getPythonServiceClient(config?: Partial<PythonServiceConfig>): PythonServiceClient {
  if (!clientInstance) {
    clientInstance = new PythonServiceClient(config);
  }
  return clientInstance;
}

export function createPythonServiceClient(config?: Partial<PythonServiceConfig>): PythonServiceClient {
  return new PythonServiceClient(config);
}

export default PythonServiceClient;
