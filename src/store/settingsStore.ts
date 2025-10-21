import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface NotificationSettings {
  emailSummary: boolean;
  emailAlerts: boolean;
  emailNews: boolean;
  pushMentions: boolean;
  pushIntegrations: boolean;
  pushSuggestions: boolean;
}

const initialNotificationSettings: NotificationSettings = {
  emailSummary: true,
  emailAlerts: true,
  emailNews: false,
  pushMentions: true,
  pushIntegrations: false,
  pushSuggestions: true,
};

interface SettingsState {
  // Estado
  aiSystemPrompt: string;
  aiInitialGreetings: string[];
  isTwoFactorEnabled: boolean;
  notificationSettings: NotificationSettings;

  // Actions
  setAiSystemPrompt: (prompt: string) => void;
  setAiInitialGreetings: (greetings: string[]) => void;
  addAiGreeting: (greeting: string) => void;
  removeAiGreeting: (index: number) => void;
  updateAiGreeting: (index: number, greeting: string) => void;
  setTwoFactorEnabled: (enabled: boolean) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Estado inicial
      aiSystemPrompt: 'Você é o SyncAds AI, um assistente de marketing digital especializado em otimização de campanhas. Seja proativo, criativo e forneça insights baseados em dados. Suas respostas devem ser claras, concisas e sempre focadas em ajudar o usuário a atingir seus objetivos de marketing.',
      
      aiInitialGreetings: [
        'Olá! 👋 Sou o SyncAds AI, seu assistente de marketing digital. Como posso ajudar você hoje?',
        'Oi! Estou aqui para ajudar a otimizar suas campanhas. O que gostaria de fazer?',
        'Bem-vindo! Pronto para criar campanhas incríveis? Por onde começamos?',
      ],
      
      isTwoFactorEnabled: false,
      notificationSettings: initialNotificationSettings,

      // Set AI System Prompt
      setAiSystemPrompt: (prompt: string) => set({ aiSystemPrompt: prompt }),

      // Set AI Initial Greetings
      setAiInitialGreetings: (greetings: string[]) => set({ aiInitialGreetings: greetings }),

      // Add AI Greeting
      addAiGreeting: (greeting: string) => set((state) => ({
        aiInitialGreetings: [...state.aiInitialGreetings, greeting]
      })),

      // Remove AI Greeting
      removeAiGreeting: (index: number) => set((state) => ({
        aiInitialGreetings: state.aiInitialGreetings.filter((_, i) => i !== index)
      })),

      // Update AI Greeting
      updateAiGreeting: (index: number, greeting: string) => set((state) => ({
        aiInitialGreetings: state.aiInitialGreetings.map((g, i) => i === index ? greeting : g)
      })),

      // Set Two Factor Enabled
      setTwoFactorEnabled: (enabled: boolean) => set({ isTwoFactorEnabled: enabled }),

      // Update Notification Settings
      updateNotificationSettings: (settings: Partial<NotificationSettings>) => set((state) => ({
        notificationSettings: { ...state.notificationSettings, ...settings }
      })),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        aiSystemPrompt: state.aiSystemPrompt,
        aiInitialGreetings: state.aiInitialGreetings,
        isTwoFactorEnabled: state.isTwoFactorEnabled,
        notificationSettings: state.notificationSettings,
      }),
    }
  )
);
