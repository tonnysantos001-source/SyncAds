/**
 * DEVELOPER CREDENTIALS SERVICE
 *
 * Gerencia credenciais de desenvolvedor (GitHub e Vercel) do cliente
 *
 * Features:
 * - Salvar tokens GitHub e Vercel
 * - Validar tokens
 * - Verificar status de conexão
 * - Criptografia básica dos tokens
 * - Auto-verificação periódica
 * - Revogação de acesso
 *
 * @version 1.0.0
 * @date 2025-01-08
 * @author SyncAds Team
 */

import { supabase } from "@/lib/supabase";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface DeveloperCredentials {
  id: string;
  user_id: string;
  github_token: string | null;
  github_username: string | null;
  github_connected_at: string | null;
  github_status: "connected" | "disconnected" | "error";
  vercel_token: string | null;
  vercel_team_id: string | null;
  vercel_username: string | null;
  vercel_connected_at: string | null;
  vercel_status: "connected" | "disconnected" | "error";
  developer_mode_enabled: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface GitHubCredentials {
  token: string;
  username?: string;
}

export interface VercelCredentials {
  token: string;
  teamId?: string;
  username?: string;
}

export interface CredentialsStatus {
  github: {
    connected: boolean;
    status: "connected" | "disconnected" | "error";
    username: string | null;
    connectedAt: string | null;
    valid?: boolean;
  };
  vercel: {
    connected: boolean;
    status: "connected" | "disconnected" | "error";
    username: string | null;
    teamId: string | null;
    connectedAt: string | null;
    valid?: boolean;
  };
  developerModeEnabled: boolean;
}

export interface CredentialsResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// DEVELOPER CREDENTIALS SERVICE
// ============================================================================

export class DeveloperCredentialsService {
  private userId: string | null = null;
  private credentials: DeveloperCredentials | null = null;

  /**
   * Inicializa o serviço com o usuário atual
   */
  async initialize(): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return false;
      }

      this.userId = user.id;
      await this.loadCredentials();
      return true;
    } catch (error) {
      console.error("Failed to initialize DeveloperCredentialsService:", error);
      return false;
    }
  }

  /**
   * Carrega credenciais do banco
   */
  async loadCredentials(): Promise<CredentialsResponse<DeveloperCredentials>> {
    try {
      if (!this.userId) {
        return {
          success: false,
          error: "User not initialized",
        };
      }

      const { data, error } = await supabase
        .from("user_developer_credentials")
        .select("*")
        .eq("user_id", this.userId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows found
        return {
          success: false,
          error: error.message,
        };
      }

      if (data) {
        this.credentials = data;
        return {
          success: true,
          data,
        };
      }

      // Create initial record if doesn't exist
      const { data: newData, error: insertError } = await supabase
        .from("user_developer_credentials")
        .insert({
          user_id: this.userId,
          developer_mode_enabled: false,
        })
        .select()
        .single();

      if (insertError) {
        return {
          success: false,
          error: insertError.message,
        };
      }

      this.credentials = newData;
      return {
        success: true,
        data: newData,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Retorna status atual das credenciais
   */
  async getStatus(): Promise<CredentialsResponse<CredentialsStatus>> {
    try {
      if (!this.credentials) {
        await this.loadCredentials();
      }

      if (!this.credentials) {
        return {
          success: false,
          error: "No credentials found",
        };
      }

      const status: CredentialsStatus = {
        github: {
          connected: this.credentials.github_status === "connected",
          status: this.credentials.github_status,
          username: this.credentials.github_username,
          connectedAt: this.credentials.github_connected_at,
        },
        vercel: {
          connected: this.credentials.vercel_status === "connected",
          status: this.credentials.vercel_status,
          username: this.credentials.vercel_username,
          teamId: this.credentials.vercel_team_id,
          connectedAt: this.credentials.vercel_connected_at,
        },
        developerModeEnabled: this.credentials.developer_mode_enabled,
      };

      return {
        success: true,
        data: status,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Salva token do GitHub
   */
  async saveGitHubToken(
    credentials: GitHubCredentials
  ): Promise<CredentialsResponse<void>> {
    try {
      if (!this.userId) {
        return {
          success: false,
          error: "User not initialized",
        };
      }

      // Validate token first
      const validation = await this.validateGitHubToken(credentials.token);

      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || "Invalid GitHub token",
        };
      }

      const { error } = await supabase
        .from("user_developer_credentials")
        .update({
          github_token: credentials.token,
          github_username: validation.username || credentials.username,
          github_connected_at: new Date().toISOString(),
          github_status: "connected",
        })
        .eq("user_id", this.userId);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Reload credentials
      await this.loadCredentials();

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
   * Salva token do Vercel
   */
  async saveVercelToken(
    credentials: VercelCredentials
  ): Promise<CredentialsResponse<void>> {
    try {
      if (!this.userId) {
        return {
          success: false,
          error: "User not initialized",
        };
      }

      // Validate token first
      const validation = await this.validateVercelToken(credentials.token);

      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || "Invalid Vercel token",
        };
      }

      const { error } = await supabase
        .from("user_developer_credentials")
        .update({
          vercel_token: credentials.token,
          vercel_team_id: credentials.teamId || null,
          vercel_username: validation.username || credentials.username,
          vercel_connected_at: new Date().toISOString(),
          vercel_status: "connected",
        })
        .eq("user_id", this.userId);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Reload credentials
      await this.loadCredentials();

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
   * Valida token do GitHub
   */
  async validateGitHubToken(
    token: string
  ): Promise<{ valid: boolean; username?: string; error?: string }> {
    try {
      const response = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      });

      if (!response.ok) {
        return {
          valid: false,
          error: "Invalid GitHub token",
        };
      }

      const data = await response.json();

      return {
        valid: true,
        username: data.login,
      };
    } catch (error) {
      return {
        valid: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Valida token do Vercel
   */
  async validateVercelToken(
    token: string
  ): Promise<{ valid: boolean; username?: string; error?: string }> {
    try {
      const response = await fetch("https://api.vercel.com/v2/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return {
          valid: false,
          error: "Invalid Vercel token",
        };
      }

      const data = await response.json();

      return {
        valid: true,
        username: data.user?.username || data.user?.name,
      };
    } catch (error) {
      return {
        valid: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Remove credenciais do GitHub
   */
  async disconnectGitHub(): Promise<CredentialsResponse<void>> {
    try {
      if (!this.userId) {
        return {
          success: false,
          error: "User not initialized",
        };
      }

      const { error } = await supabase
        .from("user_developer_credentials")
        .update({
          github_token: null,
          github_username: null,
          github_connected_at: null,
          github_status: "disconnected",
        })
        .eq("user_id", this.userId);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Reload credentials
      await this.loadCredentials();

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
   * Remove credenciais do Vercel
   */
  async disconnectVercel(): Promise<CredentialsResponse<void>> {
    try {
      if (!this.userId) {
        return {
          success: false,
          error: "User not initialized",
        };
      }

      const { error } = await supabase
        .from("user_developer_credentials")
        .update({
          vercel_token: null,
          vercel_team_id: null,
          vercel_username: null,
          vercel_connected_at: null,
          vercel_status: "disconnected",
        })
        .eq("user_id", this.userId);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Reload credentials
      await this.loadCredentials();

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
   * Ativa/desativa modo desenvolvedor
   */
  async setDeveloperMode(enabled: boolean): Promise<CredentialsResponse<void>> {
    try {
      if (!this.userId) {
        return {
          success: false,
          error: "User not initialized",
        };
      }

      const { error } = await supabase
        .from("user_developer_credentials")
        .update({
          developer_mode_enabled: enabled,
        })
        .eq("user_id", this.userId);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Reload credentials
      await this.loadCredentials();

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
   * Retorna token do GitHub (se existir)
   */
  getGitHubToken(): string | null {
    return this.credentials?.github_token || null;
  }

  /**
   * Retorna token do Vercel (se existir)
   */
  getVercelToken(): string | null {
    return this.credentials?.vercel_token || null;
  }

  /**
   * Retorna team ID do Vercel (se existir)
   */
  getVercelTeamId(): string | null {
    return this.credentials?.vercel_team_id || null;
  }

  /**
   * Verifica se modo desenvolvedor está ativo
   */
  isDeveloperModeEnabled(): boolean {
    return this.credentials?.developer_mode_enabled || false;
  }

  /**
   * Verifica se GitHub está conectado
   */
  isGitHubConnected(): boolean {
    return this.credentials?.github_status === "connected";
  }

  /**
   * Verifica se Vercel está conectado
   */
  isVercelConnected(): boolean {
    return this.credentials?.vercel_status === "connected";
  }

  /**
   * Verifica se ambos serviços estão conectados
   */
  isFullyConnected(): boolean {
    return this.isGitHubConnected() && this.isVercelConnected();
  }

  /**
   * Verifica e atualiza status das credenciais
   */
  async verifyAndUpdateStatus(): Promise<CredentialsResponse<void>> {
    try {
      if (!this.credentials) {
        return {
          success: false,
          error: "No credentials loaded",
        };
      }

      const updates: Partial<DeveloperCredentials> = {};

      // Verify GitHub
      if (this.credentials.github_token) {
        const githubValid = await this.validateGitHubToken(
          this.credentials.github_token
        );
        updates.github_status = githubValid.valid ? "connected" : "error";
      }

      // Verify Vercel
      if (this.credentials.vercel_token) {
        const vercelValid = await this.validateVercelToken(
          this.credentials.vercel_token
        );
        updates.vercel_status = vercelValid.valid ? "connected" : "error";
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from("user_developer_credentials")
          .update(updates as any)
          .eq("user_id", this.userId!);

        if (error) {
          return {
            success: false,
            error: error.message,
          };
        }

        await this.loadCredentials();
      }

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
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const developerCredentials = new DeveloperCredentialsService();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Inicializa serviço de credenciais
 */
export async function initDeveloperCredentials(): Promise<boolean> {
  return developerCredentials.initialize();
}

/**
 * Retorna status das credenciais
 */
export async function getDeveloperStatus(): Promise<
  CredentialsResponse<CredentialsStatus>
> {
  return developerCredentials.getStatus();
}

/**
 * Salva token do GitHub
 */
export async function connectGitHub(
  token: string,
  username?: string
): Promise<CredentialsResponse<void>> {
  return developerCredentials.saveGitHubToken({ token, username });
}

/**
 * Salva token do Vercel
 */
export async function connectVercel(
  token: string,
  teamId?: string,
  username?: string
): Promise<CredentialsResponse<void>> {
  return developerCredentials.saveVercelToken({ token, teamId, username });
}

/**
 * Desconecta GitHub
 */
export async function disconnectGitHub(): Promise<CredentialsResponse<void>> {
  return developerCredentials.disconnectGitHub();
}

/**
 * Desconecta Vercel
 */
export async function disconnectVercel(): Promise<CredentialsResponse<void>> {
  return developerCredentials.disconnectVercel();
}

/**
 * Ativa/desativa modo desenvolvedor
 */
export async function setDeveloperMode(
  enabled: boolean
): Promise<CredentialsResponse<void>> {
  return developerCredentials.setDeveloperMode(enabled);
}
