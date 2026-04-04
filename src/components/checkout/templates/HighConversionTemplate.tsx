/**
 * HighConversionTemplate — Checkout Alto Impacto v5
 * Replicado fielmente do HTML de referência fornecido pelo usuário.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle, Loader2, Package, Minus, Plus } from 'lucide-react';
import { checkoutMonitor } from '@/lib/checkoutMonitor';
import type { TemplateRenderProps } from '@/types/checkout.types';
import { formatPhone } from '@/lib/utils/phoneUtils';
import { formatCpf } from '@/lib/utils/cpfUtils';
import { formatCep, searchCep } from '@/lib/utils/cepUtils';
import {
  validateNameDebounced,
  validateEmailDebounced,
  capitalizeWords,
} from '@/lib/utils/validationUtils';

// ── DROP ZONE (fiel ao HTML de referência) ──────────────────
// classe original: "relative group min-h-[60px] rounded-lg border-2 border-dashed
//   transition-all duration-200 border-gray-200/50 hover:border-gray-300/50 hover:bg-gray-50/80"

const DropZone: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div
    className="relative group min-h-[60px] rounded-lg border-2 border-dashed transition-all duration-200 border-gray-200/50 hover:border-gray-300/50 hover:bg-gray-50/80"
  >
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100/50 transition-all duration-200">
        <span className="w-2 h-2 rounded-full bg-gray-400/70" />
        <p className="text-sm font-medium text-gray-400/90">Solte aqui</p>
      </div>
    </div>
    <div className="flex flex-col gap-4">{children}</div>
  </div>
);

// ── COUNTDOWN ───────────────────────────────────────────────

const Countdown: React.FC<{ primaryColor: string }> = ({ primaryColor }) => {
  const [time, setTime] = useState({ h: 0, m: 8, s: 13 });

  const expTime = useMemo(() => {
    const KEY = 'ck_high_v5_exp';
    const s = localStorage.getItem(KEY);
    if (s) return new Date(s);
    const d = new Date();
    d.setMinutes(d.getMinutes() + 10);
    localStorage.setItem(KEY, d.toISOString());
    return d;
  }, []);

  useEffect(() => {
    const tick = () => {
      const diff = expTime.getTime() - Date.now();
      if (diff <= 0) { setTime({ h: 0, m: 0, s: 0 }); return; }
      setTime({ h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expTime]);

  const pad = (n: number) => String(n).padStart(2, '0');

  // Replica exatamente o bloco do countdown do HTML
  return (
    <div className="w-full">
      <div
        className="relative group rounded-lg border-2 border-dashed transition-all duration-200 border-gray-200/50 hover:border-gray-300/50 hover:bg-gray-50/80"
      >
        <div className="flex flex-col gap-4">
          <div className="group w-full transition-all duration-200" style={{ opacity: 1 }}>
            <div className="flex-1">
              <div className="relative group">
                <div
                  className="relative w-full py-2 px-4 flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'rgb(6, 112, 198)', borderRadius: '16px' }}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium" style={{ color: 'rgb(255,255,255)' }}>Oferta termina em:</span>
                    <div className="flex items-center gap-2 ml-2">
                      <div className="flex items-center">
                        <span className="font-bold" style={{ fontSize: '24px', color: 'rgb(255,255,255)' }}>{pad(time.h)}</span>
                        <span className="text-xs ml-1" style={{ color: 'rgb(255,255,255)' }}>h</span>
                      </div>
                      <span style={{ color: 'rgb(255,255,255)' }}>:</span>
                      <div className="flex items-center">
                        <span className="font-bold" style={{ fontSize: '24px', color: 'rgb(255,255,255)' }}>{pad(time.m)}</span>
                        <span className="text-xs ml-1" style={{ color: 'rgb(255,255,255)' }}>m</span>
                      </div>
                      <span style={{ color: 'rgb(255,255,255)' }}>:</span>
                      <div className="flex items-center">
                        <span className="font-bold" style={{ fontSize: '24px', color: 'rgb(255,255,255)' }}>{pad(time.s)}</span>
                        <span className="text-xs ml-1" style={{ color: 'rgb(255,255,255)' }}>s</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── INPUT STYLE (fiel ao HTML) ──────────────────────────────

const inputStyle: React.CSSProperties = {
  padding: '13.5px 11px',
  fontSize: '13px',
  borderRadius: '9999px',
  backgroundColor: 'rgb(255,255,255)',
  border: '1.5px solid rgb(222,222,222)',
  color: 'rgb(34,34,34)',
  height: 'auto',
  transition: '0.2s',
  width: '100%',
  fontWeight: 400,
  fontFamily: '"Proxima Nova", sans-serif',
  outline: 'none',
  boxSizing: 'border-box' as const,
  display: 'block',
};

// ── PREVIEW DATA ────────────────────────────────────────────

const PREV_PRODUCTS = [{ id: '1', name: 'Produto Exemplo', price: 197, quantity: 1, image: '' }];
const PREV_BRINDE   = { name: 'Body oil anti-cellulite', label: 'Grátis', image: 'https://images.pexels.com/photos/6621461/pexels-photo-6621461.jpeg?auto=compress&cs=tinysrgb&w=150' };

// ════════════════════════════════════════════════════════════
// TEMPLATE PRINCIPAL
// ════════════════════════════════════════════════════════════

const HighConversionTemplate: React.FC<TemplateRenderProps> = ({
  orderId, checkoutData, theme, templateConfig, isPreview = false,
  onStepChange, onPaymentSuccess,
}) => {
  const primary = (theme.primaryColor as string) || '#0082ec';

  // form state
  const [email, setEmail]         = useState('');
  const [name, setName]           = useState('');
  const [phone, setPhone]         = useState('');
  const [document, setDocument]   = useState('');
  const [emailValid, setEmailValid] = useState<null|boolean>(null);
  const [nameValid, setNameValid]   = useState<null|boolean>(null);

  const [cep, setCep]             = useState('');
  const [street, setStreet]       = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [complement, setComplement] = useState('');
  const [number, setNumber]       = useState('');
  const [city, setCity]           = useState('');
  const [state, setState]         = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepFound, setCepFound]   = useState(false);

  const [method, setMethod]       = useState<'PIX'|'CREDIT_CARD'|'BOLETO'>('PIX');
  const [processing, setProcessing] = useState(false);
  const [coupon, setCoupon]       = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  // Accordion Step State
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // data
  const products  = checkoutData?.products ?? (isPreview ? PREV_PRODUCTS : []);
  const subtotal  = checkoutData?.subtotal ?? (isPreview ? 197 : 0);
  const shipping  = checkoutData?.shipping ?? (isPreview ? 15  : 0);
  const discount  = checkoutData?.discount ?? 0;
  const total     = checkoutData?.total    ?? (isPreview ? 212 : 0);
  const brinde    = (checkoutData as any)?.brinde ?? (isPreview ? PREV_BRINDE : null);

  const bannerSrc     = (theme.bannerImage as string) || (theme.bannerImageUrl as string) || '';
  const bannerEnabled = !!(theme.bannerEnabled && bannerSrc);
  const showTimer     = (theme.showCountdownTimer as boolean) !== false;

  const fmt = (v: number) =>
    `R$\u00A0${v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

  const handleCep = async (val: string) => {
    const f = formatCep(val); setCep(f); setCepFound(false);
    if (f.replace(/\D/g,'').length === 8) {
      setLoadingCep(true);
      try {
        const r = await searchCep(f.replace(/\D/g,''));
        if (r) {
          setStreet(r.street || r.logradouro || '');
          setNeighborhood(r.neighborhood || r.bairro || '');
          setCity(r.city || r.localidade || '');
          setState(r.state || r.uf || '');
          setCepFound(true);
        }
      } catch {}
      finally { setLoadingCep(false); }
    }
  };

  const finalize = async () => {
    if (isPreview) { onPaymentSuccess?.(orderId || 'preview'); return; }
    setProcessing(true);
    checkoutMonitor.paymentAttempt(method, templateConfig.slug, orderId);
    try {
      await new Promise(r => setTimeout(r, 1200));
      checkoutMonitor.paymentSuccess(method, templateConfig.slug, orderId);
      onPaymentSuccess?.(orderId || '');
    } catch(e) {
      checkoutMonitor.paymentError(method, String(e), templateConfig.slug, orderId);
    } finally { setProcessing(false); }
  };

  const onfocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = primary;
    e.currentTarget.style.boxShadow = `0 0 0 1px ${primary}40`;
  };
  const onblur = (e: React.FocusEvent<HTMLInputElement>, col?: string) => {
    e.currentTarget.style.borderColor = col || 'rgb(222,222,222)';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div
      className="min-h-screen flex flex-col w-full min-w-0 overflow-x-hidden font-sans relative"
      style={{
        backgroundColor: (theme.backgroundColor as string) || '#FFFFFF',
        fontFamily: '"Proxima Nova", "Proxima Nova", sans-serif',
      }}
    >

      {/* ════ HEADER ════ */}
      <header className="border-b" style={{ backgroundColor: primary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 relative">
            <div className="flex items-center gap-3">
              {(theme.logoUrl as string)
                ? <img src={theme.logoUrl as string} alt="Logo" className="h-8 object-contain" />
                : <span className="text-xl font-bold" style={{ color: 'rgb(255,255,255)', fontSize: '18px' }}>{(theme.storeName as string) || 'Minha Loja'}</span>
              }
            </div>
            <div
              className="flex items-center gap-2"
              style={{ padding: '4px 8px', borderRadius: '4px', color: 'rgb(255,255,255)', fontSize: '0.875rem', fontWeight: 500, backgroundColor: 'rgb(0,130,236)' }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgb(34,197,94)' }} />
              <span>Pagamento 100% seguro</span>
            </div>
          </div>
        </div>
      </header>

      {/* ════ MAIN ════ */}
      <main className="flex-1 flex items-center min-w-0 overflow-x-hidden">
        <div className="w-full min-w-0 max-w-full overflow-x-hidden">
          <div className="flex flex-col min-w-[100%] w-full" style={{ fontFamily: '"Proxima Nova", sans-serif', height: 'fit-content' }}>

            {/* ── TIMER ── */}
            {showTimer && (
              <div className="w-full">
                <Countdown primaryColor={primary} />
              </div>
            )}

            {/* ── 2 COLUNAS ── */}
            <div className="flex-1 w-full min-w-0" style={{ height: 'fit-content', paddingTop: '0px' }}>
              <div className="mt-0 w-full min-w-0 gap-0 grid grid-cols-[1fr_auto_1fr]">

                {/* ════ COLUNA ESQUERDA ════ */}
                <div className="min-w-0 w-full pt-6 pb-6 px-[38px] flex justify-end">
                  <div className="w-full min-w-0 space-y-4 max-w-[503px]">

                    {/* slot topo esquerda */}
                    <DropZone />

                    {/* ── 1. Informações de contato ── */}
                    <div className="rounded-md mt-4 mb-4" style={{ borderRadius: '16px', borderColor: 'rgb(229,231,235)' }}>
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="w-full flex items-center justify-between text-left mb-3 group"
                      >
                        <h2 className="mb-1 flex items-center gap-3 transition-colors" style={{ fontWeight: 500, fontSize: '21px', marginTop: 0, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif', textTransform: 'none', color: currentStep === 1 ? primary : 'rgb(107,114,128)' }}>
                          <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: currentStep === 1 ? primary : 'rgb(209,213,219)' }}>1</span>
                          Informações de contato
                        </h2>
                        {currentStep > 1 && <span className="text-sm font-semibold text-gray-500 underline">Alterar</span>}
                      </button>
                      
                      {currentStep === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          {/* email */}
                          <div>
                            <input
                              className="flex h-12 rounded-lg border border-gray-200 bg-white px-4 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50 w-full"
                              placeholder="Email"
                              type="email"
                              value={email}
                              style={inputStyle}
                              onChange={e => { const v = e.target.value.toLowerCase().trim(); setEmail(v); validateEmailDebounced(v, r => setEmailValid(r?.isValid ?? null)); }}
                              onFocus={onfocus}
                              onBlur={e => onblur(e)}
                            />
                          </div>
                          {/* nome */}
                          <div>
                            <input
                              className="flex h-12 rounded-lg border border-gray-200 bg-white px-4 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50 w-full"
                              placeholder="Nome completo"
                              value={name}
                              style={inputStyle}
                              onChange={e => { const v = capitalizeWords(e.target.value); setName(v); validateNameDebounced(v, r => setNameValid(r?.isValid ?? null)); }}
                              onFocus={onfocus}
                              onBlur={e => onblur(e)}
                            />
                          </div>
                          {/* doc/telefone */}
                          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr] gap-3">
                            <input
                              className="flex h-12 rounded-lg border border-gray-200 bg-white px-4 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50 w-full"
                              placeholder="CPF/CNPJ"
                              value={document}
                              style={inputStyle}
                              onChange={e => setDocument(formatCpf(e.target.value))}
                              onFocus={onfocus}
                              onBlur={e => onblur(e)}
                            />
                            <input
                              className="flex h-12 rounded-lg border border-gray-200 bg-white px-4 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50 w-full"
                              placeholder="Celular/WhatsApp"
                              value={phone}
                              style={inputStyle}
                              onChange={e => setPhone(formatPhone(e.target.value))}
                              onFocus={onfocus}
                              onBlur={e => onblur(e)}
                            />
                          </div>
                          <button
                            onClick={() => setCurrentStep(2)}
                            className="w-full h-12 rounded-full text-white font-bold text-sm flex items-center justify-center transition-all hover:opacity-90 mt-2"
                            style={{ backgroundColor: primary }}
                          >
                            Continuar para entrega
                          </button>
                        </div>
                      )}
                    </div>

                    {/* ── Slot de banner ── */}
                    {bannerEnabled && (
                      <div className="relative group rounded-lg border-2 border-dashed transition-all duration-200 border-gray-200/50 hover:border-gray-300/50 hover:bg-gray-50/80">
                        <div className="flex flex-col gap-4">
                          <div className="group w-full transition-all duration-200" style={{ opacity: 1 }}>
                            <div className="flex-1">
                              <div className="relative group">
                                <div className="relative w-full" style={{ textAlign: 'center' }}>
                                  <img src={bannerSrc} alt="Banner da loja" style={{ width: '100%', height: '195px', objectFit: 'cover', borderRadius: '16px' }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── 2. Endereço de entrega ── */}
                    <div className="rounded-md mt-4 mb-4" style={{ borderRadius: '16px', borderColor: 'rgb(229,231,235)' }}>
                      <button
                        onClick={() => currentStep >= 2 && setCurrentStep(2)}
                        className={`w-full flex items-center justify-between text-left mb-3 group ${currentStep < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={currentStep < 2}
                      >
                        <h2 className="mb-1 flex items-center gap-3 transition-colors" style={{ fontWeight: 500, fontSize: '21px', marginTop: 0, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif', textTransform: 'none', color: currentStep === 2 ? primary : 'rgb(107,114,128)' }}>
                          <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: currentStep >= 2 ? primary : 'rgb(209,213,219)' }}>2</span>
                          Endereço de entrega
                        </h2>
                        {currentStep > 2 && <span className="text-sm font-semibold text-gray-500 underline">Alterar</span>}
                      </button>
                      
                      {currentStep === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="relative">
                            <input
                              className="flex h-12 rounded-lg border border-gray-200 bg-white px-4 text-sm outline-none w-full"
                              inputMode="numeric"
                              placeholder="CEP"
                              type="text"
                              value={cep}
                              style={cepFound ? { ...inputStyle, borderColor: '#16a34a' } : inputStyle}
                              maxLength={9}
                              onChange={e => handleCep(e.target.value)}
                              onFocus={onfocus}
                              onBlur={e => onblur(e, cepFound ? '#16a34a' : undefined)}
                            />
                            {loadingCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}
                            {cepFound && !loadingCep && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />}
                          </div>
                          {[
                            { ph: 'Rua', val: street, set: setStreet },
                            { ph: 'Bairro', val: neighborhood, set: setNeighborhood },
                            { ph: 'Complemento', val: complement, set: setComplement },
                            { ph: 'Número', val: number, set: setNumber },
                            { ph: 'Cidade', val: city, set: setCity },
                            { ph: 'Estado', val: state, set: (v: string) => setState(v.toUpperCase()), extra: { maxLength: 2 } },
                          ].map(({ ph, val, set, extra }) => (
                            <div key={ph} className="relative">
                              <input
                                className="flex h-12 rounded-lg border border-gray-200 bg-white px-4 text-sm outline-none w-full"
                                placeholder={ph}
                                value={val}
                                style={inputStyle}
                                onChange={e => (set as (v: string) => void)(e.target.value)}
                                onFocus={onfocus}
                                onBlur={e => onblur(e)}
                                {...(extra || {})}
                              />
                            </div>
                          ))}
                          <button
                            onClick={() => setCurrentStep(3)}
                            className="w-full h-12 rounded-full text-white font-bold text-sm flex items-center justify-center transition-all hover:opacity-90 mt-2"
                            style={{ backgroundColor: primary }}
                          >
                            Continuar para pagamento
                          </button>
                        </div>
                      )}
                    </div>

                    {/* ── 3. Pagamento ── */}
                    <div className="rounded-md mt-4 mb-4" style={{ borderRadius: '16px', borderColor: 'rgb(229,231,235)' }}>
                      <button
                        onClick={() => currentStep >= 3 && setCurrentStep(3)}
                        className={`w-full flex items-center justify-between text-left mb-3 group ${currentStep < 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={currentStep < 3}
                      >
                        <h2 className="mb-1 flex items-center gap-3 transition-colors" style={{ fontWeight: 500, fontSize: '21px', marginTop: 0, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif', textTransform: 'none', color: currentStep === 3 ? primary : 'rgb(107,114,128)' }}>
                          <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: currentStep >= 3 ? primary : 'rgb(209,213,219)' }}>3</span>
                          Pagamento
                        </h2>
                      </button>

                      {currentStep === 3 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          {/* Opções de pagamento */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-1.5 justify-end w-full mb-1">
                              <span className="text-xs text-gray-500 font-medium mr-1 tracking-tight">CARTÕES ACEITOS</span>
                              {['amex','visa','mastercard','elo','discover'].map(brand => (
                                <img key={brand} src={`/icones-pay/card-${brand}.svg`} alt={brand} className="h-4 flex-shrink-0" />
                              ))}
                            </div>

                            {/* PIX */}
                            <div
                              className="border rounded-lg overflow-hidden cursor-pointer"
                              style={{
                                borderColor: method === 'PIX' ? primary : 'rgb(229,231,235)',
                                backgroundColor: method === 'PIX' ? `${primary}08` : 'rgb(249,250,251)',
                              }}
                              onClick={() => setMethod('PIX')}
                            >
                              <div className="flex items-center justify-between p-4 transition-colors" style={{ backgroundColor: 'transparent' }}>
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div
                                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                                    style={{ borderColor: method === 'PIX' ? primary : 'rgb(209,213,219)' }}
                                  >
                                    {method === 'PIX' && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primary }} />}
                                  </div>
                                  <div className="flex flex-col flex-1 min-w-0">
                                    <span className="font-semibold text-sm text-gray-900 inline-flex items-center gap-2">
                                      Pix <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Aprovação Imediata</span>
                                    </span>
                                    <span className="text-xs text-gray-500 leading-tight">Ganhe 5% de desconto</span>
                                  </div>
                                </div>
                                <div className="flex-shrink-0 ml-3">
                                  <img src="/icones-pay/card-pix.svg" alt="Pix" className="h-6" />
                                </div>
                              </div>
                            </div>

                            {/* Cartão de Crédito */}
                            <div
                              className="border rounded-lg overflow-hidden cursor-pointer"
                              style={{
                                borderColor: method === 'CREDIT_CARD' ? primary : 'rgb(229,231,235)',
                                backgroundColor: method === 'CREDIT_CARD' ? `${primary}08` : 'rgb(249,250,251)',
                              }}
                              onClick={() => setMethod('CREDIT_CARD')}
                            >
                              <div className="flex items-center justify-between p-4 transition-colors" style={{ backgroundColor: 'transparent' }}>
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div
                                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                                    style={{ borderColor: method === 'CREDIT_CARD' ? primary : 'rgb(209,213,219)' }}
                                  >
                                    {method === 'CREDIT_CARD' && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primary }} />}
                                  </div>
                                  <div className="flex flex-col flex-1 min-w-0">
                                    <span className="font-semibold text-sm text-gray-900">Cartão de Crédito</span>
                                    <span className="text-xs text-gray-500 leading-tight">Em até 12x</span>
                                  </div>
                                </div>
                              </div>
                              {/* Formulário cartão expandível */}
                              <AnimatePresence>
                                {method === 'CREDIT_CARD' && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="px-4 pb-4 pt-3 space-y-3 border-t border-gray-100">
                                      <input style={inputStyle} placeholder="Número do cartão" maxLength={19} className="flex h-12 rounded-lg border text-sm outline-none w-full" />
                                      <div className="grid grid-cols-2 gap-3">
                                        <input style={inputStyle} placeholder="Nome no cartão" className="flex h-12 rounded-lg border text-sm outline-none w-full" />
                                        <input style={inputStyle} placeholder="MM/AA" maxLength={5} className="flex h-12 rounded-lg border text-sm outline-none w-full" />
                                      </div>
                                      <div className="grid grid-cols-2 gap-3">
                                        <input style={inputStyle} placeholder="CVV" maxLength={4} className="flex h-12 rounded-lg border text-sm outline-none w-full" />
                                        <select style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' as const }}>
                                          {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                                            <option key={n} value={n}>{n}x de R$ {((total * 1.05)/n).toFixed(2).replace('.',',')}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Boleto Bancário */}
                            <div
                              className="border rounded-lg overflow-hidden cursor-pointer"
                              style={{
                                borderColor: method === 'BOLETO' ? primary : 'rgb(229,231,235)',
                                backgroundColor: method === 'BOLETO' ? `${primary}08` : 'rgb(249,250,251)',
                              }}
                              onClick={() => setMethod('BOLETO')}
                            >
                              <div className="flex items-center justify-between p-4 transition-colors" style={{ backgroundColor: 'transparent' }}>
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div
                                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                                    style={{ borderColor: method === 'BOLETO' ? primary : 'rgb(209,213,219)' }}
                                  >
                                    {method === 'BOLETO' && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primary }} />}
                                  </div>
                                  <div className="flex flex-col flex-1 min-w-0">
                                    <span className="font-semibold text-sm text-gray-900">Boleto Bancário</span>
                                    <span className="text-xs text-gray-500 leading-tight">Vencimento em 3 dias</span>
                                  </div>
                                </div>
                                <div className="flex-shrink-0 ml-3">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/></svg>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Botão Finalizar Pedido */}
                          <div className="pt-4 mt-4">
                            <button
                              className="whitespace-nowrap rounded-md transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 w-full text-white font-bold text-lg hover:opacity-90 flex items-center justify-center gap-2"
                              style={{
                                backgroundColor: processing ? '#9ca3af' : 'rgb(0,131,236)',
                                borderColor: 'rgb(0,131,236)',
                                height: '3.5rem',
                                minHeight: '3.5rem',
                                borderRadius: '9999px',
                                cursor: processing ? 'not-allowed' : 'pointer',
                              }}
                              onClick={finalize}
                              disabled={processing}
                            >
                              {processing ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /><span>Processando...</span></>
                              ) : (
                                <><Lock className="w-5 h-5" /><span className="truncate">Finalizar Pedido</span></>
                              )}
                            </button>
                            <p className="text-[11px] text-center text-gray-500 mt-3 font-medium tracking-tight">
                              SEUS DADOS ESTÃO SEGUROS E CRIPTOGRAFADOS
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* slot rodapé esquerda */}
                    <DropZone />

                  </div>
                </div>

                {/* ════ DIVISOR ════ */}
                <div className="w-px self-stretch shrink-0" style={{ backgroundColor: 'rgb(222,222,222)' }} />

                {/* ════ COLUNA DIREITA ════ */}
                <div
                  className="flex pt-6 pb-6 w-full min-w-0 min-h-full self-stretch justify-start"
                  style={{ backgroundColor: 'rgb(249,250,251)', paddingLeft: '38px', paddingRight: '38px' }}
                >
                  <div className="w-full max-w-[480px]">

                    {/* slot topo direita */}
                    <DropZone />

                    {/* sticky: produtos + brinde + cupom + totais */}
                    <div className="sticky top-6 w-full min-w-0">
                      <div className="lg:top-6 lg:self-start w-full">
                        <div className="w-full min-w-0 pt-0 lg:pt-[10px]" style={{ borderRadius: '16px' }}>

                          {/* Produtos */}
                          <div className="mb-5">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                              {products.map(p => (
                                <div key={p.id} className="flex gap-4">
                                  <div className="relative w-16 h-16 flex-shrink-0">
                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-lg border border-gray-200 overflow-hidden">
                                      {p.image
                                        ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                                        : <Package className="w-7 h-7 text-gray-400" />
                                      }
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0 flex flex-col">
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                      <h4 className="text-sm font-medium text-gray-900 leading-tight flex-1 line-clamp-1" style={{ color: 'rgb(34,34,34)', fontSize: '14px' }}>{p.name}</h4>
                                      <p className="text-sm font-semibold text-gray-900 flex-shrink-0" style={{ color: 'rgb(34,34,34)', fontSize: '14px' }}>{fmt(p.price * p.quantity)}</p>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2.5 ml-auto">
                                        <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                                          <button type="button" className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors rounded-l-lg disabled:opacity-40 disabled:cursor-not-allowed" disabled>
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4"/></svg>
                                          </button>
                                          <span className="text-sm font-semibold w-7 text-center text-gray-900">{p.quantity}</span>
                                          <button type="button" className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors rounded-r-lg">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Brinde */}
                          {brinde && (
                            <div
                              className="relative border rounded-lg overflow-hidden transition-all cursor-pointer mb-4"
                              style={{ borderStyle: 'dashed', borderColor: 'rgb(0,130,236)', borderRadius: '12px', backgroundColor: 'rgb(255,255,255)', borderWidth: '1px' }}
                            >
                              <div className="px-3 py-3">
                                <p className="font-medium mb-2 text-xs" style={{ color: 'rgb(107,114,128)' }}>Você ganhou esse brinde</p>
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0">
                                    {brinde.image
                                      ? <img src={brinde.image} alt={brinde.name} className="w-14 h-14 object-cover rounded-lg" />
                                      : <div className="w-14 h-14 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center"><Package className="w-6 h-6 text-gray-400" /></div>
                                    }
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold mb-1 text-xs" style={{ color: 'rgb(17,24,39)' }}>{brinde.name}</h4>
                                    <p className="text-xs" style={{ color: 'rgb(107,114,128)' }}>{brinde.label || 'Grátis'}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Cupom */}
                          <div className="mb-6 pt-5 border-t border-gray-200">
                            <div className="flex gap-2">
                              <input
                                readOnly={couponApplied}
                                placeholder="Código do cupom"
                                className="flex-1 h-11 px-4 border border-gray-300 text-sm font-normal outline-none focus:border-gray-400 rounded-lg transition-all placeholder:text-gray-400"
                                type="text"
                                style={{ borderRadius: '9999px', backgroundColor: 'rgb(255,255,255)' }}
                                value={coupon}
                                onChange={e => setCoupon(e.target.value)}
                              />
                              <button
                                type="button"
                                className="px-6 h-11 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all whitespace-nowrap"
                                style={{ borderRadius: '9999px' }}
                                onClick={() => coupon && setCouponApplied(true)}
                              >
                                Aplicar
                              </button>
                            </div>
                          </div>

                          {/* Totais */}
                          <div className="pt-5 border-t border-gray-200">
                            <div className="space-y-2.5 mb-4">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600" style={{ color: 'rgb(102,102,102)', fontWeight: 400 }}>
                                  Subtotal • {products.reduce((a, p) => a + p.quantity, 0)} item
                                </span>
                                <span className="text-sm font-semibold text-gray-900" style={{ color: 'rgb(34,34,34)' }}>{fmt(subtotal)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600" style={{ color: 'rgb(102,102,102)', fontWeight: 400 }}>Frete</span>
                                <span className="text-sm font-semibold" style={{ color: shipping === 0 ? '#16a34a' : 'rgb(102,102,102)' }}>
                                  {shipping === 0 ? 'Grátis' : fmt(shipping)}
                                </span>
                              </div>
                              {discount > 0 && (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-green-600">Desconto</span>
                                  <span className="text-sm font-semibold text-green-600">- {fmt(discount)}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                              <span className="text-base font-bold text-gray-900" style={{ color: 'rgb(34,34,34)', fontSize: '16px' }}>Total</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500" style={{ color: 'rgb(153,153,153)', fontSize: '11px', fontWeight: 400 }}>BRL</span>
                                <span className="text-xl font-bold text-gray-900" style={{ color: 'rgb(34,34,34)', fontSize: '20px' }}>{fmt(total)}</span>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>

                    {/* slot rodapé direita */}
                    <DropZone />

                  </div>
                </div>

              </div>
            </div>

            {/* ── Slot abaixo das 2 colunas (full width) ── */}
            <div className="w-full">
              <DropZone />
            </div>

          </div>
        </div>
      </main>

      {/* ════ FOOTER ════ */}
      <footer className="border-t" style={{ backgroundColor: 'rgb(255,255,255)', fontSize: '16px', lineHeight: '1.6em', fontWeight: 500 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-center text-sm font-medium" style={{ color: 'rgb(107,114,128)' }}>Formas de Pagamento</p>
              <div className="flex flex-wrap justify-center items-center gap-2">
                <img src="/icones-pay/card-visa.svg"       alt="Visa"             className="h-6" />
                <img src="/icones-pay/card-mastercard.svg" alt="Mastercard"       className="h-6" />
                <img src="/icones-pay/card-elo.svg"        alt="Elo"              className="h-6" />
                <img src="/icones-pay/card-amex.svg"       alt="American Express" className="h-6" />
                <img src="/icones-pay/card-discover.svg"   alt="Discover"         className="h-6" />
                <img src="/icones-pay/card-diners.svg"     alt="Diners Club"      className="h-6" />
                <img src="/icones-pay/card-aura.svg"       alt="Aura"             className="h-6" />
                <img src="/icones-pay/card-pix.svg"        alt="PIX"              className="h-6" />
              </div>
            </div>
            <div className="flex justify-center items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5" style={{ backgroundColor: 'rgb(239,246,255)', borderRadius: '9999px' }}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgb(34,197,94)' }} />
                <span className="text-sm" style={{ color: 'rgb(17,24,39)' }}>Site Seguro</span>
              </div>
            </div>
            <p className="text-center text-xs" style={{ color: '#9ca3af' }}>
              © {new Date().getFullYear()} {(theme.storeName as string) || 'Minha Loja'} · Powered by{' '}
              <a href="https://syncads.com.br" target="_blank" rel="noopener noreferrer" className="font-medium hover:underline" style={{ color: '#8b5cf6' }}>SyncAds</a>
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default HighConversionTemplate;
