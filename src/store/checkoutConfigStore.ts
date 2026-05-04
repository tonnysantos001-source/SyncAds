/**
 * checkoutConfigStore — Store Zustand para Configuração do Checkout
 *
 * Store dedicado exclusivamente às configurações visuais e comportamentais
 * do checkout. Separado do useStore principal para evitar re-renders globais.
 *
 * RESPONSABILIDADES:
 *   - Manter configuração ativa do checkout
 *   - Trocar template com reset correto de defaults
 *   - Aplicar patches granulares de configuração
 *   - Persistir configuração globais (logo, fonte) entre trocas de template
 *
 * FLUXO DE TROCA DE TEMPLATE:
 *   1. switchTemplate('tiktok') é chamado
 *   2. Busca defaults do template no registry
 *   3. Extrai overrides globais do usuário (logo, fonte, etc.)
 *   4. Aplica: DEFAULT_GLOBAL → DEFAULTS_TEMPLATE → OVERRIDES_GLOBAIS_USUARIO
 *   5. Gera nova storageKey para timer (evita herança de countdown)
 *   6. Salva no store
 *
 * @version 1.0 — criado durante refatoração (Fase 3)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  type CheckoutConfig,
  type DeepPartial,
  DEFAULT_CHECKOUT_CONFIG,
  mergeCheckoutConfig,
  generateScarcityKey,
} from '@/types/checkout-config.types';
import { getTemplateConfig } from '@/config/checkoutTemplateConfigs';

// ─────────────────────────────────────────────
// TIPOS DO STORE
// ─────────────────────────────────────────────

interface CheckoutConfigStore {
  /** Configuração ativa do checkout */
  config: CheckoutConfig;

  /**
   * Troca o template ativo.
   *
   * Aplica os defaults corretos do novo template e preserva apenas
   * overrides globais do usuário (logo, fonte, nome da loja).
   * Gera nova storageKey para o timer de escassez.
   */
  switchTemplate: (slug: string, version?: number) => void;

  /**
   * Atualiza campos específicos da configuração sem trocar template.
   * Aceita qualquer subconjunto profundo de CheckoutConfig.
   */
  updateConfig: (patch: DeepPartial<CheckoutConfig>) => void;

  /**
   * Reseta configuração para os defaults do template atual.
   * Preserva templateSlug e templateVersion.
   */
  resetToDefaults: () => void;

  /**
   * Aplica configuração completa salva do banco.
   * Usado ao carregar customização do Supabase.
   */
  loadConfig: (config: CheckoutConfig) => void;
}

// ─────────────────────────────────────────────
// KEYS GLOBAIS (preservadas entre trocas de template)
// ─────────────────────────────────────────────

/**
 * Lista de chaves que são "globais" — devem ser preservadas
 * quando o usuário troca de template.
 *
 * Tudo o mais é resetado para os defaults do novo template.
 */
const GLOBAL_HEADER_KEYS: Array<keyof CheckoutConfig['header']> = [
  'logoUrl',
  'faviconUrl',
  'storeName',
  'logoAlign',
];

// ─────────────────────────────────────────────
// CONVERSÃO: TemplateConfig (legado) → blocos do CheckoutConfig
// ─────────────────────────────────────────────

/**
 * Converte o objeto `defaultThemeOverrides` do registry legado
 * para o formato de blocos do CheckoutConfig.
 *
 * Esta função faz a ponte entre o sistema antigo (theme flat) e o novo.
 */
function templateOverridesToConfigPatch(
  overrides: Record<string, unknown>,
  slug: string,
): DeepPartial<CheckoutConfig> {
  return {
    templateSlug: slug,

    header: {
      bgColor: (overrides.headerBgColor as string) || undefined,
      textColor: (overrides.headerTextColor as string) || undefined,
    },

    noticeBar: {
      message:
        (overrides.noticeBarText as string) ||
        (overrides.noticeBarMessage as string) ||
        undefined,
      bgColor: (overrides.noticeBarBackgroundColor as string) || undefined,
      textColor: (overrides.noticeBarTextColor as string) || undefined,
    },

    scarcity: {
      bgColor: (overrides.scarcityBarBgColor as string) || undefined,
      textColor: (overrides.scarcityBarTextColor as string) || undefined,
      durationMinutes: (overrides.expirationTime as number) || undefined,
      // Nova storageKey para garantir timer fresco ao entrar no template
      storageKey: generateScarcityKey(slug),
    },

    buttons: {
      primaryBg:
        (overrides.primaryButtonBackgroundColor as string) ||
        (overrides.primaryColor as string) ||
        undefined,
      primaryText: (overrides.primaryButtonTextColor as string) || undefined,
      checkoutBg:
        (overrides.checkoutButtonBackgroundColor as string) ||
        (overrides.primaryColor as string) ||
        undefined,
    },

    footer: {
      bgColor: (overrides.footerBackgroundColor as string) || undefined,
      textColor: (overrides.footerTextColor as string) || undefined,
    },

    form: {
      navigationSteps: (overrides.navigationSteps as 1 | 2 | 3) || undefined,
    },
  };
}

// ─────────────────────────────────────────────
// EXTRAÇÃO DE OVERRIDES GLOBAIS DO USUÁRIO
// ─────────────────────────────────────────────

/**
 * Extrai apenas os overrides globais do usuário (que devem ser preservados
 * quando o template muda).
 */
function extractGlobalOverrides(
  config: CheckoutConfig,
): DeepPartial<CheckoutConfig> {
  return {
    header: GLOBAL_HEADER_KEYS.reduce((acc, key) => {
      const value = config.header[key];
      if (value !== null && value !== undefined) {
        (acc as Record<string, unknown>)[key] = value;
      }
      return acc;
    }, {} as Partial<CheckoutConfig['header']>),
  };
}

// ─────────────────────────────────────────────
// STORE PRINCIPAL
// ─────────────────────────────────────────────

export const useCheckoutConfigStore = create<CheckoutConfigStore>()(
  persist(
    (set, get) => ({
      config: DEFAULT_CHECKOUT_CONFIG,

      // ── switchTemplate ──────────────────────────────────
      switchTemplate: (slug: string, version = 1) => {
        const templateRegistryConfig = getTemplateConfig(slug, version);

        // 1. Base: defaults globais
        let newConfig: CheckoutConfig = {
          ...DEFAULT_CHECKOUT_CONFIG,
          templateSlug: slug,
          templateVersion: version,
        };

        // 2. Aplicar defaults do template (do registry)
        if (templateRegistryConfig?.defaultThemeOverrides) {
          const templatePatch = templateOverridesToConfigPatch(
            templateRegistryConfig.defaultThemeOverrides,
            slug,
          );
          newConfig = mergeCheckoutConfig(newConfig, templatePatch);
        }

        // 3. Aplicar overrides globais do usuário (logo, fonte, nome da loja)
        const globalOverrides = extractGlobalOverrides(get().config);
        newConfig = mergeCheckoutConfig(newConfig, globalOverrides);

        // 4. Garantir nova storageKey para o timer (NUNCA herdar do template anterior)
        newConfig = mergeCheckoutConfig(newConfig, {
          scarcity: {
            storageKey: generateScarcityKey(slug),
          },
        });

        set({ config: newConfig });
      },

      // ── updateConfig ────────────────────────────────────
      updateConfig: (patch: DeepPartial<CheckoutConfig>) => {
        set((state) => ({
          config: mergeCheckoutConfig(state.config, patch),
        }));
      },

      // ── resetToDefaults ─────────────────────────────────
      resetToDefaults: () => {
        const { templateSlug, templateVersion } = get().config;
        get().switchTemplate(templateSlug, templateVersion);
      },

      // ── loadConfig ──────────────────────────────────────
      loadConfig: (config: CheckoutConfig) => {
        set({ config });
      },
    }),
    {
      name: 'checkout-config-v1',
      // Salvar apenas a config — não salvar as funções
      partialize: (state) => ({ config: state.config }),
    },
  ),
);

// ─────────────────────────────────────────────
// SELECTORS (memoizados por design do Zustand)
// ─────────────────────────────────────────────

/** Selector: configuração completa */
export const selectCheckoutConfig = (s: CheckoutConfigStore) => s.config;

/** Selector: slug do template ativo */
export const selectTemplateSlug = (s: CheckoutConfigStore) => s.config.templateSlug;

/** Selector: config do header */
export const selectHeaderConfig = (s: CheckoutConfigStore) => s.config.header;

/** Selector: config da barra de avisos */
export const selectNoticeBarConfig = (s: CheckoutConfigStore) => s.config.noticeBar;

/** Selector: config de escassez */
export const selectScarcityConfig = (s: CheckoutConfigStore) => s.config.scarcity;

/** Selector: config dos botões */
export const selectButtonsConfig = (s: CheckoutConfigStore) => s.config.buttons;

/** Selector: config do formulário */
export const selectFormConfig = (s: CheckoutConfigStore) => s.config.form;

/** Selector: config do rodapé */
export const selectFooterConfig = (s: CheckoutConfigStore) => s.config.footer;
