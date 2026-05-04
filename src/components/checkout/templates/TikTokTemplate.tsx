/**
 * TikTokTemplate — Checkout Estilo TikTok / TokVex
 *
 * Desktop: countdown + 2 colunas (forms esq | resumo+pagamento dir sticky)
 * Mobile:  countdown → collapsed address → collapsed CPF → progress bar
 *          → Resumo accordion → Contato → Pagamento → botão fixo fundo
 *
 * Cor: #EE1D52 | Fonte: Plus Jakarta Sans | Border-radius: 12px
 * @version 3.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, ChevronDown, ChevronUp, Loader2, CheckCircle,
  Tag, Package, Truck, Plus, MapPin, FileText,
} from 'lucide-react';
import { checkoutMonitor } from '@/lib/checkoutMonitor';
import { NoticeBar } from '@/components/checkout/NoticeBar';
import type { TemplateRenderProps } from '@/types/checkout.types';
import type { CheckoutConfig } from '@/types/checkout-config.types';
import { formatPhone } from '@/lib/utils/phoneUtils';
import { formatCpf } from '@/lib/utils/cpfUtils';
import { formatCep, searchCep } from '@/lib/utils/cepUtils';

// ============================================================
// TYPES
// ============================================================

type PaymentMethod = 'pix' | 'credit_card' | 'boleto_bancario';

// ============================================================
// COUNTDOWN HOOK
// ============================================================

const useCountdown = (initialMinutes = 10, storageKey?: string) => {
  const [seconds, setSeconds] = useState(() => {
    // Usa storageKey para persistir timer entre renders (mas não entre templates)
    const key = storageKey || `tiktok_countdown_${initialMinutes}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const diff = Math.round((new Date(stored).getTime() - Date.now()) / 1000);
      if (diff > 0) return diff;
    }
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + initialMinutes);
    localStorage.setItem(key, expiry.toISOString());
    return initialMinutes * 60;
  });
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  return {
    h: Math.floor(seconds / 3600),
    m: Math.floor((seconds % 3600) / 60),
    s: seconds % 60,
  };
};
const pad = (n: number) => String(n).padStart(2, '0');

// ============================================================
// SHARED INPUT CLASS
// ============================================================

const inputCls =
  'flex w-full rounded-lg border border-gray-200 bg-white px-4 text-sm placeholder:text-[13px] placeholder:text-gray-500 focus-visible:outline-none focus:ring-0 outline-none h-[48px]';

// ============================================================
// COUNTDOWN BAR
// ============================================================

const CountdownBar: React.FC<{ primaryColor: string; scarcityConfig?: CheckoutConfig['scarcity'] }> = ({ primaryColor, scarcityConfig }) => {
  const { h, m, s } = useCountdown(
    scarcityConfig?.durationMinutes ?? 10,
    scarcityConfig?.storageKey,
  );
  return (
    <div
      className="relative w-full py-2 px-4 flex items-center justify-center gap-2 mb-4"
      style={{ backgroundColor: primaryColor, borderRadius: '12px' }}
    >
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium text-white">Oferta termina em:</span>
        <div className="flex items-center gap-2 ml-2">
          <div className="flex items-center">
            <span className="font-bold text-white" style={{ fontSize: '24px' }}>{pad(h)}</span>
            <span className="text-xs ml-1 text-white">h</span>
          </div>
          <span className="text-white">:</span>
          <div className="flex items-center">
            <span className="font-bold text-white" style={{ fontSize: '24px' }}>{pad(m)}</span>
            <span className="text-xs ml-1 text-white">m</span>
          </div>
          <span className="text-white">:</span>
          <div className="flex items-center">
            <span className="font-bold text-white" style={{ fontSize: '24px' }}>{pad(s)}</span>
            <span className="text-xs ml-1 text-white">s</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// SHIPPING FORM (used in both desktop and mobile expanded)
// ============================================================

const ShippingForm: React.FC<{ theme: Record<string, unknown> }> = ({ theme }) => {
  const [zip, setZip]               = useState('');
  const [street, setStreet]         = useState('');
  const [number, setNumber]         = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity]             = useState('');
  const [stateUf, setStateUf]       = useState('');
  const [loading, setLoading]       = useState(false);
  const [found, setFound]           = useState(false);

  const handleCep = async (val: string) => {
    const fmt = formatCep(val);
    setZip(fmt);
    setFound(false);
    if (fmt.replace(/\D/g, '').length === 8) {
      setLoading(true);
      try {
        const r = await searchCep(fmt.replace(/\D/g, ''));
        if (r) {
          setStreet(r.street || (r as any).logradouro || '');
          setNeighborhood(r.neighborhood || (r as any).bairro || '');
          setCity(r.city || (r as any).localidade || '');
          setStateUf(r.state || (r as any).uf || '');
          setFound(true);
        }
      } catch {}
      finally { setLoading(false); }
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <input className={inputCls} placeholder="00000-000" maxLength={9} inputMode="numeric"
          value={zip} onChange={(e) => handleCep(e.target.value)}
          style={{ borderRadius: '12px', fontSize: '13px' }} />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}
        {found && !loading && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <input className={inputCls} placeholder="Rua *" value={street}
          onChange={(e) => setStreet(e.target.value)} style={{ borderRadius: '12px', fontSize: '13px' }} />
        <input className={inputCls} placeholder="Número *" value={number}
          onChange={(e) => setNumber(e.target.value)} style={{ borderRadius: '12px', fontSize: '13px' }} />
      </div>
      <input className={inputCls} placeholder="Complemento" value={complement}
        onChange={(e) => setComplement(e.target.value)} style={{ borderRadius: '12px', fontSize: '13px' }} />
      <div className="grid grid-cols-3 gap-4">
        <input className={inputCls} placeholder="Bairro *" value={neighborhood}
          onChange={(e) => setNeighborhood(e.target.value)} style={{ borderRadius: '12px', fontSize: '13px' }} />
        <input className={inputCls} placeholder="Cidade *" value={city}
          onChange={(e) => setCity(e.target.value)} style={{ borderRadius: '12px', fontSize: '13px' }} />
        <input className={inputCls} placeholder="ESTADO/UF *" maxLength={2} value={stateUf}
          onChange={(e) => setStateUf(e.target.value.toUpperCase())} style={{ borderRadius: '12px', fontSize: '13px' }} />
      </div>
    </div>
  );
};

// ============================================================
// CONTACT FORM
// ============================================================

const ContactForm: React.FC<{ theme: Record<string, unknown> }> = ({ theme }) => {
  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  return (
    <div className="space-y-4">
      <input className={inputCls} placeholder="Nome completo *" value={name}
        onChange={(e) => setName(e.target.value)} style={{ borderRadius: '12px', fontSize: '13px' }} />
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <input className={inputCls} placeholder="E-mail *" type="email" value={email}
          onChange={(e) => setEmail(e.target.value)} style={{ borderRadius: '12px', fontSize: '13px' }} />
        <input className={inputCls} placeholder="Telefone *" value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))} style={{ borderRadius: '12px', fontSize: '13px' }} />
      </div>
    </div>
  );
};

// ============================================================
// PAYMENT OPTIONS CONFIG
// ============================================================

const PAYMENT_OPTIONS = [
  {
    id: 'pix' as PaymentMethod,
    label: 'Pix',
    description: 'Pague em até 24 horas e obtenha confirmação instantânea.',
    icon: (
      <img src="https://img.icons8.com/color/200/pix.png" alt="PIX" className="w-6 h-6"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
    ),
  },
  {
    id: 'credit_card' as PaymentMethod,
    label: 'Cartão de crédito',
    description: 'Pague em até 12 parcelas',
    icon: (
      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    id: 'boleto_bancario' as PaymentMethod,
    label: 'Boleto',
    description: 'Pagamento via boleto bancário',
    icon: (
      <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 4h2v16H3V4zm4 0h1v16H7V4zm3 0h1v16h-1V4zm3 0h2v16h-2V4zm4 0h1v16h-1V4zm3 0h2v16h-2V4z" />
      </svg>
    ),
  },
];

// ============================================================
// PAYMENT SECTION (shared)
// ============================================================

interface PaymentSectionProps {
  primaryColor: string;
  theme: Record<string, unknown>;
  total: number;
  isPreview: boolean;
  orderId?: string;
  templateSlug: string;
  onSuccess?: (id: string) => void;
}

const PaymentSection: React.FC<PaymentSectionProps> = ({
  primaryColor, theme, total, isPreview, orderId, templateSlug, onSuccess,
}) => {
  const [method, setMethod]       = useState<PaymentMethod>('pix');
  const [processing, setProcessing] = useState(false);
  const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

  const handleFinalize = async () => {
    if (isPreview) { onSuccess?.(orderId || 'preview'); return; }
    setProcessing(true);
    checkoutMonitor.paymentAttempt(method.toUpperCase(), templateSlug, orderId);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      checkoutMonitor.paymentSuccess(method.toUpperCase(), templateSlug, orderId);
      onSuccess?.(orderId || '');
    } catch (e) {
      checkoutMonitor.paymentError(method.toUpperCase(), String(e), templateSlug, orderId);
    } finally { setProcessing(false); }
  };

  return (
    <div>
      <h3 className="font-semibold mb-4" style={{ color: 'rgb(17,24,39)' }}>Forma de pagamento</h3>
      <div className="divide-y divide-gray-200">
        {PAYMENT_OPTIONS.map((opt) => (
          <label key={opt.id}
            className="flex items-center justify-between py-4 cursor-pointer"
            onClick={() => setMethod(opt.id)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                {opt.icon}
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">{opt.label}</span>
                <span className="text-xs text-gray-500">{opt.description}</span>
              </div>
            </div>
            <input type="radio" value={opt.id} checked={method === opt.id}
              onChange={() => setMethod(opt.id)} name="payment_method_tiktok"
              className="w-5 h-5 cursor-pointer flex-shrink-0"
              style={{ accentColor: primaryColor, colorScheme: 'light' }} />
          </label>
        ))}
      </div>

      {/* Credit card fields */}
      <AnimatePresence>
        {method === 'credit_card' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="space-y-3 pt-2 pb-2">
              <input className={inputCls} placeholder="Número do cartão *" maxLength={19} style={{ borderRadius: '12px', fontSize: '13px' }} />
              <input className={inputCls} placeholder="Nome no cartão *" style={{ borderRadius: '12px', fontSize: '13px' }} />
              <div className="grid grid-cols-3 gap-3">
                <input className={inputCls} placeholder="Mês" maxLength={2} style={{ borderRadius: '12px', fontSize: '13px' }} />
                <input className={inputCls} placeholder="Ano" maxLength={4} style={{ borderRadius: '12px', fontSize: '13px' }} />
                <input className={inputCls} placeholder="CVV" maxLength={4} style={{ borderRadius: '12px', fontSize: '13px' }} />
              </div>
              {total > 0 && (
                <select className={inputCls} style={{ borderRadius: '12px', fontSize: '13px', cursor: 'pointer' }}>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map((n) => (
                    <option key={n} value={n}>{n}x de {fmt(total / n)}</option>
                  ))}
                </select>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  );
};

// ============================================================
// RIGHT PANEL (desktop only) — Resumo + Pagamento sticky
// ============================================================

interface RightPanelProps {
  primaryColor: string;
  theme: Record<string, unknown>;
  isPreview: boolean;
  checkoutData?: TemplateRenderProps['checkoutData'];
  orderId?: string;
  templateSlug: string;
  onSuccess?: (id: string) => void;
}

const RightPanel: React.FC<RightPanelProps> = ({
  primaryColor, theme, isPreview, checkoutData, orderId, templateSlug, onSuccess,
}) => {
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [coupon, setCoupon]           = useState('');
  const [applied, setApplied]         = useState(false);

  const products = checkoutData?.products ?? (isPreview ? [{ id: '1', name: 'Produto Exemplo', price: 197.00, quantity: 1, image: '' }] : []);
  const subtotal = checkoutData?.subtotal ?? (isPreview ? 197.00 : 0);
  const shipping = checkoutData?.shipping ?? 0;
  const discount = checkoutData?.discount ?? 0;
  const total    = checkoutData?.total    ?? (isPreview ? 197.00 : 0);
  const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">

      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Resumo do Pedido</h2>
        <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd"
              d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd" />
          </svg>
          Seus dados estão seguros e criptografados.
        </p>
      </div>

      {/* Products */}
      <div className="p-4 border-b border-gray-200">
        <button type="button"
          className="flex items-center justify-between w-full text-left mb-3"
          onClick={() => setSummaryOpen(!summaryOpen)}
        >
          <span className="font-medium text-gray-900">Produtos ({products.length})</span>
          {summaryOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
        </button>
        <AnimatePresence initial={false}>
          {summaryOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="space-y-4">
                {products.map((p) => (
                  <div key={p.id} className="flex gap-3">
                    <div className="relative flex-shrink-0">
                      {p.image
                        ? <img src={p.image} alt={p.name} className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                        : <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                      }
                      <div className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {p.quantity}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{p.name}</h3>
                      <p className="text-sm font-semibold mt-1" style={{ color: primaryColor }}>
                        {fmt(p.price * p.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Coupon */}
      <div className="p-4 border-b border-gray-200">
        {!applied ? (
          <div className="flex gap-2">
            <input placeholder="Adicionar cupom de desconto"
              className="flex-1 h-[40px] px-4 border border-gray-300 rounded-lg text-sm focus:outline-none"
              type="text" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
            <button type="button" onClick={() => coupon && setApplied(true)}
              className="px-4 h-[40px] bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
              Aplicar
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <Tag className="w-4 h-4" />
              <span className="font-medium">{coupon}</span>
            </div>
            <button type="button" onClick={() => { setApplied(false); setCoupon(''); }}
              className="text-xs text-red-500 hover:text-red-700">Remover</button>
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium text-gray-900">{fmt(subtotal)}</span>
        </div>
        {shipping > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Frete</span>
            <span className="font-medium text-gray-900">{fmt(shipping)}</span>
          </div>
        )}
        {discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-green-600">Desconto</span>
            <span className="text-green-600 font-medium">- {fmt(discount)}</span>
          </div>
        )}
        <div className="border-t border-gray-200 pt-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-gray-900">{fmt(total)}</span>
          </div>
        </div>
      </div>

      {/* Payment */}
      <div className="border-t border-gray-200 p-6">
        <PaymentSection
          primaryColor={primaryColor} theme={theme} total={total}
          isPreview={isPreview} orderId={orderId}
          templateSlug={templateSlug} onSuccess={onSuccess}
        />
      </div>
    </div>
  );
};

// ============================================================
// MOBILE PROGRESS BAR
// ============================================================

const MobileProgressBar: React.FC<{ primaryColor: string }> = ({ primaryColor }) => {
  const segments = [primaryColor, '#06b6d4', '#8b5cf6', primaryColor, '#06b6d4', '#ec4899'];
  return (
    <div className="flex gap-1 my-4">
      {segments.map((color, i) => (
        <div key={i} className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      ))}
    </div>
  );
};

// ============================================================
// MOBILE RESUMO ACCORDION
// ============================================================

interface MobileResumoProps {
  primaryColor: string;
  checkoutData?: TemplateRenderProps['checkoutData'];
  isPreview: boolean;
}

const MobileResumo: React.FC<MobileResumoProps> = ({ primaryColor, checkoutData, isPreview }) => {
  const [open, setOpen] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [applied, setApplied] = useState(false);

  const products = checkoutData?.products ?? (isPreview ? [{ id: '1', name: 'Produto Exemplo', price: 197.00, quantity: 1, image: '' }] : []);
  const subtotal = checkoutData?.subtotal ?? (isPreview ? 197.00 : 0);
  const shipping = checkoutData?.shipping ?? 0;
  const total    = checkoutData?.total    ?? (isPreview ? 197.00 : 0);
  const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button type="button"
        className="flex items-center justify-between w-full px-4 py-4 text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-gray-500" />
          <span className="font-semibold text-gray-900 text-sm">Resumo do Pedido</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-gray-900">{fmt(total)}</span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-gray-200">
            <div className="p-4 space-y-4">
              {products.map((p) => (
                <div key={p.id} className="flex gap-3">
                  <div className="relative flex-shrink-0">
                    {p.image
                      ? <img src={p.image} alt={p.name} className="w-14 h-14 object-cover rounded-lg border border-gray-200" />
                      : <div className="w-14 h-14 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                    }
                    <div className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {p.quantity}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: primaryColor }}>
                      {fmt(p.price * p.quantity)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Coupon */}
              {!applied ? (
                <div className="flex gap-2">
                  <input placeholder="Adicionar cupom de desconto"
                    className="flex-1 h-[40px] px-3 border border-gray-300 rounded-lg text-sm focus:outline-none"
                    value={coupon} onChange={(e) => setCoupon(e.target.value)} />
                  <button type="button" onClick={() => coupon && setApplied(true)}
                    className="px-3 h-[40px] bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                    Aplicar
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <Tag className="w-4 h-4" />
                    <span className="font-medium">{coupon}</span>
                  </div>
                  <button type="button" onClick={() => { setApplied(false); setCoupon(''); }}
                    className="text-xs text-red-500">Remover</button>
                </div>
              )}

              <div className="border-t border-gray-200 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{fmt(subtotal)}</span>
                </div>
                {shipping > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Frete</span>
                    <span className="font-medium">{fmt(shipping)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-gray-900">{fmt(total)}</span>
                </div>
              </div>
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
  orderId, checkoutData, theme, checkoutConfig, templateConfig,
  isPreview = false, isMobile = false, onPaymentSuccess,
}) => {
  // Prioriza config tipada; fallback para theme legado
  const primaryColor =
    checkoutConfig?.buttons.primaryBg ??
    (theme.primaryColor as string) ??
    '#EE1D52';
  const scarcityEnabled =
    checkoutConfig?.scarcity.enabled ??
    ((theme.showCountdownTimer as boolean) !== false);
  const noticeBarEnabled =
    checkoutConfig?.noticeBar.enabled ??
    (theme.noticeBarEnabled as boolean) ??
    false;

  // Collapsed state para mobile
  const [addressOpen, setAddressOpen] = useState(false);
  const [cpfOpen, setCpfOpen]         = useState(false);
  const [cpfValue, setCpfValue]       = useState('');

  const total = checkoutData?.total ?? (isPreview ? 197.00 : 0);
  const fmt   = (v: number) => `R$ ${v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

  return (
    <div
      className="w-full min-w-0 overflow-x-hidden"
      style={{
        fontFamily: (theme.fontFamily as string) || '"Plus Jakarta Sans", sans-serif',
        backgroundColor: 'rgb(255,255,255)',
      }}
    >
      {noticeBarEnabled && <NoticeBar theme={theme as Record<string, unknown>} />}

      <div className="min-h-fit py-6 md:py-8">
        <div className="w-full relative">
          <div
            className="px-4 max-w-[1280px] mx-auto"
            style={{ paddingBottom: isMobile ? '96px' : '32px', paddingLeft: isMobile ? '16px' : undefined, paddingRight: isMobile ? '16px' : undefined }}
          >

            {/* COUNTDOWN — sempre visível */}
            {scarcityEnabled && (
              <CountdownBar
                primaryColor={checkoutConfig?.scarcity.bgColor ?? primaryColor}
                scarcityConfig={checkoutConfig?.scarcity}
              />
            )}

            {/* ══════════════════════════════════════════
                DESKTOP LAYOUT
                Mostrado quando NÃO é mobile (prop) e viewport lg+
            ══════════════════════════════════════════ */}
            {!isMobile && (
              <div className="hidden lg:flex lg:gap-4">

                {/* LEFT COL */}
                <div className="flex-1 space-y-3">

                  {/* Endereço */}
                  <div className="bg-white p-4 sm:p-6 border border-gray-200"
                    style={{ borderRadius: '12px', borderColor: 'rgb(229,231,235)' }}>
                    <h3 className="font-semibold mb-4" style={{ color: 'rgb(17,24,39)' }}>Endereço de Entrega</h3>
                    <ShippingForm theme={theme} />
                  </div>

                  {/* CPF */}
                  <div className="bg-white p-4 sm:p-6 border border-gray-200"
                    style={{ borderRadius: '12px', borderColor: 'rgb(229,231,235)' }}>
                    <h3 className="font-semibold mb-4" style={{ color: 'rgb(17,24,39)' }}>CPF / CNPJ</h3>
                    <input className={inputCls} placeholder="000.000.000-00" maxLength={14}
                      style={{ borderRadius: '12px', fontSize: '13px' }} />
                  </div>

                  {/* Contato */}
                  <div className="bg-white p-4 sm:p-6 border border-gray-200"
                    style={{ borderRadius: '12px', borderColor: 'rgb(229,231,235)' }}>
                    <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'rgb(17,24,39)' }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Informações de Contato
                    </h3>
                    <ContactForm theme={theme} />
                  </div>

                </div>

                {/* RIGHT COL — sticky */}
                <div className="w-[400px] shrink-0">
                  <div className="sticky top-4">
                    <RightPanel
                      primaryColor={primaryColor} theme={theme} isPreview={isPreview}
                      checkoutData={checkoutData} orderId={orderId}
                      templateSlug={templateConfig.slug} onSuccess={onPaymentSuccess}
                    />
                  </div>
                </div>

              </div>
            )}

            {/* ══════════════════════════════════════════
                MOBILE LAYOUT
                Mostrado SEMPRE quando isMobile=true (editor)
                OU em viewports < lg (dispositivos reais)
                Ordem: countdown → address → CPF → progress
                       → resumo → contato → pagamento
            ══════════════════════════════════════════ */}
            {isMobile ? (
              /* Editor mobile preview: sempre renderizado */
              <div className="space-y-3">
                {/* 1. Endereço colapsável */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <button type="button"
                    className="w-full flex items-center justify-between px-4 py-4"
                    onClick={() => setAddressOpen(!addressOpen)}
                  >
                    <div className="flex items-center gap-2 text-gray-700">
                      {!addressOpen && <Plus className="w-4 h-4" style={{ color: primaryColor }} />}
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">
                        {addressOpen ? 'Endereço de Entrega' : 'Adicionar endereço de entrega'}
                      </span>
                    </div>
                    {addressOpen
                      ? <ChevronUp className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />
                    }
                  </button>
                  <AnimatePresence initial={false}>
                    {addressOpen && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }}
                        exit={{ height: 0 }} className="overflow-hidden border-t border-gray-200">
                        <div className="p-4"><ShippingForm theme={theme} /></div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 2. CPF colapsável */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <button type="button"
                    className="w-full flex items-center justify-between px-4 py-4"
                    onClick={() => setCpfOpen(!cpfOpen)}
                  >
                    <div className="flex items-center gap-2 text-gray-700">
                      {!cpfOpen && <Plus className="w-4 h-4" style={{ color: primaryColor }} />}
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">
                        {cpfOpen ? 'CPF / CNPJ' : 'Adicionar CPF'}
                      </span>
                    </div>
                    {cpfOpen
                      ? <ChevronUp className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />
                    }
                  </button>
                  <AnimatePresence initial={false}>
                    {cpfOpen && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }}
                        exit={{ height: 0 }} className="overflow-hidden border-t border-gray-200">
                        <div className="p-4">
                          <input className={inputCls} placeholder="000.000.000-00" maxLength={14}
                            value={cpfValue} onChange={(e) => setCpfValue(formatCpf(e.target.value))}
                            style={{ borderRadius: '12px', fontSize: '13px' }} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 3. Progress bar */}
                <MobileProgressBar primaryColor={primaryColor} />

                {/* 4. Resumo do Pedido accordion */}
                <MobileResumo primaryColor={primaryColor} checkoutData={checkoutData} isPreview={isPreview} />

                {/* 5. Informações de Contato */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Informações de Contato
                  </h3>
                  <ContactForm theme={theme} />
                </div>

                {/* 6. Forma de pagamento */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <PaymentSection
                    primaryColor={primaryColor} theme={theme} total={total}
                    isPreview={isPreview} orderId={orderId}
                    templateSlug={templateConfig.slug} onSuccess={onPaymentSuccess}
                  />
                </div>
              </div>
            ) : (
              /* Dispositivos reais mobile: breakpoint CSS */
              <div className="lg:hidden space-y-3">
                {/* 1. Endereço colapsável */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <button type="button"
                    className="w-full flex items-center justify-between px-4 py-4"
                    onClick={() => setAddressOpen(!addressOpen)}
                  >
                    <div className="flex items-center gap-2 text-gray-700">
                      {!addressOpen && <Plus className="w-4 h-4" style={{ color: primaryColor }} />}
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">
                        {addressOpen ? 'Endereço de Entrega' : 'Adicionar endereço de entrega'}
                      </span>
                    </div>
                    {addressOpen
                      ? <ChevronUp className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />
                    }
                  </button>
                  <AnimatePresence initial={false}>
                    {addressOpen && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }}
                        exit={{ height: 0 }} className="overflow-hidden border-t border-gray-200">
                        <div className="p-4"><ShippingForm theme={theme} /></div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 2. CPF colapsável */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <button type="button"
                    className="w-full flex items-center justify-between px-4 py-4"
                    onClick={() => setCpfOpen(!cpfOpen)}
                  >
                    <div className="flex items-center gap-2 text-gray-700">
                      {!cpfOpen && <Plus className="w-4 h-4" style={{ color: primaryColor }} />}
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">
                        {cpfOpen ? 'CPF / CNPJ' : 'Adicionar CPF'}
                      </span>
                    </div>
                    {cpfOpen
                      ? <ChevronUp className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />
                    }
                  </button>
                  <AnimatePresence initial={false}>
                    {cpfOpen && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }}
                        exit={{ height: 0 }} className="overflow-hidden border-t border-gray-200">
                        <div className="p-4">
                          <input className={inputCls} placeholder="000.000.000-00" maxLength={14}
                            value={cpfValue} onChange={(e) => setCpfValue(formatCpf(e.target.value))}
                            style={{ borderRadius: '12px', fontSize: '13px' }} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 3. Progress bar */}
                <MobileProgressBar primaryColor={primaryColor} />

                {/* 4. Resumo accordion */}
                <MobileResumo primaryColor={primaryColor} checkoutData={checkoutData} isPreview={isPreview} />

                {/* 5. Informações de Contato */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Informações de Contato
                  </h3>
                  <ContactForm theme={theme} />
                </div>

                {/* 6. Forma de pagamento */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <PaymentSection
                    primaryColor={primaryColor} theme={theme} total={total}
                    isPreview={isPreview} orderId={orderId}
                    templateSlug={templateConfig.slug} onSuccess={onPaymentSuccess}
                  />
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Botão fixo no fundo — mobile */}
      <div
        className={isMobile ? 'fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-50' : 'lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-50'}
        style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}
      >
        <motion.button type="button"
          className="w-full h-[52px] text-white font-semibold"
          style={{ backgroundColor: primaryColor, borderRadius: '9999px', border: 'none', cursor: 'pointer' }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { if (isPreview) onPaymentSuccess?.('preview'); }}
        >
          Finalizar pedido{total > 0 ? ` • ${fmt(total)}` : ''}
        </motion.button>
      </div>
    </div>
  );
};

export default TikTokTemplate;
