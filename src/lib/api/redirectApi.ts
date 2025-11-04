import { supabase } from '../supabase';

// ============================================
// TYPES
// ============================================

export type RedirectTrigger =
  | 'POST_PURCHASE'
  | 'ABANDONED_CART'
  | 'EXIT_INTENT'
  | 'TIME_DELAY'
  | 'SCROLL_PERCENTAGE'
  | 'IDLE'
  | 'FIRST_VISIT'
  | 'RETURNING_VISITOR';

export type RedirectStatus = 'ACTIVE' | 'INACTIVE' | 'SCHEDULED' | 'EXPIRED';

export interface RedirectRule {
  id: string;
  userId: string;
  name: string;
  description?: string;
  trigger: RedirectTrigger;
  triggerDelay?: number;
  triggerScrollPercentage?: number;
  triggerIdleTime?: number;
  destinationUrl: string;
  status: RedirectStatus;
  priority: number;
  conditions?: {
    minCartValue?: number;
    maxCartValue?: number;
    productIds?: string[];
    categoryIds?: string[];
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    deviceType?: 'MOBILE' | 'TABLET' | 'DESKTOP';
    newVisitors?: boolean;
    returningVisitors?: boolean;
  };
  applicablePages?: string[];
  excludedPages?: string[];
  validFrom?: string;
  validUntil?: string;
  maxRedirects?: number;
  currentRedirects: number;
  conversions: number;
  openInNewTab: boolean;
  showConfirmation: boolean;
  confirmationMessage?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface RedirectLog {
  id: string;
  userId: string;
  ruleId: string;
  sessionId?: string;
  customerId?: string;
  orderId?: string;
  sourceUrl: string;
  destinationUrl: string;
  trigger: RedirectTrigger;
  converted: boolean;
  convertedAt?: string;
  conversionValue?: number;
  deviceType?: 'MOBILE' | 'TABLET' | 'DESKTOP';
  browser?: string;
  os?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface RedirectStats {
  totalRules: number;
  activeRules: number;
  totalRedirects: number;
  totalConversions: number;
  conversionRate: number;
  totalRevenue: number;
  averageOrderValue: number;
  byTrigger: Record<RedirectTrigger, {
    redirects: number;
    conversions: number;
    conversionRate: number;
    revenue: number;
  }>;
  topRules: Array<{
    ruleId: string;
    ruleName: string;
    redirects: number;
    conversions: number;
    conversionRate: number;
    revenue: number;
  }>;
}

// ============================================
// REDIRECT API
// ============================================

export const redirectApi = {
  // ========== REGRAS ==========

  /**
   * Criar nova regra de redirecionamento
   */
  async createRule(
    rule: Omit<RedirectRule, 'id' | 'currentRedirects' | 'conversions' | 'createdAt' | 'updatedAt'>
  ): Promise<RedirectRule> {
    try {
      const { data, error } = await supabase
        .from('RedirectRule')
        .insert({
          ...rule,
          currentRedirects: 0,
          conversions: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as RedirectRule;
    } catch (error: any) {
      console.error('Error creating redirect rule:', error);
      throw error;
    }
  },

  /**
   * Atualizar regra de redirecionamento
   */
  async updateRule(id: string, updates: Partial<RedirectRule>): Promise<RedirectRule> {
    try {
      const { data, error } = await supabase
        .from('RedirectRule')
        .update({
          ...updates,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as RedirectRule;
    } catch (error: any) {
      console.error('Error updating redirect rule:', error);
      throw error;
    }
  },

  /**
   * Deletar regra de redirecionamento
   */
  async deleteRule(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('RedirectRule')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error deleting redirect rule:', error);
      throw error;
    }
  },

  /**
   * Listar todas as regras
   */
  async listRules(userId: string, filters?: {
    status?: RedirectStatus;
    trigger?: RedirectTrigger;
    active?: boolean;
  }): Promise<RedirectRule[]> {
    try {
      let query = supabase
        .from('RedirectRule')
        .select('*')
        .eq('userId', userId)
        .order('priority', { ascending: false })
        .order('createdAt', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.trigger) {
        query = query.eq('trigger', filters.trigger);
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
      return data as RedirectRule[];
    } catch (error: any) {
      console.error('Error listing redirect rules:', error);
      throw error;
    }
  },

  /**
   * Buscar regra por ID
   */
  async getRuleById(id: string): Promise<RedirectRule> {
    try {
      const { data, error } = await supabase
        .from('RedirectRule')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as RedirectRule;
    } catch (error: any) {
      console.error('Error getting redirect rule:', error);
      throw error;
    }
  },

  /**
   * Ativar/Desativar regra
   */
  async toggleRule(id: string, isActive: boolean): Promise<RedirectRule> {
    try {
      const status: RedirectStatus = isActive ? 'ACTIVE' : 'INACTIVE';
      return await redirectApi.updateRule(id, { status });
    } catch (error: any) {
      console.error('Error toggling redirect rule:', error);
      throw error;
    }
  },

  /**
   * Atualizar prioridade da regra
   */
  async updatePriority(id: string, priority: number): Promise<RedirectRule> {
    try {
      return await redirectApi.updateRule(id, { priority });
    } catch (error: any) {
      console.error('Error updating redirect priority:', error);
      throw error;
    }
  },

  /**
   * Buscar regras ativas aplicáveis
   */
  async getApplicableRules(
    userId: string,
    options: {
      trigger?: RedirectTrigger;
      page?: string;
      cartValue?: number;
      productIds?: string[];
      utmSource?: string;
      deviceType?: 'MOBILE' | 'TABLET' | 'DESKTOP';
      isNewVisitor?: boolean;
    }
  ): Promise<RedirectRule[]> {
    try {
      const now = new Date().toISOString();

      let query = supabase
        .from('RedirectRule')
        .select('*')
        .eq('userId', userId)
        .eq('status', 'ACTIVE')
        .or(`validFrom.is.null,validFrom.lte.${now}`)
        .or(`validUntil.is.null,validUntil.gte.${now}`)
        .order('priority', { ascending: false });

      if (options.trigger) {
        query = query.eq('trigger', options.trigger);
      }

      const { data, error } = await query;

      if (error) throw error;

      let rules = data as RedirectRule[];

      // Filtrar por página
      if (options.page) {
        rules = rules.filter(rule => {
          if (rule.applicablePages && rule.applicablePages.length > 0) {
            return rule.applicablePages.includes(options.page!);
          }
          if (rule.excludedPages && rule.excludedPages.length > 0) {
            return !rule.excludedPages.includes(options.page!);
          }
          return true;
        });
      }

      // Filtrar por condições
      rules = rules.filter(rule => {
        if (!rule.conditions) return true;

        // Verificar valor do carrinho
        if (options.cartValue !== undefined) {
          if (rule.conditions.minCartValue && options.cartValue < rule.conditions.minCartValue) {
            return false;
          }
          if (rule.conditions.maxCartValue && options.cartValue > rule.conditions.maxCartValue) {
            return false;
          }
        }

        // Verificar produtos
        if (rule.conditions.productIds && rule.conditions.productIds.length > 0 && options.productIds) {
          const hasProduct = options.productIds.some(id => rule.conditions!.productIds!.includes(id));
          if (!hasProduct) return false;
        }

        // Verificar UTM
        if (rule.conditions.utmSource && options.utmSource !== rule.conditions.utmSource) {
          return false;
        }

        // Verificar tipo de dispositivo
        if (rule.conditions.deviceType && options.deviceType !== rule.conditions.deviceType) {
          return false;
        }

        // Verificar visitante novo/retornante
        if (rule.conditions.newVisitors !== undefined && options.isNewVisitor !== undefined) {
          if (rule.conditions.newVisitors && !options.isNewVisitor) return false;
        }

        if (rule.conditions.returningVisitors !== undefined && options.isNewVisitor !== undefined) {
          if (rule.conditions.returningVisitors && options.isNewVisitor) return false;
        }

        return true;
      });

      // Filtrar regras que atingiram limite
      rules = rules.filter(rule => {
        if (!rule.maxRedirects) return true;
        return rule.currentRedirects < rule.maxRedirects;
      });

      return rules;
    } catch (error: any) {
      console.error('Error getting applicable rules:', error);
      throw error;
    }
  },

  /**
   * Duplicar regra
   */
  async duplicateRule(id: string): Promise<RedirectRule> {
    try {
      const original = await redirectApi.getRuleById(id);

      const { id: _, createdAt, updatedAt, ...ruleData } = original;

      return await redirectApi.createRule({
        ...ruleData,
        name: `${original.name} (Cópia)`,
        status: 'INACTIVE',
        currentRedirects: 0,
        conversions: 0,
      } as any);
    } catch (error: any) {
      console.error('Error duplicating redirect rule:', error);
      throw error;
    }
  },

  // ========== LOGS ==========

  /**
   * Registrar redirecionamento
   */
  async logRedirect(
    log: Omit<RedirectLog, 'id' | 'createdAt'>
  ): Promise<RedirectLog> {
    try {
      // Criar log
      const { data, error } = await supabase
        .from('RedirectLog')
        .insert(log)
        .select()
        .single();

      if (error) throw error;

      // Incrementar contador da regra
      const rule = await redirectApi.getRuleById(log.ruleId);
      await redirectApi.updateRule(log.ruleId, {
        currentRedirects: rule.currentRedirects + 1,
      });

      return data as RedirectLog;
    } catch (error: any) {
      console.error('Error logging redirect:', error);
      throw error;
    }
  },

  /**
   * Marcar redirecionamento como convertido
   */
  async markAsConverted(
    logId: string,
    orderId: string,
    conversionValue: number
  ): Promise<RedirectLog> {
    try {
      const log = await redirectApi.getLogById(logId);

      // Atualizar log
      const { data, error } = await supabase
        .from('RedirectLog')
        .update({
          converted: true,
          convertedAt: new Date().toISOString(),
          orderId,
          conversionValue,
        })
        .eq('id', logId)
        .select()
        .single();

      if (error) throw error;

      // Incrementar conversões da regra
      const rule = await redirectApi.getRuleById(log.ruleId);
      await redirectApi.updateRule(log.ruleId, {
        conversions: rule.conversions + 1,
      });

      return data as RedirectLog;
    } catch (error: any) {
      console.error('Error marking redirect as converted:', error);
      throw error;
    }
  },

  /**
   * Buscar log por ID
   */
  async getLogById(id: string): Promise<RedirectLog> {
    try {
      const { data, error } = await supabase
        .from('RedirectLog')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as RedirectLog;
    } catch (error: any) {
      console.error('Error getting redirect log:', error);
      throw error;
    }
  },

  /**
   * Buscar logs por session
   */
  async getLogsBySession(sessionId: string): Promise<RedirectLog[]> {
    try {
      const { data, error } = await supabase
        .from('RedirectLog')
        .select('*')
        .eq('sessionId', sessionId)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data as RedirectLog[];
    } catch (error: any) {
      console.error('Error getting redirect logs by session:', error);
      throw error;
    }
  },

  /**
   * Listar logs
   */
  async getLogs(
    userId: string,
    filters?: {
      ruleId?: string;
      converted?: boolean;
      trigger?: RedirectTrigger;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
    }
  ): Promise<RedirectLog[]> {
    try {
      let query = supabase
        .from('RedirectLog')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });

      if (filters?.ruleId) {
        query = query.eq('ruleId', filters.ruleId);
      }

      if (filters?.converted !== undefined) {
        query = query.eq('converted', filters.converted);
      }

      if (filters?.trigger) {
        query = query.eq('trigger', filters.trigger);
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

      const { data, error } = await query;

      if (error) throw error;
      return data as RedirectLog[];
    } catch (error: any) {
      console.error('Error getting redirect logs:', error);
      throw error;
    }
  },

  // ========== ANALYTICS ==========

  /**
   * Obter analytics de redirecionamento
   */
  async getAnalytics(
    userId: string,
    period?: {
      from: string;
      to: string;
    }
  ): Promise<RedirectStats> {
    try {
      // Buscar regras
      const rules = await redirectApi.listRules(userId);

      // Buscar logs
      let query = supabase
        .from('RedirectLog')
        .select('*')
        .eq('userId', userId);

      if (period) {
        query = query
          .gte('createdAt', period.from)
          .lte('createdAt', period.to);
      }

      const { data, error } = await query;

      if (error) throw error;

      const logs = data as RedirectLog[];

      const totalRules = rules.length;
      const activeRules = rules.filter(r => r.status === 'ACTIVE').length;
      const totalRedirects = logs.length;
      const totalConversions = logs.filter(l => l.converted).length;
      const conversionRate = totalRedirects > 0
        ? (totalConversions / totalRedirects) * 100
        : 0;
      const totalRevenue = logs
        .filter(l => l.converted && l.conversionValue)
        .reduce((sum, l) => sum + (l.conversionValue || 0), 0);
      const averageOrderValue = totalConversions > 0
        ? totalRevenue / totalConversions
        : 0;

      // Analytics por trigger
      const triggers: RedirectTrigger[] = [
        'POST_PURCHASE',
        'ABANDONED_CART',
        'EXIT_INTENT',
        'TIME_DELAY',
        'SCROLL_PERCENTAGE',
        'IDLE',
        'FIRST_VISIT',
        'RETURNING_VISITOR',
      ];

      const byTrigger: RedirectStats['byTrigger'] = {} as any;

      triggers.forEach(trigger => {
        const triggerLogs = logs.filter(l => l.trigger === trigger);
        if (triggerLogs.length > 0) {
          const conversions = triggerLogs.filter(l => l.converted).length;
          const revenue = triggerLogs
            .filter(l => l.converted && l.conversionValue)
            .reduce((sum, l) => sum + (l.conversionValue || 0), 0);

          byTrigger[trigger] = {
            redirects: triggerLogs.length,
            conversions,
            conversionRate: (conversions / triggerLogs.length) * 100,
            revenue,
          };
        }
      });

      // Top regras
      const topRules = rules
        .map(rule => {
          const ruleLogs = logs.filter(l => l.ruleId === rule.id);
          const conversions = ruleLogs.filter(l => l.converted).length;
          const revenue = ruleLogs
            .filter(l => l.converted && l.conversionValue)
            .reduce((sum, l) => sum + (l.conversionValue || 0), 0);

          return {
            ruleId: rule.id,
            ruleName: rule.name,
            redirects: ruleLogs.length,
            conversions,
            conversionRate: ruleLogs.length > 0 ? (conversions / ruleLogs.length) * 100 : 0,
            revenue,
          };
        })
        .filter(r => r.redirects > 0)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      return {
        totalRules,
        activeRules,
        totalRedirects,
        totalConversions,
        conversionRate,
        totalRevenue,
        averageOrderValue,
        byTrigger,
        topRules,
      };
    } catch (error: any) {
      console.error('Error getting redirect analytics:', error);
      throw error;
    }
  },

  /**
   * Obter taxa de conversão de uma regra
   */
  async getConversionRate(ruleId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('RedirectLog')
        .select('converted')
        .eq('ruleId', ruleId);

      if (error) throw error;

      const logs = data as Pick<RedirectLog, 'converted'>[];
      const total = logs.length;
      const converted = logs.filter(l => l.converted).length;

      return total > 0 ? (converted / total) * 100 : 0;
    } catch (error: any) {
      console.error('Error getting conversion rate:', error);
      throw error;
    }
  },

  /**
   * Obter performance de uma regra
   */
  async getRulePerformance(ruleId: string): Promise<{
    rule: RedirectRule;
    redirects: number;
    conversions: number;
    conversionRate: number;
    revenue: number;
    averageOrderValue: number;
  }> {
    try {
      const rule = await redirectApi.getRuleById(ruleId);
      const logs = await redirectApi.getLogs(rule.userId, { ruleId });

      const redirects = logs.length;
      const conversions = logs.filter(l => l.converted).length;
      const conversionRate = redirects > 0 ? (conversions / redirects) * 100 : 0;
      const revenue = logs
        .filter(l => l.converted && l.conversionValue)
        .reduce((sum, l) => sum + (l.conversionValue || 0), 0);
      const averageOrderValue = conversions > 0 ? revenue / conversions : 0;

      return {
        rule,
        redirects,
        conversions,
        conversionRate,
        revenue,
        averageOrderValue,
      };
    } catch (error: any) {
      console.error('Error getting rule performance:', error);
      throw error;
    }
  },

  /**
   * Resetar estatísticas da regra
   */
  async resetRuleStats(ruleId: string): Promise<RedirectRule> {
    try {
      return await redirectApi.updateRule(ruleId, {
        currentRedirects: 0,
        conversions: 0,
      });
    } catch (error: any) {
      console.error('Error resetting rule stats:', error);
      throw error;
    }
  },

  /**
   * Processar regras expiradas
   */
  async processExpiredRules(userId: string): Promise<number> {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('RedirectRule')
        .select('id')
        .eq('userId', userId)
        .eq('status', 'ACTIVE')
        .not('validUntil', 'is', null)
        .lt('validUntil', now);

      if (error) throw error;

      const expired = data as Pick<RedirectRule, 'id'>[];

      const promises = expired.map(r =>
        redirectApi.updateRule(r.id, { status: 'EXPIRED' })
      );
      await Promise.all(promises);

      return expired.length;
    } catch (error: any) {
      console.error('Error processing expired rules:', error);
      throw error;
    }
  },

  /**
   * Processar regras agendadas
   */
  async processScheduledRules(userId: string): Promise<number> {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('RedirectRule')
        .select('id')
        .eq('userId', userId)
        .eq('status', 'SCHEDULED')
        .not('validFrom', 'is', null)
        .lte('validFrom', now);

      if (error) throw error;

      const scheduled = data as Pick<RedirectRule, 'id'>[];

      const promises = scheduled.map(r =>
        redirectApi.updateRule(r.id, { status: 'ACTIVE' })
      );
      await Promise.all(promises);

      return scheduled.length;
    } catch (error: any) {
      console.error('Error processing scheduled rules:', error);
      throw error;
    }
  },
};

export default redirectApi;
