/**
 * MinimalTemplate — Checkout Minimalista (v2)
 *
 * Layout: 3 etapas progressivas bloqueadas (step-locking)
 * Design: Estilo Stripe/Shopify — clean, espaçado, profissional
 * Grid:   [1fr | 380px] com gap-6
 *
 * @version 2.0
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, User, Truck, CreditCard, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';
import { checkoutMonitor } from '@/lib/checkoutMonitor';
import { OrderBumpCard } from '@/components/checkout/OrderBumpCard';
import { NoticeBar } from '@/components/checkout/NoticeBar';
import PaymentMethodIcons from '@/components/checkout/PaymentMethodIcons';
import type { TemplateRenderProps } from '@/types/checkout.types';
import { MinimalStepCustomer } from './shared/steps/MinimalStepCustomer';
import { MinimalStepShipping } from './shared/steps/MinimalStepShipping';
import { MinimalStepPayment } from './shared/steps/MinimalStepPayment';
import { CheckoutSummaryPanel } from './shared/CheckoutSummaryPanel';

// ============================================================
// STEP WRAPPER (Corvex Style)
// ============================================================

interface MinimalStepWrapperProps {
  stepNumber: number;
  title: string;
  subtitle: string;
  isLocked: boolean;
  children?: React.ReactNode;
}

const MinimalStepWrapper: React.FC<MinimalStepWrapperProps> = ({
  stepNumber,
  title,
  subtitle,
  isLocked,
  children,
}) => {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #E5E7EB',
        padding: '24px',
        marginBottom: '24px',
        opacity: isLocked ? 0.4 : 1,
        pointerEvents: isLocked ? 'none' : 'auto',
        transition: 'opacity 0.3s ease',
      }}
    >
      <div style={{ marginBottom: isLocked ? '0' : '20px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isLocked ? '#8E8E8E' : '#111827',
              color: '#fff',
              borderRadius: '8px',
              width: '20px',
              height: '20px',
              fontSize: '10px',
              fontWeight: 'bold',
              marginRight: '8px',
            }}
          >
            {stepNumber}
          </span>
          {title}
        </h2>
        <p style={{ fontSize: '11px', color: '#8E8E8E', marginTop: '8px', lineHeight: '1.2' }}>
          {subtitle}
        </p>

        {isLocked && (
          <p style={{ fontSize: '14px', color: '#ef4444', marginTop: '16px' }}>
            Complete as etapas anteriores para prosseguir
          </p>
        )}
      </div>

      {!isLocked && children && <div>{children}</div>}
    </div>
  );
};

// ============================================================
// MINIMAL SCARCITY BAR (Strictly matched to Image 2)
// ============================================================
// MINIMAL SCARCITY BAR
// ============================================================
const MinimalScarcityBar = ({ theme, isPreview }: { theme: any; isPreview?: boolean }) => {
  const [timeLeft, setTimeLeft] = useState({ h: '00', m: '00', s: '00' });
  const [isExpired, setIsExpired] = useState(false);

  const expirationMinutes = theme.expirationTime || 15;

  const expirationTime = useMemo(() => {
    const storageKey = 'minimal_checkout_expiration_time';
    
    // If we're in preview mode, let's always restart the timer for visual feedback
    if (isPreview) {
      const pExpiration = new Date();
      pExpiration.setMinutes(pExpiration.getMinutes() + expirationMinutes);
      return pExpiration;
    }

    const stored = localStorage.getItem(storageKey);
    if (stored) return new Date(stored);

    const newExpiration = new Date();
    newExpiration.setMinutes(newExpiration.getMinutes() + expirationMinutes);
    localStorage.setItem(storageKey, newExpiration.toISOString());
    return newExpiration;
  }, [expirationMinutes, isPreview]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = expirationTime.getTime() - now;

      if (distance < 0) {
        setIsExpired(true);
        setTimeLeft({ h: '00', m: '00', s: '00' });
        clearInterval(timer);
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({
        h: hours.toString().padStart(2, '0'),
        m: minutes.toString().padStart(2, '0'),
        s: seconds.toString().padStart(2, '0')
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [expirationTime]);

  if (theme.useVisible === false || (isExpired && !isPreview)) return null;

  return (
    <div
      style={{
        backgroundColor: (theme?.scarcityBarBgColor as string) || '#0F172A',
        width: '100%',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: (theme?.scarcityBarTextColor as string) || '#ffffff',
        fontSize: '14px',
        fontWeight: '500',
      }}
    >
      Oferta termina em:
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
        <span style={{ fontWeight: '600', fontSize: '18px' }}>{timeLeft.h}</span>
        <span style={{ fontSize: '12px', marginRight: '6px' }}>h</span>
        <span style={{ fontSize: '16px' }}>:</span>
        <span style={{ fontWeight: '600', fontSize: '18px', marginLeft: '6px' }}>{timeLeft.m}</span>
        <span style={{ fontSize: '12px', marginRight: '6px' }}>m</span>
        <span style={{ fontSize: '16px' }}>:</span>
        <span style={{ fontWeight: '600', fontSize: '18px', marginLeft: '6px' }}>{timeLeft.s}</span>
        <span style={{ fontSize: '12px' }}>s</span>
      </div>
    </div>
  );
};

// ============================================================
// MOBILE COMPONENTS (Identical to Image 3)
// ============================================================

const MinimalMobileSteps = ({ currentStep, navSteps, isMobile }: { currentStep: number; navSteps: number; isMobile: boolean }) => {
  if (!isMobile) return null;
  const steps = [
    { id: 1, label: 'Identificação', icon: User },
    { id: 2, label: 'Entrega', icon: Truck },
    { id: 3, label: 'Pagamento', icon: CreditCard },
  ].filter(s => s.id <= (navSteps > 1 ? 3 : 2));

  return (
    <div style={{ display: 'flex' }} className="justify-around items-start py-6 mb-4 bg-white border-b border-gray-100 w-full">
      {steps.map((step) => {
        const isActive = currentStep === step.id;
        const Icon = step.icon;
        return (
          <div key={step.id} className="flex flex-col items-center gap-1.5 flex-1">
            <div 
              style={{
                backgroundColor: isActive ? '#0F172A' : '#F3F4F6',
                color: isActive ? '#FFFFFF' : '#9CA3AF'
              }}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm"
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span 
              style={{ color: isActive ? '#0F172A' : '#9CA3AF' }}
              className="text-[10px] font-bold uppercase tracking-tight text-center px-1"
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const MinimalMobileSummary = ({ productsCount, total, isOpen, onToggle, isMobile }: { productsCount: number; total: number; isOpen: boolean; onToggle: () => void; isMobile: boolean }) => {
  if (!isMobile) return null;
  const formatCurrency = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

  return (
    <div style={{ display: 'flex' }} className="w-full bg-white border-b border-t border-gray-100 mb-4 px-4 py-3.5 items-center justify-between cursor-pointer active:bg-gray-50 transition-colors" onClick={onToggle}>
      <div className="flex items-center gap-2.5">
        <ShoppingBag size={18} className="text-gray-400" />
        <span className="text-[13px] font-extrabold uppercase text-gray-900 tracking-wide">
          RESUMO ({productsCount})
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[16px] font-extrabold text-gray-900">
          {formatCurrency(total)}
        </span>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>
    </div>
  );
};

// ============================================================
// SOCIAL PROOF FAKE (Strictly Image 3 style)
// ============================================================

const MinimalFakeSocialProof = ({ theme, isMobileView = false }: { theme: any; isMobileView?: boolean }) => {
  const [purchases, setPurchases] = useState(() => {
    const initial = parseInt(theme.initialPurchases as string) || 324;
    return initial;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setPurchases(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        backgroundColor: '#0F172A',
        borderRadius: '12px',
        padding: '24px 20px',
        textAlign: 'center',
        marginBottom: isMobileView ? '24px' : '0',
        marginTop: isMobileView ? '0' : '20px',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <h3 style={{ color: '#F3F4F6', fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>
        Atenção
      </h3>
      <p style={{ color: '#9CA3AF', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
        Não perca essa oportunidade!
      </p>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
        <ShoppingBag size={22} className="text-[#4ade80]" />
        <motion.span
          key={purchases}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ duration: 0.5 }}
          style={{ 
            color: '#4ade80', 
            fontSize: '28px', 
            fontWeight: '900',
            letterSpacing: '-1px'
          }}
        >
          {purchases} Compras
        </motion.span>
      </div>
    </motion.div>
  );
};

// ============================================================
// MINIMAL FOOTER (Strictly matched to Image 2)
// ============================================================
const MinimalFooter = ({ theme, isMobile }: { theme?: any; isMobile?: boolean }) => (
  <footer
    style={{
      marginTop: 'auto',
      padding: '40px 24px 24px',
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '24px',
    }}
  >
    <div
      style={{
        width: '100%',
        maxWidth: '1280px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        paddingTop: '24px',
        borderTop: '1px solid #E5E7EB',
      }}
    >
        <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Formas de Pagamento
        </span>
        <PaymentMethodIcons
          variant="horizontal"
          methods={['visa', 'mastercard', 'elo', 'amex', 'discover', 'diners', 'aura', 'pix', 'boleto']}
          isMobile={isMobile}
        />
        <div 
          className="flex items-center gap-2.5 px-4 py-2 bg-[#F0FDF4] rounded-full border border-green-100 shadow-sm transition-all hover:scale-105"
        >
          <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-[11px] font-bold text-[#166534] tracking-tight uppercase">Site Seguro</span>
        </div>
    </div>
  </footer>
);

// ============================================================
// MAIN TEMPLATE
// ============================================================

const MinimalTemplate: React.FC<TemplateRenderProps> = ({
  orderId,
  checkoutData = { products: [], total: 0, subtotal: 0, shipping: 0 },
  theme,
  templateConfig,
  currentStep: currentStepProp,
  onStepChange,
  onPaymentSuccess,
  primaryColor: primaryColorProp,
  isMobile = false,
  isPreview = false,
  customization,
}) => {
  const [currentStep, setCurrentStep] = useState(currentStepProp || 1);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  
  const primaryColor    = primaryColorProp || (theme.primaryColor as string) || '#0B1320';
  const scarcityBgColor = (theme.scarcityBarBgColor as string) || '#0B1320';
  const navSteps        = (theme.navigationSteps as number) || 3;
  const storeName       = (theme.storeName as string) || 'Minha Loja';

  // Sync internal state if prop changes (rare but good for consistency)
  useEffect(() => {
    if (currentStepProp !== undefined) {
      setCurrentStep(currentStepProp);
    }
  }, [currentStepProp]);

  const handleStepAdvance = useCallback((toStep: number) => {
    setCurrentStep(toStep);
    onStepChange?.(toStep);
    checkoutMonitor.stepAdvance(toStep, templateConfig.slug, orderId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [orderId, templateConfig.slug, onStepChange]);

  const handleStepBack = useCallback((toStep: number) => {
    setCurrentStep(toStep);
    onStepChange?.(toStep);
    checkoutMonitor.stepBack(toStep, templateConfig.slug, orderId);
  }, [orderId, templateConfig.slug, onStepChange]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#0f172a',
        padding: '24px 12px 64px',
        fontFamily: (theme.fontFamily as string) || "'Rubik', 'Inter', system-ui, sans-serif",
      }}
    >
      <div 
        style={{ 
          width: '100%', 
          maxWidth: '1280px', 
          backgroundColor: '#ffffff', 
          borderRadius: '16px', 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
        }}
      >
        {/* Notice Bar inside card for consistent look */}
        {(theme.noticeBarEnabled as boolean) && (
          <NoticeBar theme={theme as any} />
        )}

      {/* ── HEADER ──────────────────────────────────────────── */}
      <div
        id="minimal-checkout-header"
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #E5E7EB',
          width: '100%',
          height: isMobile ? '85px' : '80px',
          paddingTop: isMobile ? '24px' : '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          zIndex: 50,
          position: 'relative'
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            width: '100%',
            height: '100%',
            margin: '0 auto',
            padding: isMobile ? '0 12px' : '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxSizing: 'border-box'
          }}
        >
          {/* Logo / Nome da loja */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-start',
              flex: 1
            }}
          >
            {(theme.logoUrl as string) ? (
              <img
                src={theme.logoUrl as string}
                alt={storeName}
                style={{ height: isMobile ? '32px' : '40px', objectFit: 'contain' }}
              />
            ) : (
              <span
                style={{
                  fontSize: isMobile ? '16px' : '22px',
                  fontWeight: '700',
                  color: '#111827',
                  letterSpacing: '-0.3px',
                }}
              >
                {storeName}
              </span>
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
      </div>

      {/* ── HEADER TIMER BAR NO TOPO ─────────────────────────────── */}
      {(theme.useVisible as boolean) && (
        <MinimalScarcityBar theme={theme} isPreview={isPreview} />
      )}

      {/* ── MOBILE EXCLUSIVE UI ──────────────────────────────────── */}
      <MinimalMobileSteps currentStep={currentStep} navSteps={navSteps} isMobile={isMobile || false} />
      
      <MinimalMobileSummary 
        productsCount={checkoutData.products?.length || 0}
        total={checkoutData.total || (isPreview ? 212.00 : 0)}
        isOpen={isSummaryExpanded}
        onToggle={() => setIsSummaryExpanded(!isSummaryExpanded)}
        isMobile={isMobile || false}
      />

      <AnimatePresence>
        {(isSummaryExpanded && isMobile) && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ width: '100%', padding: '0 16px', marginBottom: '24px', boxSizing: 'border-box' }}
            className="overflow-hidden"
          >
             <CheckoutSummaryPanel
                checkoutData={checkoutData}
                theme={theme}
                isPreview={isPreview}
              />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Social Proof Banner */}
      {isMobile && (
        <div style={{ width: '100%', padding: '0 16px', boxSizing: 'border-box' }}>
          <MinimalFakeSocialProof theme={theme} isMobileView={true} />
        </div>
      )}

      {/* ── CONTEÚDO PRINCIPAL ──────────────────────────────── ── */}
      <div
        style={{
          maxWidth: '1280px',
          width: '100%',
          margin: '0 auto',
          padding: isMobile ? '0' : '24px',
          paddingTop: isMobile ? '0' : '24px',
          paddingBottom: '80px',
          flex: 1,
          boxSizing: 'border-box'
        }}
      >
        <div className="checkout-grid h-full" style={{ display: isMobile ? 'flex' : 'grid' }}>
          {/* Coluna Principal — Dados e Pagamento */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="checkout-col-main">
            {/* ETAPA 1 — IDENTIFICAÇÃO */}
            <MinimalStepWrapper
              stepNumber={1}
              title="Identificação"
              subtitle="Pedimos apenas as informações essenciais para concluir sua compra com segurança."
              isLocked={currentStep < 1}
              isFullHeight={currentStep === 1}
            >
              {currentStep === 1 ? (
                <MinimalStepCustomer
                  theme={theme}
                  isPreview={isPreview}
                  onNext={() => handleStepAdvance(navSteps === 1 ? 3 : 2)}
                  primaryColor={primaryColor}
                />
              ) : (
                <div className="flex justify-between items-center py-2 text-sm text-gray-500 font-medium">
                  <span>Informações de contato salvas.</span>
                  <button onClick={() => setCurrentStep(1)} className="text-blue-600 hover:underline">Alterar</button>
                </div>
              )}
            </MinimalStepWrapper>

            {/* ETAPA 2 — ENTREGA (Só aparece se NavSteps > 1 e se a etapa 1 foi concluída ou se já é a etapa 2+) */}
            {navSteps > 1 && currentStep >= 2 && (
              <MinimalStepWrapper
                stepNumber={2}
                title="Entrega"
                subtitle="Para calcular o frete é necessário preencher todos os campos acima."
                isLocked={currentStep < 2}
                isFullHeight={currentStep === 2}
              >
                {currentStep === 2 ? (
                  <MinimalStepShipping
                    theme={theme}
                    isPreview={isPreview}
                    onNext={() => handleStepAdvance(3)}
                    onBack={() => handleStepBack(1)}
                    primaryColor={primaryColor}
                  />
                ) : (
                  <div className="flex justify-between items-center py-2 text-sm text-gray-500 font-medium">
                    <span>Endereço de entrega confirmado.</span>
                    <button onClick={() => setCurrentStep(2)} className="text-blue-600 hover:underline">Alterar</button>
                  </div>
                )}
              </MinimalStepWrapper>
            )}

            {/* ETAPA 3 — PAGAMENTO (Só aparece se estiver na etapa 3) */}
            {currentStep >= (navSteps > 1 ? 3 : 2) && (
              <MinimalStepWrapper
                stepNumber={navSteps > 1 ? 3 : 2}
                title="Pagamento"
                subtitle="Para finalizar seu pedido escolha uma forma de pagamento"
                isLocked={false}
                isFullHeight={currentStep === 3}
              >
                <MinimalStepPayment
                  theme={theme}
                  isPreview={isPreview}
                  checkoutData={checkoutData}
                  orderId={orderId}
                  onBack={() => handleStepBack(navSteps > 1 ? 2 : 1)}
                  onSuccess={onPaymentSuccess}
                  primaryColor={primaryColor}
                  templateSlug={templateConfig.slug}
                />
              </MinimalStepWrapper>
            )}
          </div>

          {/* Coluna Lateral — Resumo Fixo (Desktop) */}
          {!isMobile && (
            <div
              style={{ alignSelf: 'start', minWidth: '320px' }}
              className="checkout-col-summary"
            >
              <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #E5E7EB', backgroundColor: '#fff' }}>
                <CheckoutSummaryPanel
                  checkoutData={checkoutData}
                  theme={theme}
                  isPreview={isPreview}
                />
              </div>
              
              {/* SOCIAL PROOF FAKE */}
              <div style={{ marginTop: '20px' }}>
                <MinimalFakeSocialProof theme={theme} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <MinimalFooter theme={theme} isMobile={isMobile} />

      {/* ── ESTILOS RESPONSIVOS ──────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&display=swap');

           .checkout-grid {
             width: 100%;
             gap: 24px;
           }

          @media (max-width: 1023px) {
            .checkout-grid {
              display: flex;
              flex-direction: column;
            }
            .checkout-col-main {
              width: 100%;
              padding: 0;
            }
            .checkout-col-summary {
              display: none;
            }
          }

          @media (min-width: 1024px) {
            .checkout-grid {
              display: grid;
              grid-template-columns: 1fr 360px;
              align-items: start;
              gap: 24px;
            }
            .checkout-col-main {
              display: flex;
              flex-direction: column;
              gap: 24px;
              grid-column: 1;
            }
            .checkout-col-summary {
              display: block;
              position: sticky;
              top: 24px;
              grid-column: 2;
            }
          }
      `}</style>
      </div>
    </div>
  );
};

export default MinimalTemplate;
