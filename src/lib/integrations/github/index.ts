/**
 * GITHUB INTEGRATION - INDEX
 *
 * Exports centralizados para o módulo de integração com GitHub
 *
 * @version 1.0.0
 * @date 2025-01-08
 */

// Main service
export {
  GitHubService,
  githubService,
  createAndDeployRepository,
} from './GitHubService';

// Types
export type {
  GitHubConfig,
  GitHubUser,
  GitHubRepository,
  CreateRepositoryOptions,
  CommitFileOptions,
  CreateBranchOptions,
  GitHubActionsWorkflow,
  WebhookConfig,
  GitHubServiceResponse,
} from './GitHubService';

// Extended types
export type {
  GitHubOrganization,
  RepositoryPermissions,
  GitHubCommit,
  GitHubBranch,
  GitHubRef,
  GitHubFileContent,
  GitHubTree,
  GitHubBlob,
  GitHubPullRequest,
  GitHubIssue,
  GitHubWorkflow,
  GitHubWorkflowRun,
  GitHubActionSecret,
  GitHubWebhook,
  WebhookDelivery,
  GitHubWebhookEvent,
  PushEvent,
  GitHubRelease,
  GitHubDeployment,
  GitHubDeploymentStatus,
  GitHubRateLimit,
  GitHubError,
  GitHubSearchResult,
  RepositorySearchResult,
  GitHubToken,
  GitHubAppInstallation,
} from './types';

// Re-export default
export { githubService as default } from './GitHubService';
