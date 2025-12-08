/**
 * DEPLOY SERVICE - INDEX
 *
 * Exports centralizados para o módulo de deploy
 *
 * @version 1.0.0
 * @date 2025-01-08
 */

// Main service
export {
  DeployService,
  deployService,
  deployFromGitHub,
  quickDeployStatic,
} from './DeployService';

// Types
export type {
  VercelConfig,
  DeployOptions,
  VercelProject,
  VercelDeployment,
  VercelDomain,
  DeploymentLog,
  DeployServiceResponse,
  VercelFramework,
} from './DeployService';

// Re-export for convenience
export { deployService as default } from './DeployService';
