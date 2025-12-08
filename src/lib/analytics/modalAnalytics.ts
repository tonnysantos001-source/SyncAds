/**
 * MODAL ANALYTICS SYSTEM
 * Sistema de analytics para monitorar uso dos modais contextuais
 *
 * Features:
 * - Rastreamento de uso por modal
 * - Métricas de confiança de detecção
 * - Tempo de sessão por modal
 * - Taxa de conversão de detecções
 * - Integração com Google Analytics
 * - Export para dashboard
 *
 * @version 1.0.0
 * @date 2025-01-08
 */

import { supabase } from '@/lib/supabase';
import type { ModalType, ModalContext } from '../ai/modalContext';

/**
 * Evento de analytics do modal
 */
export interface ModalAnalyticsEvent {
  id: string;
  userId: string;
  eventType: 'modal_opened' | 'modal_closed' | 'modal_switched' | 'message_sent' | 'detection_triggered';
  modalType: ModalType;
  timestamp: number;
  sessionId: string;
  metadata?: {
    confidence?: number;
    wasAutomatic?: boolean;
    messageLength?: number;
    detectedContext?: string;
    previousModal?: ModalType;
    timeSpent?: number;
  };
}

/**
 * Estatísticas agregadas por modal
 */
export interface ModalStats {
  modalType: ModalType;
  totalOpens: number;
  totalMessages: number;
  totalTimeSpent: number; // ms
  averageSessionTime: number; // ms
  averageMessagesPerSession: number;
  autoDetectionRate: number; // 0-1
  averageConfidence: number; // 0-1
  lastUsed: number;
}

/**
 * Resumo geral de analytics
 */
export interface AnalyticsSummary {
  totalSessions: number;
  totalMessages: number;
  totalTimeSpent: number;
  modalDistribution: Record<ModalType, number>;
  detectionAccuracy: number;
  mostUsedModal: ModalType;
  averageSessionDuration: number;
  period: {
    start: number;
    end: number;
  };
}

// Session storage
let currentSessionId: string | null = null;
let sessionStartTime: number | null = null;
let currentModal: ModalType | null = null;
let modalStartTime: number | null = null;

/**
 * Inicializa uma nova sessão
 */
export function initSession(userId: string): string {
  currentSessionId = `session_${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  sessionStartTime = Date.now();

  // Salvar no localStorage
  localStorage.setItem('modal_session_id', currentSessionId);
  localStorage.setItem('modal_session_start', sessionStartTime.toString());

  return currentSessionId;
}

/**
 * Obtém o ID da sessão atual
 */
export function getSessionId(userId: string): string {
  if (!currentSessionId) {
    const stored = localStorage.getItem('modal_session_id');
    if (stored) {
      currentSessionId = stored;
    } else {
      currentSessionId = initSession(userId);
    }
  }
  return currentSessionId;
}

/**
 * Rastreia abertura de modal
 */
export async function trackModalOpen(
  userId: string,
  modalType: ModalType,
  context?: ModalContext
): Promise<void> {
  const sessionId = getSessionId(userId);
  const previousModal = currentModal;

  // Se estava em outro modal, registrar fechamento
  if (currentModal && currentModal !== modalType) {
    await trackModalClose(userId, currentModal);
  }

  currentModal = modalType;
  modalStartTime = Date.now();

  const event: ModalAnalyticsEvent = {
    id: `event_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    userId,
    eventType: previousModal ? 'modal_switched' : 'modal_opened',
    modalType,
    timestamp: Date.now(),
    sessionId,
    metadata: {
      confidence: context?.confidence,
      wasAutomatic: context ? true : false,
      detectedContext: context?.metadata?.intent,
      previousModal: previousModal || undefined,
    },
  };

  await saveEvent(event);

  // Google Analytics
  trackToGA('modal_opened', {
    modal_type: modalType,
    was_automatic: context ? 'yes' : 'no',
    confidence: context?.confidence ? Math.round(context.confidence * 100) : 0,
  });
}

/**
 * Rastreia fechamento de modal
 */
export async function trackModalClose(
  userId: string,
  modalType: ModalType
): Promise<void> {
  if (!modalStartTime) return;

  const sessionId = getSessionId(userId);
  const timeSpent = Date.now() - modalStartTime;

  const event: ModalAnalyticsEvent = {
    id: `event_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    userId,
    eventType: 'modal_closed',
    modalType,
    timestamp: Date.now(),
    sessionId,
    metadata: {
      timeSpent,
    },
  };

  await saveEvent(event);

  // Google Analytics
  trackToGA('modal_closed', {
    modal_type: modalType,
    time_spent_seconds: Math.round(timeSpent / 1000),
  });

  modalStartTime = null;
}

/**
 * Rastreia envio de mensagem
 */
export async function trackMessageSent(
  userId: string,
  modalType: ModalType,
  message: string,
  context?: ModalContext
): Promise<void> {
  const sessionId = getSessionId(userId);

  const event: ModalAnalyticsEvent = {
    id: `event_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    userId,
    eventType: 'message_sent',
    modalType,
    timestamp: Date.now(),
    sessionId,
    metadata: {
      messageLength: message.length,
      confidence: context?.confidence,
      detectedContext: context?.metadata?.intent,
    },
  };

  await saveEvent(event);

  // Google Analytics
  trackToGA('message_sent', {
    modal_type: modalType,
    message_length: message.length,
  });
}

/**
 * Rastreia detecção automática de contexto
 */
export async function trackDetection(
  userId: string,
  context: ModalContext,
  wasAccepted: boolean
): Promise<void> {
  const sessionId = getSessionId(userId);

  const event: ModalAnalyticsEvent = {
    id: `event_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    userId,
    eventType: 'detection_triggered',
    modalType: context.type,
    timestamp: Date.now(),
    sessionId,
    metadata: {
      confidence: context.confidence,
      wasAutomatic: wasAccepted,
      detectedContext: context.metadata?.intent,
    },
  };

  await saveEvent(event);

  // Google Analytics
  trackToGA('auto_detection', {
    modal_type: context.type,
    confidence: Math.round(context.confidence * 100),
    accepted: wasAccepted ? 'yes' : 'no',
  });
}

/**
 * Salva evento no storage
 */
async function saveEvent(event: ModalAnalyticsEvent): Promise<void> {
  try {
    // Salvar no localStorage
    const stored = localStorage.getItem('modal_analytics_events');
    const events: ModalAnalyticsEvent[] = stored ? JSON.parse(stored) : [];
    events.push(event);

    // Manter apenas últimos 1000 eventos no localStorage
    if (events.length > 1000) {
      events.splice(0, events.length - 1000);
    }

    localStorage.setItem('modal_analytics_events', JSON.stringify(events));

    // Tentar salvar no Supabase (não bloquear se falhar)
    try {
      await supabase.from('modal_analytics').insert({
        user_id: event.userId,
        event_type: event.eventType,
        modal_type: event.modalType,
        timestamp: new Date(event.timestamp).toISOString(),
        session_id: event.sessionId,
        metadata: event.metadata,
      });
    } catch (supabaseError) {
      console.warn('[Analytics] Falha ao salvar no Supabase:', supabaseError);
      // Não propagar erro - analytics não deve quebrar a aplicação
    }
  } catch (error) {
    console.error('[Analytics] Erro ao salvar evento:', error);
  }
}

/**
 * Obtém estatísticas por modal
 */
export function getModalStats(userId: string, modalType?: ModalType): ModalStats[] {
  try {
    const stored = localStorage.getItem('modal_analytics_events');
    if (!stored) return [];

    const events: ModalAnalyticsEvent[] = JSON.parse(stored);
    const userEvents = events.filter(e => e.userId === userId);

    // Agrupar por modal
    const modalTypes = modalType
      ? [modalType]
      : Array.from(new Set(userEvents.map(e => e.modalType)));

    return modalTypes.map(type => {
      const modalEvents = userEvents.filter(e => e.modalType === type);

      const opens = modalEvents.filter(e => e.eventType === 'modal_opened' || e.eventType === 'modal_switched');
      const messages = modalEvents.filter(e => e.eventType === 'message_sent');
      const closes = modalEvents.filter(e => e.eventType === 'modal_closed');

      const totalTimeSpent = closes.reduce((sum, e) => sum + (e.metadata?.timeSpent || 0), 0);
      const autoDetections = opens.filter(e => e.metadata?.wasAutomatic);
      const confidences = opens
        .filter(e => e.metadata?.confidence !== undefined)
        .map(e => e.metadata!.confidence!);

      return {
        modalType: type,
        totalOpens: opens.length,
        totalMessages: messages.length,
        totalTimeSpent,
        averageSessionTime: opens.length > 0 ? totalTimeSpent / opens.length : 0,
        averageMessagesPerSession: opens.length > 0 ? messages.length / opens.length : 0,
        autoDetectionRate: opens.length > 0 ? autoDetections.length / opens.length : 0,
        averageConfidence: confidences.length > 0
          ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length
          : 0,
        lastUsed: modalEvents.length > 0
          ? Math.max(...modalEvents.map(e => e.timestamp))
          : 0,
      };
    });
  } catch (error) {
    console.error('[Analytics] Erro ao calcular stats:', error);
    return [];
  }
}

/**
 * Obtém resumo geral de analytics
 */
export function getAnalyticsSummary(
  userId: string,
  periodDays: number = 30
): AnalyticsSummary {
  try {
    const stored = localStorage.getItem('modal_analytics_events');
    if (!stored) {
      return getEmptySummary();
    }

    const events: ModalAnalyticsEvent[] = JSON.parse(stored);
    const userEvents = events.filter(e => e.userId === userId);

    // Filtrar por período
    const cutoff = Date.now() - (periodDays * 24 * 60 * 60 * 1000);
    const periodEvents = userEvents.filter(e => e.timestamp >= cutoff);

    if (periodEvents.length === 0) {
      return getEmptySummary();
    }

    // Calcular métricas
    const sessions = new Set(periodEvents.map(e => e.sessionId));
    const messages = periodEvents.filter(e => e.eventType === 'message_sent');
    const closes = periodEvents.filter(e => e.eventType === 'modal_closed');
    const totalTimeSpent = closes.reduce((sum, e) => sum + (e.metadata?.timeSpent || 0), 0);

    // Distribuição por modal
    const modalDistribution: Record<string, number> = {};
    periodEvents.forEach(e => {
      modalDistribution[e.modalType] = (modalDistribution[e.modalType] || 0) + 1;
    });

    // Modal mais usado
    let mostUsedModal: ModalType = 'chat';
    let maxCount = 0;
    Object.entries(modalDistribution).forEach(([modal, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostUsedModal = modal as ModalType;
      }
    });

    // Acurácia de detecção
    const detections = periodEvents.filter(e => e.eventType === 'detection_triggered');
    const acceptedDetections = detections.filter(e => e.metadata?.wasAutomatic);
    const detectionAccuracy = detections.length > 0
      ? acceptedDetections.length / detections.length
      : 0;

    return {
      totalSessions: sessions.size,
      totalMessages: messages.length,
      totalTimeSpent,
      modalDistribution: modalDistribution as Record<ModalType, number>,
      detectionAccuracy,
      mostUsedModal,
      averageSessionDuration: sessions.size > 0 ? totalTimeSpent / sessions.size : 0,
      period: {
        start: Math.min(...periodEvents.map(e => e.timestamp)),
        end: Math.max(...periodEvents.map(e => e.timestamp)),
      },
    };
  } catch (error) {
    console.error('[Analytics] Erro ao gerar resumo:', error);
    return getEmptySummary();
  }
}

/**
 * Resumo vazio
 */
function getEmptySummary(): AnalyticsSummary {
  return {
    totalSessions: 0,
    totalMessages: 0,
    totalTimeSpent: 0,
    modalDistribution: {} as Record<ModalType, number>,
    detectionAccuracy: 0,
    mostUsedModal: 'chat',
    averageSessionDuration: 0,
    period: {
      start: Date.now(),
      end: Date.now(),
    },
  };
}

/**
 * Exporta dados para CSV
 */
export function exportToCSV(userId: string): string {
  try {
    const stored = localStorage.getItem('modal_analytics_events');
    if (!stored) return '';

    const events: ModalAnalyticsEvent[] = JSON.parse(stored);
    const userEvents = events.filter(e => e.userId === userId);

    // Header
    const csv = [
      'Timestamp,Event Type,Modal Type,Session ID,Confidence,Was Automatic,Time Spent (ms)',
      ...userEvents.map(e => {
        const date = new Date(e.timestamp).toISOString();
        return `${date},${e.eventType},${e.modalType},${e.sessionId},${e.metadata?.confidence || ''},${e.metadata?.wasAutomatic || ''},${e.metadata?.timeSpent || ''}`;
      })
    ].join('\n');

    return csv;
  } catch (error) {
    console.error('[Analytics] Erro ao exportar CSV:', error);
    return '';
  }
}

/**
 * Limpa dados antigos (mantém apenas últimos X dias)
 */
export function cleanOldData(daysToKeep: number = 90): void {
  try {
    const stored = localStorage.getItem('modal_analytics_events');
    if (!stored) return;

    const events: ModalAnalyticsEvent[] = JSON.parse(stored);
    const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);

    const recentEvents = events.filter(e => e.timestamp >= cutoff);
    localStorage.setItem('modal_analytics_events', JSON.stringify(recentEvents));

    console.log(`[Analytics] Limpeza concluída. Mantidos ${recentEvents.length} de ${events.length} eventos.`);
  } catch (error) {
    console.error('[Analytics] Erro ao limpar dados:', error);
  }
}

/**
 * Integração com Google Analytics
 */
function trackToGA(eventName: string, params: Record<string, any>): void {
  if (typeof window === 'undefined') return;

  try {
    // Google Analytics 4
    if (window.gtag) {
      window.gtag('event', eventName, {
        ...params,
        event_category: 'modal_interaction',
        timestamp: Date.now(),
      });
    }

    // Mixpanel (se disponível)
    if ((window as any).mixpanel) {
      (window as any).mixpanel.track(eventName, params);
    }
  } catch (error) {
    console.warn('[Analytics] Erro ao enviar para GA:', error);
  }
}

/**
 * Hook para React (opcional)
 */
export function useModalAnalytics(userId: string) {
  return {
    trackOpen: (modalType: ModalType, context?: ModalContext) =>
      trackModalOpen(userId, modalType, context),
    trackClose: (modalType: ModalType) =>
      trackModalClose(userId, modalType),
    trackMessage: (modalType: ModalType, message: string, context?: ModalContext) =>
      trackMessageSent(userId, modalType, message, context),
    trackDetection: (context: ModalContext, wasAccepted: boolean) =>
      trackDetection(userId, context, wasAccepted),
    getStats: (modalType?: ModalType) =>
      getModalStats(userId, modalType),
    getSummary: (periodDays?: number) =>
      getAnalyticsSummary(userId, periodDays),
    exportCSV: () =>
      exportToCSV(userId),
  };
}

// Auto-limpeza periódica (executar a cada 7 dias)
if (typeof window !== 'undefined') {
  const lastCleanup = localStorage.getItem('modal_analytics_last_cleanup');
  const now = Date.now();

  if (!lastCleanup || now - parseInt(lastCleanup) > 7 * 24 * 60 * 60 * 1000) {
    cleanOldData(90);
    localStorage.setItem('modal_analytics_last_cleanup', now.toString());
  }
}

// Type augmentation para window.gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
