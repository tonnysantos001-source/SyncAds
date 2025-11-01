// ============================================
// PAYMENT METRICS API
// ============================================
//
// API completa para métricas e relatórios do sistema de pagamento
// Integra com as views materializadas e tabelas de eventos
//
// ============================================

import { supabase } from '@/lib/supabase';

// ============================================
// TYPES
// ============================================

export interface CheckoutMetrics {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  refundedTransactions: number;
  totalRevenue: number;
  refundedRevenue: number;
  netRevenue: number;
  avgTicket: number;
  successRate: number;
  failureRate: number;
  conversionRate: number;
}

export interface GatewayMetrics {
  gatewayId: string;
  gatewayName: string;
  gatewaySlug: string;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalRevenue: number;
  avgTicket: number;
  successRate: number;
  failureRate: number;
  pixCount: number;
  boletoCount: number;
  creditCardCount: number;
  avgProcessingTime?: number;
}

export interface PaymentAlert {
  id: string;
  alertType: string;
  severity: 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  currentValue?: number;
  threshold?: any;
  status: 'active' | 'acknowledged' | 'resolved';
  gatewayId?: string;
  gatewayName?: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export interface PaymentEvent {
  id: string;
  eventType: string;
  eventData?: any;
  severity: 'info' | 'warning' | 'error' | 'critical';
  transactionId?: string;
  orderId?: string;
  gatewayId?: string;
  errorMessage?: string;
  processingTime?: number;
  createdAt: string;
}

export interface TransactionReport {
  id: string;
  orderId: string;
  gatewayName: string;
  paymentMethod: string;
  amount: number;
  status: string;
  failureReason?: string;
  createdAt: string;
  paidAt?: string;
  processingTime?: number;
}

export interface GatewaySuccessRate {
  gatewayId: string;
  gatewayName: string;
  gatewaySlug: string;
  successRate: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  lastUpdated: string;
}

export interface FailingGateway {
  gatewayId: string;
  gatewayName: string;
  gatewaySlug: string;
  failureCount: number;
  totalAttempts: number;
  failureRate: number;
  lastFailureAt: string;
}

export interface MetricsPeriod {
  period: 'hour' | 'day' | 'week' | 'month';
  startDate?: Date;
  endDate?: Date;
}

// ============================================
// API FUNCTIONS
// ============================================

export const paymentMetricsApi = {
  /**
   * Obter métricas gerais do checkout
   */
  async getCheckoutMetrics(
    userId: string,
    period: MetricsPeriod = { period: 'month' }
  ): Promise<CheckoutMetrics> {
    try {
      // Usar view materializada se disponível, caso contrário calcular
      const { data: viewData, error: viewError } = await supabase
        .from('CheckoutMetricsView')
        .select('*')
        .eq('organizationId', userId)
        .single();

      if (!viewError && viewData) {
        return {
          totalTransactions: viewData.totalTransactions || 0,
          successfulTransactions: viewData.successfulTransactions || 0,
          failedTransactions: viewData.failedTransactions || 0,
          pendingTransactions: viewData.pendingTransactions || 0,
          refundedTransactions: viewData.refundedTransactions || 0,
          totalRevenue: Number(viewData.totalRevenue) || 0,
          refundedRevenue: Number(viewData.refundedRevenue) || 0,
          netRevenue: Number(viewData.totalRevenue) - Number(viewData.refundedRevenue) || 0,
          avgTicket: Number(viewData.avgTicket) || 0,
          successRate: Number(viewData.successRate) || 0,
          failureRate: 100 - Number(viewData.successRate) || 0,
          conversionRate: Number(viewData.successRate) || 0,
        };
      }

      // Fallback: calcular em tempo real
      const startDate = period.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = period.endDate || new Date();

      const { data: transactions, error } = await supabase
        .from('Transaction')
        .select('*')
        .eq('userId', userId)
        .gte('createdAt', startDate.toISOString())
        .lte('createdAt', endDate.toISOString());

      if (error) throw error;

      const metrics: CheckoutMetrics = {
        totalTransactions: transactions?.length || 0,
        successfulTransactions: transactions?.filter(t => t.status === 'PAID').length || 0,
        failedTransactions: transactions?.filter(t => t.status === 'FAILED').length || 0,
        pendingTransactions: transactions?.filter(t => t.status === 'PENDING').length || 0,
        refundedTransactions: transactions?.filter(t => t.status === 'REFUNDED').length || 0,
        totalRevenue: transactions?.filter(t => t.status === 'PAID')
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        refundedRevenue: transactions?.filter(t => t.status === 'REFUNDED')
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        netRevenue: 0,
        avgTicket: 0,
        successRate: 0,
        failureRate: 0,
        conversionRate: 0,
      };

      metrics.netRevenue = metrics.totalRevenue - metrics.refundedRevenue;

      if (metrics.successfulTransactions > 0) {
        metrics.avgTicket = metrics.totalRevenue / metrics.successfulTransactions;
      }

      if (metrics.totalTransactions > 0) {
        metrics.successRate = (metrics.successfulTransactions / metrics.totalTransactions) * 100;
        metrics.failureRate = (metrics.failedTransactions / metrics.totalTransactions) * 100;
        metrics.conversionRate = metrics.successRate;
      }

      return metrics;
    } catch (error) {
      console.error('Error fetching checkout metrics:', error);
      throw error;
    }
  },

  /**
   * Obter métricas por gateway
   */
  async getGatewayMetrics(userId: string): Promise<GatewayMetrics[]> {
    try {
      // Usar view materializada
      const { data, error } = await supabase
        .from('GatewayPerformanceView')
        .select('*')
        .eq('organizationId', userId)
        .order('totalRevenue', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        gatewayId: item.gatewayId,
        gatewayName: item.gatewayName,
        gatewaySlug: item.gatewaySlug,
        totalTransactions: item.totalTransactions || 0,
        successfulTransactions: item.successfulTransactions || 0,
        failedTransactions: item.failedTransactions || 0,
        totalRevenue: Number(item.totalRevenue) || 0,
        avgTicket: Number(item.avgTicket) || 0,
        successRate: Number(item.successRate) || 0,
        failureRate: 100 - Number(item.successRate) || 0,
        pixCount: item.pixCount || 0,
        boletoCount: item.boletoCount || 0,
        creditCardCount: item.creditCardCount || 0,
      }));
    } catch (error) {
      console.error('Error fetching gateway metrics:', error);
      throw error;
    }
  },

  /**
   * Obter alertas ativos
   */
  async getActiveAlerts(userId: string): Promise<PaymentAlert[]> {
    try {
      const { data: user } = await supabase
        .from('User')
        .select('organizationId')
        .eq('id', userId)
        .single();

      if (!user?.organizationId) return [];

      const { data, error } = await supabase
        .from('PaymentAlert')
        .select(`
          *,
          Gateway:gatewayId (
            name
          )
        `)
        .eq('organizationId', user.organizationId)
        .eq('status', 'active')
        .order('severity', { ascending: false })
        .order('createdAt', { ascending: false });

      if (error) throw error;

      return (data || []).map(alert => ({
        id: alert.id,
        alertType: alert.alertType,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        currentValue: alert.currentValue ? Number(alert.currentValue) : undefined,
        threshold: alert.threshold,
        status: alert.status,
        gatewayId: alert.gatewayId,
        gatewayName: alert.Gateway?.name,
        createdAt: alert.createdAt,
        acknowledgedAt: alert.acknowledgedAt,
        resolvedAt: alert.resolvedAt,
      }));
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
  },

  /**
   * Reconhecer alerta
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('PaymentAlert')
        .update({
          status: 'acknowledged',
          acknowledgedBy: userId,
          acknowledgedAt: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw error;
    }
  },

  /**
   * Resolver alerta
   */
  async resolveAlert(alertId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('PaymentAlert')
        .update({
          status: 'resolved',
          resolvedAt: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  },

  /**
   * Obter eventos de pagamento
   */
  async getPaymentEvents(
    userId: string,
    filters?: {
      severity?: string;
      eventType?: string;
      transactionId?: string;
      limit?: number;
    }
  ): Promise<PaymentEvent[]> {
    try {
      const { data: user } = await supabase
        .from('User')
        .select('organizationId')
        .eq('id', userId)
        .single();

      if (!user?.organizationId) return [];

      let query = supabase
        .from('PaymentEvent')
        .select('*')
        .eq('organizationId', user.organizationId)
        .order('createdAt', { ascending: false })
        .limit(filters?.limit || 100);

      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }

      if (filters?.eventType) {
        query = query.eq('eventType', filters.eventType);
      }

      if (filters?.transactionId) {
        query = query.eq('transactionId', filters.transactionId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(event => ({
        id: event.id,
        eventType: event.eventType,
        eventData: event.eventData,
        severity: event.severity,
        transactionId: event.transactionId,
        orderId: event.orderId,
        gatewayId: event.gatewayId,
        errorMessage: event.errorMessage,
        processingTime: event.processingTime,
        createdAt: event.createdAt,
      }));
    } catch (error) {
      console.error('Error fetching payment events:', error);
      return [];
    }
  },

  /**
   * Obter relatório de transações
   */
  async getTransactionReport(
    userId: string,
    filters?: {
      status?: string;
      gatewayId?: string;
      paymentMethod?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ transactions: TransactionReport[]; total: number }> {
    try {
      let query = supabase
        .from('Transaction')
        .select(`
          *,
          Gateway:gatewayId (
            name
          )
        `, { count: 'exact' })
        .eq('userId', userId)
        .order('createdAt', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.gatewayId) {
        query = query.eq('gatewayId', filters.gatewayId);
      }

      if (filters?.paymentMethod) {
        query = query.eq('paymentMethod', filters.paymentMethod);
      }

      if (filters?.startDate) {
        query = query.gte('createdAt', filters.startDate.toISOString());
      }

      if (filters?.endDate) {
        query = query.lte('createdAt', filters.endDate.toISOString());
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const transactions = (data || []).map(t => ({
        id: t.id,
        orderId: t.orderId,
        gatewayName: t.Gateway?.name || 'N/A',
        paymentMethod: t.paymentMethod,
        amount: Number(t.amount),
        status: t.status,
        failureReason: t.failureReason,
        createdAt: t.createdAt,
        paidAt: t.paidAt,
        processingTime: t.processingTime,
      }));

      return {
        transactions,
        total: count || 0,
      };
    } catch (error) {
      console.error('Error fetching transaction report:', error);
      throw error;
    }
  },

  /**
   * Obter taxa de sucesso por gateway
   */
  async getGatewaySuccessRates(userId: string): Promise<GatewaySuccessRate[]> {
    try {
      const { data: user } = await supabase
        .from('User')
        .select('organizationId')
        .eq('id', userId)
        .single();

      if (!user?.organizationId) return [];

      const { data, error } = await supabase
        .from('GatewayPerformanceView')
        .select('*')
        .eq('organizationId', user.organizationId)
        .order('successRate', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        gatewayId: item.gatewayId,
        gatewayName: item.gatewayName,
        gatewaySlug: item.gatewaySlug,
        successRate: Number(item.successRate) || 0,
        totalTransactions: item.totalTransactions || 0,
        successfulTransactions: item.successfulTransactions || 0,
        failedTransactions: item.failedTransactions || 0,
        lastUpdated: item.calculatedAt,
      }));
    } catch (error) {
      console.error('Error fetching gateway success rates:', error);
      return [];
    }
  },

  /**
   * Obter gateways com falha
   */
  async getFailingGateways(userId: string): Promise<FailingGateway[]> {
    try {
      const { data: user } = await supabase
        .from('User')
        .select('organizationId')
        .eq('id', userId)
        .single();

      if (!user?.organizationId) return [];

      const { data, error } = await supabase
        .from('FailingGatewaysView')
        .select('*')
        .eq('organizationId', user.organizationId)
        .order('failureRate', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        gatewayId: item.gatewayId,
        gatewayName: item.gatewayName,
        gatewaySlug: item.gatewaySlug,
        failureCount: item.failureCount || 0,
        totalAttempts: item.totalAttempts || 0,
        failureRate: Number(item.failureRate) || 0,
        lastFailureAt: item.lastFailureAt,
      }));
    } catch (error) {
      console.error('Error fetching failing gateways:', error);
      return [];
    }
  },

  /**
   * Exportar relatório para CSV
   */
  async exportTransactionReport(
    userId: string,
    filters?: {
      status?: string;
      gatewayId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<Blob> {
    try {
      const { transactions } = await this.getTransactionReport(userId, {
        ...filters,
        limit: 10000, // Máximo para export
      });

      const csvHeader = 'ID,Order ID,Gateway,Payment Method,Amount,Status,Created At,Paid At,Failure Reason\n';
      const csvRows = transactions.map(t =>
        `${t.id},${t.orderId},${t.gatewayName},${t.paymentMethod},${t.amount},${t.status},${t.createdAt},${t.paidAt || ''},${t.failureReason || ''}`
      ).join('\n');

      const csv = csvHeader + csvRows;
      return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  },

  /**
   * Atualizar métricas manualmente (refresh views)
   */
  async refreshMetrics(): Promise<void> {
    try {
      const { error } = await supabase.rpc('refresh_payment_metrics');
      if (error) throw error;
    } catch (error) {
      console.error('Error refreshing metrics:', error);
      throw error;
    }
  },

  /**
   * Obter estatísticas de retry
   */
  async getRetryStats(userId: string): Promise<{
    pending: number;
    processing: number;
    success: number;
    failed: number;
  }> {
    try {
      const { data: user } = await supabase
        .from('User')
        .select('organizationId')
        .eq('id', userId)
        .single();

      if (!user?.organizationId) {
        return { pending: 0, processing: 0, success: 0, failed: 0 };
      }

      const { data, error } = await supabase
        .from('PaymentRetryQueue')
        .select('status')
        .eq('organizationId', user.organizationId);

      if (error) throw error;

      const stats = {
        pending: 0,
        processing: 0,
        success: 0,
        failed: 0,
      };

      (data || []).forEach(item => {
        if (item.status === 'pending') stats.pending++;
        else if (item.status === 'processing') stats.processing++;
        else if (item.status === 'success') stats.success++;
        else if (item.status === 'failed') stats.failed++;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching retry stats:', error);
      return { pending: 0, processing: 0, success: 0, failed: 0 };
    }
  },
};

// ============================================
// EXPORT DEFAULT
// ============================================

export default paymentMetricsApi;
