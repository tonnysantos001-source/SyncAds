/**
 * TikTokTemplate — Checkout Estilo TikTok / TokVex
 *
 * Layout: Dois colunas com PAGAMENTO na coluna DIREITA
 * Cor:    Pink/Magenta gradient #E91E8C → #FF4559
 * Fluxo:  Página única — dados + entrega à esq, pagamento à dir
 * Unique: Apple Pay simulado, endereço colapsável no mobile
 *
 * @version 1.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Lock, ShieldCheck, ChevronDown, ChevronUp, Smartphone } from 'lucide-react';
import { checkoutMonitor } from '@/lib/checkoutMonitor';
import { ScarcityTimer } from '@/components/checkout/ScarcityTimer';
import { CheckoutFooter } from '@/components/checkout/CheckoutFooter';
import { NoticeBar } from '@/components/checkout/NoticeBar';
import PaymentMethodIcons from '@/components/checkout/PaymentMethodIcons';
import type { TemplateRenderProps } from '@/types/checkout.types';
import { MinimalStepCustomer } from './shared/steps/MinimalStepCustomer';
import { MinimalStepShipping } from './shared/steps/MinimalStepShipping';
import { CheckoutSummaryPanel } from './shared/CheckoutSummaryPanel';
import { MinimalStepPayment } from './shared/steps/MinimalStepPayment';

// ============================================================
// HEADER TikTok-style (minimal, clean)
// ============================================================

const TikTokHeader: React.FC<{ theme: Record<string, unknown>; gradient: string; isMobile?: boolean }> = ({
  theme, gradient, isMobile
}) => (
  <div className={cn("w-full px-4 flex items-center justify-between bg-white border-b border-gray-100", isMobile ? "h-[85px] pt-6" : "h-20 lg:px-6")}>
    {(theme.logoUrl as string) ? (
      <img src={theme.logoUrl as string} alt="Logo" className="h-8 object-contain" />
    ) : (
      <div className="font-bold text-gray-800 text-lg">
        {(theme.storeName as string) || 'Minha Loja'}
      </div>
    )}
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
// SCARCITY BAR - gradient pink
// ============================================================

const PinkScarcityBar: React.FC<{ theme: Record<string, unknown> }> = ({ theme }) => (
  <div
    className="w-full py-2.5 text-white text-center text-sm font-semibold"
    style={{
      background: (theme.scarcityBarBgGradient as string)
        || 'linear-gradient(135deg, #E91E8C, #FF4559)',
    }}
  >
    <ScarcityTimer theme={theme as any} />
  </div>
);

// ============================================================
// APPLE PAY BUTTON (simulado — visual only)
// ============================================================

const ApplePayButton: React.FC = () => (
  <button
    type="button"
    className="w-full py-3 rounded-full bg-black text-white font-semibold text-sm flex items-center justify-center gap-2 mb-3"
    style={{ cursor: 'pointer' }}
  >
    🍎 Pagar com Apple Pay
  </button>
);

// ============================================================
// COLLAPSIBLE ADDRESS (mobile)
// ============================================================

const CollapsibleAddress: React.FC<{
  theme: Record<string, unknown>;
  primaryColor: string;
  isPreview: boolean;
}> = ({ theme, primaryColor, isPreview }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center justify-between text-left"
      >
        <span className="font-semibold text-sm text-gray-800">Endereço de entrega</span>
        {open
          ? <ChevronUp className="w-4 h-4 text-gray-400" />
          : <ChevronDown className="w-4 h-4 text-gray-400" />
        }
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              <MinimalStepShipping
                theme={theme}
                isPreview={isPreview}
                onNext={() => setOpen(false)}
                onBack={() => setOpen(false)}
                primaryColor={primaryColor}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================
// MAIN TEMPLATE
// ============================================================

const TikTokTemplate: React.FC<TemplateRenderProps> = ({
  orderId, checkoutData, theme, templateConfig, isPreview = false,
  isMobile = false, onStepChange, onPaymentSuccess,
}) => {
  const primaryColor = (theme.primaryColor as string) || '#E91E8C';
  const gradient = (theme.buttonGradient as string) || 'linear-gradient(135deg, #E91E8C, #FF4559)';
  const scarcityEnabled = (theme.showCountdownTimer as boolean) !== false;

  return (
    <div
      className={cn("min-h-screen flex flex-col items-center", isMobile ? "pt-8 pb-16 px-4" : "p-4 lg:p-6")}
      style={{
        backgroundColor: '#0f172a',
        fontFamily: (theme.fontFamily as string) || 'Inter, system-ui, sans-serif',
      }}
    >
      <div 
        className="w-full max-w-7xl bg-white rounded-2xl overflow-hidden shadow-lg flex flex-col"
        style={{ minHeight: isMobile ? 'calc(100vh - 32px)' : 'auto' }}
      >
        {(theme.noticeBarEnabled as boolean) && <NoticeBar theme={theme as any} />}
      <TikTokHeader theme={theme} gradient={gradient} isMobile={isMobile} />
      {scarcityEnabled && <PinkScarcityBar theme={theme} />}

      <div className={cn("max-w-7xl mx-auto", isMobile ? "p-0" : "px-4 py-6")}>
        {/* TikTok: LEFT = dados/entrega, RIGHT = pagamento + resumo */}
        <div className={cn("flex flex-col gap-6", isMobile ? "" : "lg:flex-row")}>

          {/* LEFT COLUMN */}
          <div className="flex-1 space-y-4">

            {/* Dados pessoais */}
            <div className="rounded-xl border bg-white shadow-sm p-5">
              <h3 className="font-semibold text-sm text-gray-800 mb-4">
                Informações de contato
              </h3>
              <MinimalStepCustomer
                theme={theme}
                isPreview={isPreview}
                onNext={() => checkoutMonitor.stepAdvance(2, templateConfig.slug, orderId)}
                primaryColor={primaryColor}
              />
            </div>

            {/* Endereço colapsável */}
            <CollapsibleAddress
              theme={theme}
              primaryColor={primaryColor}
              isPreview={isPreview}
            />

            {/* CPF separado */}
            <div className="rounded-xl border bg-white shadow-sm p-5">
              <h3 className="font-semibold text-sm text-gray-800 mb-4">CPF do titular</h3>
              <input
                style={{
                  width: '100%', height: '48px', padding: '0 12px',
                  borderRadius: (theme.inputBorderRadius as string) || '6px',
                  border: `1px solid ${(theme.inputBorderColor as string) || '#d1d5db'}`,
                  fontSize: '14px', outline: 'none',
                }}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>

          </div>

          {/* RIGHT COLUMN — Pagamento + Resumo */}
          <div className="w-full lg:w-96 flex-shrink-0 space-y-4">

            {/* Resumo */}
            <CheckoutSummaryPanel
              checkoutData={checkoutData}
              theme={theme}
              isPreview={isPreview}
              totalColor={primaryColor}
            />

            {/* Apple Pay */}
            {(theme.applePayEnabled as boolean) && <ApplePayButton />}

            {/* Pagamento */}
            <div className="rounded-xl border bg-white shadow-sm p-5">
              <h3 className="font-semibold text-sm text-gray-800 mb-4">Forma de pagamento</h3>

              {/* Botão com gradiente pink + valor */}
              <MinimalStepPayment
                theme={{
                  ...theme,
                  buttonGradient: gradient,
                  primaryColor,
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
        </div>
      </div>

      {/* Standardized Payment Footer */}
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

export default TikTokTemplate;
