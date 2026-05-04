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
  Truck, Shield, Clock, Lock, ChevronDown,
  Star, ShoppingCart,
} from 'lucide-react';
import { checkoutMonitor } from '@/lib/checkoutMonitor';
import { CheckoutFooter } from '@/components/checkout/CheckoutFooter';
import { NoticeBar } from '@/components/checkout/NoticeBar';
import PaymentMethodIcons from '@/components/checkout/PaymentMethodIcons';
import type { TemplateRenderProps } from '@/types/checkout.types';
import type { CheckoutConfig } from '@/types/checkout-config.types';
import { MinimalStepCustomer } from './shared/steps/MinimalStepCustomer';
import { MinimalStepShipping } from './shared/steps/MinimalStepShipping';
import { MinimalStepPayment } from './shared/steps/MinimalStepPayment';
import { CheckoutSummaryPanel } from './shared/CheckoutSummaryPanel';

// ============================================================
// HEADER — Logo + badge verde
// ============================================================

const ConfiancaHeader: React.FC<{
  storeName: string;
  logoUrl: string | null;
  primaryColor: string;
  isMobile?: boolean;
}> = ({ storeName, logoUrl, primaryColor, isMobile }) => (
  <header className="bg-white border-b sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" style={{ width: '120px', height: '50px', objectFit: 'contain' }} />
        ) : (
          <div className="font-bold text-gray-900 text-xl tracking-tight">
            {storeName}
          </div>
        )}
      </div>

      {/* Security Badge - White style from reference */}
      <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] bg-white border border-gray-100 shadow-sm">
        <div className="flex items-center">
          <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <div className="flex flex-col leading-tight" style={{ gap: '1px' }}>
          <span className="text-[0.75rem] font-bold tracking-wider leading-tight text-gray-900">PAGAMENTO</span>
          <span className="text-[0.75rem] font-medium tracking-wider leading-tight text-gray-600">100% SEGURO</span>
        </div>
      </div>
    </div>
  </header>
);

const ProductShowcaseBanner: React.FC<{ theme: Record<string, unknown>; primaryColor: string }> = ({
  theme, primaryColor,
}) => {
  const bannerImage = theme.bannerImage as string | undefined;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pt-6">
      <div 
        className="w-full relative overflow-hidden rounded-[16px] shadow-sm border border-gray-100"
        style={{ minHeight: '180px', backgroundColor: bannerImage ? 'transparent' : `${primaryColor}10` }}
      >
        {bannerImage ? (
          <img src={bannerImage} alt="Banner" className="w-full object-cover" style={{ height: '350px' }} />
        ) : (
          <div className="w-full p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 bg-gradient-to-br from-white to-gray-50/50">
            <div className="max-w-md text-left space-y-4">
              <div className="inline-flex px-3 py-1 rounded-full bg-green-100/50 text-green-700 text-[10px] font-bold uppercase tracking-wider">
                Edição Especial
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-[1.1]">
                Revele sua beleza <br />
                <span style={{ color: primaryColor }}>interior</span> e exterior.
              </h2>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <ShoppingCart className="w-4 h-4" />
                <span>Compra segura com entrega garantida</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center bg-white shadow-md border border-gray-100 transition-transform hover:scale-105"
                >
                  <div className="text-4xl">🧴</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
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
    { label: 'Identificação', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> },
    { label: 'Endereço',      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle></svg> },
    { label: 'Pagamento',     icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="20" height="14" x="2" y="5" rx="2"></rect><line x1="2" x2="22" y1="10" y2="10"></line></svg> },
  ];

  return (
    <nav className="w-full py-6 bg-white border-b border-gray-100 flex items-center justify-center px-4 font-nunito">
      <ol className="flex items-center w-full max-w-lg justify-between relative">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isActive    = currentStep === stepNumber;
          
          return (
            <li key={index} className="flex flex-col items-center relative z-10 flex-1">
              <div 
                className="w-7 h-7 rounded-[12px] flex items-center justify-center transition-all duration-300 border-2"
                style={{
                  backgroundColor: 'white',
                  borderColor: isActive || isCompleted ? primaryColor : '#E5E7EB',
                  color: isActive || isCompleted ? primaryColor : '#9CA3AF',
                }}
              >
                {step.icon}
              </div>
              <span 
                className={cn(
                  "mt-2 text-[11px] font-medium transition-colors duration-200",
                  isActive || isCompleted ? "text-gray-900" : "text-gray-500"
                )}
                style={{ color: isActive || isCompleted ? primaryColor : undefined }}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

// ============================================================
// BENEFITS — 3 itens
// ============================================================

const BenefitsCard: React.FC<{ primaryColor: string }> = ({ primaryColor }) => {
  const items = [
    { 
      icon: <Truck className="w-5 h-5" style={{ color: primaryColor }} />, 
      label: 'Frete Grátis',    
      desc: 'Para todo o Brasil em compras acima de R$ 199' 
    },
    { 
      icon: <Shield className="w-5 h-5" style={{ color: primaryColor }} />,  
      label: 'Compra Segura',   
      desc: 'Seus dados protegidos e pagamento seguro' 
    },
    { 
      icon: <Clock className="w-5 h-5" style={{ color: primaryColor }} />,   
      label: 'Entrega Rápida',  
      desc: 'Enviamos em até 24 horas após a confirmação' 
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-start gap-4 group">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-50 group-hover:bg-white transition-colors"
          >
            {item.icon}
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">{item.label}</h4>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{item.desc}</p>
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
      name: 'Mariana Lopes',
      text: 'Atendimento excelente e tudo chegou perfeito. Recomendo!',
      rating: 5,
      avatar: 'https://images.pexels.com/photos/29616387/pexels-photo-29616387.jpeg',
    },
    {
      name: 'Ana Paula',
      text: 'Produtos de ótima qualidade e entrega super rápida. Amei!',
      rating: 5,
      avatar: 'https://images.pexels.com/photos/35391664/pexels-photo-35391664.jpeg',
    },
  ];

  return (
    <div className="bg-white rounded-[16px] p-4 sm:p-6 shadow-sm border border-gray-100">
      <div className="space-y-6">
        {reviews.map((r, idx) => (
          <div key={idx} className="space-y-3">
            <div className="flex items-start gap-3">
              <img src={r.avatar} alt={r.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-0.5 mb-1">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <h4 className="text-[16px] font-semibold text-gray-900 mb-1">{r.name}</h4>
                <p className="text-[14px] text-gray-600 leading-normal">{r.text}</p>
              </div>
            </div>
            {idx < reviews.length - 1 && <div className="border-t border-dotted border-gray-200 mt-0 pt-0" />}
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// FAQ INTEGRADO
// ============================================================

const CheckoutFAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const items = [
    { q: 'Quais formas de pagamento são aceitas?', a: 'Aceitamos cartão de crédito, Pix e boleto bancário.' },
    { q: 'Posso parcelar minha compra?',            a: 'Sim, o parcelamento está disponível no cartão de crédito (conforme condições exibidas no checkout).' },
    { q: 'Recebo confirmação após o pagamento?',   a: 'Sim, você receberá a confirmação por e-mail e/ou WhatsApp.' },
    { q: 'Qual o prazo de entrega?',               a: 'O prazo varia conforme sua região e aparece antes de finalizar o pedido.' },
  ];

  return (
    <div className="bg-white rounded-[16px] border border-gray-100 overflow-hidden">
      <div className="px-6 py-6 border-b border-gray-100/50">
        <h3 className="text-lg font-medium text-gray-900">Perguntas Frequentes</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {items.map((item, i) => (
          <div key={i}>
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full px-6 py-4 flex items-center justify-between text-left group transition-all"
              style={{ gap: '1rem' }}
            >
              <span className="text-sm font-medium text-gray-900">{item.q}</span>
              <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform duration-300", openIndex === i && "rotate-180")} />
            </button>
            <AnimatePresence>
              {openIndex === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-gray-50/30"
                >
                  <p className="px-6 pb-4 text-sm text-gray-500 leading-relaxed font-normal">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
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
  orderId, checkoutData, theme, checkoutConfig, templateConfig, isPreview = false,
  isMobile = false, onStepChange, onPaymentSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  // Prioriza config tipada; fallback para theme legado
  const primaryColor =
    checkoutConfig?.buttons.primaryBg ??
    (theme.primaryColor as string) ??
    '#8DC63F';
  const storeName = checkoutConfig?.header.storeName ?? (theme.storeName as string) ?? 'Minha Loja';
  const logoUrl   = checkoutConfig?.header.logoUrl   ?? (theme.logoUrl as string | null) ?? null;
  const fontFamily =
    checkoutConfig?.typography.fontFamily ??
    (theme.fontFamily as string) ??
    'Nunito, system-ui, sans-serif';
  const noticeBarEnabled =
    checkoutConfig?.noticeBar.enabled ??
    (theme.noticeBarEnabled as boolean) ??
    false;

  const handleAdvance = (toStep: number) => {
    setCurrentStep(toStep);
    onStepChange?.(toStep);
    checkoutMonitor.stepAdvance(toStep, templateConfig.slug, orderId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className={cn('min-h-screen w-full flex flex-col items-center overflow-visible', isMobile ? 'px-0 pb-20' : 'p-4 lg:p-8 pb-32')}
      style={{
        backgroundColor: `${primaryColor}1A`,
        fontFamily,
      }}
    >
      <div className="w-full max-w-[1280px] bg-white rounded-2xl shadow-2xl shadow-black/5 flex flex-col border border-gray-100">
        {noticeBarEnabled && <NoticeBar theme={theme as Record<string, unknown>} />}

        {/* Header lime */}
        <ConfiancaHeader
          storeName={storeName}
          logoUrl={logoUrl}
          primaryColor={primaryColor}
          isMobile={isMobile}
        />

        {/* Product Showcase Banner */}
        <ProductShowcaseBanner theme={theme} primaryColor={primaryColor} />

        {/* Horizontal Stepper */}
        <HorizontalStepper currentStep={currentStep} primaryColor={primaryColor} />

        {/* Content */}
        <div className={cn("max-w-[1280px] mx-auto w-full", isMobile ? "p-4" : "px-8 py-10")}>
          <div className={cn("grid grid-cols-1 gap-10", isMobile ? "" : "lg:grid-cols-[1fr_400px]")}>

            {/* Left — etapas */}
            <div className="space-y-6">

              {/* Etapa 1: Dados pessoais */}
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-8"
                  >
                    <div className="bg-gray-50/50 rounded-3xl p-6 sm:p-8 border border-gray-100/50">
                      <MinimalStepCustomer
                        theme={{
                          ...theme,
                          formTitle: 'Dados pessoais',
                          formSubtitle: 'Utilizaremos seu e-mail para identificar seu perfil e histórico de compra.',
                          buttonText: 'Ir para Entrega',
                        }}
                        isPreview={isPreview}
                        onNext={() => handleAdvance(2)}
                        primaryColor={primaryColor}
                      />
                    </div>

                    {/* FAQ below form */}
                    <div className="pt-4">
                      <CheckoutFAQ />
                    </div>
                  </motion.div>
                )}

                {/* Etapa 2: Endereço */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="bg-gray-50/50 rounded-3xl p-6 sm:p-8 border border-gray-100/50"
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

                {/* Etapa 3: Pagamento */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="bg-gray-50/50 rounded-3xl p-6 sm:p-8 border border-gray-100/50"
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
            <div className="space-y-6">
              <div className="sticky top-28 space-y-6">
                {/* Resumo */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <CheckoutSummaryPanel
                    checkoutData={checkoutData}
                    theme={theme}
                    isPreview={isPreview}
                    totalColor={primaryColor}
                  />
                </div>

                {/* Depoimentos com avatar */}
                <TestimonialsWithAvatar primaryColor={primaryColor} />

                {/* Benefits 3 itens */}
                <BenefitsCard primaryColor={primaryColor} />
              </div>
            </div>

          </div>
        </div>

        {/* Standardized Payment Footer */}
        <footer className="w-full bg-white border-t border-gray-100 py-12 px-8 font-nunito">
          <div className="max-w-7xl mx-auto flex flex-col items-center gap-10">
            <div className="space-y-6 w-full flex flex-col items-center">
              <p className="text-center text-sm font-medium text-gray-500">
                Formas de Pagamento
              </p>
              <div className="flex flex-wrap justify-center items-center gap-3">
                <PaymentMethodIcons 
                  isMobile={isMobile}
                  className="justify-center grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                  methods={['visa', 'mastercard', 'elo', 'amex', 'pix', 'boleto']}
                />
              </div>
            </div>

            <div className="flex justify-center items-center gap-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-[#97e00d] rounded-full" style={{ backgroundColor: primaryColor }}>
                <div className="w-2 h-2 rounded-full bg-white/40 animate-pulse" />
                <span className="text-sm font-bold text-white uppercase tracking-tight">Site Seguro</span>
              </div>
            </div>
          </div>
        </footer>

        <CheckoutFooter theme={theme as Record<string, unknown>} />
      </div>
    </div>
  );
};

export default ConfiancaTemplate;
