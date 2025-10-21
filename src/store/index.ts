// Barrel export para todos os stores
export { useAuthStore } from './authStore';
export type { User } from './authStore';

export { useCampaignsStore } from './campaignsStore';

export { useChatStore } from './chatStore';

export { useSettingsStore } from './settingsStore';
export type { NotificationSettings } from './settingsStore';

export { useIntegrationsStore } from './integrationsStore';

// Re-export do store principal (legacy + AI Connections + search)
export { useStore } from './useStore';
export type { AiConnection } from './useStore';
