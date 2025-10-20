import { supabase } from '../supabase';

export interface PendingInvite {
  id: string;
  email: string;
  organizationId: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
  invitedBy: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string;
  createdAt: string;
  acceptedAt?: string;
}

export const invitesApi = {
  // Send invite via Edge Function
  sendInvite: async (email: string, role: 'ADMIN' | 'MEMBER' | 'VIEWER') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email,
          role
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Failed to send invite');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Send invite error:', error);
      throw error;
    }
  },

  // Get all pending invites for current user's organization
  getPendingInvites: async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('PendingInvite')
        .select('*')
        .eq('status', 'PENDING')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data as PendingInvite[];
    } catch (error) {
      console.error('Get pending invites error:', error);
      throw error;
    }
  },

  // Cancel an invite
  cancelInvite: async (inviteId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('PendingInvite')
        .update({ status: 'CANCELLED' })
        .eq('id', inviteId);

      if (error) throw error;
    } catch (error) {
      console.error('Cancel invite error:', error);
      throw error;
    }
  },

  // Accept an invite (public endpoint, no auth required)
  acceptInvite: async (token: string, password: string, name: string) => {
    try {
      // Get invite details
      const { data: invite, error: inviteError } = await (supabase as any)
        .from('PendingInvite')
        .select('*')
        .eq('id', token)
        .eq('status', 'PENDING')
        .single();

      if (inviteError || !invite) {
        throw new Error('Invalid or expired invite');
      }

      // Check if invite is expired
      if (new Date(invite.expiresAt) < new Date()) {
        await (supabase as any)
          .from('PendingInvite')
          .update({ status: 'EXPIRED' })
          .eq('id', token);
        throw new Error('This invite has expired');
      }

      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invite.email,
        password: password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Create user record in database with organization
      const userId = authData.user.id;
      const now = new Date().toISOString();

      const { error: userError } = await supabase
        .from('User')
        .insert({
          id: userId,
          email: invite.email,
          name: name,
          organizationId: invite.organizationId,
          role: invite.role,
          isActive: true,
          authProvider: 'EMAIL',
          plan: 'FREE',
          createdAt: now,
          updatedAt: now,
        });

      if (userError) throw userError;

      // Mark invite as accepted
      await (supabase as any)
        .from('PendingInvite')
        .update({ 
          status: 'ACCEPTED',
          acceptedAt: now
        })
        .eq('id', token);

      return { user: authData.user, session: authData.session };
    } catch (error) {
      console.error('Accept invite error:', error);
      throw error;
    }
  },

  // Resend an invite
  resendInvite: async (inviteId: string) => {
    try {
      const { data: invite, error } = await (supabase as any)
        .from('PendingInvite')
        .select('email, role')
        .eq('id', inviteId)
        .single();

      if (error || !invite) throw new Error('Invite not found');

      // Cancel old invite
      await invitesApi.cancelInvite(inviteId);

      // Send new invite
      return await invitesApi.sendInvite(invite.email, invite.role as any);
    } catch (error) {
      console.error('Resend invite error:', error);
      throw error;
    }
  },
};
