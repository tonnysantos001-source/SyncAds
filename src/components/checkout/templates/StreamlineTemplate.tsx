/**
 * StreamlineTemplate — Checkout Streamline (Black Friday / Split-stepper)
 *
 * Layout: SPLIT — Esquerda: step 1+2 (dados+entrega) | Direita: step 3 (pagamento) SEMPRE visível
 * Cor:    Vermelho #E60000
 * Unique: Hero banner Black Friday, benefits card persistente, visual de cartão,
 *         completed step summary (read-only), depoimentos no mobile
 *
 * @version 1.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Check, ChevronLeft, ChevronRight, Lock, ShieldCheck,
  Truck, Zap, CreditCard, Star, Package,
} from 'lucide-react';
import { checkoutMonitor } from '@/lib/checkoutMonitor';
import { ScarcityTimer } from '@/components/checkout/ScarcityTimer';
import { CheckoutFooter } from '@/components/checkout/CheckoutFooter';
import { NoticeBar } from '@/components/checkout/NoticeBar';
import PaymentMethodIcons from '@/components/checkout/PaymentMethodIcons';
import type { TemplateRenderProps } from '@/types/checkout.types';
import { MinimalStepCustomer } from './shared/steps/MinimalStepCustomer';
import { MinimalStepShipping } from './shared/steps/MinimalStepShipping';
import { MinimalStepPayment } from './shared/steps/MinimalStepPayment';
import { CheckoutSummaryPanel } from './shared/CheckoutSummaryPanel';

// ============================================================
// HEADER — Streamline (logo + badge vermelho)
// ============================================================

const StreamlineHeader: React.FC<{ theme: Record<string, unknown>; primaryColor: string; isMobile?: boolean }> = ({
  theme, primaryColor, isMobile,
}) => (
  <div className={cn("w-full px-4 flex items-center justify-between border-b border-gray-100 bg-white", isMobile ? "h-[85px] pt-6" : "h-20 lg:px-8")}>
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
// HERO BANNER — Black Friday style
// ============================================================

const HeroBanner: React.FC<{ theme: Record<string, unknown>; primaryColor: string }> = ({
  theme, primaryColor,
}) => {
  const bannerImage = theme.bannerImage as string | undefined;

  return (
    <div
      className="w-full relative overflow-hidden"
      style={{
        backgroundColor: primaryColor,
        minHeight: '100px',
      }}
    >
      {bannerImage ? (
        <img src={bannerImage} alt="Banner" className="w-full object-cover" style={{ maxHeight: '160px' }} />
      ) : (
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-white">
            <div className="text-xs uppercase tracking-wider opacity-70 mb-1">Oferta Especial</div>
            <h2 className="text-2xl font-black leading-tight">
              Black Friday 🔥<br />
              <span className="text-yellow-300">Até 70% OFF</span>
            </h2>
          </div>
          <div className="flex items-center gap-3 text-white">
            <div className="text-center">
              <div className="font-black text-3xl text-yellow-300">70%</div>
              <div className="text-xs opacity-70">de desconto</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// SCARCITY — vermelho
// ============================================================

const RedScarcityBar: React.FC<{ theme: Record<string, unknown>; primaryColor: string }> = ({
  theme, primaryColor,
}) => (
  <div
    className="w-full py-2.5 text-white text-center text-sm font-semibold"
    style={{ backgroundColor: primaryColor }}
  >
    <ScarcityTimer theme={theme as any} />
  </div>
);

// ============================================================
// BENEFITS CARD — 2 itens (persistente)
// ============================================================

const StreamlineBenefitsCard: React.FC<{ primaryColor: string }> = ({ primaryColor }) => (
  <div
    className="rounded-xl border p-4 flex gap-4"
    style={{ borderColor: '#e5e7eb', backgroundColor: '#fff8f8' }}
  >
    <div className="flex items-center gap-2 text-sm">
      <Truck className="w-4 h-4" style={{ color: primaryColor }} />
      <span className="font-medium text-gray-700">Frete Grátis</span>
    </div>
    <div className="w-px bg-gray-200" />
    <div className="flex items-center gap-2 text-sm">
      <Zap className="w-4 h-4" style={{ color: primaryColor }} />
      <span className="font-medium text-gray-700">Entrega Rápida</span>
    </div>
  </div>
);

// ============================================================
// COMPLETED STEP SUMMARY (read-only)
// ============================================================

const CompletedStepSummary: React.FC<{
  step: 1 | 2;
  primaryColor: string;
  onClick: () => void;
}> = ({ step, primaryColor, onClick }) => {
  const labels = {
    1: { title: 'Identificação', desc: 'maria@email.com • (11) 99999-9999' },
    2: { title: 'Entrega',        desc: 'Rua Exemplo, 123 — São Paulo, SP' },
  };
  const info = labels[step];

  return (
    <div
      className="rounded-xl border bg-white p-4 flex items-center justify-between cursor-pointer"
      style={{ borderColor: primaryColor, borderWidth: '1.5px' }}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ backgroundColor: primaryColor }}
        >
          <Check className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{info.title}</p>
          <p className="text-xs text-gray-500">{info.desc}</p>
        </div>
      </div>
      <button type="button" className="text-xs font-medium" style={{ color: primaryColor }}>
        Editar
      </button>
    </div>
  );
};

// ============================================================
// CREDIT CARD VISUAL
// ============================================================

const CardVisual: React.FC<{ primaryColor: string }> = ({ primaryColor }) => (
  <div
    className="rounded-2xl p-5 text-white shadow-lg"
    style={{
      background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}99)`,
      aspectRatio: '1.6',
      maxWidth: '280px',
      width: '100%',
    }}
  >
    <div className="flex justify-between items-start mb-6">
      <CreditCard className="w-8 h-8 opacity-80" />
      <div className="text-xs opacity-60 uppercase tracking-wider">Cartão</div>
    </div>
    <div className="font-mono text-sm tracking-widest opacity-80">
      •••• •••• •••• ••••
    </div>
    <div className="flex justify-between items-end mt-4">
      <div>
        <div className="text-xs opacity-60">Titular</div>
        <div className="text-sm font-semibold">NOME DO TITULAR</div>
      </div>
      <div>
        <div className="text-xs opacity-60">Validade</div>
        <div className="text-sm font-mono">MM/AA</div>
      </div>
    </div>
  </div>
);

// ============================================================
// MAIN TEMPLATE — Split Stepper
// ============================================================

type StreamlineStep = 1 | 2;

const StreamlineTemplate: React.FC<TemplateRenderProps> = ({
  orderId, checkoutData, theme, templateConfig, isPreview = false,
  isMobile = false, onStepChange, onPaymentSuccess,
}) => {
  const [leftStep, setLeftStep] = useState<StreamlineStep>(1);

  const primaryColor = (theme.primaryColor as string) || '#E60000';
  const scarcityEnabled = (theme.showCountdownTimer as boolean) !== false;
  const heroBannerEnabled = (theme.heroBannerEnabled as boolean) !== false;

  const handleStepChange = (step: StreamlineStep) => {
    setLeftStep(step);
    onStepChange?.(step);
    checkoutMonitor.stepAdvance(step, templateConfig.slug, orderId);
  };

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
        <StreamlineHeader theme={theme} primaryColor={primaryColor} isMobile={isMobile} />

      {/* Hero banner */}
      {heroBannerEnabled && <HeroBanner theme={theme} primaryColor={primaryColor} />}

      {/* Scarcity */}
      {scarcityEnabled && <RedScarcityBar theme={theme} primaryColor={primaryColor} />}

      {/* Content — SPLIT */}
      <div className={cn("max-w-7xl mx-auto", isMobile ? "p-0" : "px-4 py-6")}>
        <div className={cn("flex flex-col gap-6", isMobile ? "" : "lg:flex-row")}>

          {/* LEFT — step 1+2 */}
          <div className="flex-1 space-y-4">

            {/* Completed step 1 */}
            {leftStep === 2 && (
              <CompletedStepSummary step={1} primaryColor={primaryColor} onClick={() => handleStepChange(1)} />
            )}

            {/* Step 1 ativo */}
            <AnimatePresence>
              {leftStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border bg-white p-5"
                  style={{ borderColor: primaryColor, borderWidth: '2px' }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      1
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm">Identificação</h3>
                  </div>

                  <MinimalStepCustomer
                    theme={theme}
                    isPreview={isPreview}
                    onNext={() => handleStepChange(2)}
                    primaryColor={primaryColor}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 2 ativo */}
            <AnimatePresence>
              {leftStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border bg-white p-5"
                  style={{ borderColor: primaryColor, borderWidth: '2px' }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      2
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm">Endereço de Entrega</h3>
                  </div>

                  <MinimalStepShipping
                    theme={theme}
                    isPreview={isPreview}
                    onNext={() => checkoutMonitor.stepAdvance(3, templateConfig.slug, orderId)}
                    onBack={() => handleStepChange(1)}
                    primaryColor={primaryColor}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Benefits persistente */}
            <StreamlineBenefitsCard primaryColor={primaryColor} />

          </div>

          {/* RIGHT — Pagamento + Resumo (sempre visível) */}
          <div className="w-full lg:w-96 flex-shrink-0 space-y-4">

            {/* Resumo */}
            <CheckoutSummaryPanel
              checkoutData={checkoutData}
              theme={theme}
              isPreview={isPreview}
              totalColor={primaryColor}
            />

            {/* Cartão visual */}
            {(theme.cardVisualEnabled as boolean) && (
              <div className="flex justify-center">
                <CardVisual primaryColor={primaryColor} />
              </div>
            )}

            {/* Pagamento — sempre visível */}
            <div className="rounded-xl border bg-white p-5" style={{ borderColor: '#e5e7eb' }}>
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  3
                </div>
                <h3 className="font-semibold text-gray-800 text-sm">Pagamento</h3>
              </div>

              <MinimalStepPayment
                theme={theme}
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

export default StreamlineTemplate;
