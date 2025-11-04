import { supabase } from '../supabase';

// ============================================
// TYPES
// ============================================

export type CashbackType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type CashbackStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'SCHEDULED';

export interface Cashback {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: CashbackType;
  value: number;
  minOrderValue?: number;
  maxCashbackAmount?: number;
  validFrom?: string;
  validUntil?: string;
  status: CashbackStatus;
  applicableToProducts?: string[];
  applicableToCategories?: string[];
  excludedProducts?: string[];
  maxUsesPerCustomer?: number;
  firstPurchaseOnly: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type CashbackTransactionStatus = 'PENDING' | 'AVAILABLE' | 'USED' | 'EXPIRED' | 'CANCELLED';

export interface CashbackTransaction {
  id: string;
  userId: string;
  customerId: string;
  cashbackId?: string;
  orderId: string;
  amount: number;
  status: CashbackTransactionStatus;
  earnedAt: string;
  availableAt?: string;
  expiresAt?: string;
  usedAt?: string;
  usedInOrderId?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CashbackStats {
  totalRules: number;
  activeRules: number;
  totalEarned: number;
  totalUsed: number;
  totalAvailable: number;
  totalExpired: number;
  customersWithCashback: number;
  averageCashbackPerCustomer: number;
  byRule: Record<string, {
    ruleId: string;
    ruleName: string;
    totalEarned: number;
    totalUsed: number;
    totalCustomers: number;
  }>;
}

export interface CustomerCashback {
  customerId: string;
  customerEmail?: string;
  customerName?: string;
  totalEarned: number;
  totalUsed: number;
  available: number;
  expired: number;
  transactions: CashbackTransaction[];
}

// ============================================
// CASHBACK RULES API
// ============================================

export const cashbackApi = {
  // ========== REGRAS ==========

  /**
   * Criar nova regra de cashback
   */
  async createRule(rule: Omit<Cashback, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cashback> {
    try {
      const { data, error } = await supabase
        .from('Cashback')
        .insert(rule)
        .select()
        .single();

      if (error) throw error;
      return data as Cashback;
    } catch (error: any) {
      console.error('Error creating cashback rule:', error);
      throw error;
    }
  },

  /**
   * Atualizar regra de cashback
   */
  async updateRule(id: string, updates: Partial<Cashback>): Promise<Cashback> {
    try {
      const { data, error } = await supabase
        .from('Cashback')
        .update({
          ...updates,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Cashback;
    } catch (error: any) {
      console.error('Error updating cashback rule:', error);
      throw error;
    }
  },

  /**
   * Deletar regra de cashback
   */
  async deleteRule(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('Cashback')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error deleting cashback rule:', error);
      throw error;
    }
  },

  /**
   * Listar todas as regras de cashback
   */
  async listRules(userId: string, filters?: {
    status?: CashbackStatus;
    active?: boolean;
  }): Promise<Cashback[]> {
    try {
      let query = supabase
        .from('Cashback')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
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
      return data as Cashback[];
    } catch (error: any) {
      console.error('Error listing cashback rules:', error);
      throw error;
    }
  },

  /**
   * Buscar regra por ID
   */
  async getRuleById(id: string): Promise<Cashback> {
    try {
      const { data, error } = await supabase
        .from('Cashback')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Cashback;
    } catch (error: any) {
      console.error('Error getting cashback rule:', error);
      throw error;
    }
  },

  /**
   * Ativar/Desativar regra
   */
  async toggleRule(id: string, isActive: boolean): Promise<Cashback> {
    try {
      const status: CashbackStatus = isActive ? 'ACTIVE' : 'INACTIVE';
      return await cashbackApi.updateRule(id, { status });
    } catch (error: any) {
      console.error('Error toggling cashback rule:', error);
      throw error;
    }
  },

  // ========== TRANSAÇÕES ==========

  /**
   * Registrar nova transação de cashback
   */
  async createTransaction(
    transaction: Omit<CashbackTransaction, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<CashbackTransaction> {
    try {
      const { data, error } = await supabase
        .from('CashbackTransaction')
        .insert(transaction)
        .select()
        .single();

      if (error) throw error;
      return data as CashbackTransaction;
    } catch (error: any) {
      console.error('Error creating cashback transaction:', error);
      throw error;
    }
  },

  /**
   * Atualizar transação de cashback
   */
  async updateTransaction(
    id: string,
    updates: Partial<CashbackTransaction>
  ): Promise<CashbackTransaction> {
    try {
      const { data, error } = await supabase
        .from('CashbackTransaction')
        .update({
          ...updates,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CashbackTransaction;
    } catch (error: any) {
      console.error('Error updating cashback transaction:', error);
      throw error;
    }
  },

  /**
   * Listar transações
   */
  async getTransactions(
    userId: string,
    filters?: {
      customerId?: string;
      status?: CashbackTransactionStatus;
      orderId?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
    }
  ): Promise<CashbackTransaction[]> {
    try {
      let query = supabase
        .from('CashbackTransaction')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });

      if (filters?.customerId) {
        query = query.eq('customerId', filters.customerId);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.orderId) {
        query = query.eq('orderId', filters.orderId);
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
      return data as CashbackTransaction[];
    } catch (error: any) {
      console.error('Error getting cashback transactions:', error);
      throw error;
    }
  },

  /**
   * Buscar transação por ID
   */
  async getTransactionById(id: string): Promise<CashbackTransaction> {
    try {
      const { data, error } = await supabase
        .from('CashbackTransaction')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as CashbackTransaction;
    } catch (error: any) {
      console.error('Error getting cashback transaction:', error);
      throw error;
    }
  },

  // ========== CASHBACK DO CLIENTE ==========

  /**
   * Obter cashback disponível do cliente
   */
  async getAvailableCashback(customerId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('CashbackTransaction')
        .select('amount')
        .eq('customerId', customerId)
        .eq('status', 'AVAILABLE');

      if (error) throw error;

      const transactions = data as Pick<CashbackTransaction, 'amount'>[];
      return transactions.reduce((sum, t) => sum + t.amount, 0);
    } catch (error: any) {
      console.error('Error getting available cashback:', error);
      throw error;
    }
  },

  /**
   * Obter resumo completo de cashback do cliente
   */
  async getCustomerCashback(customerId: string): Promise<CustomerCashback> {
    try {
      const { data, error } = await supabase
        .from('CashbackTransaction')
        .select('*')
        .eq('customerId', customerId)
        .order('createdAt', { ascending: false });

      if (error) throw error;

      const transactions = data as CashbackTransaction[];

      const totalEarned = transactions
        .filter(t => t.status !== 'CANCELLED')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalUsed = transactions
        .filter(t => t.status === 'USED')
        .reduce((sum, t) => sum + t.amount, 0);

      const available = transactions
        .filter(t => t.status === 'AVAILABLE')
        .reduce((sum, t) => sum + t.amount, 0);

      const expired = transactions
        .filter(t => t.status === 'EXPIRED')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        customerId,
        totalEarned,
        totalUsed,
        available,
        expired,
        transactions,
      };
    } catch (error: any) {
      console.error('Error getting customer cashback:', error);
      throw error;
    }
  },

  /**
   * Usar cashback em um pedido
   */
  async useCashback(
    transactionId: string,
    orderId: string,
    amountUsed?: number
  ): Promise<CashbackTransaction> {
    try {
      const transaction = await cashbackApi.getTransactionById(transactionId);

      if (transaction.status !== 'AVAILABLE') {
        throw new Error('Cashback não está disponível para uso');
      }

      const amount = amountUsed || transaction.amount;

      if (amount > transaction.amount) {
        throw new Error('Valor a usar maior que o disponível');
      }

      // Se usar o valor total, marca como usado
      if (amount === transaction.amount) {
        return await cashbackApi.updateTransaction(transactionId, {
          status: 'USED',
          usedAt: new Date().toISOString(),
          usedInOrderId: orderId,
        });
      }

      // Se usar parcialmente, atualiza o valor e cria nova transação com o usado
      const remaining = transaction.amount - amount;

      // Atualiza transação original com valor restante
      await cashbackApi.updateTransaction(transactionId, {
        amount: remaining,
      });

      // Cria nova transação para o valor usado
      return await cashbackApi.createTransaction({
        userId: transaction.userId,
        customerId: transaction.customerId,
        cashbackId: transaction.cashbackId,
        orderId: transaction.orderId,
        amount: amount,
        status: 'USED',
        earnedAt: transaction.earnedAt,
        usedAt: new Date().toISOString(),
        usedInOrderId: orderId,
      });
    } catch (error: any) {
      console.error('Error using cashback:', error);
      throw error;
    }
  },

  /**
   * Marcar cashback como expirado
   */
  async expireCashback(transactionId: string): Promise<CashbackTransaction> {
    try {
      return await cashbackApi.updateTransaction(transactionId, {
        status: 'EXPIRED',
      });
    } catch (error: any) {
      console.error('Error expiring cashback:', error);
      throw error;
    }
  },

  /**
   * Cancelar cashback
   */
  async cancelCashback(
    transactionId: string,
    reason?: string
  ): Promise<CashbackTransaction> {
    try {
      return await cashbackApi.updateTransaction(transactionId, {
        status: 'CANCELLED',
        cancelledAt: new Date().toISOString(),
        cancellationReason: reason,
      });
    } catch (error: any) {
      console.error('Error cancelling cashback:', error);
      throw error;
    }
  },

  /**
   * Processar expiração automática de cashbacks
   */
  async processExpiredCashbacks(userId: string): Promise<number> {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('CashbackTransaction')
        .select('id')
        .eq('userId', userId)
        .eq('status', 'AVAILABLE')
        .lt('expiresAt', now);

      if (error) throw error;

      const expired = data as Pick<CashbackTransaction, 'id'>[];

      // Marcar todos como expirados
      const promises = expired.map(t => cashbackApi.expireCashback(t.id));
      await Promise.all(promises);

      return expired.length;
    } catch (error: any) {
      console.error('Error processing expired cashbacks:', error);
      throw error;
    }
  },

  // ========== ANALYTICS ==========

  /**
   * Obter estatísticas gerais de cashback
   */
  async getStats(
    userId: string,
    period?: {
      from: string;
      to: string;
    }
  ): Promise<CashbackStats> {
    try {
      // Buscar regras
      const rules = await cashbackApi.listRules(userId);
      const totalRules = rules.length;
      const activeRules = rules.filter(r => r.status === 'ACTIVE').length;

      // Buscar transações
      let query = supabase
        .from('CashbackTransaction')
        .select('*')
        .eq('userId', userId);

      if (period) {
        query = query
          .gte('createdAt', period.from)
          .lte('createdAt', period.to);
      }

      const { data, error } = await query;

      if (error) throw error;

      const transactions = data as CashbackTransaction[];

      const totalEarned = transactions
        .filter(t => t.status !== 'CANCELLED')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalUsed = transactions
        .filter(t => t.status === 'USED')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalAvailable = transactions
        .filter(t => t.status === 'AVAILABLE')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpired = transactions
        .filter(t => t.status === 'EXPIRED')
        .reduce((sum, t) => sum + t.amount, 0);

      const uniqueCustomers = [...new Set(transactions.map(t => t.customerId))];
      const customersWithCashback = uniqueCustomers.length;
      const averageCashbackPerCustomer = customersWithCashback > 0
        ? totalEarned / customersWithCashback
        : 0;

      // Estatísticas por regra
      const byRule: CashbackStats['byRule'] = {};

      for (const rule of rules) {
        const ruleTransactions = transactions.filter(t => t.cashbackId === rule.id);
        const ruleCustomers = [...new Set(ruleTransactions.map(t => t.customerId))];

        byRule[rule.id] = {
          ruleId: rule.id,
          ruleName: rule.name,
          totalEarned: ruleTransactions
            .filter(t => t.status !== 'CANCELLED')
            .reduce((sum, t) => sum + t.amount, 0),
          totalUsed: ruleTransactions
            .filter(t => t.status === 'USED')
            .reduce((sum, t) => sum + t.amount, 0),
          totalCustomers: ruleCustomers.length,
        };
      }

      return {
        totalRules,
        activeRules,
        totalEarned,
        totalUsed,
        totalAvailable,
        totalExpired,
        customersWithCashback,
        averageCashbackPerCustomer,
        byRule,
      };
    } catch (error: any) {
      console.error('Error getting cashback stats:', error);
      throw error;
    }
  },

  /**
   * Obter clientes com mais cashback
   */
  async getTopCustomers(
    userId: string,
    limit: number = 10,
    orderBy: 'earned' | 'available' = 'available'
  ): Promise<Array<{
    customerId: string;
    totalEarned: number;
    available: number;
    used: number;
  }>> {
    try {
      const { data, error } = await supabase
        .from('CashbackTransaction')
        .select('customerId, amount, status')
        .eq('userId', userId);

      if (error) throw error;

      const transactions = data as Pick<CashbackTransaction, 'customerId' | 'amount' | 'status'>[];

      // Agrupar por cliente
      const customerMap = new Map<string, {
        customerId: string;
        totalEarned: number;
        available: number;
        used: number;
      }>();

      transactions.forEach(t => {
        if (!customerMap.has(t.customerId)) {
          customerMap.set(t.customerId, {
            customerId: t.customerId,
            totalEarned: 0,
            available: 0,
            used: 0,
          });
        }

        const customer = customerMap.get(t.customerId)!;

        if (t.status !== 'CANCELLED') {
          customer.totalEarned += t.amount;
        }

        if (t.status === 'AVAILABLE') {
          customer.available += t.amount;
        }

        if (t.status === 'USED') {
          customer.used += t.amount;
        }
      });

      // Ordenar e limitar
      const customers = Array.from(customerMap.values());
      const sortKey = orderBy === 'earned' ? 'totalEarned' : 'available';

      return customers
        .sort((a, b) => b[sortKey] - a[sortKey])
        .slice(0, limit);
    } catch (error: any) {
      console.error('Error getting top customers:', error);
      throw error;
    }
  },

  /**
   * Calcular cashback para um pedido
   */
  async calculateCashback(
    userId: string,
    orderValue: number,
    customerId: string,
    productIds?: string[]
  ): Promise<{
    applicable: boolean;
    amount: number;
    rule?: Cashback;
    reason?: string;
  }> {
    try {
      const rules = await cashbackApi.listRules(userId, { active: true });

      // Ordenar por valor de cashback (maior primeiro)
      const sortedRules = rules.sort((a, b) => {
        const aValue = a.type === 'PERCENTAGE' ? (orderValue * a.value / 100) : a.value;
        const bValue = b.type === 'PERCENTAGE' ? (orderValue * b.value / 100) : b.value;
        return bValue - aValue;
      });

      for (const rule of sortedRules) {
        // Verificar valor mínimo
        if (rule.minOrderValue && orderValue < rule.minOrderValue) {
          continue;
        }

        // Verificar validade
        if (rule.validFrom && new Date(rule.validFrom) > new Date()) {
          continue;
        }

        if (rule.validUntil && new Date(rule.validUntil) < new Date()) {
          continue;
        }

        // Verificar produtos aplicáveis
        if (rule.applicableToProducts && rule.applicableToProducts.length > 0 && productIds) {
          const hasApplicableProduct = productIds.some(id =>
            rule.applicableToProducts!.includes(id)
          );
          if (!hasApplicableProduct) {
            continue;
          }
        }

        // Verificar produtos excluídos
        if (rule.excludedProducts && rule.excludedProducts.length > 0 && productIds) {
          const hasExcludedProduct = productIds.some(id =>
            rule.excludedProducts!.includes(id)
          );
          if (hasExcludedProduct) {
            continue;
          }
        }

        // Verificar limite de usos por cliente
        if (rule.maxUsesPerCustomer) {
          const customerTransactions = await cashbackApi.getTransactions(userId, {
            customerId,
          });
          const usesCount = customerTransactions.filter(
            t => t.cashbackId === rule.id && t.status !== 'CANCELLED'
          ).length;

          if (usesCount >= rule.maxUsesPerCustomer) {
            continue;
          }
        }

        // Verificar primeira compra apenas
        if (rule.firstPurchaseOnly) {
          const customerTransactions = await cashbackApi.getTransactions(userId, {
            customerId,
          });
          if (customerTransactions.length > 0) {
            continue;
          }
        }

        // Calcular valor do cashback
        let amount = rule.type === 'PERCENTAGE'
          ? (orderValue * rule.value / 100)
          : rule.value;

        // Aplicar valor máximo se definido
        if (rule.maxCashbackAmount && amount > rule.maxCashbackAmount) {
          amount = rule.maxCashbackAmount;
        }

        return {
          applicable: true,
          amount,
          rule,
        };
      }

      return {
        applicable: false,
        amount: 0,
        reason: 'Nenhuma regra de cashback aplicável',
      };
    } catch (error: any) {
      console.error('Error calculating cashback:', error);
      throw error;
    }
  },
};

export default cashbackApi;
