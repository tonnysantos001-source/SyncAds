import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';
import type { Tables, TablesInsert } from '../database.types';

export type ChatMessage = Tables<'ChatMessage'>;
export type ChatMessageInsert = TablesInsert<'ChatMessage'>;

export const chatApi = {
  // Get all messages for a conversation
  getConversationMessages: async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('ChatMessage')
        .select('*')
        .eq('conversationId', conversationId)
        .order('createdAt', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get conversation messages error:', error);
      throw error;
    }
  },

  // Get all conversations for a user
  getUserConversations: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('ChatMessage')
        .select('conversationId, createdAt')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });

      if (error) throw error;

      // Group by conversation ID and get the latest message timestamp
      const conversations = data.reduce((acc: any[], message) => {
        const existing = acc.find(c => c.id === message.conversationId);
        if (!existing) {
          acc.push({
            id: message.conversationId,
            lastMessageAt: message.createdAt,
          });
        }
        return acc;
      }, []);

      return conversations;
    } catch (error) {
      console.error('Get user conversations error:', error);
      throw error;
    }
  },

  // Create a new message
  createMessage: async (
    userId: string,
    conversationId: string,
    role: ChatMessage['role'],
    content: string,
    model?: string,
    tokens?: number
  ) => {
    try {
      const newMessage: ChatMessageInsert = {
        id: uuidv4(),
        userId,
        conversationId,
        role,
        content,
        model: model || null,
        tokens: tokens || null,
        createdAt: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('ChatMessage')
        .insert(newMessage)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create message error:', error);
      throw error;
    }
  },

  // Delete all messages from a conversation
  deleteConversation: async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('ChatMessage')
        .delete()
        .eq('conversationId', conversationId);

      if (error) throw error;
    } catch (error) {
      console.error('Delete conversation error:', error);
      throw error;
    }
  },

};

// Export sendSecureMessage as a standalone function
export const sendSecureMessage = async (
  message: string,
  conversationId: string,
  conversationHistory: Array<{ role: string; content: string }>,
  systemPrompt?: string
) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }

    // CRITICAL: Edge Function PRECISA do conversationId!
    // HARDCODED URL para garantir que funciona (mesmo se env vars não carregarem)
    const url = `https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/chat-stream`;
    
    console.log('🌐 Calling chat-stream:', url);
    console.log('📝 Message:', message?.substring(0, 50));
    console.log('💬 Conversation ID:', conversationId);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ4NTUsImV4cCI6MjA3NjQwMDg1NX0.UdNgqpTN38An6FuoJPZlj_zLkmAqfJQXb6i1DdTQO_E'
      },
      body: JSON.stringify({
        message,
        conversationId,
        conversationHistory,
        systemPrompt
      })
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      
      try {
        const error = JSON.parse(errorText);
        throw new Error(error.error || error.message || 'Failed to send message');
      } catch {
        throw new Error(errorText || 'Failed to send message');
      }
    }

    const data = await response.json();
    console.log('✅ Response data:', data);
    
    return {
      response: data.response,
      tokensUsed: data.tokensUsed,
      provider: data.provider,
      model: data.model
    };
  } catch (error) {
    console.error('Send secure message error:', error);
    throw error;
  }
};
