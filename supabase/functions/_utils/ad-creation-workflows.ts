// ============================================================================
// AD CREATION WORKFLOWS - Sistema de Criação Automática de Anúncios
// ============================================================================
// Workflows pré-configurados para criar anúncios em diferentes plataformas
// ============================================================================

import { Workflow, WorkflowStep } from './workflow-engine.ts';

export interface AdCreationParams {
  platform: 'meta' | 'google' | 'linkedin' | 'tiktok';
  campaign: {
    name: string;
    objective: string;
    budget: number;
    budgetType: 'daily' | 'lifetime';
    startDate?: string;
    endDate?: string;
  };
  adSet?: {
    name: string;
    targeting: {
      locations?: string[];
      age?: { min: number; max: number };
      gender?: 'all' | 'male' | 'female';
      interests?: string[];
      behaviors?: string[];
    };
    placement?: string[];
  };
  ad: {
    name: string;
    format: 'image' | 'video' | 'carousel' | 'collection';
    headline: string;
    description: string;
    callToAction: string;
    media: {
      type: 'image' | 'video';
      url?: string;
      localPath?: string;
    }[];
    destinationUrl: string;
  };
}

// ============================================================================
// META ADS (FACEBOOK/INSTAGRAM) WORKFLOWS
// ============================================================================

export class MetaAdsWorkflow {
  /**
   * Cria campanha completa no Meta Ads Manager
   */
  static createCampaign(params: AdCreationParams): Workflow {
    return {
      id: crypto.randomUUID(),
      name: 'Create Meta Ads Campaign',
      description: `Cria campanha ${params.campaign.name} no Meta Ads`,
      version: '1.0.0',
      created_by: 'system',
      created_at: new Date().toISOString(),
      variables: {
        ...params,
        campaignId: null,
        adSetId: null,
        adId: null,
      },
      steps: [
        // PASSO 1: Navegar para Ads Manager
        {
          id: 'navigate_ads_manager',
          type: 'command',
          action: 'NAVIGATE',
          params: { url: 'https://business.facebook.com/adsmanager' },
          timeout: 10000,
        },

        // PASSO 2: Aguardar carregamento
        {
          id: 'wait_load',
          type: 'wait',
          params: { duration: 3000 },
        },

        // PASSO 3: Clicar em "Criar"
        {
          id: 'click_create',
          type: 'command',
          action: 'DOM_CLICK',
          params: {
            selector: '[data-testid="create-button"], button:has-text("Criar")',
          },
          retry: { maxAttempts: 3, delay: 2000 },
        },

        // PASSO 4: Selecionar objetivo da campanha
        {
          id: 'select_objective',
          type: 'command',
          action: 'DOM_CLICK',
          params: {
            selector: `[data-objective="${params.campaign.objective}"]`,
          },
          retry: { maxAttempts: 3, delay: 1000 },
        },

        // PASSO 5: Nomear campanha
        {
          id: 'name_campaign',
          type: 'command',
          action: 'DOM_FILL',
          params: {
            selector: 'input[name="campaign_name"], input[placeholder*="nome da campanha"]',
            value: params.campaign.name,
          },
        },

        // PASSO 6: Definir orçamento
        {
          id: 'set_budget',
          type: 'command',
          action: 'DOM_FILL',
          params: {
            selector: 'input[name="budget"], input[data-testid="budget-input"]',
            value: String(params.campaign.budget),
          },
        },

        // PASSO 7: Selecionar tipo de orçamento
        {
          id: 'select_budget_type',
          type: 'command',
          action: 'DOM_CLICK',
          params: {
            selector: params.campaign.budgetType === 'daily'
              ? '[data-testid="daily-budget"]'
              : '[data-testid="lifetime-budget"]',
          },
        },

        // PASSO 8: Configurar público (se fornecido)
        ...(params.adSet ? this.getAudienceSteps(params.adSet) : []),

        // PASSO 9: Upload de mídia
        ...this.getMediaUploadSteps(params.ad.media),

        // PASSO 10: Preencher texto do anúncio
        {
          id: 'fill_headline',
          type: 'command',
          action: 'DOM_FILL',
          params: {
            selector: 'input[name="headline"], textarea[aria-label*="título"]',
            value: params.ad.headline,
          },
        },

        {
          id: 'fill_description',
          type: 'command',
          action: 'DOM_FILL',
          params: {
            selector: 'textarea[name="message"], textarea[aria-label*="texto"]',
            value: params.ad.description,
          },
        },

        // PASSO 11: URL de destino
        {
          id: 'fill_url',
          type: 'command',
          action: 'DOM_FILL',
          params: {
            selector: 'input[name="website_url"], input[placeholder*="URL"]',
            value: params.ad.destinationUrl,
          },
        },

        // PASSO 12: Call to Action
        {
          id: 'select_cta',
          type: 'command',
          action: 'DOM_CLICK',
          params: {
            selector: `button:has-text("${params.ad.callToAction}")`,
          },
        },

        // PASSO 13: Revisar
        {
          id: 'click_review',
          type: 'command',
          action: 'DOM_CLICK',
          params: {
            selector: 'button:has-text("Revisar"), button[data-testid="review-button"]',
          },
        },

        // PASSO 14: Aguardar revisão
        {
          id: 'wait_review',
          type: 'wait',
          params: { duration: 2000 },
        },

        // PASSO 15: Publicar
        {
          id: 'publish',
          type: 'command',
          action: 'DOM_CLICK',
          params: {
            selector: 'button:has-text("Publicar"), button[data-testid="publish-button"]',
          },
        },

        // PASSO 16: Capturar screenshot de confirmação
        {
          id: 'screenshot_confirmation',
          type: 'command',
          action: 'SCREENSHOT',
          params: {},
          saveAs: 'confirmationScreenshot',
        },

        // PASSO 17: Extrair ID da campanha
        {
          id: 'extract_campaign_id',
          type: 'extract',
          params: {
            type: 'text',
            selector: '[data-testid="campaign-id"], .campaign-id',
          },
          saveAs: 'campaignId',
        },
      ],
      errorHandler: {
        type: 'fallback',
        notifyOnError: true,
        maxRetries: 3,
      },
    };
  }

  /**
   * Steps para configurar público
   */
  private static getAudienceSteps(adSet: AdCreationParams['adSet']): WorkflowStep[] {
    const steps: WorkflowStep[] = [];

    if (!adSet) return steps;

    // Localizações
    if (adSet.targeting.locations && adSet.targeting.locations.length > 0) {
      steps.push({
        id: 'open_location',
        type: 'command',
        action: 'DOM_CLICK',
        params: { selector: 'button:has-text("Localizações")' },
      });

      adSet.targeting.locations.forEach((location, index) => {
        steps.push({
          id: `add_location_${index}`,
          type: 'command',
          action: 'DOM_FILL',
          params: {
            selector: 'input[placeholder*="localização"]',
            value: location,
          },
        });
        steps.push({
          id: `wait_location_${index}`,
          type: 'wait',
          params: { duration: 500 },
        });
      });
    }

    // Idade
    if (adSet.targeting.age) {
      steps.push({
        id: 'set_age_min',
        type: 'command',
        action: 'DOM_FILL',
        params: {
          selector: 'input[name="age_min"]',
          value: String(adSet.targeting.age.min),
        },
      });

      steps.push({
        id: 'set_age_max',
        type: 'command',
        action: 'DOM_FILL',
        params: {
          selector: 'input[name="age_max"]',
          value: String(adSet.targeting.age.max),
        },
      });
    }

    // Gênero
    if (adSet.targeting.gender && adSet.targeting.gender !== 'all') {
      steps.push({
        id: 'select_gender',
        type: 'command',
        action: 'DOM_CLICK',
        params: {
          selector: `[data-gender="${adSet.targeting.gender}"]`,
        },
      });
    }

    // Interesses
    if (adSet.targeting.interests && adSet.targeting.interests.length > 0) {
      steps.push({
        id: 'open_interests',
        type: 'command',
        action: 'DOM_CLICK',
        params: { selector: 'button:has-text("Interesses")' },
      });

      adSet.targeting.interests.forEach((interest, index) => {
        steps.push({
          id: `add_interest_${index}`,
          type: 'command',
          action: 'DOM_FILL',
          params: {
            selector: 'input[placeholder*="interesse"]',
            value: interest,
          },
        });
      });
    }

    return steps;
  }

  /**
   * Steps para upload de mídia
   */
  private static getMediaUploadSteps(media: AdCreationParams['ad']['media']): WorkflowStep[] {
    const steps: WorkflowStep[] = [];

    media.forEach((item, index) => {
      steps.push({
        id: `open_media_upload_${index}`,
        type: 'command',
        action: 'DOM_CLICK',
        params: { selector: 'button:has-text("Adicionar mídia"), input[type="file"]' },
      });

      if (item.url) {
        // Upload via URL
        steps.push({
          id: `upload_url_${index}`,
          type: 'command',
          action: 'DOM_FILL',
          params: {
            selector: 'input[placeholder*="URL"]',
            value: item.url,
          },
        });
      }

      steps.push({
        id: `wait_upload_${index}`,
        type: 'wait',
        params: { duration: 2000 },
      });
    });

    return steps;
  }
}

// ============================================================================
// GOOGLE ADS WORKFLOWS
// ============================================================================

export class GoogleAdsWorkflow {
  /**
   * Cria campanha no Google Ads
   */
  static createCampaign(params: AdCreationParams): Workflow {
    return {
      id: crypto.randomUUID(),
      name: 'Create Google Ads Campaign',
      description: `Cria campanha ${params.campaign.name} no Google Ads`,
      version: '1.0.0',
      created_by: 'system',
      created_at: new Date().toISOString(),
      variables: { ...params },
      steps: [
        // PASSO 1: Navegar para Google Ads
        {
          id: 'navigate_google_ads',
          type: 'command',
          action: 'NAVIGATE',
          params: { url: 'https://ads.google.com' },
          timeout: 10000,
        },

        // PASSO 2: Clicar em "Nova Campanha"
        {
          id: 'click_new_campaign',
          type: 'command',
          action: 'DOM_CLICK',
          params: {
            selector: 'button:has-text("Nova campanha"), [aria-label*="Nova campanha"]',
          },
          retry: { maxAttempts: 3, delay: 2000 },
        },

        // PASSO 3: Selecionar objetivo
        {
          id: 'select_goal',
          type: 'command',
          action: 'DOM_CLICK',
          params: {
            selector: `[data-goal="${params.campaign.objective}"]`,
          },
        },

        // PASSO 4: Selecionar tipo de campanha
        {
          id: 'select_campaign_type',
          type: 'command',
          action: 'DOM_CLICK',
          params: {
            selector: '[data-campaign-type="display"]', // ou search, video, etc
          },
        },

        // PASSO 5: Nomear campanha
        {
          id: 'name_campaign',
          type: 'command',
          action: 'DOM_FILL',
          params: {
            selector: 'input[aria-label*="nome da campanha"]',
            value: params.campaign.name,
          },
        },

        // PASSO 6: Definir orçamento
        {
          id: 'set_budget',
          type: 'command',
          action: 'DOM_FILL',
          params: {
            selector: 'input[aria-label*="orçamento"]',
            value: String(params.campaign.budget),
          },
        },

        // PASSO 7: Configurar segmentação
        {
          id: 'open_targeting',
          type: 'command',
          action: 'DOM_CLICK',
          params: { selector: 'button:has-text("Segmentação")' },
        },

        // PASSO 8: Criar anúncio
        {
          id: 'create_ad',
          type: 'command',
          action: 'DOM_CLICK',
          params: { selector: 'button:has-text("Criar anúncio")' },
        },

        // PASSO 9: Título
        {
          id: 'fill_headline',
          type: 'command',
          action: 'DOM_FILL',
          params: {
            selector: 'input[aria-label*="título"]',
            value: params.ad.headline,
          },
        },

        // PASSO 10: Descrição
        {
          id: 'fill_description',
          type: 'command',
          action: 'DOM_FILL',
          params: {
            selector: 'textarea[aria-label*="descrição"]',
            value: params.ad.description,
          },
        },

        // PASSO 11: URL final
        {
          id: 'fill_final_url',
          type: 'command',
          action: 'DOM_FILL',
          params: {
            selector: 'input[aria-label*="URL final"]',
            value: params.ad.destinationUrl,
          },
        },

        // PASSO 12: Upload de imagem
        {
          id: 'upload_image',
          type: 'command',
          action: 'DOM_CLICK',
          params: { selector: 'button:has-text("Adicionar imagem")' },
        },

        // PASSO 13: Salvar e continuar
        {
          id: 'save_continue',
          type: 'command',
          action: 'DOM_CLICK',
          params: { selector: 'button:has-text("Salvar e continuar")' },
        },

        // PASSO 14: Publicar
        {
          id: 'publish',
          type: 'command',
          action: 'DOM_CLICK',
          params: { selector: 'button:has-text("Publicar campanha")' },
        },

        // PASSO 15: Screenshot
        {
          id: 'screenshot',
          type: 'command',
          action: 'SCREENSHOT',
          saveAs: 'confirmationScreenshot',
        },
      ],
      errorHandler: {
        type: 'retry',
        maxRetries: 3,
        notifyOnError: true,
      },
    };
  }
}

// ============================================================================
// LINKEDIN ADS WORKFLOWS
// ============================================================================

export class LinkedInAdsWorkflow {
  /**
   * Cria campanha no LinkedIn Ads
   */
  static createCampaign(params: AdCreationParams): Workflow {
    return {
      id: crypto.randomUUID(),
      name: 'Create LinkedIn Ads Campaign',
      description: `Cria campanha ${params.campaign.name} no LinkedIn`,
      version: '1.0.0',
      created_by: 'system',
      created_at: new Date().toISOString(),
      variables: { ...params },
      steps: [
        // PASSO 1: Navegar para Campaign Manager
        {
          id: 'navigate',
          type: 'command',
          action: 'NAVIGATE',
          params: { url: 'https://www.linkedin.com/campaignmanager' },
        },

        // PASSO 2: Criar campanha
        {
          id: 'click_create',
          type: 'command',
          action: 'DOM_CLICK',
          params: { selector: 'button:has-text("Criar campanha")' },
        },

        // PASSO 3: Selecionar objetivo
        {
          id: 'select_objective',
          type: 'command',
          action: 'DOM_CLICK',
          params: { selector: `[data-objective="${params.campaign.objective}"]` },
        },

        // PASSO 4: Nome
        {
          id: 'name_campaign',
          type: 'command',
          action: 'DOM_FILL',
          params: {
            selector: 'input[name="name"]',
            value: params.campaign.name,
          },
        },

        // PASSO 5: Orçamento
        {
          id: 'set_budget',
          type: 'command',
          action: 'DOM_FILL',
          params: {
            selector: 'input[name="budget"]',
            value: String(params.campaign.budget),
          },
        },

        // PASSO 6: Segmentação por cargo (LinkedIn específico)
        {
          id: 'targeting_job_title',
          type: 'command',
          action: 'DOM_CLICK',
          params: { selector: 'button:has-text("Cargo")' },
        },

        // PASSO 7: Criar anúncio
        {
          id: 'create_ad',
          type: 'command',
          action: 'DOM_CLICK',
          params: { selector: 'button:has-text("Criar anúncio")' },
        },

        // PASSO 8: Título
        {
          id: 'fill_headline',
          type: 'command',
          action: 'DOM_FILL',
          params: {
            selector: 'input[name="headline"]',
            value: params.ad.headline,
          },
        },

        // PASSO 9: Descrição
        {
          id: 'fill_description',
          type: 'command',
          action: 'DOM_FILL',
          params: {
            selector: 'textarea[name="description"]',
            value: params.ad.description,
          },
        },

        // PASSO 10: URL
        {
          id: 'fill_url',
          type: 'command',
          action: 'DOM_FILL',
          params: {
            selector: 'input[name="destination_url"]',
            value: params.ad.destinationUrl,
          },
        },

        // PASSO 11: Publicar
        {
          id: 'publish',
          type: 'command',
          action: 'DOM_CLICK',
          params: { selector: 'button:has-text("Ativar")' },
        },
      ],
    };
  }
}

// ============================================================================
// AD WORKFLOW FACTORY
// ============================================================================

export class AdWorkflowFactory {
  /**
   * Cria workflow apropriado baseado na plataforma
   */
  static create(params: AdCreationParams): Workflow {
    switch (params.platform) {
      case 'meta':
        return MetaAdsWorkflow.createCampaign(params);

      case 'google':
        return GoogleAdsWorkflow.createCampaign(params);

      case 'linkedin':
        return LinkedInAdsWorkflow.createCampaign(params);

      default:
        throw new Error(`Plataforma não suportada: ${params.platform}`);
    }
  }

  /**
   * Valida parâmetros de criação de anúncio
   */
  static validate(params: AdCreationParams): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar campanha
    if (!params.campaign.name) errors.push('Nome da campanha é obrigatório');
    if (!params.campaign.objective) errors.push('Objetivo é obrigatório');
    if (params.campaign.budget <= 0) errors.push('Orçamento deve ser maior que 0');

    // Validar anúncio
    if (!params.ad.headline) errors.push('Título do anúncio é obrigatório');
    if (!params.ad.description) errors.push('Descrição é obrigatória');
    if (!params.ad.destinationUrl) errors.push('URL de destino é obrigatória');
    if (params.ad.media.length === 0) errors.push('Pelo menos uma mídia é necessária');

    // Validar URL
    try {
      new URL(params.ad.destinationUrl);
    } catch {
      errors.push('URL de destino inválida');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// ============================================================================
// EXEMPLOS DE USO
// ============================================================================

export const AdCreationExamples = {
  /**
   * Exemplo: Meta Ads para e-commerce
   */
  metaEcommerce: (): AdCreationParams => ({
    platform: 'meta',
    campaign: {
      name: 'Black Friday 2025 - Eletrônicos',
      objective: 'conversions',
      budget: 500,
      budgetType: 'daily',
    },
    adSet: {
      name: 'Público Brasil 25-45',
      targeting: {
        locations: ['Brasil'],
        age: { min: 25, max: 45 },
        gender: 'all',
        interests: ['Tecnologia', 'Eletrônicos', 'Compras online'],
      },
    },
    ad: {
      name: 'Anúncio Notebook Gamer',
      format: 'image',
      headline: 'Notebook Gamer com 50% OFF! 🔥',
      description: 'Última chance! Black Friday com descontos incríveis. Corre que está acabando!',
      callToAction: 'Comprar agora',
      media: [
        { type: 'image', url: 'https://example.com/notebook.jpg' }
      ],
      destinationUrl: 'https://minhaloija.com/black-friday',
    },
  }),

  /**
   * Exemplo: Google Ads para serviços
   */
  googleService: (): AdCreationParams => ({
    platform: 'google',
    campaign: {
      name: 'Consultoria Financeira - São Paulo',
      objective: 'leads',
      budget: 300,
      budgetType: 'daily',
    },
    ad: {
      name: 'Consultoria SP',
      format: 'image',
      headline: 'Consultoria Financeira Especializada',
      description: 'Planeje seu futuro com segurança. Agende uma consulta gratuita!',
      callToAction: 'Agendar consulta',
      media: [
        { type: 'image', url: 'https://example.com/consultoria.jpg' }
      ],
      destinationUrl: 'https://consultoria.com/agendar',
    },
  }),

  /**
   * Exemplo: LinkedIn Ads para B2B
   */
  linkedinB2B: (): AdCreationParams => ({
    platform: 'linkedin',
    campaign: {
      name: 'Software Empresarial - CEOs',
      objective: 'lead_generation',
      budget: 1000,
      budgetType: 'daily',
    },
    ad: {
      name: 'Software ERP',
      format: 'image',
      headline: 'Aumente a Eficiência da sua Empresa em 300%',
      description: 'Software ERP completo para gestão empresarial. Teste grátis por 30 dias!',
      callToAction: 'Solicitar demo',
      media: [
        { type: 'image', url: 'https://example.com/erp.jpg' }
      ],
      destinationUrl: 'https://software.com/demo',
    },
  }),
};
