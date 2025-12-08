/**
 * DEVELOPER MODULE - INDEX
 *
 * Exports centralizados para o módulo de desenvolvedor
 *
 * @version 1.0.0
 * @date 2025-01-08
 */

// Main service
export {
  DeveloperCredentialsService,
  developerCredentials,
} from './DeveloperCredentialsService';

// Types
export type {
  DeveloperCredentials,
  GitHubCredentials,
  VercelCredentials,
  CredentialsStatus,
  CredentialsResponse,
} from './DeveloperCredentialsService';

// Convenience functions
export {
  initDeveloperCredentials,
  getDeveloperStatus,
  connectGitHub,
  connectVercel,
  disconnectGitHub,
  disconnectVercel,
  setDeveloperMode,
} from './DeveloperCredentialsService';

// Re-export for convenience
export { developerCredentials as default } from './DeveloperCredentialsService';
