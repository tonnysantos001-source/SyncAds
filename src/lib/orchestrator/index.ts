/**
 * ORCHESTRATOR - INDEX
 *
 * Exports centralizados para o módulo de orquestração
 *
 * @version 1.0.0
 * @date 2025-01-08
 */

// Main orchestrator
export {
  ServiceOrchestrator,
  orchestrator,
  callEdgeFunction,
  callBatch,
  invalidateCache,
  getMetrics,
} from './ServiceOrchestrator';

// Types
export type {
  OrchestratorConfig,
  CallOptions,
  ServiceResponse,
} from './ServiceOrchestrator';

// Re-export for convenience
export { orchestrator as default } from './ServiceOrchestrator';
