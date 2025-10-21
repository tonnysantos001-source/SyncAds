/**
 * Custom hooks com selectors otimizados para Zustand
 * 
 * Benefícios:
 * - Evita re-renders desnecessários
 * - Memoização automática
 * - Type-safe
 * - Reutilizável
 */

import { useAuthStore } from '@/store/authStore';
import { useCampaignsStore } from '@/store/campaignsStore';
import { useChatStore } from '@/store/chatStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useIntegrationsStore } from '@/store/integrationsStore';
import { useShallow } from 'zustand/react/shallow';

// ============================================================================
// AUTH SELECTORS
// ============================================================================

/**
 * Hook otimizado para pegar apenas user
 * Re-render só quando user mudar
 */
export const useUser = () => {
  return useAuthStore((state) => state.user);
};

/**
 * Hook otimizado para autenticação
 * Re-render só quando status mudar
 */
export const useAuth = () => {
  return useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      isInitialized: state.isInitialized,
      user: state.user,
    }))
  );
};

/**
 * Hook otimizado para actions de auth
 * Nunca causa re-render (functions são estáveis)
 */
export const useAuthActions = () => {
  return useAuthStore(
    useShallow((state) => ({
      login: state.login,
      register: state.register,
      logout: state.logout,
      updateUser: state.updateUser,
    }))
  );
};

// ============================================================================
// CAMPAIGNS SELECTORS
// ============================================================================

/**
 * Hook otimizado para lista de campanhas
 */
export const useCampaigns = () => {
  return useCampaignsStore((state) => state.campaigns);
};

/**
 * Hook otimizado para campanhas ativas
 * Memoiza a filtragem
 */
export const useActiveCampaigns = () => {
  return useCampaignsStore(
    (state) => state.campaigns.filter((c) => c.status === 'Ativa'),
    (a, b) => a.length === b.length && a.every((v, i) => v.id === b[i].id)
  );
};

/**
 * Hook otimizado para total de campanhas
 */
export const useCampaignsCount = () => {
  return useCampaignsStore((state) => state.campaigns.length);
};

/**
 * Hook otimizado para actions de campaigns
 */
export const useCampaignsActions = () => {
  return useCampaignsStore(
    useShallow((state) => ({
      loadCampaigns: state.loadCampaigns,
      addCampaign: state.addCampaign,
      updateCampaign: state.updateCampaign,
      deleteCampaign: state.deleteCampaign,
    }))
  );
};

// ============================================================================
// CHAT SELECTORS
// ============================================================================

/**
 * Hook otimizado para conversas
 */
export const useConversations = () => {
  return useChatStore((state) => state.conversations);
};

/**
 * Hook otimizado para conversa ativa
 */
export const useActiveConversation = () => {
  return useChatStore(
    useShallow((state) => ({
      activeConversationId: state.activeConversationId,
      conversation: state.conversations.find(
        (c) => c.id === state.activeConversationId
      ),
    }))
  );
};

/**
 * Hook otimizado para actions de chat
 */
export const useChatActions = () => {
  return useChatStore(
    useShallow((state) => ({
      setActiveConversationId: state.setActiveConversationId,
      createNewConversation: state.createNewConversation,
      addMessage: state.addMessage,
      deleteConversation: state.deleteConversation,
      setAssistantTyping: state.setAssistantTyping,
    }))
  );
};

// ============================================================================
// SETTINGS SELECTORS
// ============================================================================

/**
 * Hook otimizado para configurações de IA
 */
export const useAiSettings = () => {
  return useSettingsStore(
    useShallow((state) => ({
      aiSystemPrompt: state.aiSystemPrompt,
      aiInitialGreetings: state.aiInitialGreetings,
    }))
  );
};

/**
 * Hook otimizado para configurações de notificação
 */
export const useNotificationSettings = () => {
  return useSettingsStore((state) => state.notificationSettings);
};

/**
 * Hook otimizado para actions de settings
 */
export const useSettingsActions = () => {
  return useSettingsStore(
    useShallow((state) => ({
      setAiSystemPrompt: state.setAiSystemPrompt,
      updateNotificationSettings: state.updateNotificationSettings,
      setTwoFactorEnabled: state.setTwoFactorEnabled,
    }))
  );
};

// ============================================================================
// INTEGRATIONS SELECTORS
// ============================================================================

/**
 * Hook otimizado para integrations
 */
export const useIntegrations = () => {
  return useIntegrationsStore((state) => state.integrations);
};

/**
 * Hook otimizado para integrations conectadas
 */
export const useConnectedIntegrations = () => {
  return useIntegrationsStore(
    (state) => state.integrations.filter((i) => i.isConnected),
    (a, b) => a.length === b.length && a.every((v, i) => v.id === b[i].id)
  );
};

/**
 * Hook otimizado para verificar se integration está conectada
 */
export const useIsIntegrationConnected = (platform: string) => {
  return useIntegrationsStore((state) =>
    state.integrations.some((i) => i.platform === platform && i.isConnected)
  );
};

/**
 * Hook otimizado para actions de integrations
 */
export const useIntegrationsActions = () => {
  return useIntegrationsStore(
    useShallow((state) => ({
      loadIntegrations: state.loadIntegrations,
      connectIntegration: state.connectIntegration,
      disconnectIntegration: state.disconnectIntegration,
    }))
  );
};
