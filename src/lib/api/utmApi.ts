import { supabase } from '../supabase';

// ============================================
// TYPES
// ============================================

export interface UTMTracking {
  id: string;
  userId: string;
  sessionId: string;
  customerId?: string;
  orderId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;
  landingPage: string;
  deviceType?: 'MOBILE' | 'TABLET' | 'DESKTOP';
  browser?: string;
  os?: string;
  country?: string;
  region?: string;
  city?: string;
  ipAddress?: string;
  converted: boolean;
  convertedAt?: string;
  orderValue?: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface UTMAnalytics {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  totalVisits: number;
  totalConversions: number;
  conversionRate: number;
  totalRevenue: number;
  averageOrderValue: number;
  roi?: number;
}

export interface UTMStats {
  totalSessions: number;
  totalConversions: number;
  totalRevenue: number;
  conversionRate: number;
  averageOrderValue: number;
  bySource: Record<string, UTMAnalytics>;
  byMedium: Record<string, UTMAnalytics>;
  byCampaign: Record<string, UTMAnalytics>;
  topPerformers: {
    sources: Array<{ name: string; conversions: number; revenue: number }>;
    mediums: Array<{ name: string; conversions: number; revenue: number }>;
    campaigns: Array<{ name: string; conversions: number; revenue: number }>;
  };
}

export interface TrackUTMParams {
  userId: string;
  sessionId: string;
  customerId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;
  landingPage: string;
  deviceType?: 'MOBILE' | 'TABLET' | 'DESKTOP';
  browser?: string;
  os?: string;
  country?: string;
  region?: string;
  city?: string;
  ipAddress?: string;
}

// ============================================
// UTM API
// ============================================

export const utmApi = {
  /**
   * Rastrear novo UTM
   */
  async track(params: TrackUTMParams): Promise<UTMTracking> {
    try {
      const { data, error } = await supabase
        .from('UTMTracking')
        .insert({
          ...params,
          converted: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as UTMTracking;
    } catch (error: any) {
      console.error('Error tracking UTM:', error);
      throw error;
    }
  },

  /**
   * Buscar UTM por ID
   */
  async getById(id: string): Promise<UTMTracking> {
    try {
      const { data, error } = await supabase
        .from('UTMTracking')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as UTMTracking;
    } catch (error: any) {
      console.error('Error getting UTM:', error);
      throw error;
    }
  },

  /**
   * Buscar UTM por session ID
   */
  async getBySession(sessionId: string): Promise<UTMTracking | null> {
    try {
      const { data, error } = await supabase
        .from('UTMTracking')
        .select('*')
        .eq('sessionId', sessionId)
        .order('createdAt', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      return data as UTMTracking;
    } catch (error: any) {
      console.error('Error getting UTM by session:', error);
      throw error;
    }
  },

  /**
   * Listar todos os UTMs do usuário
   */
  async getByUser(
    userId: string,
    filters?: {
      source?: string;
      medium?: string;
      campaign?: string;
      converted?: boolean;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<UTMTracking[]> {
    try {
      let query = supabase
        .from('UTMTracking')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });

      if (filters?.source) {
        query = query.eq('utmSource', filters.source);
      }

      if (filters?.medium) {
        query = query.eq('utmMedium', filters.medium);
      }

      if (filters?.campaign) {
        query = query.eq('utmCampaign', filters.campaign);
      }

      if (filters?.converted !== undefined) {
        query = query.eq('converted', filters.converted);
      }

      if (filters?.dateFrom) {
        query = query.gte('createdAt', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('createdAt', filters.dateTo);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as UTMTracking[];
    } catch (error: any) {
      console.error('Error listing UTMs:', error);
      throw error;
    }
  },

  /**
   * Marcar UTM como convertido
   */
  async markAsConverted(
    id: string,
    orderId: string,
    orderValue: number
  ): Promise<UTMTracking> {
    try {
      const { data, error } = await supabase
        .from('UTMTracking')
        .update({
          converted: true,
          convertedAt: new Date().toISOString(),
          orderId,
          orderValue,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as UTMTracking;
    } catch (error: any) {
      console.error('Error marking UTM as converted:', error);
      throw error;
    }
  },

  /**
   * Marcar sessão como convertida
   */
  async markSessionConverted(
    sessionId: string,
    orderId: string,
    orderValue: number
  ): Promise<UTMTracking | null> {
    try {
      const utm = await utmApi.getBySession(sessionId);
      if (!utm) return null;

      return await utmApi.markAsConverted(utm.id, orderId, orderValue);
    } catch (error: any) {
      console.error('Error marking session as converted:', error);
      throw error;
    }
  },

  /**
   * Atualizar UTM
   */
  async update(id: string, updates: Partial<UTMTracking>): Promise<UTMTracking> {
    try {
      const { data, error } = await supabase
        .from('UTMTracking')
        .update({
          ...updates,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as UTMTracking;
    } catch (error: any) {
      console.error('Error updating UTM:', error);
      throw error;
    }
  },

  /**
   * Deletar UTM
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('UTMTracking')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error deleting UTM:', error);
      throw error;
    }
  },

  /**
   * Obter analytics usando a view UTMAnalytics
   */
  async getAnalytics(
    userId: string,
    period?: {
      from: string;
      to: string;
    }
  ): Promise<UTMAnalytics[]> {
    try {
      let query = supabase
        .from('UTMAnalytics')
        .select('*')
        .eq('userId', userId);

      if (period) {
        query = query
          .gte('createdAt', period.from)
          .lte('createdAt', period.to);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as UTMAnalytics[];
    } catch (error: any) {
      console.error('Error getting analytics:', error);
      throw error;
    }
  },

  /**
   * Obter estatísticas completas de UTM
   */
  async getStats(
    userId: string,
    period?: {
      from: string;
      to: string;
    }
  ): Promise<UTMStats> {
    try {
      let query = supabase
        .from('UTMTracking')
        .select('*')
        .eq('userId', userId);

      if (period) {
        query = query
          .gte('createdAt', period.from)
          .lte('createdAt', period.to);
      }

      const { data, error } = await query;

      if (error) throw error;

      const utms = data as UTMTracking[];

      // Calcular estatísticas gerais
      const totalSessions = utms.length;
      const totalConversions = utms.filter(u => u.converted).length;
      const totalRevenue = utms
        .filter(u => u.converted && u.orderValue)
        .reduce((sum, u) => sum + (u.orderValue || 0), 0);
      const conversionRate = totalSessions > 0
        ? (totalConversions / totalSessions) * 100
        : 0;
      const averageOrderValue = totalConversions > 0
        ? totalRevenue / totalConversions
        : 0;

      // Calcular por fonte
      const bySource: Record<string, UTMAnalytics> = {};
      const sources = [...new Set(utms.map(u => u.utmSource).filter(Boolean))];
      sources.forEach(source => {
        const sourceUtms = utms.filter(u => u.utmSource === source);
        const converted = sourceUtms.filter(u => u.converted);
        const revenue = converted.reduce((sum, u) => sum + (u.orderValue || 0), 0);
        bySource[source!] = {
          utmSource: source,
          totalVisits: sourceUtms.length,
          totalConversions: converted.length,
          conversionRate: (converted.length / sourceUtms.length) * 100,
          totalRevenue: revenue,
          averageOrderValue: converted.length > 0 ? revenue / converted.length : 0,
        };
      });

      // Calcular por meio
      const byMedium: Record<string, UTMAnalytics> = {};
      const mediums = [...new Set(utms.map(u => u.utmMedium).filter(Boolean))];
      mediums.forEach(medium => {
        const mediumUtms = utms.filter(u => u.utmMedium === medium);
        const converted = mediumUtms.filter(u => u.converted);
        const revenue = converted.reduce((sum, u) => sum + (u.orderValue || 0), 0);
        byMedium[medium!] = {
          utmMedium: medium,
          totalVisits: mediumUtms.length,
          totalConversions: converted.length,
          conversionRate: (converted.length / mediumUtms.length) * 100,
          totalRevenue: revenue,
          averageOrderValue: converted.length > 0 ? revenue / converted.length : 0,
        };
      });

      // Calcular por campanha
      const byCampaign: Record<string, UTMAnalytics> = {};
      const campaigns = [...new Set(utms.map(u => u.utmCampaign).filter(Boolean))];
      campaigns.forEach(campaign => {
        const campaignUtms = utms.filter(u => u.utmCampaign === campaign);
        const converted = campaignUtms.filter(u => u.converted);
        const revenue = converted.reduce((sum, u) => sum + (u.orderValue || 0), 0);
        byCampaign[campaign!] = {
          utmCampaign: campaign,
          totalVisits: campaignUtms.length,
          totalConversions: converted.length,
          conversionRate: (converted.length / campaignUtms.length) * 100,
          totalRevenue: revenue,
          averageOrderValue: converted.length > 0 ? revenue / converted.length : 0,
        };
      });

      // Top performers
      const topSources = Object.entries(bySource)
        .map(([name, stats]) => ({
          name,
          conversions: stats.totalConversions,
          revenue: stats.totalRevenue,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      const topMediums = Object.entries(byMedium)
        .map(([name, stats]) => ({
          name,
          conversions: stats.totalConversions,
          revenue: stats.totalRevenue,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      const topCampaigns = Object.entries(byCampaign)
        .map(([name, stats]) => ({
          name,
          conversions: stats.totalConversions,
          revenue: stats.totalRevenue,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      return {
        totalSessions,
        totalConversions,
        totalRevenue,
        conversionRate,
        averageOrderValue,
        bySource,
        byMedium,
        byCampaign,
        topPerformers: {
          sources: topSources,
          mediums: topMediums,
          campaigns: topCampaigns,
        },
      };
    } catch (error: any) {
      console.error('Error getting UTM stats:', error);
      throw error;
    }
  },

  /**
   * Obter taxa de conversão geral
   */
  async getConversionRate(
    userId: string,
    period?: {
      from: string;
      to: string;
    }
  ): Promise<number> {
    try {
      let query = supabase
        .from('UTMTracking')
        .select('converted')
        .eq('userId', userId);

      if (period) {
        query = query
          .gte('createdAt', period.from)
          .lte('createdAt', period.to);
      }

      const { data, error } = await query;

      if (error) throw error;

      const utms = data as Pick<UTMTracking, 'converted'>[];
      const total = utms.length;
      const converted = utms.filter(u => u.converted).length;

      return total > 0 ? (converted / total) * 100 : 0;
    } catch (error: any) {
      console.error('Error getting conversion rate:', error);
      throw error;
    }
  },

  /**
   * Obter UTMs por fonte específica
   */
  async getBySource(userId: string, source: string): Promise<UTMTracking[]> {
    try {
      const { data, error } = await supabase
        .from('UTMTracking')
        .select('*')
        .eq('userId', userId)
        .eq('utmSource', source)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data as UTMTracking[];
    } catch (error: any) {
      console.error('Error getting UTMs by source:', error);
      throw error;
    }
  },

  /**
   * Obter UTMs por meio específico
   */
  async getByMedium(userId: string, medium: string): Promise<UTMTracking[]> {
    try {
      const { data, error } = await supabase
        .from('UTMTracking')
        .select('*')
        .eq('userId', userId)
        .eq('utmMedium', medium)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data as UTMTracking[];
    } catch (error: any) {
      console.error('Error getting UTMs by medium:', error);
      throw error;
    }
  },

  /**
   * Obter UTMs por campanha específica
   */
  async getByCampaign(userId: string, campaign: string): Promise<UTMTracking[]> {
    try {
      const { data, error } = await supabase
        .from('UTMTracking')
        .select('*')
        .eq('userId', userId)
        .eq('utmCampaign', campaign)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data as UTMTracking[];
    } catch (error: any) {
      console.error('Error getting UTMs by campaign:', error);
      throw error;
    }
  },

  /**
   * Obter fontes únicas
   */
  async getUniqueSources(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('UTMTracking')
        .select('utmSource')
        .eq('userId', userId)
        .not('utmSource', 'is', null);

      if (error) throw error;

      const sources = [...new Set(data.map(d => d.utmSource).filter(Boolean))] as string[];
      return sources;
    } catch (error: any) {
      console.error('Error getting unique sources:', error);
      throw error;
    }
  },

  /**
   * Obter meios únicos
   */
  async getUniqueMediums(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('UTMTracking')
        .select('utmMedium')
        .eq('userId', userId)
        .not('utmMedium', 'is', null);

      if (error) throw error;

      const mediums = [...new Set(data.map(d => d.utmMedium).filter(Boolean))] as string[];
      return mediums;
    } catch (error: any) {
      console.error('Error getting unique mediums:', error);
      throw error;
    }
  },

  /**
   * Obter campanhas únicas
   */
  async getUniqueCampaigns(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('UTMTracking')
        .select('utmCampaign')
        .eq('userId', userId)
        .not('utmCampaign', 'is', null);

      if (error) throw error;

      const campaigns = [...new Set(data.map(d => d.utmCampaign).filter(Boolean))] as string[];
      return campaigns;
    } catch (error: any) {
      console.error('Error getting unique campaigns:', error);
      throw error;
    }
  },

  /**
   * Obter ROI por campanha
   */
  async getCampaignROI(
    userId: string,
    campaign: string,
    adSpend: number
  ): Promise<{
    campaign: string;
    adSpend: number;
    revenue: number;
    roi: number;
    conversions: number;
    conversionRate: number;
  }> {
    try {
      const utms = await utmApi.getByCampaign(userId, campaign);
      const converted = utms.filter(u => u.converted);
      const revenue = converted.reduce((sum, u) => sum + (u.orderValue || 0), 0);
      const roi = adSpend > 0 ? ((revenue - adSpend) / adSpend) * 100 : 0;
      const conversionRate = utms.length > 0 ? (converted.length / utms.length) * 100 : 0;

      return {
        campaign,
        adSpend,
        revenue,
        roi,
        conversions: converted.length,
        conversionRate,
      };
    } catch (error: any) {
      console.error('Error calculating campaign ROI:', error);
      throw error;
    }
  },
};

export default utmApi;
