import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { authApi } from "@/lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  avatar?: string | null;
  plan: "Free" | "Pro" | "Enterprise";
  isSuperAdmin?: boolean;
  storeName?: string | null;
}

interface AuthState {
  // Estado
  isAuthenticated: boolean;
  user: User | null;
  isInitialized: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    cpf?: string,
    birthDate?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      isAuthenticated: false,
      user: null,
      isInitialized: false, // Sempre começa como false e será setado para true após verificação

      // Init Auth - Verifica autenticação ao carregar app
      initAuth: async () => {
        try {
          console.log("🔄 [AUTH] InitAuth iniciado...");
          const userData = await authApi.getCurrentUser();
          console.log("🔄 [AUTH] User data:", userData);

          if (userData) {
            set({
              isAuthenticated: true,
              user: {
                id: userData.id,
                name: userData.name,
                email: userData.email,
                avatarUrl: userData.avatar || undefined,
                avatar: userData.avatar,
                plan:
                  userData.plan === "PRO"
                    ? "Pro"
                    : userData.plan === "FREE"
                      ? "Free"
                      : "Enterprise",
                isSuperAdmin: Boolean(userData.isSuperAdmin),
                storeName: userData.storeName,
              },
              isInitialized: true, // Sempre true quando há usuário
            });
            console.log(
              "✅ [AUTH] InitAuth OK! isSuperAdmin:",
              userData.isSuperAdmin,
            );
          } else {
            // IMPORTANTE: Sempre setar isInitialized como true, mesmo sem usuário
            set({
              isAuthenticated: false,
              user: null,
              isInitialized: true,
            });
            console.log("⚠️ [AUTH] Nenhum usuário autenticado");
          }
        } catch (error) {
          console.error("❌ [AUTH] Init auth error:", error);
          // IMPORTANTE: Mesmo com erro, setar como inicializado
          set({
            isAuthenticated: false,
            user: null,
            isInitialized: true,
          });
        }
      },

      // Login
      login: async (email: string, password: string) => {
        try {
          console.log("🔐 [AUTH] Login iniciado...");
          const { user } = await authApi.signIn({ email, password });
          console.log("🔐 [AUTH] Supabase auth OK:", !!user);

          if (user) {
            const userData = await authApi.getCurrentUser();
            console.log("🔐 [AUTH] User data:", userData);

            if (userData) {
              set({
                isAuthenticated: true,
                isInitialized: true, // Garantir que está inicializado após login
                user: {
                  id: userData.id,
                  name: userData.name,
                  email: userData.email,
                  avatarUrl: userData.avatar || undefined,
                  avatar: userData.avatar,
                  plan:
                    userData.plan === "PRO"
                      ? "Pro"
                      : userData.plan === "FREE"
                        ? "Free"
                        : "Enterprise",
                  isSuperAdmin: Boolean(userData.isSuperAdmin),
                  storeName: userData.storeName,
                },
              });
              console.log(
                "✅ [AUTH] Login completo! isSuperAdmin:",
                userData.isSuperAdmin,
              );
            } else {
              // Se não conseguiu buscar userData, logar erro mas manter inicializado
              console.error(
                "❌ [AUTH] Login OK mas não conseguiu buscar userData",
              );
              set({ isInitialized: true });
            }
          }
        } catch (error) {
          console.error("❌ [AUTH] Login error:", error);
          // Garantir que está inicializado mesmo com erro de login
          set({ isInitialized: true });
          throw error;
        }
      },

      // Register
      register: async (
        email: string,
        password: string,
        name: string,
        cpf?: string,
        birthDate?: string,
        addressData?: {
          cep: string;
          street: string;
          number: string;
          complement?: string;
          neighborhood: string;
          city: string;
          state: string;
        },
      ) => {
        try {
          console.log("🔐 [AUTH STORE] Register iniciado...", {
            email,
            name,
            hasCpf: !!cpf,
            hasBirthDate: !!birthDate,
            hasAddress: !!addressData,
          });

          console.log("📝 [AUTH STORE] Chamando authApi.signUp...");
          const { user } = await authApi.signUp({
            email,
            password,
            name,
            cpf,
            birthDate,
            ...addressData,
          });
          console.log("✅ [AUTH STORE] signUp retornou:", !!user);
          if (user) {
            console.log("✅ [AUTH STORE] Usuário criado, setando estado...", {
              userId: user.id,
              email: user.email,
              name: name,
            });

            // Usar dados do signUp diretamente (não buscar de novo)
            set({
              isAuthenticated: true,
              isInitialized: true,
              user: {
                id: user.id,
                name: name, // Usar o name que foi passado no signup
                email: user.email || email,
                avatarUrl: undefined,
                avatar: null,
                plan: "Free", // Novo usuário sempre começa no plano Free
                isSuperAdmin: false,
              },
            });

            console.log("✅ [AUTH STORE] Estado atualizado com sucesso!");
          } else {
            console.error("❌ [AUTH STORE] signUp não retornou usuário!");
          }
        } catch (error: any) {
          console.error("❌ [AUTH STORE] Register error:", error);
          console.error("❌ [AUTH STORE] Error message:", error.message);
          console.error("❌ [AUTH STORE] Error details:", {
            name: error.name,
            code: error.code,
            status: error.status,
          });
          throw error;
        }
      },

      // Logout
      logout: async () => {
        try {
          await authApi.signOut();

          // Limpar COMPLETAMENTE o estado
          set({
            isAuthenticated: false,
            user: null,
            isInitialized: true,
          });

          // Limpar localStorage manualmente também
          localStorage.removeItem("auth-storage");
        } catch (error) {
          console.error("Logout error:", error);
          // Mesmo com erro, limpar o estado local
          set({
            isAuthenticated: false,
            user: null,
            isInitialized: true,
          });
          localStorage.removeItem("auth-storage");
          throw error;
        }
      },

      // Update User
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        isInitialized: state.isInitialized, // Persistir também isInitialized
      }),
      // Garantir que ao hidratar, isInitialized seja sempre boolean
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Se isInitialized não estiver definido, setar como false
          if (typeof state.isInitialized !== "boolean") {
            state.isInitialized = false;
          }
          console.log("🔄 [AUTH] Storage hidratado:", {
            isAuthenticated: state.isAuthenticated,
            hasUser: !!state.user,
            isInitialized: state.isInitialized,
          });
        }
      },
    },
  ),
);
