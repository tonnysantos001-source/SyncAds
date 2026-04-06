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
import { cn } from '@/lib/utils';
import { Lock, ShieldCheck, Clock } from 'lucide-react';
import { checkoutMonitor } from '@/lib/checkoutMonitor';
import { CheckoutFooter } from '@/components/checkout/CheckoutFooter';
import { NoticeBar } from '@/components/checkout/NoticeBar';
import PaymentMethodIcons from '@/components/checkout/PaymentMethodIcons';
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

const PremiumHeader: React.FC<{ theme: Record<string, unknown>; isMobile?: boolean }> = ({
  theme, isMobile,
}) => (
  <div className={cn("w-full px-4 flex items-center justify-between bg-white border-b border-gray-100", isMobile ? "h-[85px] pt-6" : "h-20 lg:px-8")}>
    <div className="flex items-center">
      {(theme.logoUrl as string) ? (
        <img src={theme.logoUrl as string} alt="Logo" className={cn("object-contain", isMobile ? "h-8" : "h-9")} />
      ) : (
        <div className="font-extrabold text-gray-900 text-lg">
          {(theme.storeName as string) || 'Minha Loja'}
        </div>
      )}
    </div>
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50">
        <Lock className="w-4 h-4 text-green-500 fill-current" />
      </div>
      <div className="flex flex-col items-start leading-[1.1]">
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Pagamento</span>
        <span className="text-[10px] font-bold text-gray-900 uppercase tracking-tight">100% Seguro</span>
      </div>
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
  isMobile = false, onStepChange, onPaymentSuccess,
}) => {
  const primaryColor = (theme.primaryColor as string) || '#10B981';
  const scarcityEnabled = (theme.showCountdownTimer as boolean) !== false;
  const totalPrefix = (theme.totalPrefix as string) || 'BRL';

  return (
    <div
      className={cn("min-h-screen flex flex-col items-center", isMobile ? "pt-8 pb-16 px-4" : "p-4 lg:p-6")}
      style={{
        backgroundColor: '#0f172a', // Consistent Slate-900 background
        fontFamily: (theme.fontFamily as string) || 'Inter, system-ui, sans-serif',
      }}
    >
      <div 
        className="w-full max-w-7xl bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ minHeight: isMobile ? 'calc(100vh - 32px)' : 'auto' }}
      >
        {(theme.noticeBarEnabled as boolean) && <NoticeBar theme={theme as any} />}

      {/* Header mínimo (sem logo proeminente) */}
      <PremiumHeader theme={theme} isMobile={isMobile} />

      {/* Subtle scarcity */}
      {scarcityEnabled && (
        <div className="flex justify-center py-2 px-4">
          <SubtleScarcityTimer theme={theme} />
        </div>
      )}

      {/* Content */}
      <div className={cn("max-w-7xl mx-auto", isMobile ? "p-0" : "px-4 py-4")}>
        <div className={cn("flex flex-col gap-6", isMobile ? "" : "lg:flex-row")}>

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


          </div>

        </div>
      </div>

      <footer className="w-full max-w-7xl mx-auto px-4 py-10 mt-6 border-t border-gray-100 bg-white rounded-b-2xl">
        <div className="flex flex-col items-center gap-8">
          <div className="w-full flex flex-col items-center gap-4">
            <p className="text-sm font-semibold tracking-wide uppercase opacity-30 text-gray-500">
              Formas de Pagamento
            </p>
            <PaymentMethodIcons 
              isMobile={isMobile}
              className="justify-center"
              methods={['visa', 'mastercard', 'elo', 'amex', 'discover', 'diners', 'aura', 'pix', 'boleto']}
            />
          </div>

          <div className="flex justify-center">
            <div className="flex items-center gap-2.5 px-4 py-2 bg-[#F0FDF4] rounded-full border border-green-100 shadow-sm transition-all hover:scale-105">
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[11px] font-bold text-[#166534] tracking-tight uppercase">Site Seguro</span>
            </div>
          </div>
        </div>
      </footer>

      <CheckoutFooter theme={theme as any} />
      </div>
    </div>
  );
};

export default PremiumTemplate;
