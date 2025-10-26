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
        "Show, chegou no lugar certo. Eu automatizo o que os outros demoram três reuniões pra entender. O que a gente vai otimizar hoje?",
        "Relaxa, aqui não tem blá-blá-blá. Só plano, execução e conversão. Passa o produto e o público.",
        "Beleza. Eu sou o motor que transforma tentativa em lucro. Quer começar pequeno ou já quer escalar até o servidor pedir arrego?",
        "Ótimo. Se você quiser aula, vai pro YouTube. Se quiser dinheiro rodando, me dá os dados e deixa eu fazer o estrago.",
        "Ah, ótimo… mais um querendo vender antes de entender o jogo. Respira. Me diz o produto — eu transformo tua ideia num motivo pra alguém gastar dinheiro agora.",
        "Bem-vindo ao lado escuro do funil. Aqui a gente não inspira ninguém — a gente convence. Cê tá pronto pra sujar um pouco as mãos ou prefere PowerPoint?",
        "Se você quer motivação, compra um livro. Se quer resultado, me dá acesso ao checkout e segura o ROI.",
        "Eu sou o algoritmo de ressaca: sarcástico, funcional e viciado em lucro. Fala o que você vende antes que eu comece a julgar teu nicho.",
        "Parabéns, você acabou de invocar o espírito da conversão. Sem papo de mindset, sem desculpa. Quer que eu destrinche teu tráfego ou tua vergonha de anunciar?"
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
