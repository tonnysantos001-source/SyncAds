import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { categorizedIntegrations } from '@/data/mocks';
import { aiConnectionsApi } from '@/lib/api';

type IntegrationId = typeof categorizedIntegrations[0]['integrations'][number]['id'];

export interface AiConnection {
  id: string;
  name: string;
  apiKey: string;
  baseUrl?: string | null;
  model?: string | null;
  status: 'untested' | 'valid' | 'invalid';
}

interface GlobalState {
  // Global Search
  searchTerm: string;
  setSearchTerm: (term: string) => void;

  // Integrations (legacy - ainda usando mocks)
  connectedIntegrations: IntegrationId[];
  toggleIntegration: (id: IntegrationId, connect: boolean) => void;

  // AI Connections (legacy - deprecated em favor de GlobalAiConnection)
  aiConnections: AiConnection[];
  loadAiConnections: (userId: string) => Promise<void>;
  addAiConnection: (userId: string, connection: Omit<AiConnection, 'id' | 'status'>) => Promise<void>;
  updateAiConnection: (id: string, data: Partial<Omit<AiConnection, 'id'>>) => Promise<void>;
  removeAiConnection: (id: string) => Promise<void>;
}

export const useStore = create<GlobalState>()(
  persist(
    (set, get) => ({
      // Global Search
      searchTerm: '',
      setSearchTerm: (term: string) => set({ searchTerm: term }),

      // Integrations
      connectedIntegrations: ['google-analytics', 'github'],
      toggleIntegration: (id: IntegrationId, connect: boolean) => set((state) => {
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

      // AI Connections (legacy)
      aiConnections: [],
      
      loadAiConnections: async (userId: string) => {
        try {
          const connections = await aiConnectionsApi.getConnections(userId);
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

      addAiConnection: async (userId: string, connection: Omit<AiConnection, 'id' | 'status'>) => {
        try {
          await aiConnectionsApi.createConnection(userId, {
            name: connection.name,
            apiKey: connection.apiKey,
            baseUrl: connection.baseUrl || null,
            model: connection.model || null,
            status: 'untested',
          });
          await get().loadAiConnections(userId);
        } catch (error) {
          console.error('Add AI connection error:', error);
          throw error;
        }
      },

      updateAiConnection: async (id: string, data: Partial<Omit<AiConnection, 'id'>>) => {
        try {
          await aiConnectionsApi.updateConnection(id, data);
          // Atualizar local state
          set((state) => ({
            aiConnections: state.aiConnections.map(conn =>
              conn.id === id ? { ...conn, ...data } : conn
            )
          }));
        } catch (error) {
          console.error('Update AI connection error:', error);
          throw error;
        }
      },

      removeAiConnection: async (id: string) => {
        try {
          await aiConnectionsApi.deleteConnection(id);
          set((state) => ({
            aiConnections: state.aiConnections.filter(conn => conn.id !== id)
          }));
        } catch (error) {
          console.error('Remove AI connection error:', error);
          throw error;
        }
      },
    }),
    {
      name: 'global-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        connectedIntegrations: state.connectedIntegrations,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!Array.isArray(state.connectedIntegrations)) {
            state.connectedIntegrations = ['google-analytics', 'github'];
          }
        }
      },
    }
  )
);
