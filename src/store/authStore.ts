import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { authApi } from '@/lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  avatar?: string | null;
  plan: 'Free' | 'Pro' | 'Enterprise';
  isSuperAdmin?: boolean;
}

interface AuthState {
  // Estado
  isAuthenticated: boolean;
  user: User | null;
  isInitialized: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, cpf?: string, birthDate?: string) => Promise<void>;
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
      isInitialized: false,

      // Init Auth - Verifica autenticação ao carregar app
      initAuth: async () => {
        try {
          console.log('🔄 [AUTH] InitAuth iniciado...');
          const userData = await authApi.getCurrentUser();
          console.log('🔄 [AUTH] User data:', userData);
          
          if (userData) {
            set({ 
              isAuthenticated: true, 
              user: {
                id: userData.id,
                name: userData.name,
                email: userData.email,
                avatarUrl: userData.avatar || undefined,
                avatar: userData.avatar,
                plan: userData.plan === 'PRO' ? 'Pro' : userData.plan === 'FREE' ? 'Free' : 'Enterprise',
                isSuperAdmin: userData.isSuperAdmin || false,
              },
              isInitialized: true,
            });
            console.log('✅ [AUTH] InitAuth OK! isSuperAdmin:', userData.isSuperAdmin);
          } else {
            set({ isInitialized: true });
            console.log('⚠️ [AUTH] Nenhum usuário autenticado');
          }
        } catch (error) {
          console.error('❌ [AUTH] Init auth error:', error);
          set({ isInitialized: true });
        }
      },

      // Login
      login: async (email: string, password: string) => {
        try {
          console.log('🔐 [AUTH] Login iniciado...');
          const { user } = await authApi.signIn({ email, password });
          console.log('🔐 [AUTH] Supabase auth OK:', !!user);
          
          if (user) {
            const userData = await authApi.getCurrentUser();
            console.log('🔐 [AUTH] User data:', userData);
            
            if (userData) {
              set({ 
                isAuthenticated: true,
                isInitialized: true, // ✅ FIX: adicionar isInitialized
                user: {
                  id: userData.id,
                  name: userData.name,
                  email: userData.email,
                  avatarUrl: userData.avatar || undefined,
                  avatar: userData.avatar,
                  plan: userData.plan === 'PRO' ? 'Pro' : userData.plan === 'FREE' ? 'Free' : 'Enterprise',
                  isSuperAdmin: userData.isSuperAdmin || false,
                }
              });
              console.log('✅ [AUTH] Login completo! isSuperAdmin:', userData.isSuperAdmin);
            }
          }
        } catch (error) {
          console.error('❌ [AUTH] Login error:', error);
          throw error;
        }
      },

      // Register
      register: async (email: string, password: string, name: string, cpf?: string, birthDate?: string) => {
        try {
          const { user } = await authApi.signUp({ email, password, name, cpf, birthDate });
          if (user) {
            const userData = await authApi.getCurrentUser();
            if (userData) {
              set({ 
                isAuthenticated: true, 
                user: {
                  id: userData.id,
                  name: userData.name,
                  email: userData.email,
                  avatarUrl: userData.avatar || undefined,
                  avatar: userData.avatar,
                  plan: userData.plan === 'PRO' ? 'Pro' : userData.plan === 'FREE' ? 'Free' : 'Enterprise',
                  isSuperAdmin: userData.isSuperAdmin || false,
                }
              });
            }
          }
        } catch (error) {
          console.error('Register error:', error);
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
          localStorage.removeItem('auth-storage');
        } catch (error) {
          console.error('Logout error:', error);
          // Mesmo com erro, limpar o estado local
          set({ 
            isAuthenticated: false, 
            user: null,
            isInitialized: true,
          });
          localStorage.removeItem('auth-storage');
          throw error;
        }
      },

      // Update User
      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
      })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);
