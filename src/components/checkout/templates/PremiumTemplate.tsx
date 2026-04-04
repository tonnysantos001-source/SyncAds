/**
 * PremiumTemplate — Checkout Premium (Luxury)
 *
 * Layout: Two-column sem header (logo sutil no topo)
 * Cor:    Verde esmeralda #10B981 (botão com 🔒)
 * Fluxo:  Página única limpa — sem urgência visual agressiva
 * Unique: Countdown sutil (cinza claro), "BRL R$ 212,00", sem header
 *
 * @version 1.0
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck, Clock } from 'lucide-react';
import { checkoutMonitor } from '@/lib/checkoutMonitor';
import { CheckoutFooter } from '@/components/checkout/CheckoutFooter';
import { NoticeBar } from '@/components/checkout/NoticeBar';
import type { TemplateRenderProps } from '@/types/checkout.types';
import { MinimalStepCustomer } from './shared/steps/MinimalStepCustomer';
import { MinimalStepShipping } from './shared/steps/MinimalStepShipping';
import { MinimalStepPayment } from './shared/steps/MinimalStepPayment';
import { CheckoutSummaryPanel } from './shared/CheckoutSummaryPanel';

// ============================================================
// SUBTLE SCARCITY — inline, cinza claro (não full-width)
// ============================================================

const SubtleScarcityTimer: React.FC<{ theme: Record<string, unknown> }> = ({ theme }) => {
  const [timeLeft] = React.useState({ minutes: 14, seconds: 59 });
  const bgColor = (theme.scarcityBarBgColor as string) || '#f3f4f6';
  const textColor = (theme.scarcityBarTextColor as string) || '#374151';

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm max-w-fit mx-auto"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <Clock className="w-4 h-4" />
      <span>Reserva expira em</span>
      <span className="font-bold font-mono">
        {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
      </span>
    </div>
  );
};

// ============================================================
// MINIMAL SECURE HEADER
// ============================================================

const PremiumMinimalHeader: React.FC<{ theme: Record<string, unknown>; primaryColor: string }> = ({
  theme, primaryColor,
}) => (
  <div className="w-full py-3 px-6 flex items-center justify-between">
    <div className="text-sm font-medium text-gray-500">
      {(theme.storeName as string) || 'Checkout Seguro'}
    </div>
    <div className="flex items-center gap-1.5 text-xs text-gray-400">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
      Site Seguro
    </div>
  </div>
);

// ============================================================
// SITE SEGURO BADGE (dot green style)
// ============================================================

const SiteSeguroBadge: React.FC<{ primaryColor: string }> = ({ primaryColor }) => (
  <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-4">
    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />
    <ShieldCheck className="w-4 h-4" style={{ color: primaryColor }} />
    <span>Site Seguro</span>
  </div>
);

// ============================================================
// MAIN TEMPLATE
// ============================================================

const PremiumTemplate: React.FC<TemplateRenderProps> = ({
  orderId, checkoutData, theme, templateConfig, isPreview = false,
  onStepChange, onPaymentSuccess,
}) => {
  const primaryColor = (theme.primaryColor as string) || '#10B981';
  const scarcityEnabled = (theme.showCountdownTimer as boolean) !== false;
  const totalPrefix = (theme.totalPrefix as string) || 'BRL';

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: (theme.backgroundColor as string) || '#ffffff',
        fontFamily: (theme.fontFamily as string) || 'Inter, system-ui, sans-serif',
      }}
    >
      {(theme.noticeBarEnabled as boolean) && <NoticeBar theme={theme as any} />}

      {/* Header mínimo (sem logo proeminente) */}
      <PremiumMinimalHeader theme={theme} primaryColor={primaryColor} />

      {/* Subtle scarcity */}
      {scarcityEnabled && (
        <div className="flex justify-center py-2 px-4">
          <SubtleScarcityTimer theme={theme} />
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Left — formulário limpo */}
          <div className="flex-1 space-y-5">

            {/* Dados pessoais */}
            <div className="rounded-xl border bg-white p-5" style={{ borderColor: '#e5e7eb' }}>
              <h3 className="font-semibold text-gray-800 mb-1 text-sm">Informações de contato</h3>
              <p className="text-xs text-gray-500 mb-4">
                Preencha seus dados para finalizar o pedido
              </p>
              <MinimalStepCustomer
                theme={theme}
                isPreview={isPreview}
                onNext={() => checkoutMonitor.stepAdvance(2, templateConfig.slug, orderId)}
                primaryColor={primaryColor}
              />
            </div>

            {/* Entrega */}
            <div className="rounded-xl border bg-white p-5" style={{ borderColor: '#e5e7eb' }}>
              <h3 className="font-semibold text-gray-800 mb-4 text-sm">Endereço de entrega</h3>
              <MinimalStepShipping
                theme={theme}
                isPreview={isPreview}
                onNext={() => checkoutMonitor.stepAdvance(3, templateConfig.slug, orderId)}
                onBack={() => {}}
                primaryColor={primaryColor}
              />
            </div>

            {/* Pagamento — botão verde com cadeado */}
            <div className="rounded-xl border bg-white p-5" style={{ borderColor: '#e5e7eb' }}>
              <h3 className="font-semibold text-gray-800 mb-4 text-sm">Forma de pagamento</h3>
              <MinimalStepPayment
                theme={{
                  ...theme,
                  // Botão verde com ícone de cadeado
                  primaryColor,
                  buttonText: 'Finalizar Pedido',
                }}
                isPreview={isPreview}
                checkoutData={checkoutData}
                orderId={orderId}
                onBack={() => {}}
                onSuccess={onPaymentSuccess}
                primaryColor={primaryColor}
                templateSlug={templateConfig.slug}
              />
            </div>

          </div>

          {/* Right — resumo com prefixo BRL */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <CheckoutSummaryPanel
              checkoutData={checkoutData}
              theme={theme}
              isPreview={isPreview}
              totalPrefix={totalPrefix}
              totalColor={primaryColor}
              collapsibleOnMobile
            />

            {/* Site Seguro badge */}
            <SiteSeguroBadge primaryColor={primaryColor} />
          </div>

        </div>
      </div>

      <CheckoutFooter theme={theme as any} />
    </div>
  );
};

export default PremiumTemplate;
