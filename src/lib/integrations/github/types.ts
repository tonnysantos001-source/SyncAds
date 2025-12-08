/**
 * GITHUB TYPES
 *
 * TypeScript types e interfaces para GitHub API
 *
 * @version 1.0.0
 * @date 2025-01-08
 */

// ============================================================================
// USER & ORGANIZATION TYPES
// ============================================================================

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  html_url: string;
  type: 'User' | 'Organization';
  created_at: string;
  updated_at: string;
  bio?: string | null;
  location?: string | null;
  company?: string | null;
  public_repos?: number;
  followers?: number;
  following?: number;
}

export interface GitHubOrganization {
  id: number;
  login: string;
  name: string | null;
  description: string | null;
  avatar_url: string;
  html_url: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// REPOSITORY TYPES
// ============================================================================

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  owner: {
    login: string;
    id: number;
    avatar_url: string;
  };
  html_url: string;
  clone_url: string;
  ssh_url: string;
  git_url: string;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  language: string | null;
  archived: boolean;
  disabled: boolean;
  visibility: 'public' | 'private' | 'internal';
}

export interface RepositoryPermissions {
  admin: boolean;
  maintain: boolean;
  push: boolean;
  triage: boolean;
  pull: boolean;
}

// ============================================================================
// COMMIT TYPES
// ============================================================================

export interface GitHubCommit {
  sha: string;
  node_id: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
    tree: {
      sha: string;
      url: string;
    };
  };
  url: string;
  html_url: string;
  author: GitHubUser | null;
  committer: GitHubUser | null;
  parents: Array<{
    sha: string;
    url: string;
  }>;
}

// ============================================================================
// BRANCH TYPES
// ============================================================================

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
  protection?: {
    enabled: boolean;
    required_status_checks: {
      enforcement_level: string;
      contexts: string[];
    };
  };
}

export interface GitHubRef {
  ref: string;
  node_id: string;
  url: string;
  object: {
    type: string;
    sha: string;
    url: string;
  };
}

// ============================================================================
// FILE & CONTENT TYPES
// ============================================================================

export interface GitHubFileContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  content?: string;
  encoding?: string;
}

export interface GitHubTree {
  sha: string;
  url: string;
  tree: Array<{
    path: string;
    mode: string;
    type: 'blob' | 'tree' | 'commit';
    sha: string;
    size?: number;
    url: string;
  }>;
  truncated: boolean;
}

export interface GitHubBlob {
  content: string;
  encoding: string;
  url: string;
  sha: string;
  size: number;
  node_id: string;
}

// ============================================================================
// PULL REQUEST TYPES
// ============================================================================

export interface GitHubPullRequest {
  id: number;
  number: number;
  state: 'open' | 'closed';
  title: string;
  body: string | null;
  user: GitHubUser;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  merge_commit_sha: string | null;
  head: {
    ref: string;
    sha: string;
    repo: GitHubRepository;
  };
  base: {
    ref: string;
    sha: string;
    repo: GitHubRepository;
  };
  html_url: string;
  draft: boolean;
  merged: boolean;
  mergeable: boolean | null;
  mergeable_state: string;
}

// ============================================================================
// ISSUE TYPES
// ============================================================================

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  user: GitHubUser;
  labels: Array<{
    id: number;
    name: string;
    color: string;
    description: string | null;
  }>;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  html_url: string;
  assignees: GitHubUser[];
  milestone: {
    id: number;
    number: number;
    title: string;
    description: string | null;
    state: 'open' | 'closed';
    due_on: string | null;
  } | null;
}

// ============================================================================
// WORKFLOW & ACTIONS TYPES
// ============================================================================

export interface GitHubWorkflow {
  id: number;
  name: string;
  path: string;
  state: 'active' | 'disabled' | 'disabled_manually';
  created_at: string;
  updated_at: string;
  url: string;
  html_url: string;
  badge_url: string;
}

export interface GitHubWorkflowRun {
  id: number;
  name: string;
  head_branch: string;
  head_sha: string;
  run_number: number;
  event: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | null;
  workflow_id: number;
  url: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  run_started_at: string;
}

export interface GitHubActionSecret {
  name: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

export interface GitHubWebhook {
  id: number;
  type: string;
  name: string;
  active: boolean;
  events: string[];
  config: {
    url: string;
    content_type: 'json' | 'form';
    secret?: string;
    insecure_ssl?: '0' | '1';
  };
  updated_at: string;
  created_at: string;
  url: string;
  test_url: string;
  ping_url: string;
  deliveries_url: string;
}

export interface WebhookDelivery {
  id: number;
  guid: string;
  delivered_at: string;
  redelivery: boolean;
  duration: number;
  status: string;
  status_code: number;
  event: string;
  action: string | null;
  request: {
    headers: Record<string, string>;
    payload: any;
  };
  response: {
    headers: Record<string, string>;
    payload: string;
  };
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export type GitHubWebhookEvent =
  | 'push'
  | 'pull_request'
  | 'issues'
  | 'issue_comment'
  | 'commit_comment'
  | 'create'
  | 'delete'
  | 'deployment'
  | 'deployment_status'
  | 'fork'
  | 'gollum'
  | 'member'
  | 'page_build'
  | 'public'
  | 'release'
  | 'repository'
  | 'status'
  | 'watch'
  | 'workflow_run'
  | 'workflow_dispatch';

export interface PushEvent {
  ref: string;
  before: string;
  after: string;
  created: boolean;
  deleted: boolean;
  forced: boolean;
  base_ref: string | null;
  compare: string;
  commits: Array<{
    id: string;
    message: string;
    timestamp: string;
    author: {
      name: string;
      email: string;
      username: string;
    };
    added: string[];
    removed: string[];
    modified: string[];
  }>;
  head_commit: any;
  repository: GitHubRepository;
  pusher: {
    name: string;
    email: string;
  };
  sender: GitHubUser;
}

// ============================================================================
// RELEASE TYPES
// ============================================================================

export interface GitHubRelease {
  id: number;
  tag_name: string;
  target_commitish: string;
  name: string | null;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string | null;
  author: GitHubUser;
  assets: Array<{
    id: number;
    name: string;
    label: string | null;
    content_type: string;
    state: string;
    size: number;
    download_count: number;
    created_at: string;
    updated_at: string;
    browser_download_url: string;
  }>;
  html_url: string;
  tarball_url: string;
  zipball_url: string;
}

// ============================================================================
// DEPLOYMENT TYPES
// ============================================================================

export interface GitHubDeployment {
  id: number;
  sha: string;
  ref: string;
  task: string;
  payload: any;
  environment: string;
  description: string | null;
  creator: GitHubUser;
  created_at: string;
  updated_at: string;
  statuses_url: string;
  repository_url: string;
}

export interface GitHubDeploymentStatus {
  id: number;
  state: 'error' | 'failure' | 'inactive' | 'in_progress' | 'queued' | 'pending' | 'success';
  creator: GitHubUser;
  description: string | null;
  environment: string;
  target_url: string | null;
  created_at: string;
  updated_at: string;
  deployment_url: string;
  repository_url: string;
}

// ============================================================================
// RATE LIMIT TYPES
// ============================================================================

export interface GitHubRateLimit {
  resources: {
    core: {
      limit: number;
      remaining: number;
      reset: number;
      used: number;
    };
    search: {
      limit: number;
      remaining: number;
      reset: number;
      used: number;
    };
    graphql: {
      limit: number;
      remaining: number;
      reset: number;
      used: number;
    };
  };
  rate: {
    limit: number;
    remaining: number;
    reset: number;
    used: number;
  };
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface GitHubError {
  message: string;
  documentation_url?: string;
  errors?: Array<{
    resource: string;
    field: string;
    code: string;
    message?: string;
  }>;
}

// ============================================================================
// SEARCH TYPES
// ============================================================================

export interface GitHubSearchResult<T> {
  total_count: number;
  incomplete_results: boolean;
  items: T[];
}

export interface RepositorySearchResult extends GitHubRepository {
  score: number;
}

// ============================================================================
// TOKEN TYPES
// ============================================================================

export interface GitHubToken {
  token: string;
  expires_at?: string;
  permissions?: Record<string, string>;
  repository_selection?: 'all' | 'selected';
}

export interface GitHubAppInstallation {
  id: number;
  account: GitHubUser | GitHubOrganization;
  repository_selection: 'all' | 'selected';
  access_tokens_url: string;
  repositories_url: string;
  html_url: string;
  app_id: number;
  target_id: number;
  target_type: 'User' | 'Organization';
  permissions: Record<string, string>;
  events: string[];
  created_at: string;
  updated_at: string;
}
