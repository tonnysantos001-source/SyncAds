import { supabase } from '../supabase';

// ============================================
// TYPES
// ============================================

export interface CheckoutCustomization {
  id: string;
  organizationId: string;
  name: string;
  theme: {
    // Cabeçalho
    logoUrl?: string;
    logoAlignment?: 'left' | 'center' | 'right';
    showLogoAtTop?: boolean;
    faviconUrl?: string;
    backgroundColor?: string;
    useGradient?: boolean;
    
    // Cores
    cartBorderColor?: string;
    quantityCircleColor?: string;
    quantityTextColor?: string;
    showCartIcon?: boolean;
    
    // Banner
    bannerEnabled?: boolean;
    bannerImageUrl?: string;
    
    // Carrinho
    cartDisplay?: 'closed' | 'open';
    allowCouponEdit?: boolean;
    
    // Conteúdo
    nextStepStyle?: 'rounded' | 'rectangular' | 'oval';
    showCartReminder?: boolean;
    primaryButtonTextColor?: string;
    primaryButtonBackgroundColor?: string;
    primaryButtonHover?: boolean;
    primaryButtonFlow?: boolean;
    highlightedBorderTextColor?: string;
    checkoutButtonBackgroundColor?: string;
    checkoutButtonHover?: boolean;
    checkoutButtonFlow?: boolean;
    
    // Rodapé
    showStoreName?: boolean;
    showPaymentMethods?: boolean;
    showCnpjCpf?: boolean;
    showContactEmail?: boolean;
    showAddress?: boolean;
    showPhone?: boolean;
    showPrivacyPolicy?: boolean;
    showTermsConditions?: boolean;
    showReturns?: boolean;
    footerTextColor?: string;
    footerBackgroundColor?: string;
    
    // Escassez
    discountTagTextColor?: string;
    discountTagBackgroundColor?: string;
    useVisible?: boolean;
    expirationTime?: number;
    
    // Order Bump
    orderBumpTextColor?: string;
    orderBumpBackgroundColor?: string;
    orderBumpPriceColor?: string;
    orderBumpBorderColor?: string;
    orderBumpButtonTextColor?: string;
    orderBumpButtonBackgroundColor?: string;
    
    // Barra de Avisos
    noticeBarTextColor?: string;
    noticeBarBackgroundColor?: string;
    noticeBarMessage?: string;
    
    // Configurações Gerais
    navigationSteps?: 1 | 3 | 5;
    fontFamily?: 'Arial' | 'Roboto' | 'Open Sans';
    forceRemovalTime?: number;
    presellPage?: 'cart-in-cart' | 'direct-checkout';
    language?: 'pt' | 'en' | 'es';
    currency?: 'BRL' | 'USD' | 'EUR';
    requestCpfOnlyAtPayment?: boolean;
    requestBirthDate?: boolean;
    requestGender?: boolean;
    disableCarrot?: boolean;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutSection {
  id: string;
  customizationId: string;
  type: 'HEADER' | 'NOTICE_BAR' | 'BANNER' | 'CART' | 'CONTENT' | 'FOOTER' | 'SCARCITY' | 'ORDER_BUMP';
  config: Record<string, any>;
  order: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// CHECKOUT CUSTOMIZATION API
// ============================================

export const checkoutApi = {
  // Salvar personalização
  async saveCustomization(customization: Omit<CheckoutCustomization, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const { data, error } = await supabase
        .from('CheckoutCustomization')
        .upsert({
          ...customization,
          updatedAt: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data as CheckoutCustomization;
    } catch (error) {
      console.error('Error saving checkout customization:', error);
      throw error;
    }
  },

  // Carregar personalização
  async loadCustomization(organizationId: string) {
    try {
      const { data, error } = await supabase
        .from('CheckoutCustomization')
        .select('*')
        .eq('organizationId', organizationId)
        .eq('isActive', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as CheckoutCustomization | null;
    } catch (error) {
      console.error('Error loading checkout customization:', error);
      throw error;
    }
  },

  // Listar todas as personalizações
  async listCustomizations(organizationId: string) {
    try {
      const { data, error } = await supabase
        .from('CheckoutCustomization')
        .select('*')
        .eq('organizationId', organizationId)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data as CheckoutCustomization[];
    } catch (error) {
      console.error('Error listing checkout customizations:', error);
      throw error;
    }
  },

  // Ativar personalização
  async activateCustomization(id: string) {
    try {
      // Primeiro, desativar todas as outras
      const customization = await supabase
        .from('CheckoutCustomization')
        .select('organizationId')
        .eq('id', id)
        .single();

      if (customization.data) {
        await supabase
          .from('CheckoutCustomization')
          .update({ isActive: false })
          .eq('organizationId', customization.data.organizationId);
      }

      // Ativar esta
      const { data, error } = await supabase
        .from('CheckoutCustomization')
        .update({ 
          isActive: true,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CheckoutCustomization;
    } catch (error) {
      console.error('Error activating checkout customization:', error);
      throw error;
    }
  },

  // Deletar personalização
  async deleteCustomization(id: string) {
    try {
      const { error } = await supabase
        .from('CheckoutCustomization')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting checkout customization:', error);
      throw error;
    }
  },

  // Duplicar personalização
  async duplicateCustomization(id: string, newName: string) {
    try {
      const { data: original, error: fetchError } = await supabase
        .from('CheckoutCustomization')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from('CheckoutCustomization')
        .insert({
          organizationId: original.organizationId,
          name: newName,
          theme: original.theme,
          isActive: false
        })
        .select()
        .single();

      if (error) throw error;
      return data as CheckoutCustomization;
    } catch (error) {
      console.error('Error duplicating checkout customization:', error);
      throw error;
    }
  },

  // Gerar preview URL
  async generatePreviewUrl(customization: Partial<CheckoutCustomization>) {
    try {
      // Criar uma personalização temporária para preview
      const { data, error } = await supabase
        .from('CheckoutCustomization')
        .insert({
          organizationId: customization.organizationId!,
          name: `Preview-${Date.now()}`,
          theme: customization.theme || {},
          isActive: false
        })
        .select()
        .single();

      if (error) throw error;
      
      // Retornar URL de preview
      return `/checkout/preview/${data.id}`;
    } catch (error) {
      console.error('Error generating preview URL:', error);
      throw error;
    }
  },

  // Exportar personalização
  async exportCustomization(id: string) {
    try {
      const { data, error } = await supabase
        .from('CheckoutCustomization')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Remover campos internos
      const exportData = {
        name: data.name,
        theme: data.theme,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      return exportData;
    } catch (error) {
      console.error('Error exporting checkout customization:', error);
      throw error;
    }
  },

  // Importar personalização
  async importCustomization(organizationId: string, importData: any) {
    try {
      const { data, error } = await supabase
        .from('CheckoutCustomization')
        .insert({
          organizationId,
          name: `${importData.name} (Importado)`,
          theme: importData.theme,
          isActive: false
        })
        .select()
        .single();

      if (error) throw error;
      return data as CheckoutCustomization;
    } catch (error) {
      console.error('Error importing checkout customization:', error);
      throw error;
    }
  }
};

// ============================================
// CHECKOUT SECTIONS API
// ============================================

export const checkoutSectionsApi = {
  // Salvar seção
  async saveSection(section: Omit<CheckoutSection, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const { data, error } = await supabase
        .from('CheckoutSection')
        .upsert({
          ...section,
          updatedAt: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data as CheckoutSection;
    } catch (error) {
      console.error('Error saving checkout section:', error);
      throw error;
    }
  },

  // Carregar seções
  async loadSections(customizationId: string) {
    try {
      const { data, error } = await supabase
        .from('CheckoutSection')
        .select('*')
        .eq('customizationId', customizationId)
        .order('order', { ascending: true });

      if (error) throw error;
      return data as CheckoutSection[];
    } catch (error) {
      console.error('Error loading checkout sections:', error);
      throw error;
    }
  },

  // Atualizar ordem das seções
  async updateSectionOrder(sections: { id: string; order: number }[]) {
    try {
      const updates = sections.map(section => 
        supabase
          .from('CheckoutSection')
          .update({ 
            order: section.order,
            updatedAt: new Date().toISOString()
          })
          .eq('id', section.id)
      );

      await Promise.all(updates);
    } catch (error) {
      console.error('Error updating section order:', error);
      throw error;
    }
  },

  // Deletar seção
  async deleteSection(id: string) {
    try {
      const { error } = await supabase
        .from('CheckoutSection')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting checkout section:', error);
      throw error;
    }
  }
};

// ============================================
// CHECKOUT PREVIEW API
// ============================================

export const checkoutPreviewApi = {
  // Gerar preview HTML
  async generatePreview(customization: CheckoutCustomization) {
    try {
      // Chamar Edge Function para gerar preview
      const { data, error } = await supabase.functions.invoke('checkout-preview', {
        body: { customization }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating checkout preview:', error);
      throw error;
    }
  },

  // Salvar preview como template
  async saveAsTemplate(customizationId: string, templateName: string) {
    try {
      const { data, error } = await supabase
        .from('CheckoutCustomization')
        .select('*')
        .eq('id', customizationId)
        .single();

      if (error) throw error;

      const { data: template, error: templateError } = await supabase
        .from('CheckoutCustomization')
        .insert({
          organizationId: data.organizationId,
          name: templateName,
          theme: data.theme,
          isActive: false
        })
        .select()
        .single();

      if (templateError) throw templateError;
      return template as CheckoutCustomization;
    } catch (error) {
      console.error('Error saving checkout template:', error);
      throw error;
    }
  }
};