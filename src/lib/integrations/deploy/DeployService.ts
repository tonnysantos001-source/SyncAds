/**
 * DEPLOY SERVICE
 *
 * Serviço completo de deploy automatizado para Vercel
 *
 * Features:
 * - Deploy de projetos do GitHub
 * - Configuração de domínios customizados
 * - Environment variables management
 * - Build configuration
 * - Deployment status tracking
 * - Logs e monitoring
 * - SSL automático
 * - Preview deployments
 *
 * @version 1.0.0
 * @date 2025-01-08
 * @author SyncAds Team
 */

import { supabase } from "@/lib/supabase";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface VercelConfig {
  token: string;
  teamId?: string;
}

export interface DeployOptions {
  name: string;
  gitSource: {
    type: "github";
    repo: string; // format: "owner/repo"
    ref?: string; // branch name, defaults to "main"
  };
  buildCommand?: string;
  outputDirectory?: string;
  installCommand?: string;
  framework?: VercelFramework;
  environmentVariables?: Record<string, string>;
  regions?: string[];
  serverlessFunctionRegion?: string;
}

export interface VercelProject {
  id: string;
  name: string;
  accountId: string;
  createdAt: number;
  framework: string | null;
  devCommand: string | null;
  installCommand: string | null;
  buildCommand: string | null;
  outputDirectory: string | null;
  link?: {
    type: "github";
    repo: string;
    repoId: number;
    org?: string;
    gitCredentialId?: string;
  };
  latestDeployments?: VercelDeployment[];
}

export interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  created: number;
  state:
    | "BUILDING"
    | "ERROR"
    | "INITIALIZING"
    | "QUEUED"
    | "READY"
    | "CANCELED";
  type: "LAMBDAS";
  creator: {
    uid: string;
    email: string;
    username: string;
  };
  meta: Record<string, any>;
  target: "production" | "staging" | null;
  aliasError: any | null;
  aliasAssigned: number | null;
  readyState:
    | "BUILDING"
    | "ERROR"
    | "INITIALIZING"
    | "QUEUED"
    | "READY"
    | "CANCELED";
  projectId: string;
  inspectorUrl: string | null;
}

export interface VercelDomain {
  name: string;
  verified: boolean;
  verification: Array<{
    type: string;
    domain: string;
    value: string;
    reason: string;
  }>;
  createdAt: number;
  expiresAt?: number;
}

export interface DeploymentLog {
  id: string;
  message: string;
  timestamp: number;
  type: "stdout" | "stderr" | "info" | "error" | "warning";
}

export interface DeployServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    duration?: number;
    deploymentUrl?: string;
    projectUrl?: string;
  };
}

export type VercelFramework =
  | "nextjs"
  | "react"
  | "vue"
  | "angular"
  | "svelte"
  | "gatsby"
  | "nuxtjs"
  | "vite"
  | "astro"
  | "remix"
  | "solidstart"
  | "static";

// ============================================================================
// DEPLOY SERVICE CLASS
// ============================================================================

export class DeployService {
  private config: VercelConfig;
  private baseUrl = "https://api.vercel.com";

  constructor(config?: Partial<VercelConfig>) {
    this.config = {
      token: import.meta.env.VITE_VERCEL_TOKEN || "",
      teamId: import.meta.env.VITE_VERCEL_TEAM_ID,
      ...config,
    };
  }

  // ============================================================================
  // PUBLIC API - PROJECT MANAGEMENT
  // ============================================================================

  /**
   * Deploy completo: Cria projeto + configura build + faz deploy
   */
  async deploy(options: DeployOptions): Promise<
    DeployServiceResponse<{
      project: VercelProject;
      deployment: VercelDeployment;
      url: string;
    }>
  > {
    const startTime = Date.now();

    try {
      console.log("🚀 Starting deployment...", options.name);

      // 1. Create project
      const projectResponse = await this.createProject({
        name: options.name,
        framework: options.framework,
        buildCommand: options.buildCommand,
        outputDirectory: options.outputDirectory,
        installCommand: options.installCommand,
      });

      if (!projectResponse.success || !projectResponse.data) {
        return {
          success: false,
          error: projectResponse.error || "Failed to create project",
        };
      }

      const project = projectResponse.data;
      console.log("✅ Project created:", project.id);

      // 2. Link to GitHub repository
      const linkResponse = await this.linkGitHubRepository(
        project.id,
        options.gitSource.repo,
      );

      if (!linkResponse.success) {
        console.warn("⚠️ Failed to link GitHub repo:", linkResponse.error);
        // Continue anyway
      } else {
        console.log("✅ GitHub repository linked");
      }

      // 3. Set environment variables
      if (options.environmentVariables) {
        const envResponse = await this.setEnvironmentVariables(
          project.id,
          options.environmentVariables,
        );

        if (!envResponse.success) {
          console.warn("⚠️ Failed to set env vars:", envResponse.error);
        } else {
          console.log("✅ Environment variables configured");
        }
      }

      // 4. Trigger deployment
      const deployResponse = await this.createDeployment({
        projectId: project.id,
        gitSource: options.gitSource,
        target: "production",
      });

      if (!deployResponse.success || !deployResponse.data) {
        return {
          success: false,
          error: deployResponse.error || "Failed to create deployment",
        };
      }

      const deployment = deployResponse.data;
      console.log("✅ Deployment created:", deployment.uid);

      // 5. Wait for deployment to be ready
      const readyDeployment = await this.waitForDeployment(
        deployment.uid,
        120000, // 2 minutes timeout
      );

      if (!readyDeployment.success || !readyDeployment.data) {
        return {
          success: false,
          error: readyDeployment.error || "Deployment failed",
        };
      }

      const finalDeployment = readyDeployment.data;
      const url = `https://${finalDeployment.url}`;

      console.log("🎉 Deployment ready:", url);

      // 6. Store deployment info in database
      await this.storeDeployment(project.id, finalDeployment, options);

      return {
        success: true,
        data: {
          project,
          deployment: finalDeployment,
          url,
        },
        metadata: {
          duration: Date.now() - startTime,
          deploymentUrl: url,
          projectUrl: `https://vercel.com/${project.name}`,
        },
      };
    } catch (error) {
      console.error("❌ Deployment failed:", error);
      return {
        success: false,
        error: (error as Error).message,
        metadata: {
          duration: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Cria um novo projeto no Vercel
   */
  async createProject(options: {
    name: string;
    framework?: VercelFramework;
    buildCommand?: string;
    outputDirectory?: string;
    installCommand?: string;
    environmentVariables?: Array<{
      key: string;
      value: string;
      target: ("production" | "preview" | "development")[];
    }>;
  }): Promise<DeployServiceResponse<VercelProject>> {
    try {
      const body: any = {
        name: options.name,
        framework: options.framework || null,
      };

      if (options.buildCommand) {
        body.buildCommand = options.buildCommand;
      }

      if (options.outputDirectory) {
        body.outputDirectory = options.outputDirectory;
      }

      if (options.installCommand) {
        body.installCommand = options.installCommand;
      }

      if (options.environmentVariables) {
        body.environmentVariables = options.environmentVariables;
      }

      const response = await this.makeRequest<VercelProject>(
        "POST",
        "/v9/projects",
        body,
      );
      return response;
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Lista projetos do Vercel
   */
  async listProjects(): Promise<DeployServiceResponse<VercelProject[]>> {
    try {
      const response = await this.makeRequest<{ projects: VercelProject[] }>(
        "GET",
        "/v9/projects",
      );

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data.projects,
        };
      }

      return response as any;
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Retorna informações de um projeto
   */
  async getProject(
    projectId: string,
  ): Promise<DeployServiceResponse<VercelProject>> {
    return this.makeRequest<VercelProject>("GET", `/v9/projects/${projectId}`);
  }

  /**
   * Deleta um projeto
   */
  async deleteProject(projectId: string): Promise<DeployServiceResponse<void>> {
    return this.makeRequest<void>("DELETE", `/v9/projects/${projectId}`);
  }

  // ============================================================================
  // DEPLOYMENT OPERATIONS
  // ============================================================================

  /**
   * Cria um novo deployment
   */
  async createDeployment(options: {
    projectId: string;
    gitSource?: {
      type: "github";
      repo: string;
      ref?: string;
    };
    target?: "production" | "staging";
  }): Promise<DeployServiceResponse<VercelDeployment>> {
    try {
      const body: any = {
        name: options.projectId,
        project: options.projectId,
        target: options.target || "production",
      };

      if (options.gitSource) {
        body.gitSource = {
          type: options.gitSource.type,
          repo: options.gitSource.repo,
          ref: options.gitSource.ref || "main",
        };
      }

      const response = await this.makeRequest<VercelDeployment>(
        "POST",
        "/v13/deployments",
        body,
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Retorna status de um deployment
   */
  async getDeployment(
    deploymentId: string,
  ): Promise<DeployServiceResponse<VercelDeployment>> {
    return this.makeRequest<VercelDeployment>(
      "GET",
      `/v13/deployments/${deploymentId}`,
    );
  }

  /**
   * Lista deployments de um projeto
   */
  async listDeployments(
    projectId: string,
  ): Promise<DeployServiceResponse<VercelDeployment[]>> {
    try {
      const response = await this.makeRequest<{
        deployments: VercelDeployment[];
      }>("GET", `/v6/deployments?projectId=${projectId}`);

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data.deployments,
        };
      }

      return response as any;
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Cancela um deployment
   */
  async cancelDeployment(
    deploymentId: string,
  ): Promise<DeployServiceResponse<void>> {
    return this.makeRequest<void>(
      "PATCH",
      `/v12/deployments/${deploymentId}/cancel`,
    );
  }

  /**
   * Aguarda deployment ficar pronto
   */
  async waitForDeployment(
    deploymentId: string,
    timeout: number = 120000,
  ): Promise<DeployServiceResponse<VercelDeployment>> {
    const startTime = Date.now();
    const pollInterval = 5000; // 5 seconds

    while (Date.now() - startTime < timeout) {
      const response = await this.getDeployment(deploymentId);

      if (!response.success) {
        return response;
      }

      const deployment = response.data!;

      if (deployment.readyState === "READY") {
        return {
          success: true,
          data: deployment,
        };
      }

      if (
        deployment.readyState === "ERROR" ||
        deployment.readyState === "CANCELED"
      ) {
        return {
          success: false,
          error: `Deployment ${deployment.readyState.toLowerCase()}`,
        };
      }

      // Still building, wait and retry
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    return {
      success: false,
      error: "Deployment timeout",
    };
  }

  // ============================================================================
  // DOMAIN OPERATIONS
  // ============================================================================

  /**
   * Adiciona domínio customizado ao projeto
   */
  async addDomain(
    projectId: string,
    domain: string,
  ): Promise<DeployServiceResponse<VercelDomain>> {
    try {
      const response = await this.makeRequest<VercelDomain>(
        "POST",
        `/v9/projects/${projectId}/domains`,
        { name: domain },
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Lista domínios de um projeto
   */
  async listDomains(
    projectId: string,
  ): Promise<DeployServiceResponse<VercelDomain[]>> {
    try {
      const response = await this.makeRequest<{ domains: VercelDomain[] }>(
        "GET",
        `/v9/projects/${projectId}/domains`,
      );

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data.domains,
        };
      }

      return response as any;
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Remove domínio de um projeto
   */
  async removeDomain(
    projectId: string,
    domain: string,
  ): Promise<DeployServiceResponse<void>> {
    return this.makeRequest<void>(
      "DELETE",
      `/v9/projects/${projectId}/domains/${domain}`,
    );
  }

  /**
   * Verifica domínio
   */
  async verifyDomain(
    projectId: string,
    domain: string,
  ): Promise<DeployServiceResponse<VercelDomain>> {
    return this.makeRequest<VercelDomain>(
      "POST",
      `/v9/projects/${projectId}/domains/${domain}/verify`,
    );
  }

  // ============================================================================
  // ENVIRONMENT VARIABLES
  // ============================================================================

  /**
   * Define environment variables
   */
  async setEnvironmentVariables(
    projectId: string,
    variables: Record<string, string>,
    target: ("production" | "preview" | "development")[] = [
      "production",
      "preview",
      "development",
    ],
  ): Promise<DeployServiceResponse<void>> {
    try {
      const promises = Object.entries(variables).map(([key, value]) =>
        this.makeRequest("POST", `/v9/projects/${projectId}/env`, {
          key,
          value,
          target,
          type: "encrypted",
        }),
      );

      await Promise.all(promises);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Lista environment variables
   */
  async listEnvironmentVariables(
    projectId: string,
  ): Promise<DeployServiceResponse<any[]>> {
    try {
      const response = await this.makeRequest<{ envs: any[] }>(
        "GET",
        `/v9/projects/${projectId}/env`,
      );

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data.envs,
        };
      }

      return response as any;
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Remove environment variable
   */
  async removeEnvironmentVariable(
    projectId: string,
    envId: string,
  ): Promise<DeployServiceResponse<void>> {
    return this.makeRequest<void>(
      "DELETE",
      `/v9/projects/${projectId}/env/${envId}`,
    );
  }

  // ============================================================================
  // GITHUB INTEGRATION
  // ============================================================================

  /**
   * Vincula repositório do GitHub ao projeto
   */
  async linkGitHubRepository(
    projectId: string,
    repo: string,
  ): Promise<DeployServiceResponse<void>> {
    try {
      const [org, repoName] = repo.split("/");

      const response = await this.makeRequest<void>(
        "POST",
        `/v9/projects/${projectId}/link`,
        {
          type: "github",
          repo: `${org}/${repoName}`,
          org,
        },
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  // ============================================================================
  // LOGS & MONITORING
  // ============================================================================

  /**
   * Retorna logs de um deployment
   */
  async getDeploymentLogs(
    deploymentId: string,
  ): Promise<DeployServiceResponse<DeploymentLog[]>> {
    try {
      // Note: Vercel's logs API is a stream, this is a simplified version
      const response = await this.makeRequest<any>(
        "GET",
        `/v2/deployments/${deploymentId}/events`,
      );

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data as DeploymentLog[],
        };
      }

      return response as any;
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Faz uma requisição à API do Vercel
   */
  private async makeRequest<T>(
    method: string,
    endpoint: string,
    body?: any,
  ): Promise<DeployServiceResponse<T>> {
    try {
      if (!this.config.token) {
        return {
          success: false,
          error: "Vercel token not configured",
        };
      }

      const url = `${this.baseUrl}${endpoint}`;
      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.config.token}`,
        "Content-Type": "application/json",
      };

      if (this.config.teamId) {
        headers["X-Vercel-Team-Id"] = this.config.teamId;
      }

      const response = await fetch(url, {
        method,
        headers,
        ...(body && { body: JSON.stringify(body) }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error:
            errorData.error?.message || `Vercel API error: ${response.status}`,
        };
      }

      // For DELETE requests, there might be no content
      if (method === "DELETE" || response.status === 204) {
        return {
          success: true,
        };
      }

      const data = await response.json();

      return {
        success: true,
        data: data as T,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Armazena informações do deployment no Supabase
   */
  private async storeDeployment(
    projectId: string,
    deployment: VercelDeployment,
    options: DeployOptions,
  ): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.warn("User not authenticated, skipping deployment storage");
        return;
      }

      await supabase.from("deployments").insert({
        user_id: user.id,
        project_name: options.name,
        github_url: `https://github.com/${options.gitSource.repo}`,
        vercel_url: `https://${deployment.url}`,
        vercel_project_id: projectId,
        vercel_deployment_id: deployment.uid,
        status: deployment.readyState.toLowerCase(),
        metadata: {
          framework: options.framework,
          branch: options.gitSource.ref || "main",
          environment: deployment.target,
        },
      } as any);
    } catch (error) {
      console.error("Failed to store deployment:", error);
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const deployService = new DeployService();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Workflow completo: GitHub → Vercel → URL Live
 */
export async function deployFromGitHub(options: {
  name: string;
  repo: string; // format: "owner/repo"
  framework?: VercelFramework;
  envVars?: Record<string, string>;
}): Promise<DeployServiceResponse<{ url: string; projectUrl: string }>> {
  try {
    const result = await deployService.deploy({
      name: options.name,
      gitSource: {
        type: "github",
        repo: options.repo,
        ref: "main",
      },
      framework: options.framework || "static",
      environmentVariables: options.envVars,
    });

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      data: {
        url: result.data.url,
        projectUrl: `https://vercel.com/${result.data.project.name}`,
      },
      metadata: result.metadata,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Workflow rápido para deploy de site estático
 */
export async function quickDeployStatic(options: {
  name: string;
  repo: string;
  buildCommand?: string;
  outputDir?: string;
}): Promise<DeployServiceResponse<string>> {
  const result = await deployService.deploy({
    name: options.name,
    gitSource: {
      type: "github",
      repo: options.repo,
    },
    framework: "static",
    buildCommand: options.buildCommand || "npm run build",
    outputDirectory: options.outputDir || "dist",
  });

  if (!result.success || !result.data) {
    return {
      success: false,
      error: result.error,
    };
  }

  return {
    success: true,
    data: result.data.url,
  };
}
