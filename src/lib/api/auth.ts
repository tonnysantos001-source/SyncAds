import { supabase } from '../supabase';
import { GLOBAL_ORGANIZATION_ID } from '../constants';

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  cpf?: string;
  birthDate?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export const authApi = {
  // Sign up with email and password
  signUp: async (data: SignUpData) => {
    try {
      // Create user in auth system
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Create user record in database
      const userId = authData.user.id;
      const now = new Date().toISOString();

      const { error: userError } = await supabase
        .from('User')
        .insert({
          id: userId,
          email: data.email,
          name: data.name,
          cpf: data.cpf || null,
          birthDate: data.birthDate || null,
          emailVerified: false,
          authProvider: 'EMAIL',
          plan: 'FREE',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          role: 'MEMBER',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });

      if (userError) throw userError;

      return { user: authData.user, session: authData.session };
    } catch (error) {
      console.error('Sign up error:', error);
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
      console.error('Sign in error:', error);
      throw error;
    }
  },

  // Sign out
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!user) return null;

      // Get user data from database
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      // Check if user is Super Admin
      // Simplificado: apenas tenta query direta com tratamento silencioso de erros
      let isSuperAdmin = false;
      try {
        // Query direta com maybeSingle para retornar null se não existir
        const { data: superAdminCheck } = await supabase
          .from('SuperAdmin')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();
        
        isSuperAdmin = !!superAdminCheck;
      } catch (e) {
        // Ignora erro silenciosamente - user não é super admin ou tabela não existe
        isSuperAdmin = false;
      }

      return {
        ...userData,
        isSuperAdmin,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // Get current session
  getSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Get session error:', error);
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
      console.error('Reset password error:', error);
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
      console.error('Update password error:', error);
      throw error;
    }
  },
};
