import { supabase } from '../supabase';

// ============================================
// TYPES
// ============================================

export type BannerType = 'HEADER' | 'FOOTER' | 'POPUP' | 'STICKY' | 'INLINE';
export type BannerStatus = 'ACTIVE' | 'INACTIVE' | 'SCHEDULED' | 'EXPIRED';
export type BannerTrigger = 'ALWAYS' | 'FIRST_VISIT' | 'EXIT_INTENT' | 'TIME_DELAY' | 'SCROLL_PERCENTAGE';

export interface DiscountBanner {
  id: string;
  userId: string;
  name: string;
  type: BannerType;
  status: BannerStatus;
  priority: number;
  title: string;
  message: string;
  discountCode?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundColor?: string;
  textColor?: string;
  buttonBackgroundColor?: string;
  buttonTextColor?: string;
  trigger: BannerTrigger;
  triggerDelay?: number;
  triggerScrollPercentage?: number;
  showOnPages?: string[];
  excludePages?: string[];
  targetAudience?: 'ALL' | 'NEW_VISITORS' | 'RETURNING_VISITORS' | 'CART_ABANDONERS';
  validFrom?: string;
  validUntil?: string;
  maxDisplays?: number;
  currentDisplays: number;
  maxClicksPerUser?: number;
  impressions: number;
  clicks: number;
  conversions: number;
  closable: boolean;
  showCloseButton: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface BannerStats {
  totalBanners: number;
  activeBanners: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  averageCTR: number;
  averageConversionRate: number;
  byType: Record<BannerType, {
    count: number;
    impressions: number;
    clicks: number;
    ctr: number;
  }>;
}

// ============================================
// DISCOUNT BANNER API
// ============================================

export const discountBannerApi = {
  /**
   * Criar novo banner
   */
  async create(banner: Omit<DiscountBanner, 'id' | 'currentDisplays' | 'impressions' | 'clicks' | 'conversions' | 'createdAt' | 'updatedAt'>): Promise<DiscountBanner> {
    try {
      const { data, error } = await supabase
        .from('DiscountBanner')
        .insert({
          ...banner,
          currentDisplays: 0,
          impressions: 0,
          clicks: 0,
          conversions: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as DiscountBanner;
    } catch (error: any) {
      console.error('Error creating discount banner:', error);
      throw error;
    }
  },

  /**
   * Atualizar banner
   */
  async update(id: string, updates: Partial<DiscountBanner>): Promise<DiscountBanner> {
    try {
      const { data, error } = await supabase
        .from('DiscountBanner')
        .update({
          ...updates,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as DiscountBanner;
    } catch (error: any) {
      console.error('Error updating discount banner:', error);
      throw error;
    }
  },

  /**
   * Deletar banner
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('DiscountBanner')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error deleting discount banner:', error);
      throw error;
    }
  },

  /**
   * Listar todos os banners
   */
  async list(userId: string, filters?: {
    status?: BannerStatus;
    type?: BannerType;
    active?: boolean;
  }): Promise<DiscountBanner[]> {
    try {
      let query = supabase
        .from('DiscountBanner')
        .select('*')
        .eq('userId', userId)
        .order('priority', { ascending: false })
        .order('createdAt', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      if (filters?.active !== undefined) {
        if (filters.active) {
          query = query.eq('status', 'ACTIVE');
        } else {
          query = query.neq('status', 'ACTIVE');
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as DiscountBanner[];
    } catch (error: any) {
      console.error('Error listing discount banners:', error);
      throw error;
    }
  },

  /**
   * Buscar banner por ID
   */
  async getById(id: string): Promise<DiscountBanner> {
    try {
      const { data, error } = await supabase
        .from('DiscountBanner')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as DiscountBanner;
    } catch (error: any) {
      console.error('Error getting discount banner:', error);
      throw error;
    }
  },

  /**
   * Buscar banners ativos
   */
  async getActive(
    userId: string,
    options?: {
      page?: string;
      type?: BannerType;
      targetAudience?: DiscountBanner['targetAudience'];
    }
  ): Promise<DiscountBanner[]> {
    try {
      const now = new Date().toISOString();

      let query = supabase
        .from('DiscountBanner')
        .select('*')
        .eq('userId', userId)
        .eq('status', 'ACTIVE')
        .or(`validFrom.is.null,validFrom.lte.${now}`)
        .or(`validUntil.is.null,validUntil.gte.${now}`)
        .order('priority', { ascending: false });

      if (options?.type) {
        query = query.eq('type', options.type);
      }

      if (options?.targetAudience) {
        query = query.or(`targetAudience.eq.${options.targetAudience},targetAudience.eq.ALL`);
      }

      const { data, error } = await query;

      if (error) throw error;

      let banners = data as DiscountBanner[];

      // Filtrar por página se especificado
      if (options?.page) {
        banners = banners.filter(banner => {
          // Se tem páginas específicas, verificar se a página atual está incluída
          if (banner.showOnPages && banner.showOnPages.length > 0) {
            return banner.showOnPages.includes(options.page!);
          }

          // Se tem páginas excluídas, verificar se a página atual não está excluída
          if (banner.excludePages && banner.excludePages.length > 0) {
            return !banner.excludePages.includes(options.page!);
          }

          // Se não tem restrição, mostrar
          return true;
        });
      }

      // Filtrar banners que atingiram limite de exibições
      banners = banners.filter(banner => {
        if (!banner.maxDisplays) return true;
        return banner.currentDisplays < banner.maxDisplays;
      });

      return banners;
    } catch (error: any) {
      console.error('Error getting active banners:', error);
      throw error;
    }
  },

  /**
   * Ativar/Desativar banner
   */
  async toggle(id: string, isActive: boolean): Promise<DiscountBanner> {
    try {
      const status: BannerStatus = isActive ? 'ACTIVE' : 'INACTIVE';
      return await discountBannerApi.update(id, { status });
    } catch (error: any) {
      console.error('Error toggling banner:', error);
      throw error;
    }
  },

  /**
   * Atualizar prioridade do banner
   */
  async updatePriority(id: string, priority: number): Promise<DiscountBanner> {
    try {
      return await discountBannerApi.update(id, { priority });
    } catch (error: any) {
      console.error('Error updating banner priority:', error);
      throw error;
    }
  },

  /**
   * Registrar impressão do banner
   */
  async trackImpression(id: string): Promise<void> {
    try {
      const banner = await discountBannerApi.getById(id);

      await discountBannerApi.update(id, {
        impressions: banner.impressions + 1,
        currentDisplays: banner.currentDisplays + 1,
      });
    } catch (error: any) {
      console.error('Error tracking banner impression:', error);
      throw error;
    }
  },

  /**
   * Registrar clique no banner
   */
  async trackClick(id: string): Promise<void> {
    try {
      const banner = await discountBannerApi.getById(id);

      await discountBannerApi.update(id, {
        clicks: banner.clicks + 1,
      });
    } catch (error: any) {
      console.error('Error tracking banner click:', error);
      throw error;
    }
  },

  /**
   * Registrar conversão do banner
   */
  async trackConversion(id: string): Promise<void> {
    try {
      const banner = await discountBannerApi.getById(id);

      await discountBannerApi.update(id, {
        conversions: banner.conversions + 1,
      });
    } catch (error: any) {
      console.error('Error tracking banner conversion:', error);
      throw error;
    }
  },

  /**
   * Duplicar banner
   */
  async duplicate(id: string): Promise<DiscountBanner> {
    try {
      const original = await discountBannerApi.getById(id);

      const { id: _, createdAt, updatedAt, ...bannerData } = original;

      return await discountBannerApi.create({
        ...bannerData,
        name: `${original.name} (Cópia)`,
        status: 'INACTIVE',
        currentDisplays: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
      } as any);
    } catch (error: any) {
      console.error('Error duplicating banner:', error);
      throw error;
    }
  },

  /**
   * Resetar estatísticas do banner
   */
  async resetStats(id: string): Promise<DiscountBanner> {
    try {
      return await discountBannerApi.update(id, {
        currentDisplays: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
      });
    } catch (error: any) {
      console.error('Error resetting banner stats:', error);
      throw error;
    }
  },

  /**
   * Processar banners expirados
   */
  async processExpiredBanners(userId: string): Promise<number> {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('DiscountBanner')
        .select('id')
        .eq('userId', userId)
        .eq('status', 'ACTIVE')
        .not('validUntil', 'is', null)
        .lt('validUntil', now);

      if (error) throw error;

      const expired = data as Pick<DiscountBanner, 'id'>[];

      // Marcar todos como expirados
      const promises = expired.map(b =>
        discountBannerApi.update(b.id, { status: 'EXPIRED' })
      );
      await Promise.all(promises);

      return expired.length;
    } catch (error: any) {
      console.error('Error processing expired banners:', error);
      throw error;
    }
  },

  /**
   * Processar banners agendados
   */
  async processScheduledBanners(userId: string): Promise<number> {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('DiscountBanner')
        .select('id')
        .eq('userId', userId)
        .eq('status', 'SCHEDULED')
        .not('validFrom', 'is', null)
        .lte('validFrom', now);

      if (error) throw error;

      const scheduled = data as Pick<DiscountBanner, 'id'>[];

      // Ativar todos os agendados
      const promises = scheduled.map(b =>
        discountBannerApi.update(b.id, { status: 'ACTIVE' })
      );
      await Promise.all(promises);

      return scheduled.length;
    } catch (error: any) {
      console.error('Error processing scheduled banners:', error);
      throw error;
    }
  },

  /**
   * Obter estatísticas gerais
   */
  async getStats(userId: string, period?: {
    from: string;
    to: string;
  }): Promise<BannerStats> {
    try {
      let query = supabase
        .from('DiscountBanner')
        .select('*')
        .eq('userId', userId);

      if (period) {
        query = query
          .gte('createdAt', period.from)
          .lte('createdAt', period.to);
      }

      const { data, error } = await query;

      if (error) throw error;

      const banners = data as DiscountBanner[];

      const totalBanners = banners.length;
      const activeBanners = banners.filter(b => b.status === 'ACTIVE').length;
      const totalImpressions = banners.reduce((sum, b) => sum + b.impressions, 0);
      const totalClicks = banners.reduce((sum, b) => sum + b.clicks, 0);
      const totalConversions = banners.reduce((sum, b) => sum + b.conversions, 0);
      const averageCTR = totalImpressions > 0
        ? (totalClicks / totalImpressions) * 100
        : 0;
      const averageConversionRate = totalClicks > 0
        ? (totalConversions / totalClicks) * 100
        : 0;

      // Estatísticas por tipo
      const types: BannerType[] = ['HEADER', 'FOOTER', 'POPUP', 'STICKY', 'INLINE'];
      const byType: BannerStats['byType'] = {} as any;

      types.forEach(type => {
        const typeBanners = banners.filter(b => b.type === type);
        if (typeBanners.length > 0) {
          const impressions = typeBanners.reduce((sum, b) => sum + b.impressions, 0);
          const clicks = typeBanners.reduce((sum, b) => sum + b.clicks, 0);
          byType[type] = {
            count: typeBanners.length,
            impressions,
            clicks,
            ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
          };
        }
      });

      return {
        totalBanners,
        activeBanners,
        totalImpressions,
        totalClicks,
        totalConversions,
        averageCTR,
        averageConversionRate,
        byType,
      };
    } catch (error: any) {
      console.error('Error getting banner stats:', error);
      throw error;
    }
  },

  /**
   * Obter performance de um banner específico
   */
  async getBannerPerformance(id: string): Promise<{
    banner: DiscountBanner;
    ctr: number;
    conversionRate: number;
    averageValue?: number;
  }> {
    try {
      const banner = await discountBannerApi.getById(id);

      const ctr = banner.impressions > 0
        ? (banner.clicks / banner.impressions) * 100
        : 0;

      const conversionRate = banner.clicks > 0
        ? (banner.conversions / banner.clicks) * 100
        : 0;

      return {
        banner,
        ctr,
        conversionRate,
      };
    } catch (error: any) {
      console.error('Error getting banner performance:', error);
      throw error;
    }
  },
};

export default discountBannerApi;
