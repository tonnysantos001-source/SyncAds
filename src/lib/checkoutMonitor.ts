/**
 * checkoutMonitor — Sistema de Monitoramento do Checkout
 *
 * Rastreia eventos críticos do checkout em produção.
 * Preparado para integração futura com Sentry / Datadog.
 *
 * Uso:
 *   import { checkoutMonitor } from '@/lib/checkoutMonitor';
 *   checkoutMonitor.log({ type: 'TEMPLATE_LOAD', templateSlug: 'minimal' });
 *
 * @version 1.0
 */

import type { CheckoutMonitorEvent, CheckoutMonitorEventType } from '@/types/checkout.types';

// ============================================================
// SESSION ID — identifica esta sessão de checkout
// ============================================================

const generateSessionId = (): string => {
  return `ckout_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};

let _sessionId: string | null = null;

const getSessionId = (): string => {
  if (!_sessionId) {
    _sessionId = generateSessionId();
  }
  return _sessionId;
};

// ============================================================
// SENTRY INTEGRATION STUB
// Pronto para ativar quando @sentry/react for instalado:
//   import * as Sentry from '@sentry/react';
//   Sentry.captureEvent({ message, level, extra });
// ============================================================

const sendToSentry = (event: CheckoutMonitorEvent): void => {
  // TODO: Descomentar quando Sentry estiver integrado
  // if (typeof window !== 'undefined' && (window as any).Sentry) {
  //   (window as any).Sentry.addBreadcrumb({
  //     category: 'checkout',
  //     message: event.type,
  //     level: isErrorEvent(event.type) ? 'error' : 'info',
  //     data: event,
  //   });
  //   if (isErrorEvent(event.type)) {
  //     (window as any).Sentry.captureMessage(`[Checkout] ${event.type}`, 'error');
  //   }
  // }
};

// ============================================================
// SUPABASE LOGGING STUB
// Os eventos críticos podem ser salvos no banco futuramente:
//   INSERT INTO checkout_monitor_events (...)
// ============================================================

const sendToSupabase = async (_event: CheckoutMonitorEvent): Promise<void> => {
  // TODO: salvar eventos críticos no Supabase quando necessário
  // const { supabase } = await import('@/lib/supabase');
  // if (isCriticalEvent(event.type)) {
  //   await supabase.from('checkout_monitor_events').insert(event);
  // }
};

// ============================================================
// HELPERS
// ============================================================

const ERROR_EVENT_TYPES: CheckoutMonitorEventType[] = [
  'TEMPLATE_LOAD_ERROR',
  'TEMPLATE_DISABLED',
  'TEMPLATE_FALLBACK',
  'TEMPLATE_NOT_FOUND',
  'TEMPLATE_VERSION_MISMATCH',
  'PAYMENT_ERROR',
];

const isErrorEvent = (type: CheckoutMonitorEventType): boolean =>
  ERROR_EVENT_TYPES.includes(type);

const formatEvent = (event: CheckoutMonitorEvent): string => {
  const ts = new Date(event.timestamp).toISOString();
  const templateRef = event.templateSlug
    ? `${event.templateSlug}@${event.templateVersion ?? 1}`
    : 'unknown';
  return `[Checkout][${ts}] ${event.type} | template=${templateRef}${
    event.orderId ? ` | order=${event.orderId}` : ''
  }${event.fallbackSlug ? ` | fallback=${event.fallbackSlug}` : ''}`;
};

// ============================================================
// MONITOR — API pública
// ============================================================

class CheckoutMonitor {
  private isDev: boolean;

  constructor() {
    this.isDev = import.meta.env.DEV === true;
  }

  /**
   * Registra um evento de checkout.
   * Em produção: envia para Sentry (quando configurado).
   * Em dev: exibe no console com formatação.
   */
  log(partialEvent: Omit<CheckoutMonitorEvent, 'timestamp' | 'sessionId'>): void {
    const event: CheckoutMonitorEvent = {
      ...partialEvent,
      timestamp: Date.now(),
      sessionId: getSessionId(),
    };

    // Console sempre (dev=verbose, prod=erros apenas)
    if (this.isDev) {
      if (isErrorEvent(event.type)) {
        console.error(`🚨 ${formatEvent(event)}`, event.metadata ?? '');
      } else {
        console.log(`📦 ${formatEvent(event)}`, event.metadata ?? '');
      }
    } else if (isErrorEvent(event.type)) {
      console.error(`[checkout-monitor] ${event.type}`, {
        template: event.templateSlug,
        version: event.templateVersion,
        order: event.orderId,
        fallback: event.fallbackSlug,
      });
    }

    // Sentry (stub)
    sendToSentry(event);

    // Supabase (async, não bloqueia)
    sendToSupabase(event).catch(() => {
      // Silencia erros de logging — nunca deve quebrar o checkout
    });
  }

  // -------- Helpers de conveniência --------

  templateLoaded(slug: string, version: number, orderId?: string): void {
    this.log({ type: 'TEMPLATE_LOAD', templateSlug: slug, templateVersion: version, orderId });
  }

  templateLoadError(slug: string, version: number, error?: unknown, orderId?: string): void {
    this.log({
      type: 'TEMPLATE_LOAD_ERROR',
      templateSlug: slug,
      templateVersion: version,
      orderId,
      metadata: { error: String(error) },
    });
  }

  templateDisabled(slug: string, version: number, fallbackSlug: string, orderId?: string): void {
    this.log({
      type: 'TEMPLATE_DISABLED',
      templateSlug: slug,
      templateVersion: version,
      fallbackSlug,
      orderId,
    });
  }

  templateFallback(
    requestedSlug: string,
    requestedVersion: number,
    fallbackSlug: string,
    reason: string,
    orderId?: string,
  ): void {
    this.log({
      type: 'TEMPLATE_FALLBACK',
      templateSlug: requestedSlug,
      templateVersion: requestedVersion,
      fallbackSlug,
      orderId,
      metadata: { reason },
    });
  }

  templateNotFound(slug: string, version: number, fallbackSlug: string, orderId?: string): void {
    this.log({
      type: 'TEMPLATE_NOT_FOUND',
      templateSlug: slug,
      templateVersion: version,
      fallbackSlug,
      orderId,
    });
  }

  stepAdvance(step: number, templateSlug: string, orderId?: string): void {
    this.log({ type: 'STEP_ADVANCE', step, templateSlug, orderId });
  }

  stepBack(step: number, templateSlug: string, orderId?: string): void {
    this.log({ type: 'STEP_BACK', step, templateSlug, orderId });
  }

  paymentAttempt(method: string, templateSlug: string, orderId?: string): void {
    this.log({
      type: 'PAYMENT_ATTEMPT',
      templateSlug,
      orderId,
      metadata: { method },
    });
  }

  paymentSuccess(method: string, templateSlug: string, orderId?: string): void {
    this.log({
      type: 'PAYMENT_SUCCESS',
      templateSlug,
      orderId,
      metadata: { method },
    });
  }

  paymentError(method: string, error: string, templateSlug: string, orderId?: string): void {
    this.log({
      type: 'PAYMENT_ERROR',
      templateSlug,
      orderId,
      metadata: { method, error },
    });
  }

  orderBumpAdded(bumpId: string, templateSlug: string, orderId?: string): void {
    this.log({
      type: 'ORDER_BUMP_ADDED',
      templateSlug,
      orderId,
      metadata: { bumpId },
    });
  }

  couponApplied(code: string, templateSlug: string, orderId?: string): void {
    this.log({
      type: 'COUPON_APPLIED',
      templateSlug,
      orderId,
      metadata: { code },
    });
  }
}

// Singleton (um por app)
export const checkoutMonitor = new CheckoutMonitor();
