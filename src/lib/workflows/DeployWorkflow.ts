/**
 * DEPLOY WORKFLOW
 *
 * Workflow completo integrando GitHub + Vercel + Storage
 *
 * Este arquivo demonstra como usar os serviços criados (Orchestrator, GitHub, Vercel, Storage)
 * para criar um workflow end-to-end de deploy automatizado.
 *
 * Features:
 * - Criação automática de repositório GitHub
 * - Commit de código
 * - Deploy no Vercel
 * - Upload de assets para Storage
 * - Progress tracking
 * - Error handling robusto
 * - Rollback em caso de falha
 *
 * @version 1.0.0
 * @date 2025-01-08
 * @author SyncAds Team
 */

import { createAndDeployRepository } from "@/lib/integrations/github";
import { deployService } from "@/lib/integrations/deploy";
import { storageService } from "@/lib/storage";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface DeployWorkflowOptions {
  projectName: string;
  description?: string;
  code: {
    html?: string;
    css?: string;
    js?: string;
    files?: Array<{ path: string; content: string }>;
  };
  assets?: Array<{
    file: File | Blob;
    path: string;
  }>;
  framework?: "static" | "react" | "vue" | "nextjs";
  envVars?: Record<string, string>;
  onProgress?: (step: DeployStep, progress: number, message: string) => void;
}

export interface DeployWorkflowResult {
  success: boolean;
  repositoryUrl?: string;
  deploymentUrl?: string;
  vercelProjectUrl?: string;
  assetsUrls?: Array<{ path: string; url: string }>;
  error?: string;
  metadata?: {
    duration: number;
    githubRepo: string;
    vercelProjectId: string;
    deploymentId: string;
  };
}

export type DeployStep =
  | "initializing"
  | "preparing-files"
  | "creating-repository"
  | "uploading-assets"
  | "committing-code"
  | "configuring-vercel"
  | "deploying"
  | "finalizing"
  | "completed"
  | "failed";

interface WorkflowState {
  currentStep: DeployStep;
  repositoryCreated: boolean;
  repositoryUrl?: string;
  assetsUploaded: boolean;
  assetUrls: Array<{ path: string; url: string }>;
  deploymentStarted: boolean;
  deploymentCompleted: boolean;
}

// ============================================================================
// DEPLOY WORKFLOW CLASS
// ============================================================================

export class DeployWorkflow {
  private state: WorkflowState = {
    currentStep: "initializing",
    repositoryCreated: false,
    assetsUploaded: false,
    assetUrls: [],
    deploymentStarted: false,
    deploymentCompleted: false,
  };

  /**
   * Workflow completo de deploy
   */
  async execute(options: DeployWorkflowOptions): Promise<DeployWorkflowResult> {
    const startTime = Date.now();

    try {
      this.updateProgress(
        options,
        "initializing",
        0,
        "Iniciando workflow de deploy...",
      );

      // Step 1: Prepare files
      this.updateProgress(
        options,
        "preparing-files",
        10,
        "Preparando arquivos...",
      );
      const files = this.prepareFiles(options);

      // Step 2: Upload assets to Storage (if any)
      let assetUrls: Array<{ path: string; url: string }> = [];
      if (options.assets && options.assets.length > 0) {
        this.updateProgress(
          options,
          "uploading-assets",
          20,
          "Fazendo upload de assets...",
        );
        const assetsResult = await this.uploadAssets(options.assets);

        if (!assetsResult.success) {
          throw new Error(`Failed to upload assets: ${assetsResult.error}`);
        }

        assetUrls = assetsResult.urls || [];
        this.state.assetsUploaded = true;
        this.state.assetUrls = assetUrls;
      }

      // Step 3: Create GitHub repository
      this.updateProgress(
        options,
        "creating-repository",
        40,
        "Criando repositório no GitHub...",
      );
      const repoResult = await this.createRepository(options, files);

      if (!repoResult.success || !repoResult.data) {
        throw new Error(`Failed to create repository: ${repoResult.error}`);
      }

      this.state.repositoryCreated = true;
      this.state.repositoryUrl = repoResult.data.repository.html_url;

      // Repository successfully created
      const _repoName = repoResult.data.repository.full_name;

      this.updateProgress(
        options,
        "committing-code",
        60,
        "Código commitado com sucesso!",
      );

      // Step 4: Deploy to Vercel
      this.updateProgress(
        options,
        "deploying",
        70,
        "Iniciando deploy no Vercel...",
      );
      const deployResult = await this.deployToVercel(
        options,
        repoResult.data.repository.full_name,
      );

      if (!deployResult.success || !deployResult.data) {
        throw new Error(`Failed to deploy: ${deployResult.error}`);
      }

      this.state.deploymentStarted = true;

      this.updateProgress(
        options,
        "deploying",
        90,
        "Aguardando deploy finalizar...",
      );

      // Wait for deployment to be ready (already handled in deployService)
      this.state.deploymentCompleted = true;

      // Step 5: Finalize
      this.updateProgress(options, "finalizing", 95, "Finalizando...");

      const result: DeployWorkflowResult = {
        success: true,
        repositoryUrl: repoResult.data.repository.html_url,
        deploymentUrl: deployResult.data.url,
        vercelProjectUrl: `https://vercel.com/${deployResult.data.project.name}`,
        assetsUrls: assetUrls,
        metadata: {
          duration: Date.now() - startTime,
          githubRepo: repoResult.data.repository.full_name,
          vercelProjectId: deployResult.data.project.id,
          deploymentId: deployResult.data.deployment.uid,
        },
      };

      this.updateProgress(
        options,
        "completed",
        100,
        "🎉 Deploy concluído com sucesso!",
      );

      return result;
    } catch (error) {
      this.updateProgress(
        options,
        "failed",
        0,
        `Erro: ${(error as Error).message}`,
      );

      // Attempt rollback
      await this.rollback();

      return {
        success: false,
        error: (error as Error).message,
        metadata: {
          duration: Date.now() - startTime,
          githubRepo: "",
          vercelProjectId: "",
          deploymentId: "",
        },
      };
    }
  }

  /**
   * Prepara arquivos para commit
   */
  private prepareFiles(
    options: DeployWorkflowOptions,
  ): Array<{ path: string; content: string }> {
    const files: Array<{ path: string; content: string }> = [];

    // Custom files provided
    if (options.code.files) {
      files.push(...options.code.files);
      return files;
    }

    // Generate from HTML/CSS/JS
    if (options.code.html) {
      files.push({
        path: "index.html",
        content: options.code.html,
      });
    }

    if (options.code.css) {
      files.push({
        path: "styles.css",
        content: options.code.css,
      });
    }

    if (options.code.js) {
      files.push({
        path: "script.js",
        content: options.code.js,
      });
    }

    // Add package.json for frameworks
    if (options.framework && options.framework !== "static") {
      files.push({
        path: "package.json",
        content: this.generatePackageJson(
          options.projectName,
          options.framework,
        ),
      });
    }

    // Add README
    files.push({
      path: "README.md",
      content: this.generateReadme(options.projectName, options.description),
    });

    // Add .gitignore
    files.push({
      path: ".gitignore",
      content: this.generateGitignore(),
    });

    return files;
  }

  /**
   * Upload assets para Storage
   */
  private async uploadAssets(
    assets: Array<{ file: File | Blob; path: string }>,
  ): Promise<{
    success: boolean;
    urls?: Array<{ path: string; url: string }>;
    error?: string;
  }> {
    try {
      const results = await storageService.uploadBatch({
        files: assets.map((asset) => ({
          file: asset.file,
          path: `deployments/${Date.now()}/${asset.path}`,
          metadata: {
            type: "deployment-asset",
            originalPath: asset.path,
          },
        })),
        bucket: "user-assets",
      });

      if (!results.success || !results.data) {
        return {
          success: false,
          error: results.error,
        };
      }

      return {
        success: true,
        urls: results.data.map((result: any, index: number) => ({
          path: assets[index].path,
          url: result.cdnUrl,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Cria repositório no GitHub
   */
  private async createRepository(
    options: DeployWorkflowOptions,
    files: Array<{ path: string; content: string }>,
  ) {
    return createAndDeployRepository({
      name: options.projectName,
      description: options.description,
      files,
      setupVercel: true,
    });
  }

  /**
   * Deploy para Vercel
   */
  private async deployToVercel(
    options: DeployWorkflowOptions,
    repoFullName: string,
  ) {
    return deployService.deploy({
      name: options.projectName,
      gitSource: {
        type: "github",
        repo: repoFullName,
        ref: "main",
      },
      framework: options.framework || "static",
      environmentVariables: options.envVars,
    });
  }

  /**
   * Rollback em caso de erro
   */
  private async rollback(): Promise<void> {
    console.log("🔄 Iniciando rollback...");

    try {
      // Delete uploaded assets
      if (this.state.assetsUploaded && this.state.assetUrls.length > 0) {
        console.log("Deletando assets...");
        const paths = this.state.assetUrls.map((a) => a.path);
        await storageService.deleteBatch(paths, "user-assets", true);
      }

      // Note: We don't delete the GitHub repo or Vercel project
      // as they might be useful for debugging
      console.log(
        "⚠️ Repository and Vercel project were NOT deleted for debugging purposes",
      );
      console.log("✅ Rollback concluído");
    } catch (error) {
      console.error("❌ Rollback failed:", error);
    }
  }

  /**
   * Update progress callback
   */
  private updateProgress(
    options: DeployWorkflowOptions,
    step: DeployStep,
    progress: number,
    message: string,
  ): void {
    this.state.currentStep = step;
    options.onProgress?.(step, progress, message);
    console.log(`[${step}] ${progress}% - ${message}`);
  }

  /**
   * Generate package.json
   */
  private generatePackageJson(name: string, framework: string): string {
    const packages: Record<string, any> = {
      react: {
        dependencies: {
          react: "^18.2.0",
          "react-dom": "^18.2.0",
        },
        devDependencies: {
          "@types/react": "^18.2.0",
          "@types/react-dom": "^18.2.0",
          "@vitejs/plugin-react": "^4.0.0",
          vite: "^4.0.0",
        },
        scripts: {
          dev: "vite",
          build: "vite build",
          preview: "vite preview",
        },
      },
      vue: {
        dependencies: {
          vue: "^3.3.0",
        },
        devDependencies: {
          "@vitejs/plugin-vue": "^4.0.0",
          vite: "^4.0.0",
        },
        scripts: {
          dev: "vite",
          build: "vite build",
          preview: "vite preview",
        },
      },
      nextjs: {
        dependencies: {
          next: "^14.0.0",
          react: "^18.2.0",
          "react-dom": "^18.2.0",
        },
        devDependencies: {
          "@types/node": "^20.0.0",
          "@types/react": "^18.2.0",
          typescript: "^5.0.0",
        },
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start",
        },
      },
    };

    const config = packages[framework] || {};

    return JSON.stringify(
      {
        name,
        version: "1.0.0",
        private: true,
        ...config,
      },
      null,
      2,
    );
  }

  /**
   * Generate README.md
   */
  private generateReadme(name: string, description?: string): string {
    return `# ${name}

${description || "Project deployed with SyncAds"}

## 🚀 Deploy

This project was automatically deployed using SyncAds.

- **GitHub Repository**: Check the commits for the source code
- **Live URL**: Check Vercel deployment

## 📦 Stack

- Deployed to Vercel
- Hosted on GitHub
- Assets on Supabase Storage (if any)

## 🛠️ Development

\`\`\`bash
npm install
npm run dev
\`\`\`

---

Generated by [SyncAds](https://syncads.com.br) - AI-Powered Marketing Platform
`;
  }

  /**
   * Generate .gitignore
   */
  private generateGitignore(): string {
    return `# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
build/
dist/
.vercel
.next/
out/

# Misc
.DS_Store
*.log
.env
.env.local
.env.production

# IDE
.vscode/
.idea/
*.swp
*.swo
`;
  }
}

// ============================================================================
// SINGLETON & CONVENIENCE FUNCTIONS
// ============================================================================

export const deployWorkflow = new DeployWorkflow();

/**
 * Quick deploy: HTML + CSS + JS → GitHub → Vercel
 */
export async function quickDeploy(
  projectName: string,
  html: string,
  css?: string,
  js?: string,
  onProgress?: (step: DeployStep, progress: number, message: string) => void,
): Promise<DeployWorkflowResult> {
  return deployWorkflow.execute({
    projectName,
    code: { html, css, js },
    framework: "static",
    onProgress,
  });
}

/**
 * Deploy com assets (imagens, etc)
 */
export async function deployWithAssets(
  projectName: string,
  files: Array<{ path: string; content: string }>,
  assets: Array<{ file: File | Blob; path: string }>,
  onProgress?: (step: DeployStep, progress: number, message: string) => void,
): Promise<DeployWorkflowResult> {
  return deployWorkflow.execute({
    projectName,
    code: { files },
    assets,
    framework: "static",
    onProgress,
  });
}

/**
 * Deploy com framework específico
 */
export async function deployWithFramework(
  projectName: string,
  framework: "react" | "vue" | "nextjs",
  files: Array<{ path: string; content: string }>,
  envVars?: Record<string, string>,
  onProgress?: (step: DeployStep, progress: number, message: string) => void,
): Promise<DeployWorkflowResult> {
  return deployWorkflow.execute({
    projectName,
    code: { files },
    framework,
    envVars,
    onProgress,
  });
}
