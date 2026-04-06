/**
 * ConfiancaTemplate — Checkout Confiança
 *
 * Layout: 3 etapas progressivas, stepper HORIZONTAL sempre
 * Cor:    Lime green #8DC63F
 * Unique: Banner produto showcase, FAQ built-in, depoimentos c/ avatar,
 *         3-item benefits, sem countdown por padrão, "Dados pessoais"
 *
 * @version 1.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Check, Truck, Shield, Clock, Lock, ChevronRight, ChevronDown, ChevronUp,
  Star, ShoppingCart,
} from 'lucide-react';
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
// HEADER — Logo + badge verde
// ============================================================

const ConfiancaHeader: React.FC<{ theme: Record<string, unknown>; primaryColor: string; isMobile?: boolean }> = ({
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
// PRODUCT SHOWCASE BANNER — lime green com produto
// ============================================================

const ProductShowcaseBanner: React.FC<{ theme: Record<string, unknown>; primaryColor: string }> = ({
  theme, primaryColor,
}) => {
  const bannerImage = theme.bannerImage as string | undefined;

  return (
    <div
      className="w-full relative overflow-hidden"
      style={{
        backgroundColor: primaryColor,
        minHeight: '120px',
      }}
    >
      {bannerImage ? (
        <img src={bannerImage} alt="Banner" className="w-full object-cover" style={{ maxHeight: '200px' }} />
      ) : (
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          {/* Left text */}
          <div className="text-white">
            <div className="text-xs uppercase tracking-wider opacity-70 mb-1">Edição Especial</div>
            <h2 className="text-xl font-bold leading-snug">
              Revele sua beleza<br />
              <em>interior</em> e exterior.
            </h2>
            <button
              type="button"
              className="mt-3 flex items-center gap-2 bg-white text-sm font-semibold px-4 py-2 rounded-lg"
              style={{ color: primaryColor }}
            >
              <ShoppingCart className="w-4 h-4" />
              Compra segura.
            </button>
          </div>

          {/* Right — product boxes */}
          <div className="hidden sm:flex gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-20 h-20 rounded-xl flex items-center justify-center"
                style={{
                  border: `3px solid rgba(255,255,255,0.5)`,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                }}
              >
                <div className="text-3xl">🧴</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// HORIZONTAL STEPPER — sempre horizontal
// ============================================================

const HorizontalStepper: React.FC<{ currentStep: number; primaryColor: string }> = ({
  currentStep, primaryColor,
}) => {
  const steps = [
    { number: 1, label: 'Identificação' },
    { number: 2, label: 'Endereço' },
    { number: 3, label: 'Pagamento' },
  ];

  return (
    <div className="flex items-center justify-center gap-0 py-4 px-4 bg-white border-b border-gray-100">
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.number;
        const isActive    = currentStep === step.number;
        return (
          <React.Fragment key={step.number}>
            <div className="flex items-center gap-1.5">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: isCompleted || isActive ? primaryColor : '#e5e7eb',
                  color: isCompleted || isActive ? '#fff' : '#9ca3af',
                }}
              >
                {isCompleted ? <Check className="w-3 h-3" /> : step.number}
              </div>
              <span
                className="text-xs font-medium hidden sm:block"
                style={{ color: isActive ? '#111827' : '#9ca3af' }}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className="h-0.5 w-8 sm:w-16 mx-2 rounded-full transition-all duration-500"
                style={{ backgroundColor: currentStep > step.number ? primaryColor : '#e5e7eb' }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ============================================================
// BENEFITS — 3 itens
// ============================================================

const BenefitsCard: React.FC<{ primaryColor: string }> = ({ primaryColor }) => {
  const items = [
    { icon: Truck,   label: 'Frete Grátis',    desc: 'Para todo o Brasil em compras acima de R$ 189' },
    { icon: Shield,  label: 'Compra Segura',   desc: 'Seus dados de pagamento sempre seguros' },
    { icon: Clock,   label: 'Entrega Rápida',  desc: 'Enviamos em até 24 horas após a confirmação' },
  ];

  return (
    <div className="rounded-xl border bg-white p-4 space-y-3" style={{ borderColor: '#e5e7eb' }}>
      {items.map((item) => (
        <div key={item.label} className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <item.icon className="w-4 h-4" style={{ color: primaryColor }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{item.label}</p>
            <p className="text-xs text-gray-500">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// TESTIMONIALS WITH AVATAR
// ============================================================

const TestimonialsWithAvatar: React.FC<{ primaryColor: string }> = ({ primaryColor }) => {
  const reviews = [
    {
      name: 'Montana Lopez',
      text: 'Atendimento excelente e tudo chegou certinho. Recomendo!',
      rating: 5,
      initials: 'ML',
    },
    {
      name: 'Ana Paula',
      text: 'Produto de alta qualidade e entrega super rápida. Com certeza voltarei.',
      rating: 5,
      initials: 'AP',
    },
  ];

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div key={r.name} className="rounded-xl border bg-white p-4 flex items-start gap-3" style={{ borderColor: '#e5e7eb' }}>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}80)` }}
          >
            {r.initials}
          </div>
          <div>
            <div className="flex items-center gap-1 mb-1">
              {Array.from({ length: r.rating }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-sm text-gray-800">{r.text}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">{r.name}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// FAQ INTEGRADO
// ============================================================

const CheckoutFAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const items = [
    { q: 'Quais formas de pagamento são aceitas?', a: 'Aceitamos PIX, cartão de crédito (até 12x) e boleto bancário.' },
    { q: 'Posso parcelar minha compra?',            a: 'Sim! Parcele em até 12x no cartão de crédito sem juros.' },
    { q: 'Recebo confirmação após o pagamento?',   a: 'Sim, você receberá um e-mail de confirmação com todos os detalhes.' },
    { q: 'Qual o prazo de entrega?',               a: 'Entregamos em todo o Brasil entre 3 a 7 dias úteis após confirmação.' },
  ];

  return (
    <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: '#e5e7eb' }}>
      <div className="px-5 py-4 border-b" style={{ borderColor: '#e5e7eb' }}>
        <h3 className="font-semibold text-sm text-gray-800">Perguntas Frequentes</h3>
      </div>
      {items.map((item, i) => (
        <div key={i} className="border-b last:border-0" style={{ borderColor: '#f3f4f6' }}>
          <button
            type="button"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full px-5 py-3.5 flex items-center justify-between text-left text-sm text-gray-700"
          >
            {item.q}
            {openIndex === i
              ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
              : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
            }
          </button>
          <AnimatePresence>
            {openIndex === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="px-5 pb-4 text-sm text-gray-500">{item.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// SITE SEGURO FOOTER BADGE
// ============================================================

const GreenSiteSeguro: React.FC<{ primaryColor: string }> = ({ primaryColor }) => (
  <button
    type="button"
    className="flex items-center gap-2 px-4 py-2.5 rounded-full text-white text-sm font-semibold mx-auto mt-4"
    style={{ backgroundColor: primaryColor, border: 'none', cursor: 'default' }}
  >
    <Shield className="w-4 h-4" />
    Site Seguro
  </button>
);

// ============================================================
// MAIN TEMPLATE
// ============================================================

const ConfiancaTemplate: React.FC<TemplateRenderProps> = ({
  orderId, checkoutData, theme, templateConfig, isPreview = false,
  isMobile = false, onStepChange, onPaymentSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  const primaryColor    = (theme.primaryColor as string) || '#8DC63F';

  const handleAdvance = (toStep: number) => {
    setCurrentStep(toStep);
    onStepChange?.(toStep);
    checkoutMonitor.stepAdvance(toStep, templateConfig.slug, orderId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

      {/* Header lime */}
      <ConfiancaHeader theme={theme} primaryColor={primaryColor} isMobile={isMobile} />

      {/* Product Showcase Banner */}
      <ProductShowcaseBanner theme={theme} primaryColor={primaryColor} />

      {/* Horizontal Stepper */}
      <HorizontalStepper currentStep={currentStep} primaryColor={primaryColor} />

      {/* Content */}
      <div className={cn("max-w-7xl mx-auto", isMobile ? "p-0" : "px-4 py-6")}>
        <div className={cn("flex flex-col gap-6", isMobile ? "" : "lg:flex-row")}>

          {/* Left — etapas */}
          <div className="flex-1 space-y-4">

            {/* Etapa 1: Dados pessoais */}
            <AnimatePresence>
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border bg-white p-5"
                  style={{ borderColor: primaryColor, borderWidth: '2px' }}
                >
                  <MinimalStepCustomer
                    theme={{
                      ...theme,
                      formTitle: 'Dados pessoais',
                      formSubtitle: 'Utilizaremos seu e-mail para identificar seu perfil, histórico de compra, notificações de pedidos e carrinho de compras.',
                      buttonText: 'Ir para Entrega',
                    }}
                    isPreview={isPreview}
                    onNext={() => handleAdvance(2)}
                    primaryColor={primaryColor}
                  />

                  {/* FAQ below form */}
                  <div className="mt-6">
                    <CheckoutFAQ />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Etapa 2: Endereço */}
            <AnimatePresence>
              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border bg-white p-5"
                  style={{ borderColor: primaryColor, borderWidth: '2px' }}
                >
                  <MinimalStepShipping
                    theme={theme}
                    isPreview={isPreview}
                    onNext={() => handleAdvance(3)}
                    onBack={() => handleAdvance(1)}
                    primaryColor={primaryColor}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Etapa 3: Pagamento */}
            <AnimatePresence>
              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border bg-white p-5"
                  style={{ borderColor: primaryColor, borderWidth: '2px' }}
                >
                  <MinimalStepPayment
                    theme={theme}
                    isPreview={isPreview}
                    checkoutData={checkoutData}
                    orderId={orderId}
                    onBack={() => handleAdvance(2)}
                    onSuccess={onPaymentSuccess}
                    primaryColor={primaryColor}
                    templateSlug={templateConfig.slug}
                  />
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Right — resumo + trust elements */}
          <div className="w-full lg:w-80 flex-shrink-0 space-y-4">

            {/* Resumo */}
            <CheckoutSummaryPanel
              checkoutData={checkoutData}
              theme={theme}
              isPreview={isPreview}
              totalColor={primaryColor}
            />

            {/* Depoimentos com avatar */}
            <TestimonialsWithAvatar primaryColor={primaryColor} />

            {/* Benefits 3 itens */}
            <BenefitsCard primaryColor={primaryColor} />

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

export default ConfiancaTemplate;
