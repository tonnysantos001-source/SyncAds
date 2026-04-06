/**
 * HighConversionTemplate — Checkout Alto Impacto v5.2 (Clique Aqui Edition)
 * Version: 2.1-CLIQUE-AQUI
 * Replicado fielmente do HTML de referência fornecido pelo usuário.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle, Loader2, Package, Minus, Plus, ShoppingCart, ChevronDown, ChevronUp, Pen, Trash2, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { checkoutMonitor } from '@/lib/checkoutMonitor';
import type { TemplateRenderProps } from '@/types/checkout.types';
import { checkoutApi } from '@/lib/api/checkoutApi';
import PaymentMethodIcons from '@/components/checkout/PaymentMethodIcons';
import { formatPhone } from '@/lib/utils/phoneUtils';
import { formatCpf } from '@/lib/utils/cpfUtils';
import { formatCep, searchCep } from '@/lib/utils/cepUtils';
import {
  validateNameDebounced,
  validateEmailDebounced,
  capitalizeWords,
} from '@/lib/utils/validationUtils';

// ── COUNTDOWN (Estilizado conforme Referência) ──────────────
const Countdown: React.FC = () => {
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
      setTime({ 
        h: Math.floor(diff / 3600000), 
        m: Math.floor((diff % 3600000) / 60000), 
        s: Math.floor((diff % 60000) / 1000) 
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expTime]);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div 
      className="relative w-full flex items-center justify-center gap-2"
      style={{
        backgroundColor: 'rgb(0, 129, 236)',
        borderRadius: '12px',
        height: '65px',
        padding: '0 20px',
      }}
    >
      <div className="flex items-center gap-1">
        <span style={{ color: 'rgb(255,255,255)', fontSize: '14px', fontWeight: 500 }}>Oferta termina em:</span>
        <div className="flex items-center gap-2 ml-2">
          <div className="flex items-center text-white">
            <span style={{ fontWeight: 'bold', fontSize: '24px', color: 'rgb(255,255,255)' }}>{pad(time.h)}</span>
            <span style={{ fontSize: '12px', color: 'rgb(255,255,255)', marginLeft: '4px' }}>h</span>
          </div>
          <span style={{ color: 'rgb(255,255,255)' }}>:</span>
          <div className="flex items-center text-white">
            <span style={{ fontWeight: 'bold', fontSize: '24px', color: 'rgb(255,255,255)' }}>{pad(time.m)}</span>
            <span style={{ fontSize: '12px', color: 'rgb(255,255,255)', marginLeft: '4px' }}>m</span>
          </div>
          <span style={{ color: 'rgb(255,255,255)' }}>:</span>
          <div className="flex items-center">
            <span style={{ fontWeight: 'bold', fontSize: '24px', color: 'rgb(255,255,255)' }}>{pad(time.s)}</span>
            <span style={{ fontSize: '12px', color: 'rgb(255,255,255)', marginLeft: '4px' }}>s</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── DROP ZONE (Caixa "Solte aqui" para personalização) ───────
const DropZone: React.FC<{
  imageSrc?: string;
  themeKey: string;
  onUpdateTheme?: (themeOverrides: Partial<Record<string, unknown>>) => void;
}> = ({ imageSrc, themeKey, onUpdateTheme }) => {
  const [localImage, setLocalImage] = useState<string | null>(imageSrc || null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setIsUploading(true);
        const localUrl = URL.createObjectURL(file);
        setLocalImage(localUrl);

        const publicUrl = await checkoutApi.uploadCheckoutImage(file);
        if (onUpdateTheme) {
          onUpdateTheme({ [themeKey]: publicUrl });
        }
      } catch (error) {
        console.error("Erro no upload:", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleRemove = () => {
    setLocalImage(null);
    if (onUpdateTheme) {
      onUpdateTheme({ [themeKey]: "" });
    }
  };

  if (localImage) {
    return (
      <div className="relative group w-full mb-4">
        <input type="file" className="hidden" ref={inputRef} accept="image/*" onChange={handleUpload} />
        <div className="absolute -right-2 -top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button 
            type="button" 
            onClick={() => inputRef.current?.click()} 
            disabled={isUploading}
            className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-white border border-gray-200 shadow-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Pen className="h-3.5 w-3.5" />
          </button>
          <button 
            type="button" 
            onClick={handleRemove} 
            disabled={isUploading}
            className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-white border border-gray-200 shadow-sm text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="relative w-full rounded-xl overflow-hidden border border-gray-100 shadow-sm">
          {isUploading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
          )}
          <img src={localImage} alt="Banner" className="w-full object-cover" style={{ minHeight: '72px' }} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative group cursor-pointer mb-4 overflow-hidden"
      style={{
        minHeight: '84px',
        borderRadius: '12px',
        border: '2px dashed rgba(209,213,219,0.4)',
        backgroundColor: '#f9fafb',
        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <input 
        type="file" 
        className="absolute inset-0 opacity-0 cursor-pointer z-20 w-full h-full" 
        ref={inputRef} 
        accept="image/*" 
        onChange={handleUpload} 
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 gap-1.5 p-3">
        {isUploading ? (
          <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
        ) : (
          <>
            <div
              className="flex items-center gap-2.5 px-5 py-2 bg-white shadow-sm border border-gray-100 rounded-full transition-all group-hover:scale-105 active:scale-95 group-hover:shadow-md"
            >
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <p className="text-[13px] font-semibold text-gray-500 m-0">
                Clique aqui
              </p>
            </div>
            <p className="text-[11px] text-gray-400 font-medium leading-none">
              Tamanho: 500x150px
            </p>
          </>
        )}
      </div>
    </div>
  );
};

// ── CUSTOMIZABLE BANNER (Upload de Imagens Responsivas) ───────
const CustomizableBanner: React.FC<{
  imageSrc?: string;
  type: 'desktop' | 'mobile';
  isMobileView: boolean;
  onUpdateTheme?: (themeOverrides: Partial<Record<string, unknown>>) => void;
}> = ({ imageSrc, type, isMobileView, onUpdateTheme }) => {
  const isMobileType = type === 'mobile';
  const [localImage, setLocalImage] = useState<string | null>(imageSrc || null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Renderiza apenas o banner correto para o dispositivo
  if (isMobileType && !isMobileView) return null;
  if (!isMobileType && isMobileView) return null;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      try {
        setIsUploading(true);
        // Atualização Otimista Imediata da UI
        const localUrl = URL.createObjectURL(file);
        setLocalImage(localUrl);

        // Upload Real no Back-End
        const publicUrl = await checkoutApi.uploadCheckoutImage(file);
        
        // Disparando para o Tema pai
        if (onUpdateTheme) {
          onUpdateTheme({ bannerImageUrl: publicUrl });
        }
      } catch (error) {
        console.error("Erro ao subir imagem:", error);
        // Em um sistema mais complexo poderiamos exibir um Toast de erro ou regressar a preview
      } finally {
        setIsUploading(false);
      }
    }
  };

  if (!localImage) {
    return (
      <div
        className="relative group cursor-pointer w-full mb-4 overflow-hidden"
        style={{
          minHeight: '88px',
          borderRadius: '12px',
          border: '2px dashed rgba(209,213,219,0.6)',
          backgroundColor: '#f9fafb',
          transition: 'all 0.2s',
        }}
      >
        <input 
          type="file" 
          className="absolute inset-0 opacity-0 cursor-pointer z-20 w-full h-full" 
          ref={inputRef} 
          accept="image/*" 
          onChange={handleUpload} 
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-center pointer-events-none z-10">
          <div className="flex items-center gap-2 px-4 py-2 bg-white shadow-sm border border-gray-100 rounded-full transition-all group-hover:scale-105 group-hover:shadow-md">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <p className="text-[13px] font-semibold text-gray-500 m-0">
              Clique aqui para selecionar
            </p>
          </div>
          <p className="text-[11px] text-gray-400 font-medium">
            Tamanho: {type === 'desktop' ? '1000x200px' : '600x200px'}
          </p>
        </div>
      </div>
    );
  }

  // Com imagem (Mostra controles)
  return (
    <div className="group w-full transition-all duration-200 mb-4">
      <input type="file" className="hidden" ref={inputRef} accept="image/*" onChange={handleUpload} />
      <div className="relative group">
        {/* Controles do Hover */}
        <div className="absolute -right-2 -top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button 
            type="button" 
            onClick={() => inputRef.current?.click()} 
            disabled={isUploading}
            className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-white border border-gray-200 shadow-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50"
          >
            <Pen className="h-3.5 w-3.5" />
          </button>
          <button 
            type="button" 
            disabled={isUploading}
            onClick={() => {
              setLocalImage(null);
              if (onUpdateTheme) {
                 onUpdateTheme({ bannerImageUrl: "" });
              }
            }} 
            className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-white border border-gray-200 shadow-sm text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        
        {/* Wrapper da imagem */}
        <div className="relative w-full rounded-2xl overflow-hidden">
          {/* Indicador de Salvamento em andamento */}
          {isUploading && (
             <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-all duration-300">
                <div className="bg-white rounded-full p-2 py-1 flex items-center gap-2 shadow-lg">
                   <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                   <span className="text-xs font-semibold text-gray-800 pr-2">Enviando...</span>
                </div>
             </div>
          )}
          <img 
            src={localImage} 
            alt={`Banner ${type}`} 
            style={{ 
              width: '100%', 
              height: isMobileType ? '90px' : '195px', 
              objectFit: 'cover', 
            }} 
          />
        </div>
      </div>
    </div>
  );
};

// ── INPUT STYLE (Global para este template) ─────────────────
const inputStyle: React.CSSProperties = {
  padding: '13.5px 11px',
  fontSize: '13px',
  borderRadius: '9999px',
  backgroundColor: 'rgb(255,255,255)',
  border: '1.5px solid rgb(222,222,222)',
  color: 'rgb(34,34,34)',
  height: '48px',
  transition: '0.2s',
  width: '100%',
  fontWeight: 400,
  outline: 'none',
  boxSizing: 'border-box',
};

// ── PREVIEW DATA ────────────────────────────────────────────
const PREV_PRODUCTS = [{ id: '1', name: 'Produto Exemplo', price: 197, quantity: 1, image: '' }];
const PREV_BRINDE   = { name: 'Body oil anti-cellulite', label: 'Grátis', image: 'https://images.pexels.com/photos/6621461/pexels-photo-6621461.jpeg?auto=compress&cs=tinysrgb&w=150' };

// ════════════════════════════════════════════════════════════
// TEMPLATE PRINCIPAL
// ════════════════════════════════════════════════════════════

const HighConversionTemplate: React.FC<TemplateRenderProps> = ({
  orderId, checkoutData, theme, templateConfig, isPreview = false,
  onStepChange, onPaymentSuccess, onUpdateTheme,
}) => {
  const primary = (theme.primaryColor as string) || '#0082ec';

  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      setIsMobile(entries[0].contentRect.width < 1024);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

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
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);


  // data
  const products  = checkoutData?.products ?? (isPreview ? PREV_PRODUCTS : []);
  const subtotal  = checkoutData?.subtotal ?? (isPreview ? 197 : 0);
  const shipping  = checkoutData?.shipping ?? (isPreview ? 15  : 0);
  const discount  = checkoutData?.discount ?? 0;
  const total     = checkoutData?.total    ?? (isPreview ? 212 : 0);
  const brinde    = (checkoutData as any)?.brinde ?? (isPreview ? PREV_BRINDE : null);

  const bannerSrc = (theme.bannerImageUrl as string) || 'https://res.cloudinary.com/duni5gxk4/image/upload/v1769574622/elementos/s16g1qgevayvglfanapp.svg';

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
    <div className="min-h-screen bg-[#0f172a] font-sans" style={{ color: 'rgb(34,34,34)' }}>
      <div className={cn("flex justify-center", isMobile ? "pt-6 pb-12 px-4" : "p-4 lg:p-6")}>
        {/* Container Central 1280px */}
        <div 
          ref={containerRef}
          className="bg-white shadow-lg overflow-hidden flex flex-col"
          style={{ 
            width: '100%',
            maxWidth: '1280px', 
            minHeight: isMobile ? 'calc(100vh - 32px)' : 'calc(100vh - 48px)',
            borderRadius: '16px'
          }}
        >
          
          {/* HEADER (Sincronizado com Referência) */}
          <header 
            className="flex justify-between items-center px-4 md:px-8 border-b border-gray-100/10"
            style={{ 
              backgroundColor: 'rgb(0, 129, 236)', 
              height: '71px',
              minHeight: '71px'
            }}
          >
            <div className="flex items-center h-full">
              {(theme.logoUrl as string)
                ? <img src={theme.logoUrl as string} alt="Logo" className={cn("object-contain", isMobile ? "h-8" : "h-9")} />
                : <span className={cn("font-extrabold text-white truncate", isMobile ? "text-lg" : "text-xl")}>{(theme.storeName as string) || 'Minha Loja'}</span>
              }
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[10px] font-bold text-white/90 uppercase tracking-wide">Pagamento 100% Seguro</span>
              </div>
            </div>
          </header>

          {/* COUNTDOWN — Full Width cobrindo as duas colunas */}
          <div className="w-full px-4 md:px-6 py-4 bg-white">
            <Countdown />
          </div>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1">
            <div className={cn("w-full", isMobile ? "flex flex-col" : "grid grid-cols-[1fr_auto_1fr]")}>
              
              {/* MOBILE ORDER SUMMARY (lg:hidden) */}
              <div 
                className="w-full border-b border-gray-200" 
                style={{ display: isMobile ? 'block' : 'none', backgroundColor: 'rgb(249,250,251)' }}
              >
                <button
                  onClick={() => setIsMobileSummaryOpen(!isMobileSummaryOpen)}
                  className="w-full flex items-center justify-between px-4 py-4 text-sm focus:outline-none bg-white"
                >
                  <div className="flex items-center gap-2" style={{ color: primary }}>
                    <ShoppingCart className="w-5 h-5" />
                    <span className="font-medium text-[15px]">
                      {isMobileSummaryOpen ? 'Ocultar resumo' : 'Resumo do pedido'}
                    </span>
                    {isMobileSummaryOpen ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                  </div>
                  <span className="font-bold text-gray-900 text-lg">{fmt(total)}</span>
                </button>
                <AnimatePresence>
                  {isMobileSummaryOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 overflow-hidden"
                      style={{ backgroundColor: 'rgb(249,250,251)' }}
                    >
                      <div className="space-y-5 pt-2 pb-6">
                        {/* LISTA DE PRODUTOS */}
                        <div className="space-y-4">
                          {products.map(p => (
                            <div key={p.id} className="flex gap-4">
                              <div className="w-16 h-16 bg-white border border-gray-200 rounded-lg overflow-hidden flex-shrink-0 relative">
                                {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                                <div className="absolute -top-2 -right-2 w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold border-2 border-white shadow-sm" style={{ backgroundColor: 'rgba(115, 115, 115, 0.9)' }}>
                                  {p.quantity}
                                </div>
                              </div>
                              <div className="flex-1 flex flex-col pt-1">
                                <div className="flex justify-between items-start gap-4">
                                  <h4 className="text-sm font-medium text-gray-900 leading-tight flex-1 line-clamp-2">{p.name}</h4>
                                  <p className="text-sm font-semibold text-gray-900">{fmt(p.price * p.quantity)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* BRINDE */}
                        {brinde && (
                          <div 
                            className="p-3 border rounded-xl flex items-center gap-3" 
                            style={{ borderStyle: 'dashed', borderColor: 'rgb(0, 130, 236)', backgroundColor: '#fff' }}
                          >
                            <img src={brinde.image} alt={brinde.name} className="w-12 h-12 object-cover rounded-lg border border-gray-100" />
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Você ganhou esse brinde</p>
                              <h4 className="text-sm font-bold text-gray-900">{brinde.name}</h4>
                            </div>
                          </div>
                        )}

                        {/* CUPOM */}
                        <div className="flex gap-2 pt-4 border-t border-gray-200">
                          <input 
                            placeholder="Código do cupom" 
                            value={coupon}
                            onChange={e => setCoupon(e.target.value)}
                            style={{ padding: '13.5px 11px', fontSize: '13px', borderRadius: '9999px', flex: 1, backgroundColor: '#ffffff', border: '1px solid #e5e7eb', outline: 'none' }} 
                          />
                          <button 
                            onClick={() => setCouponApplied(true)}
                            className="px-5 rounded-full bg-gray-900 text-white text-sm font-bold hover:bg-black transition-colors"
                          >
                            Aplicar
                          </button>
                        </div>

                        {/* TOTAIS */}
                        <div className="space-y-3 pt-6 border-t border-gray-200">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Subtotal • {products.length} item</span>
                            <span className="font-semibold">{fmt(subtotal)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Frete</span>
                            <span className="font-semibold text-green-600">{shipping === 0 ? 'Grátis' : fmt(shipping)}</span>
                          </div>
                          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                            <span className="text-lg font-bold text-gray-900">Total</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 font-medium">BRL</span>
                              <span className="text-2xl font-bold text-gray-900">{fmt(total)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* COLUNA ESQUERDA: FORMULÁRIO */}
              <div className={cn(
                isMobile ? "px-4 py-6" : "min-w-0 w-full pt-6 pb-6 px-[38px] flex justify-end"
              )}>
                <div className={cn("space-y-6", isMobile ? "w-full" : "w-full min-w-0 max-w-[503px]")}>
                  
                  {/* DROPZONE TOPO */}
                  <DropZone 
                    themeKey="leftTopBannerUrl" 
                    imageSrc={theme.leftTopBannerUrl as string} 
                    onUpdateTheme={onUpdateTheme} 
                  />

                  {/* SEÇÃO 1: CONTATO */}
                  <div className="space-y-4">
                    <h2 style={{ fontSize: '21px', fontWeight: 500 }}>Informações de contato</h2>
                    <div className="space-y-3">
                      <input placeholder="Email" value={email} style={inputStyle} onChange={e => { const v = e.target.value.toLowerCase().trim(); setEmail(v); validateEmailDebounced(v, r => setEmailValid(r?.isValid ?? null)); }} onFocus={onfocus} onBlur={onblur} />
                      <input placeholder="Nome completo" value={name} style={inputStyle} onChange={e => { const v = capitalizeWords(e.target.value); setName(v); validateNameDebounced(v, r => setNameValid(r?.isValid ?? null)); }} onFocus={onfocus} onBlur={onblur} />
                      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                        <div className="relative group">
                          <div className="absolute left-0 h-full flex items-center px-4 gap-1 border-r border-gray-200">
                            <img src="https://flagcdn.com/w20/br.png" alt="BR" className="w-5 h-4 object-cover rounded-sm" />
                            <span className="text-xs text-gray-500">+55</span>
                          </div>
                          <input 
                            placeholder="(11) 96123-4567" 
                            value={phone} 
                            style={{ ...inputStyle, paddingLeft: '78px' }} 
                            onChange={e => setPhone(formatPhone(e.target.value))} 
                            onFocus={onfocus} 
                            onBlur={onblur} 
                          />
                        </div>
                        <input placeholder="CPF/CNPJ" value={document} style={inputStyle} onChange={e => setDocument(formatCpf(e.target.value))} onFocus={onfocus} onBlur={onblur} />
                      </div>
                    </div>
                  </div>

                  {/* BANNERS PERSONALIZÁVEIS */}
                  <CustomizableBanner imageSrc={bannerSrc} type="desktop" isMobileView={isMobile} onUpdateTheme={onUpdateTheme} />
                  <CustomizableBanner imageSrc={bannerSrc} type="mobile" isMobileView={isMobile} onUpdateTheme={onUpdateTheme} />

                  {/* SEÇÃO 2: ENTREGA */}
                  <div className="space-y-4 pt-4">
                    <h2 style={{ fontSize: '21px', fontWeight: 500 }}>Endereço de entrega</h2>
                    <div className="space-y-3">
                      <div className="relative">
                        <input placeholder="CEP" value={cep} style={cepFound ? { ...inputStyle, borderColor: '#16a34a' } : inputStyle} onChange={e => handleCep(e.target.value)} onFocus={onfocus} onBlur={e => onblur(e, cepFound ? '#16a34a' : undefined)} />
                        {loadingCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}
                      </div>
                      <input placeholder="Rua" value={street} style={inputStyle} onChange={e => setStreet(e.target.value)} onFocus={onfocus} onBlur={onblur} />
                      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                        <input placeholder="Bairro" value={neighborhood} style={inputStyle} onChange={e => setNeighborhood(e.target.value)} onFocus={onfocus} onBlur={onblur} />
                        <input placeholder="Número" value={number} style={inputStyle} onChange={e => setNumber(e.target.value)} onFocus={onfocus} onBlur={onblur} />
                      </div>
                      <input placeholder="Complemento" value={complement} style={inputStyle} onChange={e => setComplement(e.target.value)} onFocus={onfocus} onBlur={onblur} />
                      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                        <input placeholder="Cidade" value={city} style={inputStyle} onChange={e => setCity(e.target.value)} onFocus={onfocus} onBlur={onblur} />
                        <input placeholder="Estado" value={state} style={inputStyle} maxLength={2} onChange={e => setState(e.target.value.toUpperCase())} onFocus={onfocus} onBlur={onblur} />
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO 3: PAGAMENTO */}
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div>
                      <h2 style={{ fontSize: '21px', fontWeight: 500 }}>Pagamento</h2>
                      <p className="text-sm text-gray-500">Todos os dados são seguros e criptografados</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-3">
                        {/* MÉTODOS DE PAGAMENTO */}
                        {['PIX', 'CREDIT_CARD', 'BOLETO'].map((m) => (
                          <div 
                            key={m}
                            onClick={() => setMethod(m as any)}
                            className="border rounded-xl cursor-pointer transition-all overflow-hidden"
                            style={{ 
                              borderColor: method === m ? 'rgb(0, 129, 236)' : 'rgb(229, 231, 235)',
                              backgroundColor: 'rgb(249, 250, 251)'
                            }}
                          >
                            <div className="p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                                  style={{ borderColor: method === m ? 'rgb(0, 129, 236)' : 'rgb(209, 213, 219)' }}
                                >
                                  {method === m && <div className="w-2.5 h-2.5 rounded-full bg-[#0082ec]" />}
                                </div>
                                <span className="font-semibold text-sm">
                                  {m === 'PIX' ? 'PIX' : m === 'CREDIT_CARD' ? 'Cartão de Crédito' : 'Boleto Bancário'}
                                </span>
                              </div>
                              {m === 'CREDIT_CARD' && (
                                <div className="flex gap-1.5">
                                  {['amex','visa','mastercard','elo','discover'].map(c => (
                                    <img key={c} src={`/icones-pay/card-${c}.svg`} alt={c} className="h-4" />
                                  ))}
                                </div>
                              )}
                              {m === 'BOLETO' && (
                                <span className="text-[10px] text-gray-500 font-medium">Vencimento em 3 dias</span>
                              )}
                            </div>
                            <AnimatePresence>
                              {method === 'CREDIT_CARD' && m === 'CREDIT_CARD' && (
                                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-4 pb-4 space-y-3 overflow-hidden">
                                  <input style={inputStyle} placeholder="Número do cartão" />
                                  <div className="grid grid-cols-2 gap-3">
                                    <input style={inputStyle} placeholder="MM/AA" />
                                    <input style={inputStyle} placeholder="CVV" />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4">
                        <button
                          onClick={finalize}
                          disabled={processing}
                          className="w-full h-14 rounded-full text-white font-bold text-base flex items-center justify-center gap-2 btn-animate-pulse-normal shadow-lg active:scale-95 transition-transform"
                          style={{ backgroundColor: 'rgb(0, 129, 236)' }}
                        >
                          {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                          {processing ? 'Processando...' : 'Finalizar Pedido'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* DROPZONE FINAL ESQUERDA */}
                  <DropZone 
                    themeKey="leftBottomBannerUrl" 
                    imageSrc={theme.leftBottomBannerUrl as string} 
                    onUpdateTheme={onUpdateTheme} 
                  />

                </div>
              </div>

              {/* DIVISOR VERTICAL */}
              {!isMobile && (
                <div className="w-[1px] self-stretch" style={{ backgroundColor: 'rgb(222, 222, 222)' }} />
              )}

              {/* COLUNA DIREITA: RESUMO (STICKY) */}
              {!isMobile && (
                <div
                  className="flex pt-6 pb-6 w-full min-w-0 min-h-full self-stretch justify-start"
                  style={{ backgroundColor: 'rgb(249, 250, 251)', paddingLeft: '38px', paddingRight: '38px' }}
                >
                <div className="w-full max-w-[480px] space-y-4">

                  {/* DROPZONE TOPO DIREITA */}
                  <DropZone 
                    themeKey="rightTopBannerUrl" 
                    imageSrc={theme.rightTopBannerUrl as string} 
                    onUpdateTheme={onUpdateTheme} 
                  />

                  <div className="sticky top-[24px] space-y-5">
                    
                    {/* LISTA DE PRODUTOS */}
                    <div className="space-y-4">
                      {products.map(p => (
                        <div key={p.id} className="flex gap-4">
                          <div className="w-20 h-20 bg-white border border-gray-200 rounded-lg overflow-hidden flex-shrink-0 relative">
                            {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-8 h-8 text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                          </div>
                          <div className="flex-1 flex flex-col pt-1">
                            <div className="flex justify-between items-start gap-4">
                              <h4 className="text-sm font-medium text-gray-900 leading-tight flex-1 line-clamp-2">{p.name}</h4>
                              <p className="text-sm font-semibold text-gray-900">{fmt(p.price * p.quantity)}</p>
                            </div>
                            <div className="mt-auto flex justify-end">
                              <div className="flex items-center bg-white border border-gray-200 rounded-full scale-90 origin-right">
                                <button className="w-8 h-8 flex items-center justify-center text-gray-400" disabled><Minus className="w-3.5 h-3.5" /></button>
                                <span className="text-sm font-semibold w-6 text-center">{p.quantity}</span>
                                <button className="w-8 h-8 flex items-center justify-center text-gray-600"><Plus className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* BRINDE */}
                    {brinde && (
                      <div 
                        className="p-4 border rounded-xl flex items-center gap-4 animate-in fade-in zoom-in duration-500" 
                        style={{ borderStyle: 'dashed', borderColor: 'rgb(0, 130, 236)', backgroundColor: '#fff' }}
                      >
                        <img src={brinde.image} alt={brinde.name} className="w-14 h-14 object-cover rounded-lg border border-gray-100" />
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Você ganhou esse brinde</p>
                          <h4 className="text-sm font-bold text-gray-900">{brinde.name}</h4>
                        </div>
                      </div>
                    )}

                    {/* CUPOM */}
                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      <input 
                        placeholder="Código do cupom" 
                        value={coupon}
                        onChange={e => setCoupon(e.target.value)}
                        style={{ ...inputStyle, flex: 1, backgroundColor: '#f3f4f6', border: 'none' }} 
                      />
                      <button 
                        onClick={() => setCouponApplied(true)}
                        className="px-6 h-[48px] rounded-full bg-gray-900 text-white text-sm font-bold hover:bg-black transition-colors"
                      >
                        Aplicar
                      </button>
                    </div>

                    {/* TOTAIS */}
                    <div className="space-y-3 pt-6 border-t border-gray-200">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Subtotal • {products.length} item</span>
                        <span className="font-semibold">{fmt(subtotal)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Frete</span>
                        <span className="font-semibold text-green-600">{shipping === 0 ? 'Grátis' : fmt(shipping)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                        <span className="text-lg font-bold text-gray-900">Total</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 font-medium">BRL</span>
                          <span className="text-2xl font-bold text-gray-900">{fmt(total)}</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* DROPZONE FINAL DIREITA */}
                  <DropZone 
                    themeKey="rightBottomBannerUrl" 
                    imageSrc={theme.rightBottomBannerUrl as string} 
                    onUpdateTheme={onUpdateTheme} 
                  />

                </div>
              </div>
              )}

            </div>
          </main>

          {/* FOOTER */}
          <footer className="border-t bg-white" style={{ fontSize: '16px', lineHeight: '1.6em', fontWeight: 500 }}>
            <div className="max-w-7xl mx-auto px-4 py-10">
              <div className="flex flex-col items-center gap-8">
                {/* Payment Methods Section */}
                <div className="w-full flex flex-col items-center gap-4">
                  <p className="text-sm font-semibold tracking-wide uppercase opacity-50" style={{ color: theme.footerTextColor || '#6b7280' }}>
                    Formas de Pagamento
                  </p>
                  <PaymentMethodIcons 
                    isMobile={isMobile}
                    className="justify-center"
                    methods={['visa', 'mastercard', 'elo', 'amex', 'discover', 'diners', 'aura', 'pix', 'boleto']}
                  />
                  <p className="text-[11px] opacity-40 mt-1" style={{ color: theme.footerTextColor || '#6b7280' }}>
                    Aceitamos as principais bandeiras de cartão
                  </p>
                </div>

                {/* Secure Site Badge */}
                <div className="flex justify-center">
                  <div className="flex items-center gap-2.5 px-4 py-2 bg-[#F0FDF4] rounded-full border border-green-100 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                    <span className="text-xs font-bold text-[#166534] tracking-tight uppercase">Site Seguro</span>
                  </div>
                </div>
              </div>
            </div>
          </footer>

        </div>
      </div>


    </div>
  );
};

export default HighConversionTemplate;
