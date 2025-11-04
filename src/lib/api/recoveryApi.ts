import { supabase } from '../supabase';

// ============================================
// TYPES
// ============================================

export type RecoveryMethod = 'PIX' | 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH_NOTIFICATION';
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface RecoveredCart {
  id: string;
  userId: string;
  cartId: string;
  customerId?: string;
  customerEmail: string;
  customerPhone?: string;
  cartValue: number;
  recoveryMethod: RecoveryMethod;
  pixQrCode?: string;
  pixCopyPaste?: string;
  pixExpiresAt?: string;
  pixPaymentId?: string;
  recoveryEmailSent: boolean;
  recoverySmsSent: boolean;
  recoveryWhatsappSent: boolean;
  recoveryAttempts: number;
  lastRecoveryAt?: string;
  recovered: boolean;
  recoveredAt?: string;
  orderId?: string;
  discountOffered: number;
  discountType?: DiscountType;
  discountValue?: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface RecoveryStats {
  totalAttempts: number;
  successfulRecoveries: number;
  totalCartValue: number;
  recoveredValue: number;
  recoveryRate: number;
  byMethod: {
    [key in RecoveryMethod]?: {
      attempts: number;
      successes: number;
      rate: number;
      value: number;
    };
  };
}

export interface CreateRecoveryParams {
  userId: string;
  cartId: string;
  customerId?: string;
  customerEmail: string;
  customerPhone?: string;
  cartValue: number;
  recoveryMethod?: RecoveryMethod;
  discountType?: DiscountType;
  discountValue?: number;
}

// ============================================
// RECOVERY API
// ============================================

export const recoveryApi = {
  /**
   * Listar todos os carrinhos para recuperação
   */
  async list(userId: string, filters?: {
    recovered?: boolean;
    method?: RecoveryMethod;
    dateFrom?: string;
    dateTo?: string;
  }) {
    try {
      let query = supabase
        .from('RecoveredCart')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });

      if (filters?.recovered !== undefined) {
        query = query.eq('recovered', filters.recovered);
      }

      if (filters?.method) {
        query = query.eq('recoveryMethod', filters.method);
      }

      if (filters?.dateFrom) {
        query = query.gte('createdAt', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('createdAt', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as RecoveredCart[];
    } catch (error: any) {
      console.error('Error listing recovered carts:', error);
      throw error;
    }
  },

  /**
   * Buscar carrinho por ID
   */
  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('RecoveredCart')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as RecoveredCart;
    } catch (error: any) {
      console.error('Error getting recovered cart:', error);
      throw error;
    }
  },

  /**
   * Criar tentativa de recuperação
   */
  async create(params: CreateRecoveryParams) {
    try {
      const recoveryData = {
        userId: params.userId,
        cartId: params.cartId,
        customerId: params.customerId,
        customerEmail: params.customerEmail,
        customerPhone: params.customerPhone,
        cartValue: params.cartValue,
        recoveryMethod: params.recoveryMethod || 'EMAIL',
        discountOffered: params.discountValue || 0,
        discountType: params.discountType,
        discountValue: params.discountValue,
        recoveryAttempts: 0,
        recovered: false,
      };

      const { data, error } = await supabase
        .from('RecoveredCart')
        .insert(recoveryData)
        .select()
        .single();

      if (error) throw error;
      return data as RecoveredCart;
    } catch (error: any) {
      console.error('Error creating recovery:', error);
      throw error;
    }
  },

  /**
   * Enviar PIX de recuperação
   */
  async sendPixRecovery(id: string, pixData: {
    qrCode: string;
    copyPaste: string;
    expiresAt: string;
    paymentId: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('RecoveredCart')
        .update({
          pixQrCode: pixData.qrCode,
          pixCopyPaste: pixData.copyPaste,
          pixExpiresAt: pixData.expiresAt,
          pixPaymentId: pixData.paymentId,
          recoveryMethod: 'PIX',
          recoveryAttempts: supabase.sql`"recoveryAttempts" + 1`,
          lastRecoveryAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as RecoveredCart;
    } catch (error: any) {
      console.error('Error sending PIX recovery:', error);
      throw error;
    }
  },

  /**
   * Enviar email de recuperação
   */
  async sendEmailRecovery(id: string, emailData?: {
    subject?: string;
    template?: string;
    discountCode?: string;
  }) {
    try {
      // Aqui você pode integrar com seu serviço de email
      // Por enquanto, apenas marca como enviado
      const { data, error } = await supabase
        .from('RecoveredCart')
        .update({
          recoveryEmailSent: true,
          recoveryMethod: 'EMAIL',
          recoveryAttempts: supabase.sql`"recoveryAttempts" + 1`,
          lastRecoveryAt: new Date().toISOString(),
          metadata: emailData,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as RecoveredCart;
    } catch (error: any) {
      console.error('Error sending email recovery:', error);
      throw error;
    }
  },

  /**
   * Enviar SMS de recuperação
   */
  async sendSmsRecovery(id: string, message?: string) {
    try {
      // Integrar com serviço de SMS (Twilio, etc)
      const { data, error } = await supabase
        .from('RecoveredCart')
        .update({
          recoverySmsSent: true,
          recoveryMethod: 'SMS',
          recoveryAttempts: supabase.sql`"recoveryAttempts" + 1`,
          lastRecoveryAt: new Date().toISOString(),
          metadata: { message },
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as RecoveredCart;
    } catch (error: any) {
      console.error('Error sending SMS recovery:', error);
      throw error;
    }
  },

  /**
   * Enviar WhatsApp de recuperação
   */
  async sendWhatsAppRecovery(id: string, message?: string) {
    try {
      // Integrar com WhatsApp Business API
      const { data, error } = await supabase
        .from('RecoveredCart')
        .update({
          recoveryWhatsappSent: true,
          recoveryMethod: 'WHATSAPP',
          recoveryAttempts: supabase.sql`"recoveryAttempts" + 1`,
          lastRecoveryAt: new Date().toISOString(),
          metadata: { message },
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as RecoveredCart;
    } catch (error: any) {
      console.error('Error sending WhatsApp recovery:', error);
      throw error;
    }
  },

  /**
   * Marcar carrinho como recuperado
   */
  async markAsRecovered(id: string, orderId: string) {
    try {
      const { data, error } = await supabase
        .from('RecoveredCart')
        .update({
          recovered: true,
          recoveredAt: new Date().toISOString(),
          orderId,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as RecoveredCart;
    } catch (error: any) {
      console.error('Error marking as recovered:', error);
      throw error;
    }
  },

  /**
   * Obter estatísticas de recuperação
   */
  async getStats(userId: string, period?: {
    from: string;
    to: string;
  }): Promise<RecoveryStats> {
    try {
      let query = supabase
        .from('RecoveredCart')
        .select('*')
        .eq('userId', userId);

      if (period) {
        query = query
          .gte('createdAt', period.from)
          .lte('createdAt', period.to);
      }

      const { data, error } = await query;

      if (error) throw error;

      const carts = data as RecoveredCart[];

      // Calcular estatísticas gerais
      const totalAttempts = carts.length;
      const successfulRecoveries = carts.filter(c => c.recovered).length;
      const totalCartValue = carts.reduce((sum, c) => sum + c.cartValue, 0);
      const recoveredValue = carts
        .filter(c => c.recovered)
        .reduce((sum, c) => sum + c.cartValue, 0);
      const recoveryRate = totalAttempts > 0
        ? (successfulRecoveries / totalAttempts) * 100
        : 0;

      // Calcular estatísticas por método
      const methods: RecoveryMethod[] = ['PIX', 'EMAIL', 'SMS', 'WHATSAPP', 'PUSH_NOTIFICATION'];
      const byMethod: RecoveryStats['byMethod'] = {};

      methods.forEach(method => {
        const methodCarts = carts.filter(c => c.recoveryMethod === method);
        if (methodCarts.length > 0) {
          const successes = methodCarts.filter(c => c.recovered).length;
          byMethod[method] = {
            attempts: methodCarts.length,
            successes,
            rate: (successes / methodCarts.length) * 100,
            value: methodCarts
              .filter(c => c.recovered)
              .reduce((sum, c) => sum + c.cartValue, 0),
          };
        }
      });

      return {
        totalAttempts,
        successfulRecoveries,
        totalCartValue,
        recoveredValue,
        recoveryRate,
        byMethod,
      };
    } catch (error: any) {
      console.error('Error getting recovery stats:', error);
      throw error;
    }
  },

  /**
   * Buscar carrinhos pendentes de recuperação (não recuperados)
   */
  async getPending(userId: string, limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from('RecoveredCart')
        .select('*')
        .eq('userId', userId)
        .eq('recovered', false)
        .order('createdAt', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as RecoveredCart[];
    } catch (error: any) {
      console.error('Error getting pending recoveries:', error);
      throw error;
    }
  },

  /**
   * Buscar carrinhos recuperados via PIX
   */
  async getPixRecovered(userId: string) {
    try {
      const { data, error } = await supabase
        .from('RecoveredCart')
        .select('*')
        .eq('userId', userId)
        .eq('recoveryMethod', 'PIX')
        .eq('recovered', true)
        .order('recoveredAt', { ascending: false });

      if (error) throw error;
      return data as RecoveredCart[];
    } catch (error: any) {
      console.error('Error getting PIX recovered carts:', error);
      throw error;
    }
  },

  /**
   * Deletar tentativa de recuperação
   */
  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('RecoveredCart')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error deleting recovery:', error);
      throw error;
    }
  },

  /**
   * Atualizar tentativa de recuperação
   */
  async update(id: string, updates: Partial<RecoveredCart>) {
    try {
      const { data, error } = await supabase
        .from('RecoveredCart')
        .update({
          ...updates,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as RecoveredCart;
    } catch (error: any) {
      console.error('Error updating recovery:', error);
      throw error;
    }
  },
};

export default recoveryApi;
