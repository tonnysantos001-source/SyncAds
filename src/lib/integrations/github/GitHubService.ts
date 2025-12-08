/**
 * GITHUB SERVICE
 *
 * Serviço completo de integração com GitHub API
 *
 * Features:
 * - OAuth 2.0 flow completo
 * - Criação de repositórios
 * - Commits e push
 * - Branches e PRs
 * - GitHub Actions setup
 * - Webhooks configuration
 * - File management
 *
 * @version 1.0.0
 * @date 2025-01-08
 * @author SyncAds Team
 */

import { supabase } from "@/lib/supabase";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface GitHubConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes?: string[];
}

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  html_url: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  default_branch: string;
  created_at: string;
}

export interface CreateRepositoryOptions {
  name: string;
  description?: string;
  private?: boolean;
  autoInit?: boolean;
  gitignore?: string;
  license?: string;
}

export interface CommitFileOptions {
  owner: string;
  repo: string;
  path: string;
  content: string;
  message: string;
  branch?: string;
  sha?: string; // For updating existing files
}

export interface CreateBranchOptions {
  owner: string;
  repo: string;
  branch: string;
  from?: string; // Source branch, defaults to default branch
}

export interface GitHubActionsWorkflow {
  name: string;
  content: string;
  path: string;
}

export interface WebhookConfig {
  url: string;
  events: string[];
  secret?: string;
}

export interface GitHubServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    rateLimitRemaining?: number;
    rateLimitReset?: number;
  };
}

// ============================================================================
// GITHUB SERVICE CLASS
// ============================================================================

export class GitHubService {
  private config: GitHubConfig;
  private accessToken: string | null = null;

  constructor(config?: Partial<GitHubConfig>) {
    this.config = {
      clientId: import.meta.env.VITE_GITHUB_CLIENT_ID || "",
      clientSecret: import.meta.env.VITE_GITHUB_CLIENT_SECRET || "",
      redirectUri:
        import.meta.env.VITE_GITHUB_REDIRECT_URI ||
        `${window.location.origin}/auth/github/callback`,
      scopes: ["repo", "user", "workflow"],
      ...config,
    };
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  /**
   * Inicia o fluxo OAuth do GitHub
   */
  initiateOAuth(): string {
    const state = this.generateState();

    // Store state in sessionStorage for verification
    sessionStorage.setItem("github_oauth_state", state);

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes?.join(" ") || "repo user",
      state,
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Completa o fluxo OAuth com o código recebido
   */
  async completeOAuth(
    code: string,
    state: string,
  ): Promise<GitHubServiceResponse<{ token: string; user: GitHubUser }>> {
    try {
      // Verify state
      const storedState = sessionStorage.getItem("github_oauth_state");
      if (state !== storedState) {
        return {
          success: false,
          error: "Invalid state parameter",
        };
      }

      // Exchange code for token
      const tokenResponse = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            code,
            redirect_uri: this.config.redirectUri,
          }),
        },
      );

      if (!tokenResponse.ok) {
        throw new Error("Failed to exchange code for token");
      }

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        throw new Error(tokenData.error_description || tokenData.error);
      }

      this.accessToken = tokenData.access_token;

      // Get user info
      const userResponse = await this.getAuthenticatedUser();

      if (!userResponse.success || !userResponse.data) {
        throw new Error("Failed to get user info");
      }

      // Store token in Supabase for the user
      if (this.accessToken) {
        await this.storeToken(userResponse.data.id, this.accessToken);
      }

      return {
        success: true,
        data: {
          token: this.accessToken || "",
          user: userResponse.data,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Define o access token manualmente
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Retorna o access token atual
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Carrega o token do usuário do Supabase
   */
  async loadUserToken(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("integrations")
        .select("access_token")
        .eq("user_id", userId)
        .eq("platform", "github")
        .single();

      if (error || !data) {
        return false;
      }

      this.accessToken = data.access_token;
      return true;
    } catch (error) {
      console.error("Failed to load GitHub token:", error);
      return false;
    }
  }

  // ============================================================================
  // USER OPERATIONS
  // ============================================================================

  /**
   * Retorna informações do usuário autenticado
   */
  async getAuthenticatedUser(): Promise<GitHubServiceResponse<GitHubUser>> {
    return this.makeRequest<GitHubUser>("GET", "/user");
  }

  /**
   * Lista repositórios do usuário
   */
  async listRepositories(options?: {
    type?: "all" | "owner" | "member";
    sort?: "created" | "updated" | "pushed" | "full_name";
    per_page?: number;
  }): Promise<GitHubServiceResponse<GitHubRepository[]>> {
    const params = new URLSearchParams();
    if (options?.type) params.append("type", options.type);
    if (options?.sort) params.append("sort", options.sort);
    if (options?.per_page)
      params.append("per_page", options.per_page.toString());

    return this.makeRequest<GitHubRepository[]>(
      "GET",
      `/user/repos?${params.toString()}`,
    );
  }

  // ============================================================================
  // REPOSITORY OPERATIONS
  // ============================================================================

  /**
   * Cria um novo repositório
   */
  async createRepository(
    options: CreateRepositoryOptions,
  ): Promise<GitHubServiceResponse<GitHubRepository>> {
    const body = {
      name: options.name,
      description: options.description || "",
      private: options.private !== false,
      auto_init: options.autoInit !== false,
      gitignore_template: options.gitignore,
      license_template: options.license,
    };

    return this.makeRequest<GitHubRepository>("POST", "/user/repos", body);
  }

  /**
   * Retorna informações de um repositório
   */
  async getRepository(
    owner: string,
    repo: string,
  ): Promise<GitHubServiceResponse<GitHubRepository>> {
    return this.makeRequest<GitHubRepository>("GET", `/repos/${owner}/${repo}`);
  }

  /**
   * Deleta um repositório
   */
  async deleteRepository(
    owner: string,
    repo: string,
  ): Promise<GitHubServiceResponse<void>> {
    return this.makeRequest<void>("DELETE", `/repos/${owner}/${repo}`);
  }

  // ============================================================================
  // FILE OPERATIONS
  // ============================================================================

  /**
   * Cria ou atualiza um arquivo no repositório
   */
  async commitFile(
    options: CommitFileOptions,
  ): Promise<GitHubServiceResponse<any>> {
    const branch = options.branch || "main";

    // Get current file SHA if updating
    let sha = options.sha;
    if (!sha) {
      const existingFile = await this.getFileContent(
        options.owner,
        options.repo,
        options.path,
        branch,
      );
      if (existingFile.success && existingFile.data) {
        sha = existingFile.data.sha;
      }
    }

    const body = {
      message: options.message,
      content: Buffer.from(options.content).toString("base64"),
      branch,
      ...(sha && { sha }),
    };

    return this.makeRequest<any>(
      "PUT",
      `/repos/${options.owner}/${options.repo}/contents/${options.path}`,
      body,
    );
  }

  /**
   * Cria múltiplos arquivos em um único commit
   */
  async commitMultipleFiles(
    owner: string,
    repo: string,
    files: Array<{ path: string; content: string }>,
    message: string,
    branch: string = "main",
  ): Promise<GitHubServiceResponse<any>> {
    try {
      // Get the latest commit SHA
      const refResponse = await this.makeRequest<any>(
        "GET",
        `/repos/${owner}/${repo}/git/ref/heads/${branch}`,
      );

      if (!refResponse.success || !refResponse.data) {
        return {
          success: false,
          error: "Failed to get branch reference",
        };
      }

      const latestCommitSha = refResponse.data.object.sha;

      // Get the tree SHA from the latest commit
      const commitResponse = await this.makeRequest<any>(
        "GET",
        `/repos/${owner}/${repo}/git/commits/${latestCommitSha}`,
      );

      if (!commitResponse.success || !commitResponse.data) {
        return {
          success: false,
          error: "Failed to get commit",
        };
      }

      const baseTreeSha = commitResponse.data.tree.sha;

      // Create blobs for each file
      const blobs = await Promise.all(
        files.map(async (file) => {
          const blobResponse = await this.makeRequest<any>(
            "POST",
            `/repos/${owner}/${repo}/git/blobs`,
            {
              content: Buffer.from(file.content).toString("base64"),
              encoding: "base64",
            },
          );

          if (!blobResponse.success || !blobResponse.data) {
            throw new Error(`Failed to create blob for ${file.path}`);
          }

          return {
            path: file.path,
            mode: "100644",
            type: "blob",
            sha: blobResponse.data.sha,
          };
        }),
      );

      // Create a new tree
      const treeResponse = await this.makeRequest<any>(
        "POST",
        `/repos/${owner}/${repo}/git/trees`,
        {
          base_tree: baseTreeSha,
          tree: blobs,
        },
      );

      if (!treeResponse.success || !treeResponse.data) {
        return {
          success: false,
          error: "Failed to create tree",
        };
      }

      // Create a new commit
      const newCommitResponse = await this.makeRequest<any>(
        "POST",
        `/repos/${owner}/${repo}/git/commits`,
        {
          message,
          tree: treeResponse.data.sha,
          parents: [latestCommitSha],
        },
      );

      if (!newCommitResponse.success || !newCommitResponse.data) {
        return {
          success: false,
          error: "Failed to create commit",
        };
      }

      // Update the reference
      const updateRefResponse = await this.makeRequest<any>(
        "PATCH",
        `/repos/${owner}/${repo}/git/refs/heads/${branch}`,
        {
          sha: newCommitResponse.data.sha,
        },
      );

      return updateRefResponse;
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Retorna conteúdo de um arquivo
   */
  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref?: string,
  ): Promise<
    GitHubServiceResponse<{ content: string; sha: string; encoding: string }>
  > {
    const url = ref
      ? `/repos/${owner}/${repo}/contents/${path}?ref=${ref}`
      : `/repos/${owner}/${repo}/contents/${path}`;

    const response = await this.makeRequest<any>("GET", url);

    if (response.success && response.data) {
      const content = Buffer.from(response.data.content, "base64").toString(
        "utf-8",
      );
      return {
        success: true,
        data: {
          content,
          sha: response.data.sha,
          encoding: response.data.encoding,
        },
      };
    }

    return response;
  }

  // ============================================================================
  // BRANCH OPERATIONS
  // ============================================================================

  /**
   * Cria uma nova branch
   */
  async createBranch(
    options: CreateBranchOptions,
  ): Promise<GitHubServiceResponse<any>> {
    try {
      // Get the SHA of the source branch
      const sourceBranch = options.from || "main";
      const refResponse = await this.makeRequest<any>(
        "GET",
        `/repos/${options.owner}/${options.repo}/git/ref/heads/${sourceBranch}`,
      );

      if (!refResponse.success || !refResponse.data) {
        return {
          success: false,
          error: "Failed to get source branch",
        };
      }

      const sha = refResponse.data.object.sha;

      // Create the new branch
      return this.makeRequest<any>(
        "POST",
        `/repos/${options.owner}/${options.repo}/git/refs`,
        {
          ref: `refs/heads/${options.branch}`,
          sha,
        },
      );
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Lista branches do repositório
   */
  async listBranches(
    owner: string,
    repo: string,
  ): Promise<GitHubServiceResponse<any[]>> {
    return this.makeRequest<any[]>("GET", `/repos/${owner}/${repo}/branches`);
  }

  // ============================================================================
  // GITHUB ACTIONS
  // ============================================================================

  /**
   * Cria um workflow do GitHub Actions
   */
  async createWorkflow(
    owner: string,
    repo: string,
    workflow: GitHubActionsWorkflow,
  ): Promise<GitHubServiceResponse<any>> {
    const path = workflow.path.startsWith(".github/workflows/")
      ? workflow.path
      : `.github/workflows/${workflow.path}`;

    return this.commitFile({
      owner,
      repo,
      path,
      content: workflow.content,
      message: `Add workflow: ${workflow.name}`,
    });
  }

  /**
   * Cria workflow de CI/CD padrão para Vercel
   */
  async setupVercelWorkflow(
    owner: string,
    repo: string,
  ): Promise<GitHubServiceResponse<any>> {
    const workflowContent = `name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
`;

    return this.createWorkflow(owner, repo, {
      name: "Deploy to Vercel",
      content: workflowContent,
      path: "deploy-vercel.yml",
    });
  }

  // ============================================================================
  // WEBHOOKS
  // ============================================================================

  /**
   * Configura webhook no repositório
   */
  async createWebhook(
    owner: string,
    repo: string,
    config: WebhookConfig,
  ): Promise<GitHubServiceResponse<any>> {
    const body = {
      name: "web",
      active: true,
      events: config.events,
      config: {
        url: config.url,
        content_type: "json",
        ...(config.secret && { secret: config.secret }),
      },
    };

    return this.makeRequest<any>("POST", `/repos/${owner}/${repo}/hooks`, body);
  }

  /**
   * Lista webhooks do repositório
   */
  async listWebhooks(
    owner: string,
    repo: string,
  ): Promise<GitHubServiceResponse<any[]>> {
    return this.makeRequest<any[]>("GET", `/repos/${owner}/${repo}/hooks`);
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Faz uma requisição à API do GitHub
   */
  private async makeRequest<T>(
    method: string,
    endpoint: string,
    body?: any,
  ): Promise<GitHubServiceResponse<T>> {
    try {
      if (!this.accessToken) {
        return {
          success: false,
          error: "Not authenticated. Please set access token first.",
        };
      }

      const url = endpoint.startsWith("http")
        ? endpoint
        : `https://api.github.com${endpoint}`;

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        ...(body && { body: JSON.stringify(body) }),
      });

      const rateLimitRemaining = response.headers.get("x-ratelimit-remaining");
      const rateLimitReset = response.headers.get("x-ratelimit-reset");

      const metadata = {
        rateLimitRemaining: rateLimitRemaining
          ? parseInt(rateLimitRemaining)
          : undefined,
        rateLimitReset: rateLimitReset ? parseInt(rateLimitReset) : undefined,
      };

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `GitHub API error: ${response.status}`,
          metadata,
        };
      }

      // For DELETE requests, there's no content
      if (method === "DELETE") {
        return {
          success: true,
          metadata,
        };
      }

      const data = await response.json();

      return {
        success: true,
        data: data as T,
        metadata,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Gera um state aleatório para OAuth
   */
  private generateState(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  /**
   * Armazena o token no Supabase
   */
  private async storeToken(githubUserId: number, token: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    await supabase.from("integrations").upsert({
      user_id: user.id,
      platform: "github",
      platform_user_id: githubUserId.toString(),
      access_token: token,
      status: "connected",
      connected_at: new Date().toISOString(),
    } as any);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const githubService = new GitHubService();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Helper para criar um repositório e fazer deploy completo
 */
export async function createAndDeployRepository(options: {
  name: string;
  description?: string;
  files: Array<{ path: string; content: string }>;
  setupVercel?: boolean;
}): Promise<
  GitHubServiceResponse<{
    repository: GitHubRepository;
    deploymentUrl?: string;
  }>
> {
  try {
    // 1. Create repository
    const repoResponse = await githubService.createRepository({
      name: options.name,
      description: options.description,
      private: false,
      autoInit: true,
    });

    if (!repoResponse.success || !repoResponse.data) {
      return {
        success: false,
        error: repoResponse.error || "Failed to create repository",
      };
    }

    const repo = repoResponse.data;
    const [owner, repoName] = repo.full_name.split("/");

    // 2. Wait a bit for repo initialization
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 3. Commit files
    const commitResponse = await githubService.commitMultipleFiles(
      owner,
      repoName,
      options.files,
      "Initial commit",
      "main",
    );

    if (!commitResponse.success) {
      return {
        success: false,
        error: commitResponse.error || "Failed to commit files",
      };
    }

    // 4. Setup Vercel workflow if requested
    if (options.setupVercel) {
      await githubService.setupVercelWorkflow(owner, repoName);
    }

    return {
      success: true,
      data: {
        repository: repo,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
