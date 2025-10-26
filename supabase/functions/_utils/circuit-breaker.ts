// ============================================================================
// CIRCUIT BREAKER
// ============================================================================
// Implementa pattern Circuit Breaker para Edge Functions
// Estados: CLOSED → OPEN → HALF_OPEN
// Por: SYNCADS
// ============================================================================

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitConfig {
  failureThreshold: number; // Falhas antes de abrir
  openTimeoutMs: number; // Tempo até tentar HALF_OPEN (ms)
  halfOpenRetries: number; // Quantas tentativas em HALF_OPEN
}

export interface CircuitResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  state: CircuitState;
  failures: number;
}

/**
 * Estado interno do Circuit Breaker
 */
interface CircuitData {
  state: CircuitState;
  failures: number;
  lastFailure: number;
  successCount: number;
}

// Estado global (por service)
const circuits: Map<string, CircuitData> = new Map();

const DEFAULT_CONFIG: CircuitConfig = {
  failureThreshold: 5,
  openTimeoutMs: 60000, // 60 segundos
  halfOpenRetries: 1,
};

/**
 * Classe Circuit Breaker
 */
export class CircuitBreaker {
  private config: CircuitConfig;

  constructor(config: Partial<CircuitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Executa função com circuit breaker
   */
  async execute<T>(
    key: string,
    fn: () => Promise<T>
  ): Promise<CircuitResult<T>> {
    const circuit = this.getOrCreate(key);

    // Atualizar estado baseado no tempo
    this.updateState(key, circuit);

    // Log estado atual
    console.log(`🔄 Circuit ${key}: ${circuit.state}`);

    // Se OPEN, falhar imediatamente
    if (circuit.state === 'OPEN') {
      const timeUntilRetry = Math.ceil(
        (circuit.lastFailure + this.config.openTimeoutMs - Date.now()) / 1000
      );
      
      console.log(
        `🔴 Circuit ${key} is OPEN (${circuit.failures} failures). Retry in ${timeUntilRetry}s`
      );

      return {
        success: false,
        error: `Circuit breaker OPEN. Try again in ${timeUntilRetry} seconds.`,
        state: 'OPEN',
        failures: circuit.failures,
      };
    }

    // Executar função
    try {
      const data = await fn();

      // Sucesso
      if (circuit.state === 'HALF_OPEN') {
        circuit.successCount++;
        console.log(`🟡 Circuit ${key}: HALF_OPEN success (${circuit.successCount}/${this.config.halfOpenRetries})`);

        // Se HALF_OPEN teve sucesso suficiente, fechar
        if (circuit.successCount >= this.config.halfOpenRetries) {
          circuit.state = 'CLOSED';
          circuit.failures = 0;
          circuit.successCount = 0;
          console.log(`✅ Circuit ${key}: HALF_OPEN → CLOSED (recovered)`);
        }
      } else if (circuit.failures > 0) {
        // Reset contador de falhas em CLOSED
        circuit.failures = 0;
        circuit.successCount = 0;
      }

      return {
        success: true,
        data,
        state: circuit.state,
        failures: 0,
      };
    } catch (error: any) {
      // Falha
      circuit.failures++;
      circuit.lastFailure = Date.now();

      console.log(`❌ Circuit ${key}: Failed (${circuit.failures}/${this.config.failureThreshold})`);

      // Se em CLOSED e atingiu threshold, abrir
      if (circuit.state === 'CLOSED' && circuit.failures >= this.config.failureThreshold) {
        circuit.state = 'OPEN';
        console.log(`🔴 Circuit ${key}: CLOSED → OPEN (${circuit.failures} failures)`);
      }

      // Se em HALF_OPEN e falhou, voltar para OPEN
      if (circuit.state === 'HALF_OPEN') {
        circuit.state = 'OPEN';
        circuit.successCount = 0;
        console.log(`🔴 Circuit ${key}: HALF_OPEN → OPEN (failed retry)`);
      }

      return {
        success: false,
        error: error.message || 'Unknown error',
        state: circuit.state,
        failures: circuit.failures,
      };
    }
  }

  /**
   * Obtém ou cria circuito
   */
  private getOrCreate(key: string): CircuitData {
    let circuit = circuits.get(key);
    
    if (!circuit) {
      circuit = {
        state: 'CLOSED',
        failures: 0,
        lastFailure: 0,
        successCount: 0,
      };
      circuits.set(key, circuit);
    }
    
    return circuit;
  }

  /**
   * Atualiza estado baseado no tempo
   */
  private updateState(key: string, circuit: CircuitData): void {
    // Se OPEN e já passou timeout, ir para HALF_OPEN
    if (
      circuit.state === 'OPEN' &&
      Date.now() - circuit.lastFailure >= this.config.openTimeoutMs
    ) {
      circuit.state = 'HALF_OPEN';
      circuit.successCount = 0;
      console.log(`🟡 Circuit ${key}: OPEN → HALF_OPEN (trying recovery)`);
    }
  }

  /**
   * Reseta circuito manualmente
   */
  reset(key: string): void {
    circuits.delete(key);
    console.log(`🔄 Circuit ${key}: Reset manual`);
  }
}

// Instância global
export const circuitBreaker = new CircuitBreaker();

