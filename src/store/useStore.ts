import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { 
  categorizedIntegrations, 
  ChatConversation, 
  ChatMessage, 
  Campaign,
} from '@/data/mocks';
import { v4 as uuidv4 } from 'uuid';
import { authApi, campaignsApi, aiConnectionsApi, conversationsApi, chatApi } from '@/lib/api';
import type { Tables } from '@/lib/database.types';

type IntegrationId = typeof categorizedIntegrations[0]['integrations'][number]['id'];

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  avatar?: string | null;
  plan: 'Free' | 'Pro' | 'Enterprise';
}

export interface NotificationSettings {
  emailSummary: boolean;
  emailAlerts: boolean;
  emailNews: boolean;
  pushMentions: boolean;
  pushIntegrations: boolean;
  pushSuggestions: boolean;
}

export interface AiConnection {
  id: string;
  name: string;
  apiKey: string;
  baseUrl?: string | null;
  model?: string | null;
  status: 'untested' | 'valid' | 'invalid';
}

interface AppState {
  // Auth
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  initAuth: () => Promise<void>;
  isInitialized: boolean;

  // Global Search
  searchTerm: string;
  setSearchTerm: (term: string) => void;

  // Integrations
  connectedIntegrations: IntegrationId[];
  toggleIntegration: (id: IntegrationId, connect: boolean) => void;

  // Chat
  conversations: ChatConversation[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  loadConversations: () => Promise<void>;
  createNewConversation: (title?: string) => Promise<void>;
  addMessage: (conversationId: string, message: ChatMessage) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  isAssistantTyping: boolean;
  setAssistantTyping: (isTyping: boolean) => void;

  // Campaigns
  campaigns: Campaign[];
  loadCampaigns: () => Promise<void>;
  addCampaign: (campaign: Omit<Campaign, 'id'>) => Promise<void>;
  updateCampaign: (id: string, campaignData: Partial<Campaign>) => Promise<void>;
  updateCampaignStatus: (id: string, status: Campaign['status']) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;

  // AI Connections
  aiConnections: AiConnection[];
  loadAiConnections: () => Promise<void>;
  addAiConnection: (connection: Omit<AiConnection, 'id' | 'status'>) => Promise<void>;
  updateAiConnection: (id: string, data: Partial<Omit<AiConnection, 'id'>>) => Promise<void>;
  removeAiConnection: (id: string) => Promise<void>;

  // Settings
  aiSystemPrompt: string;
  setAiSystemPrompt: (prompt: string) => void;
  aiInitialGreetings: string[];
  setAiInitialGreetings: (greetings: string[]) => void;
  addAiGreeting: (greeting: string) => void;
  removeAiGreeting: (index: number) => void;
  updateAiGreeting: (index: number, greeting: string) => void;
  isTwoFactorEnabled: boolean;
  setTwoFactorEnabled: (enabled: boolean) => void;
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
}

const initialNotificationSettings: NotificationSettings = {
  emailSummary: true,
  emailAlerts: true,
  emailNews: false,
  pushMentions: true,
  pushIntegrations: false,
  pushSuggestions: true,
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      isAuthenticated: false,
      user: null,
      isInitialized: false,
      initAuth: async () => {
        try {
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
              },
              isInitialized: true,
            });
            // Load user data from Supabase
            await Promise.all([
              get().loadCampaigns(),
              get().loadAiConnections(),
              get().loadConversations(),
            ]);
          } else {
            set({ isInitialized: true });
          }
        } catch (error) {
          console.error('Init auth error:', error);
          set({ isInitialized: true });
        }
      },
      login: async (email: string, password: string) => {
        try {
          const { user } = await authApi.signIn({ email, password });
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
                }
              });
              await Promise.all([
                get().loadCampaigns(),
                get().loadAiConnections(),
                get().loadConversations(),
              ]);
            }
          }
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        }
      },
      register: async (email: string, password: string, name: string) => {
        try {
          const { user } = await authApi.signUp({ email, password, name });
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
                }
              });
            }
          }
        } catch (error) {
          console.error('Register error:', error);
          throw error;
        }
      },
      logout: async () => {
        try {
          await authApi.signOut();
          set({ 
            isAuthenticated: false, 
            user: null, 
            campaigns: [],
            conversations: [],
            connectedIntegrations: [],
            searchTerm: '',
            isTwoFactorEnabled: false,
            notificationSettings: initialNotificationSettings,
            aiConnections: [],
            activeConversationId: null,
          });
        } catch (error) {
          console.error('Logout error:', error);
          throw error;
        }
      },
      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
      })),

      // Global Search
      searchTerm: '',
      setSearchTerm: (term) => set({ searchTerm: term }),

      // Integrations
      connectedIntegrations: ['google-analytics', 'github'],
      toggleIntegration: (id, connect) => set((state) => {
        const currentIntegrations = Array.isArray(state.connectedIntegrations) ? state.connectedIntegrations : [];
        if (connect) {
          if (!currentIntegrations.includes(id)) {
            return { connectedIntegrations: [...currentIntegrations, id] };
          }
        } else {
          return { connectedIntegrations: currentIntegrations.filter(i => i !== id) };
        }
        return {};
      }),

      // Chat
      conversations: [],
      activeConversationId: null,
      setActiveConversationId: (id) => set({ activeConversationId: id }),
      
      loadConversations: async () => {
        const user = get().user;
        if (!user) return;
        try {
          const dbConversations = await conversationsApi.getConversations(user.id);
          
          // Load messages for each conversation
          const conversationsWithMessages = await Promise.all(
            dbConversations.map(async (conv) => {
              const messages = await chatApi.getConversationMessages(conv.id);
              return {
                id: conv.id,
                title: conv.title,
                messages: messages.map(msg => ({
                  id: msg.id,
                  role: msg.role.toLowerCase() as 'user' | 'assistant',
                  content: msg.content,
                })),
              };
            })
          );

          set({ 
            conversations: conversationsWithMessages,
            activeConversationId: conversationsWithMessages.length > 0 ? conversationsWithMessages[0].id : null,
          });
        } catch (error) {
          console.error('Load conversations error:', error);
        }
      },

      createNewConversation: async (title?: string) => {
        const user = get().user;
        if (!user) return;
        
        try {
          const conversationTitle = title || `Nova Conversa ${new Date().toLocaleDateString()}`;
          const newConversation = await conversationsApi.createConversation(user.id, conversationTitle);
          
          set((state) => ({
            conversations: [
              {
                id: newConversation.id,
                title: newConversation.title,
                messages: [],
              },
              ...state.conversations,
            ],
            activeConversationId: newConversation.id,
          }));
        } catch (error) {
          console.error('Create conversation error:', error);
          throw error;
        }
      },

      addMessage: async (conversationId, message) => {
        const user = get().user;
        if (!user) return;

        try {
          // Add to local state first for immediate feedback
          set((state) => {
            const newConversations = state.conversations.map(conv => {
              if (conv.id === conversationId) {
                return { ...conv, messages: [...conv.messages, message] };
              }
              return conv;
            });
            return { conversations: newConversations };
          });

          // Save to Supabase
          await chatApi.createMessage(
            user.id,
            conversationId,
            message.role.toUpperCase() as 'USER' | 'ASSISTANT',
            message.content
          );

          // Update conversation timestamp
          await conversationsApi.touchConversation(conversationId);
        } catch (error) {
          console.error('Add message error:', error);
          // Optionally rollback the local change
        }
      },

      deleteConversation: async (id) => {
        try {
          await conversationsApi.deleteConversation(id);
          
          set((state) => {
            const remainingConversations = state.conversations.filter(conv => conv.id !== id);
            let newActiveId = state.activeConversationId;

            if (state.activeConversationId === id) {
              newActiveId = remainingConversations.length > 0 ? remainingConversations[0].id : null;
            }

            return { 
              conversations: remainingConversations,
              activeConversationId: newActiveId,
            };
          });
        } catch (error) {
          console.error('Delete conversation error:', error);
          throw error;
        }
      },

      isAssistantTyping: false,
      setAssistantTyping: (isTyping) => set({ isAssistantTyping: isTyping }),

      // Campaigns
      campaigns: [],
      loadCampaigns: async () => {
        const user = get().user;
        if (!user) return;
        try {
          const data = await campaignsApi.getCampaigns(user.id);
          const campaigns: Campaign[] = data.map(c => ({
            id: c.id,
            name: c.name,
            status: c.status === 'ACTIVE' ? 'Ativa' : c.status === 'PAUSED' ? 'Pausada' : 'Concluída',
            platform: c.platform === 'GOOGLE_ADS' ? 'Google Ads' : c.platform === 'META_ADS' ? 'Meta' : 'LinkedIn',
            budgetSpent: c.budgetSpent,
            budgetTotal: c.budgetTotal,
            impressions: c.impressions,
            clicks: c.clicks,
            conversions: c.conversions,
            startDate: new Date(c.startDate).toISOString().split('T')[0],
            endDate: c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : '',
            ctr: c.ctr,
            cpc: c.cpc,
          }));
          set({ campaigns });
        } catch (error) {
          console.error('Load campaigns error:', error);
        }
      },
      addCampaign: async (campaignData) => {
        const user = get().user;
        if (!user) return;
        try {
          await campaignsApi.createCampaign(user.id, {
            name: campaignData.name,
            objective: 'Conversões',
            platform: campaignData.platform === 'Google Ads' ? 'GOOGLE_ADS' : campaignData.platform === 'Meta' ? 'META_ADS' : 'LINKEDIN_ADS',
            status: campaignData.status === 'Ativa' ? 'ACTIVE' : campaignData.status === 'Pausada' ? 'PAUSED' : 'COMPLETED',
            budgetTotal: campaignData.budgetTotal,
            budgetSpent: campaignData.budgetSpent || 0,
            budgetDaily: campaignData.budgetTotal / 30,
            startDate: new Date(campaignData.startDate).toISOString(),
            endDate: campaignData.endDate ? new Date(campaignData.endDate).toISOString() : null,
            targeting: {},
            impressions: campaignData.impressions || 0,
            clicks: campaignData.clicks || 0,
            conversions: campaignData.conversions || 0,
            ctr: campaignData.ctr || 0,
            cpc: campaignData.cpc || 0,
            roi: 0,
          });
          await get().loadCampaigns();
        } catch (error) {
          console.error('Add campaign error:', error);
          throw error;
        }
      },
      updateCampaign: async (id, campaignData) => {
        try {
          await campaignsApi.updateCampaign(id, {
            ...(campaignData.name && { name: campaignData.name }),
            ...(campaignData.status && { 
              status: campaignData.status === 'Ativa' ? 'ACTIVE' : campaignData.status === 'Pausada' ? 'PAUSED' : 'COMPLETED'
            }),
            ...(campaignData.budgetTotal && { budgetTotal: campaignData.budgetTotal }),
            ...(campaignData.budgetSpent !== undefined && { budgetSpent: campaignData.budgetSpent }),
          });
          await get().loadCampaigns();
        } catch (error) {
          console.error('Update campaign error:', error);
          throw error;
        }
      },
      updateCampaignStatus: async (id, status) => {
        try {
          await campaignsApi.updateCampaign(id, {
            status: status === 'Ativa' ? 'ACTIVE' : status === 'Pausada' ? 'PAUSED' : 'COMPLETED'
          });
          await get().loadCampaigns();
        } catch (error) {
          console.error('Update campaign status error:', error);
          throw error;
        }
      },
      deleteCampaign: async (id) => {
        try {
          await campaignsApi.deleteCampaign(id);
          await get().loadCampaigns();
        } catch (error) {
          console.error('Delete campaign error:', error);
          throw error;
        }
      },

      // AI Connections
      aiConnections: [],
      
      loadAiConnections: async () => {
        const user = get().user;
        if (!user) return;
        try {
          const connections = await aiConnectionsApi.getConnections(user.id);
          set({ 
            aiConnections: connections.map(conn => ({
              id: conn.id,
              name: conn.name,
              apiKey: conn.apiKey,
              baseUrl: conn.baseUrl,
              model: conn.model,
              status: conn.status as 'untested' | 'valid' | 'invalid',
            }))
          });
        } catch (error) {
          console.error('Load AI connections error:', error);
        }
      },

      addAiConnection: async (connection) => {
        const user = get().user;
        if (!user) return;
        try {
          await aiConnectionsApi.createConnection(user.id, {
            name: connection.name,
            apiKey: connection.apiKey,
            baseUrl: connection.baseUrl || null,
            model: connection.model || null,
            status: 'untested',
          });
          await get().loadAiConnections();
        } catch (error) {
          console.error('Add AI connection error:', error);
          throw error;
        }
      },

      updateAiConnection: async (id, data) => {
        try {
          await aiConnectionsApi.updateConnection(id, data);
          await get().loadAiConnections();
        } catch (error) {
          console.error('Update AI connection error:', error);
          throw error;
        }
      },

      removeAiConnection: async (id) => {
        try {
          await aiConnectionsApi.deleteConnection(id);
          await get().loadAiConnections();
        } catch (error) {
          console.error('Remove AI connection error:', error);
          throw error;
        }
      },

      // Settings
      aiSystemPrompt: 'Você é o SyncAds AI, um assistente de marketing digital especializado em otimização de campanhas. Seja proativo, criativo e forneça insights baseados em dados. Suas respostas devem ser claras, concisas e sempre focadas em ajudar o usuário a atingir seus objetivos de marketing.',
      setAiSystemPrompt: (prompt) => set({ aiSystemPrompt: prompt }),
      
      aiInitialGreetings: [
        'Olá! 👋 Sou o SyncAds AI, seu assistente de marketing digital. Como posso ajudar você hoje?',
        'Oi! Estou aqui para ajudar a otimizar suas campanhas. O que gostaria de fazer?',
        'Bem-vindo! Pronto para criar campanhas incríveis? Por onde começamos?',
      ],
      setAiInitialGreetings: (greetings) => set({ aiInitialGreetings: greetings }),
      addAiGreeting: (greeting) => set((state) => ({
        aiInitialGreetings: [...state.aiInitialGreetings, greeting]
      })),
      removeAiGreeting: (index) => set((state) => ({
        aiInitialGreetings: state.aiInitialGreetings.filter((_, i) => i !== index)
      })),
      updateAiGreeting: (index, greeting) => set((state) => ({
        aiInitialGreetings: state.aiInitialGreetings.map((g, i) => i === index ? greeting : g)
      })),
      
      isTwoFactorEnabled: false,
      setTwoFactorEnabled: (enabled) => set({ isTwoFactorEnabled: enabled }),
      notificationSettings: initialNotificationSettings,
      updateNotificationSettings: (settings) => set(state => ({
        notificationSettings: { ...state.notificationSettings, ...settings }
      })),
    }),
    {
      name: 'marketing-ai-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        connectedIntegrations: state.connectedIntegrations,
        aiSystemPrompt: state.aiSystemPrompt,
        aiInitialGreetings: state.aiInitialGreetings,
        isTwoFactorEnabled: state.isTwoFactorEnabled,
        notificationSettings: state.notificationSettings,
        // Não persiste mais aiConnections, conversations ou campaigns no localStorage
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!state.campaigns) state.campaigns = [];
          if (!state.conversations) state.conversations = [];
          if (!Array.isArray(state.connectedIntegrations)) {
            state.connectedIntegrations = ['google-analytics', 'github'];
          }
          if (!state.notificationSettings) {
            state.notificationSettings = initialNotificationSettings;
          }
          if (!state.aiConnections) {
            state.aiConnections = [];
          }
        }
      },
    }
  )
);
