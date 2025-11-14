/**
 * AI CORE - Export Module
 * Centraliza todas as exportações do AI Core System
 *
 * @version 2.0.0
 * @date 02/02/2025
 */

// =====================================================
// CLASSES PRINCIPAIS
// =====================================================

export { AiCore, IntentDetector } from './aiCore';

// =====================================================
// TIPOS E INTERFACES
// =====================================================

export type {
  AiCoreConfig,
  AiCapability,
  AiIntent,
  IntentDetectionResult,
} from './aiCore';

// =====================================================
// SYSTEM PROMPTS
// =====================================================

export {
  CORE_PERSONALITY_SARCASTIC,
  CAPABILITY_MARKETING,
  CAPABILITY_IMAGE_GENERATION,
  CAPABILITY_VIDEO_GENERATION,
  CAPABILITY_WEB_SEARCH,
  CAPABILITY_FILE_GENERATION,
  CAPABILITY_CODE_EXECUTION,
  CAPABILITY_ADMIN_TOOLS,
  CAPABILITY_UNIVERSAL,
} from './aiCore';

// =====================================================
// HELPER FUNCTIONS
// =====================================================

import { AiCore, AiCoreConfig, AiCapability } from './aiCore';

/**
 * Cria uma instância do AI Core com configuração padrão
 */
export function createDefaultAiCore(userId: string): AiCore {
  const defaultConfig: AiCoreConfig = {
    personality: 'sarcastic',
    capabilities: [
      'marketing',
      'content-creation',
      'data-analysis',
      'automation',
      'integrations',
      'image-generation',
      'video-generation',
      'web-search',
      'file-generation',
      'code-execution',
      'web-scraping',
      'universal',
    ],
    temperature: 0.7,
    maxTokens: 4000,
    model: 'gpt-4-turbo-preview',
    userId,
  };

  return new AiCore(defaultConfig);
}

/**
 * Cria uma instância do AI Core com capacidades customizadas
 */
export function createCustomAiCore(
  userId: string,
  capabilities: AiCapability[],
  personality: 'sarcastic' | 'professional' | 'friendly' | 'custom' = 'sarcastic',
  customSystemPrompt?: string
): AiCore {
  const config: AiCoreConfig = {
    personality,
    capabilities,
    temperature: 0.7,
    maxTokens: 4000,
    model: 'gpt-4-turbo-preview',
    userId,
    customSystemPrompt,
  };

  return new AiCore(config);
}

/**
 * Cria uma instância do AI Core para marketing apenas
 */
export function createMarketingAiCore(userId: string): AiCore {
  const config: AiCoreConfig = {
    personality: 'sarcastic',
    capabilities: [
      'marketing',
      'content-creation',
      'data-analysis',
      'integrations',
      'image-generation',
    ],
    temperature: 0.7,
    maxTokens: 4000,
    model: 'gpt-4-turbo-preview',
    userId,
  };

  return new AiCore(config);
}

/**
 * Cria uma instância do AI Core para admin
 */
export function createAdminAiCore(userId: string): AiCore {
  const config: AiCoreConfig = {
    personality: 'professional',
    capabilities: [
      'admin-tools',
      'code-execution',
      'data-analysis',
      'web-scraping',
      'file-generation',
      'universal',
    ],
    temperature: 0.3,
    maxTokens: 4000,
    model: 'gpt-4-turbo-preview',
    userId,
  };

  return new AiCore(config);
}

/**
 * Lista todas as capacidades disponíveis
 */
export function listAvailableCapabilities(): AiCapability[] {
  return [
    'marketing',
    'content-creation',
    'data-analysis',
    'automation',
    'integrations',
    'image-generation',
    'video-generation',
    'web-search',
    'file-generation',
    'code-execution',
    'web-scraping',
    'admin-tools',
    'universal',
  ];
}

/**
 * Valida se uma capacidade existe
 */
export function isValidCapability(capability: string): capability is AiCapability {
  return listAvailableCapabilities().includes(capability as AiCapability);
}
