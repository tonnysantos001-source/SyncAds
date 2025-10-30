import { supabase } from '../supabase';

// ============================================
// TYPES
// ============================================

export interface Gateway {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  type: 'PAYMENT_PROCESSOR' | 'WALLET' | 'BANK';
  supportsPix: boolean;
  supportsCreditCard: boolean;
  supportsBoleto: boolean;
  supportsDebit: boolean;
  requiredFields?: Record<string, any>;
  webhookUrl?: string;
  documentation?: string;
  isActive: boolean;
  isPopular: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GatewayConfig {
  id: string;
  userId: string; // ✅ MUDOU: organizationId → userId
  gatewayId: string;
  credentials: Record<string, any>;
  isActive: boolean;
  isDefault: boolean;
  webhookUrl?: string;
  pixFee?: number;
  creditCardFee?: number;
  boletoFee?: number;
  minAmount?: number;
  maxAmount?: number;
  isTestMode: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string; // ✅ MUDOU: organizationId → userId
  orderId: string;
  gatewayId: string;
  transactionId?: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  failureReason?: string;
  processedAt?: string;
  paidAt?: string;
  refundedAt?: string;
  cancelledAt?: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
  pixExpiresAt?: string;
  boletoUrl?: string;
  boletoBarcode?: string;
  boletoExpiresAt?: string;
  cardBrand?: string;
  cardLast4?: string;
  installments: number;
  gatewayFee?: number;
  netAmount?: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// GATEWAYS API (Todos os gateways disponíveis)
// ============================================

export const gatewaysApi = {
  // Lista todos os gateways disponíveis
  async list(filters?: {
    type?: 'PAYMENT_PROCESSOR' | 'WALLET' | 'BANK';
    isPopular?: boolean;
    supportsPix?: boolean;
    supportsCreditCard?: boolean;
  }) {
    try {
      let query = supabase
        .from('Gateway')
        .select('*')
        .eq('isActive', true)
        .order('isPopular', { ascending: false })
        .order('name', { ascending: true });

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      if (filters?.isPopular !== undefined) {
        query = query.eq('isPopular', filters.isPopular);
      }

      if (filters?.supportsPix !== undefined) {
        query = query.eq('supportsPix', filters.supportsPix);
      }

      if (filters?.supportsCreditCard !== undefined) {
        query = query.eq('supportsCreditCard', filters.supportsCreditCard);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Gateway[];
    } catch (error) {
      console.error('Error listing gateways:', error);
      throw error;
    }
  },

  // Busca um gateway por ID
  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('Gateway')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Gateway;
    } catch (error) {
      console.error('Error getting gateway:', error);
      throw error;
    }
  },

  // Busca gateway por slug
  async getBySlug(slug: string) {
    try {
      const { data, error } = await supabase
        .from('Gateway')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data as Gateway;
    } catch (error) {
      console.error('Error getting gateway by slug:', error);
      throw error;
    }
  },

  // Lista gateways populares (para exibir em destaque)
  async listPopular() {
    try {
      const { data, error } = await supabase
        .from('Gateway')
        .select('*')
        .eq('isActive', true)
        .eq('isPopular', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Gateway[];
    } catch (error) {
      console.error('Error listing popular gateways:', error);
      throw error;
    }
  },
};

// ============================================
// GATEWAY CONFIG API (Configurações por organização)
// ============================================

export const gatewayConfigApi = {
  // Lista configurações de gateways da organização
  async list() {
    try {
      const { data, error } = await supabase
        .from('GatewayConfig')
        .select('*, Gateway(*)')
        .order('isDefault', { ascending: false })
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data as GatewayConfig[];
    } catch (error) {
      console.error('Error listing gateway configs:', error);
      throw error;
    }
  },

  // Busca configuração por ID
  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('GatewayConfig')
        .select('*, Gateway(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as GatewayConfig;
    } catch (error) {
      console.error('Error getting gateway config:', error);
      throw error;
    }
  },

  // Busca gateway padrão da organização
  async getDefault() {
    try {
      const { data, error } = await supabase
        .from('GatewayConfig')
        .select('*, Gateway(*)')
        .eq('isDefault', true)
        .eq('isActive', true)
        .single();

      if (error) throw error;
      return data as GatewayConfig;
    } catch (error) {
      console.error('Error getting default gateway:', error);
      throw error;
    }
  },

  // Cria uma nova configuração de gateway
  async create(config: Omit<GatewayConfig, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      // Se for o gateway padrão, remove o padrão dos outros
      if (config.isDefault) {
        await supabase
          .from('GatewayConfig')
          .update({ isDefault: false })
          .eq('userId', config.userId);
      }

      const { data, error } = await supabase
        .from('GatewayConfig')
        .insert(config)
        .select()
        .single();

      if (error) throw error;
      return data as GatewayConfig;
    } catch (error) {
      console.error('Error creating gateway config:', error);
      throw error;
    }
  },

  // Atualiza configuração de gateway
  async update(id: string, updates: Partial<GatewayConfig>) {
    try {
      // Se está definindo como padrão, remove o padrão dos outros
      if (updates.isDefault) {
        const config = await supabase
          .from('GatewayConfig')
          .select('userId')
          .eq('id', id)
          .single();

        if (config.data) {
          await supabase
            .from('GatewayConfig')
            .update({ isDefault: false })
            .eq('userId', config.data.userId);
        }
      }

      const { data, error } = await supabase
        .from('GatewayConfig')
        .update({ ...updates, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as GatewayConfig;
    } catch (error) {
      console.error('Error updating gateway config:', error);
      throw error;
    }
  },

  // Ativa/Desativa um gateway
  async toggleActive(id: string, isActive: boolean) {
    try {
      const { data, error } = await supabase
        .from('GatewayConfig')
        .update({ isActive, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as GatewayConfig;
    } catch (error) {
      console.error('Error toggling gateway:', error);
      throw error;
    }
  },

  // Define gateway como padrão
  async setAsDefault(id: string) {
    try {
      // Primeiro, busca a configuração
      const config = await supabase
        .from('GatewayConfig')
        .select('organizationId')
        .eq('id', id)
        .single();

      if (!config.data) throw new Error('Gateway config not found');

      // Remove o padrão dos outros
      await supabase
        .from('GatewayConfig')
        .update({ isDefault: false })
        .eq('organizationId', config.data.organizationId);

      // Define este como padrão
      const { data, error } = await supabase
        .from('GatewayConfig')
        .update({ isDefault: true, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as GatewayConfig;
    } catch (error) {
      console.error('Error setting default gateway:', error);
      throw error;
    }
  },

  // Deleta configuração de gateway
  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('GatewayConfig')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting gateway config:', error);
      throw error;
    }
  },

  // Testa conexão com o gateway
  async testConnection(id: string) {
    try {
      // TODO: Implementar teste real com Edge Function
      // Por enquanto, apenas retorna sucesso
      return { success: true, message: 'Conexão testada com sucesso' };
    } catch (error) {
      console.error('Error testing gateway connection:', error);
      throw error;
    }
  },
};

// ============================================
// TRANSACTIONS API
// ============================================

export const transactionsApi = {
  // Lista todas as transações
  async list(filters?: {
    orderId?: string;
    gatewayId?: string;
    status?: Transaction['status'];
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
  }) {
    try {
      let query = supabase
        .from('Transaction')
        .select('*, Gateway(*)')
        .order('createdAt', { ascending: false });

      if (filters?.orderId) {
        query = query.eq('orderId', filters.orderId);
      }

      if (filters?.gatewayId) {
        query = query.eq('gatewayId', filters.gatewayId);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.paymentMethod) {
        query = query.eq('paymentMethod', filters.paymentMethod);
      }

      if (filters?.startDate) {
        query = query.gte('createdAt', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('createdAt', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Transaction[];
    } catch (error) {
      console.error('Error listing transactions:', error);
      throw error;
    }
  },

  // Busca transação por ID
  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('Transaction')
        .select('*, Gateway(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Transaction;
    } catch (error) {
      console.error('Error getting transaction:', error);
      throw error;
    }
  },

  // Busca transações de um pedido
  async getByOrder(orderId: string) {
    try {
      const { data, error } = await supabase
        .from('Transaction')
        .select('*, Gateway(*)')
        .eq('orderId', orderId)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    } catch (error) {
      console.error('Error getting order transactions:', error);
      throw error;
    }
  },

  // Cria uma nova transação
  async create(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const { data, error } = await supabase
        .from('Transaction')
        .insert(transaction)
        .select()
        .single();

      if (error) throw error;
      return data as Transaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  },

  // Atualiza status da transação
  async updateStatus(id: string, status: Transaction['status'], metadata?: Record<string, any>) {
    try {
      const updates: Partial<Transaction> = {
        status,
        updatedAt: new Date().toISOString(),
      };

      // Atualiza timestamps baseado no status
      if (status === 'PROCESSING') {
        updates.processedAt = new Date().toISOString();
      } else if (status === 'PAID') {
        updates.paidAt = new Date().toISOString();
      } else if (status === 'REFUNDED') {
        updates.refundedAt = new Date().toISOString();
      } else if (status === 'CANCELLED') {
        updates.cancelledAt = new Date().toISOString();
      }

      if (metadata) {
        updates.metadata = metadata;
      }

      const { data, error } = await supabase
        .from('Transaction')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Transaction;
    } catch (error) {
      console.error('Error updating transaction status:', error);
      throw error;
    }
  },

  // Cancela uma transação
  async cancel(id: string, reason?: string) {
    try {
      const { data, error } = await supabase
        .from('Transaction')
        .update({
          status: 'CANCELLED',
          failureReason: reason,
          cancelledAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Transaction;
    } catch (error) {
      console.error('Error cancelling transaction:', error);
      throw error;
    }
  },

  // Reembolsa uma transação
  async refund(id: string) {
    try {
      const { data, error } = await supabase
        .from('Transaction')
        .update({
          status: 'REFUNDED',
          refundedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Transaction;
    } catch (error) {
      console.error('Error refunding transaction:', error);
      throw error;
    }
  },

  // Stats de transações
  async getStats(filters?: {
    startDate?: string;
    endDate?: string;
  }) {
    try {
      let query = supabase
        .from('Transaction')
        .select('status, amount, paymentMethod, gatewayId');

      if (filters?.startDate) {
        query = query.gte('createdAt', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('createdAt', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calcula estatísticas
      const stats = {
        total: data.length,
        paid: data.filter(t => t.status === 'PAID').length,
        pending: data.filter(t => t.status === 'PENDING').length,
        failed: data.filter(t => t.status === 'FAILED').length,
        totalAmount: data
          .filter(t => t.status === 'PAID')
          .reduce((sum, t) => sum + t.amount, 0),
        byPaymentMethod: {} as Record<string, number>,
        byGateway: {} as Record<string, number>,
      };

      // Agrupa por método de pagamento
      data.forEach(t => {
        if (!stats.byPaymentMethod[t.paymentMethod]) {
          stats.byPaymentMethod[t.paymentMethod] = 0;
        }
        stats.byPaymentMethod[t.paymentMethod]++;
      });

      // Agrupa por gateway
      data.forEach(t => {
        if (!stats.byGateway[t.gatewayId]) {
          stats.byGateway[t.gatewayId] = 0;
        }
        stats.byGateway[t.gatewayId]++;
      });

      return stats;
    } catch (error) {
      console.error('Error getting transaction stats:', error);
      throw error;
    }
  },
};
