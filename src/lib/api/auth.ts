import { supabase } from "../supabase";
import { GLOBAL_ORGANIZATION_ID } from "../constants";

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  cpf?: string;
  birthDate?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export const authApi = {
  // Sign up with email and password
  signUp: async (data: SignUpData) => {
    try {
      console.log("🔐 [AUTH API] signUp iniciado...", {
        email: data.email,
        name: data.name,
        hasCpf: !!data.cpf,
        hasBirthDate: !!data.birthDate,
        hasAddress: !!data.cep,
      });

      // Create user in auth system
      console.log("📝 [AUTH API] Criando usuário no Supabase Auth...");
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        console.error("❌ [AUTH API] Erro no Supabase Auth:", authError);
        throw authError;
      }
      if (!authData.user) {
        console.error("❌ [AUTH API] Auth não retornou usuário!");
        throw new Error("Failed to create user");
      }

      console.log("✅ [AUTH API] Usuário criado no Auth:", authData.user.id);

      // Create user record in database
      const userId = authData.user.id;
      const now = new Date().toISOString();

      const userData = {
        id: userId,
        email: data.email,
        name: data.name,
        cpf: data.cpf || null,
        birthDate: data.birthDate || null,
        cep: data.cep || null,
        street: data.street || null,
        number: data.number || null,
        complement: data.complement || null,
        neighborhood: data.neighborhood || null,
        city: data.city || null,
        state: data.state || null,
        emailVerified: false,
        authProvider: "EMAIL",
        plan: "FREE",
        trialEndsAt: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        role: "MEMBER",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      console.log(
        "📝 [AUTH API] Inserindo usuário na tabela User...",
        userData,
      );

      const { error: userError } = await supabase.from("User").insert(userData);

      if (userError) {
        console.error(
          "❌ [AUTH API] Erro ao inserir na tabela User:",
          userError,
        );
        console.error("❌ [AUTH API] Código do erro:", userError.code);
        console.error("❌ [AUTH API] Mensagem:", userError.message);
        console.error("❌ [AUTH API] Detalhes:", userError.details);
        throw userError;
      }

      console.log("✅ [AUTH API] Usuário inserido na tabela User com sucesso!");
      console.log("✅ [AUTH API] Retornando user e session...");

      return { user: authData.user, session: authData.session };
    } catch (error: any) {
      console.error("❌ [AUTH API] Sign up error:", error);
      console.error("❌ [AUTH API] Error name:", error.name);
      console.error("❌ [AUTH API] Error message:", error.message);
      console.error("❌ [AUTH API] Error stack:", error.stack);
      throw error;
    }
  },

  // Sign in with email and password
  signIn: async (data: SignInData) => {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      return { user: authData.user, session: authData.session };
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  },

  // Sign out
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      // Verificar sessão antes de buscar usuário
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("❌ [AUTH API] Erro ao buscar sessão:", sessionError);
        // Limpar storage se sessão inválida
        localStorage.removeItem("auth-storage");
        return null;
      }

      if (!session) {
        console.log("⚠️ [AUTH API] Sem sessão ativa");
        localStorage.removeItem("auth-storage");
        return null;
      }

      // Verificar se token está próximo de expirar (menos de 5 minutos)
      const expiresAt = session.expires_at || 0;
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expiresAt - now;

      if (timeUntilExpiry < 300 && timeUntilExpiry > 0) {
        console.log("🔄 [AUTH API] Token próximo de expirar, renovando...");
        try {
          const {
            data: { session: newSession },
            error: refreshError,
          } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error(
              "❌ [AUTH API] Erro ao renovar sessão:",
              refreshError,
            );
            localStorage.removeItem("auth-storage");
            return null;
          }
          if (newSession) {
            console.log("✅ [AUTH API] Sessão renovada com sucesso");
          }
        } catch (refreshErr) {
          console.error("❌ [AUTH API] Exceção ao renovar sessão:", refreshErr);
          localStorage.removeItem("auth-storage");
          return null;
        }
      } else if (timeUntilExpiry <= 0) {
        console.error("❌ [AUTH API] Token expirado");
        localStorage.removeItem("auth-storage");
        return null;
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) {
        console.error("❌ [AUTH API] Erro ao buscar user:", authError);
        // Se erro 401, limpar storage
        if (
          authError.message?.includes("401") ||
          authError.message?.includes("JWT")
        ) {
          console.log("🧹 [AUTH API] Limpando storage por token inválido");
          localStorage.removeItem("auth-storage");
        }
        throw authError;
      }
      if (!user) return null;

      // Get user data from database
      const { data: userData, error: userError } = await supabase
        .from("User")
        .select("*")
        .eq("id", user.id)
        .single();

      if (userError) throw userError;

      // Check if user is Super Admin
      // Garantir que sempre retorne boolean
      let isSuperAdmin: boolean = false;
      try {
        // Query direta com maybeSingle para retornar null se não existir
        const { data: superAdminCheck, error: superAdminError } = await supabase
          .from("SuperAdmin")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        // Garantir que seja boolean
        isSuperAdmin = Boolean(superAdminCheck);

        console.log("🔐 [AUTH API] Super Admin check:", {
          userId: user.id,
          isSuperAdmin,
          hasData: !!superAdminCheck,
          error: superAdminError?.message,
        });
      } catch (e) {
        // Ignora erro silenciosamente - user não é super admin ou tabela não existe
        console.log(
          "⚠️ [AUTH API] Super Admin check failed (user is not admin):",
          e,
        );
        isSuperAdmin = false;
      }

      const result = {
        ...userData,
        isSuperAdmin: Boolean(isSuperAdmin), // Garantir boolean
      };

      console.log("✅ [AUTH API] getCurrentUser result:", {
        id: result.id,
        email: result.email,
        isSuperAdmin: result.isSuperAdmin,
      });

      return result;
    } catch (error) {
      console.error("Get current user error:", error);
      return null;
    }
  },

  // Get current session
  getSession: async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error("Get session error:", error);
      return null;
    }
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Reset password
  resetPassword: async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  },

  // Update password
  updatePassword: async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
    } catch (error) {
      console.error("Update password error:", error);
      throw error;
    }
  },
};
