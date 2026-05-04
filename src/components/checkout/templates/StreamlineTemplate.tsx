/**
 * StreamlineTemplate — Checkout Streamline (Black Friday / Split-stepper)
 *
 * Layout Desktop: 3 colunas [Identificação+Entrega | Pagamento+Benefits | Resumo sticky]
 * Layout Mobile:  Stack vertical na ordem correta
 * Cor:    Vermelho (primaryColor)
 *
 * @version 2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Clock, Tag, Package, Star, Check, ChevronRight, Minus, Plus } from 'lucide-react';
import { checkoutMonitor } from '@/lib/checkoutMonitor';
import { MinimalStepCustomer } from './shared/steps/MinimalStepCustomer';
import { MinimalStepShipping } from './shared/steps/MinimalStepShipping';
import { MinimalStepPayment } from './shared/steps/MinimalStepPayment';
import type { TemplateRenderProps } from '@/types/checkout.types';
import type { CheckoutConfig } from '@/types/checkout-config.types';
import { NoticeBar } from '@/components/checkout/NoticeBar';

// ─── helpers ────────────────────────────────────────────────
const fmt = (v: number) =>
  `R$ ${v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

// ─── COUNTDOWN BAR (timer real com localStorage) ────────────
const CountdownBar: React.FC<{ primaryColor: string; scarcityConfig?: CheckoutConfig['scarcity'] }> = ({
  primaryColor, scarcityConfig,
}) => {
  const durationMinutes = scarcityConfig?.durationMinutes ?? 15;
  const storageKey = scarcityConfig?.storageKey ?? 'streamline_countdown_v1';

  const [time, setTime] = useState({ h: '00', m: String(durationMinutes).padStart(2,'0'), s: '00' });

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    let expiry: Date;
    if (stored) {
      expiry = new Date(stored);
    } else {
      expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + durationMinutes);
      localStorage.setItem(storageKey, expiry.toISOString());
    }
    const tick = () => {
      const diff = expiry.getTime() - Date.now();
      if (diff <= 0) { setTime({ h: '00', m: '00', s: '00' }); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime({
        h: String(h).padStart(2, '0'),
        m: String(m).padStart(2, '0'),
        s: String(s).padStart(2, '0'),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [storageKey, durationMinutes]);

  return (
    <div
      className="w-full py-2.5 flex items-center justify-center gap-2"
      style={{ backgroundColor: primaryColor }}
    >
      <span className="text-sm font-medium text-white">Oferta termina em:</span>
      <div className="flex items-center gap-1 ml-1">
        <span className="font-bold text-white" style={{ fontSize: '24px' }}>{time.h}</span>
        <span className="text-xs text-white">h</span>
        <span className="text-white mx-0.5">:</span>
        <span className="font-bold text-white" style={{ fontSize: '24px' }}>{time.m}</span>
        <span className="text-xs text-white">m</span>
        <span className="text-white mx-0.5">:</span>
        <span className="font-bold text-white" style={{ fontSize: '24px' }}>{time.s}</span>
        <span className="text-xs text-white">s</span>
      </div>
    </div>
  );
};

// ─── STEP HEADER NUMBER ─────────────────────────────────────
const StepBadge: React.FC<{ num: number; active: boolean; primaryColor: string }> = ({
  num, active, primaryColor,
}) => (
  <span
    className="w-5 h-5 text-white text-[10px] font-bold flex items-center justify-center mr-1 flex-shrink-0"
    style={{ backgroundColor: active ? primaryColor : 'rgb(142,142,142)', borderRadius: '8px' }}
  >
    {num}
  </span>
);

// ─── STEP 2 — ENTREGA (desabilitado) ────────────────────────
const StepEntregaDisabled: React.FC<{ primaryColor: string; active: boolean }> = ({
  primaryColor, active,
}) => (
  <div
    className="p-4 sm:p-5 w-full rounded-xl bg-white"
    style={{ border: '1px solid rgb(229,231,235)', opacity: active ? 1 : 0.5 }}
  >
    <div className="mb-2">
      <h2 className="flex items-center" style={{ fontSize: '18px', fontWeight: 700 }}>
        <StepBadge num={2} active={active} primaryColor={primaryColor} />
        Entrega
      </h2>
      <p className="text-[11px] mt-2 leading-tight" style={{ color: 'rgb(142,142,142)' }}>
        Para calcular o frete é necessário preencher todos os campos acima.
      </p>
    </div>
  </div>
);

// ─── STEP 3 — PAGAMENTO (desabilitado) ──────────────────────
const StepPagamentoDisabled: React.FC<{ primaryColor: string; active: boolean }> = ({
  primaryColor, active,
}) => (
  <div
    className="p-4 sm:p-5 w-full rounded-xl bg-white"
    style={{
      border: '1px solid rgb(229,231,235)',
      opacity: active ? 1 : 0.4,
      pointerEvents: active ? 'auto' : 'none',
    }}
  >
    <div className="mb-2">
      <h2 className="flex items-center" style={{ fontSize: '18px', fontWeight: 700 }}>
        <StepBadge num={3} active={active} primaryColor={primaryColor} />
        Pagamento
      </h2>
      <p className="text-[11px] mt-2 leading-tight" style={{ color: 'rgb(142,142,142)' }}>
        Para finalizar seu pedido escolha uma forma de pagamento
      </p>
    </div>
    {!active && (
      <p className="text-sm mt-2" style={{ color: primaryColor }}>
        Complete as etapas anteriores para prosseguir
      </p>
    )}
  </div>
);

// ─── BENEFITS CARD ──────────────────────────────────────────
const BenefitsCard: React.FC<{ primaryColor: string }> = ({ primaryColor }) => (
  <div
    className="rounded-xl p-6 flex flex-row flex-wrap items-start"
    style={{ backgroundColor: `${primaryColor}0a`, gap: '24px' }}
  >
    {/* Frete Grátis */}
    <div className="flex flex-row items-start" style={{ gap: '12px' }}>
      <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center">
        <Truck className="w-5 h-5" style={{ color: primaryColor }} />
      </div>
      <div className="flex-1">
        <h3 className="font-medium" style={{ color: primaryColor, fontSize: '16px' }}>
          Frete Grátis
        </h3>
        <p className="mt-1" style={{ fontSize: '14px', color: 'rgb(55,65,81)' }}>
          Para todo o Brasil em compras acima de R$ 199
        </p>
      </div>
    </div>

    {/* Entrega Rápida */}
    <div className="flex flex-row items-start" style={{ gap: '12px' }}>
      <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center">
        <Clock className="w-5 h-5" style={{ color: primaryColor }} />
      </div>
      <div className="flex-1">
        <h3 className="font-medium" style={{ color: primaryColor, fontSize: '16px' }}>
          Entrega Rápida
        </h3>
        <p className="mt-1" style={{ fontSize: '14px', color: 'rgb(55,65,81)' }}>
          Enviamos em até 24 horas após a confirmação
        </p>
      </div>
    </div>
  </div>
);

// ─── SUMMARY PANEL (com coupon + produtos + reviews) ────────
const SummaryPanel: React.FC<{
  checkoutData?: TemplateRenderProps['checkoutData'];
  isPreview: boolean;
  primaryColor: string;
  theme: Record<string, unknown>;
}> = ({ checkoutData, isPreview, primaryColor, theme }) => {
  const [coupon, setCoupon] = useState('');
  const [qtys, setQtys] = useState<Record<string, number>>({});

  const PREVIEW_PRODUCTS = [
    { id: '1', name: 'Produto de Demonstração 1', price: 199.98, quantity: 1, image: '' },
    { id: '2', name: 'Produto de Demonstração 2', price: 299.98, quantity: 2, image: '' },
  ];
  const products = checkoutData?.products ?? (isPreview ? PREVIEW_PRODUCTS : []);
  const subtotal = checkoutData?.subtotal ?? (isPreview ? 499.92 : 0);
  const shipping = checkoutData?.shipping ?? (isPreview ? 29.98 : 0);
  const total = checkoutData?.total ?? (isPreview ? 529.96 : 0);

  const getQty = (id: string, base: number) => qtys[id] ?? base;
  const changeQty = (id: string, base: number, delta: number) => {
    const next = Math.max(1, getQty(id, base) + delta);
    setQtys((prev) => ({ ...prev, [id]: next }));
  };

  const REVIEWS = [
    { name: 'Breno Santos', text: 'Compra rápida, fácil e sem dor de cabeça.' },
    { name: 'Luisa Romeiro', text: 'Muito satisfeita com a compra. Voltarei com certeza!' },
  ];

  return (
    <div
      className="self-start"
      style={{
        position: 'sticky',
        top: '24px',
        borderRadius: '12px',
        boxShadow: 'rgba(0,0,0,0.05) 0px 4px 12px',
        padding: '30px',
        backgroundColor: 'rgb(255,255,255)',
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      {/* Título */}
      <div className="flex items-center justify-between flex-wrap mb-4">
        <h3
          className="flex items-center gap-2"
          style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 500,
            fontSize: '18px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            lineHeight: 1,
          }}
        >
          Resumo<span className="font-bold">({products.length})</span>
        </h3>
      </div>

      {/* Cupom */}
      <div className="mb-5">
        <label
          className="block mb-2"
          style={{ fontFamily: 'Rubik, sans-serif', fontWeight: 400, fontSize: '13px', color: 'rgb(51,51,51)', lineHeight: 1 }}
        >
          Tem um cupom?
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
            <input
              className="w-full pl-9 h-9 border text-[13px] outline-none focus:ring-0"
              style={{
                borderColor: '#d0d0d0',
                borderRadius: '5px',
                fontFamily: 'Rubik, sans-serif',
                fontSize: '13px',
                backgroundColor: '#fff',
              }}
              placeholder="Código do cupom"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="h-9 px-4 text-xs border hover:bg-gray-50 transition-colors"
            style={{
              fontFamily: 'Rubik, sans-serif',
              color: 'rgb(79,52,41)',
              borderColor: '#d0d0d0',
              borderRadius: '5px',
              cursor: 'pointer',
              backgroundColor: '#fff',
            }}
          >
            Aplicar
          </button>
        </div>
      </div>

      {/* Box cinza — subtotal/frete/total */}
      <div
        className="rounded mb-5"
        style={{
          backgroundColor: 'rgb(244,246,248)',
          borderRadius: '4px',
          padding: '20px',
          fontFamily: 'Rubik, sans-serif',
          fontWeight: 500,
        }}
      >
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span style={{ fontSize: '12px', color: 'rgb(51,51,51)', lineHeight: 1.4 }}>Produtos</span>
            <span style={{ fontSize: '12px', color: 'rgb(51,51,51)', lineHeight: 1.4 }}>{fmt(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span style={{ fontSize: '12px', color: 'rgb(51,51,51)', lineHeight: 1.4 }}>
              🚚 Frete
            </span>
            <span style={{ fontSize: '12px', color: 'rgb(51,51,51)', lineHeight: 1.4 }}>
              + {fmt(shipping)}
            </span>
          </div>
          <div
            className="flex justify-between items-center pt-3 mt-1"
            style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}
          >
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '16px', color: 'rgb(68,196,133)', lineHeight: 1.2 }}>
              Total
            </span>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '16px', color: 'rgb(68,196,133)', lineHeight: 1.2 }}>
              {fmt(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Lista de produtos */}
      <div className="mb-5 flex flex-col gap-4">
        {products.map((p) => (
          <div key={p.id} className="flex gap-3">
            <div className="relative flex-shrink-0" style={{ width: '64px', height: '64px' }}>
              {(p as any).image ? (
                <img
                  src={(p as any).image}
                  alt={p.name}
                  className="w-full h-full object-cover"
                  style={{ borderRadius: '4px' }}
                />
              ) : (
                <div
                  className="w-full h-full bg-gray-100 flex items-center justify-center"
                  style={{ borderRadius: '4px' }}
                >
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ fontFamily: 'Rubik, sans-serif', fontWeight: 400, fontSize: '12px', color: 'rgb(51,51,51)', lineHeight: 1 }}>
                {p.name}
              </div>
              <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
                {/* qty controls */}
                <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                  <button
                    type="button"
                    className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-900 rounded-l-lg disabled:opacity-40"
                    disabled={getQty(p.id, p.quantity) <= 1}
                    onClick={() => changeQty(p.id, p.quantity, -1)}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-semibold w-7 text-center text-gray-900">
                    {getQty(p.id, p.quantity)}
                  </span>
                  <button
                    type="button"
                    className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-900 rounded-r-lg"
                    onClick={() => changeQty(p.id, p.quantity, 1)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span style={{ fontFamily: 'Rubik, sans-serif', fontWeight: 500, fontSize: '13px', color: 'rgb(51,51,51)' }}>
                  {fmt(p.price * getQty(p.id, p.quantity))}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reviews */}
      <div
        className="border overflow-hidden"
        style={{ backgroundColor: `${primaryColor}05`, borderColor: 'rgba(0,0,0,0.1)', borderRadius: '12px', padding: '1rem' }}
      >
        {REVIEWS.map((r, i) => (
          <div key={r.name}>
            <div className="py-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-0.5 mb-1">
                    {[...Array(5)].map((_, si) => (
                      <Star key={si} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <h3 className="font-semibold mb-1" style={{ color: primaryColor, fontSize: '16px' }}>
                    {r.name}
                  </h3>
                  <p className="mt-0" style={{ fontSize: '14px', color: 'rgb(55,65,81)' }}>{r.text}</p>
                </div>
              </div>
            </div>
            {i < REVIEWS.length - 1 && (
              <div className="border-t border-dotted my-0" style={{ borderColor: 'rgba(0,0,0,0.15)' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── FOOTER ─────────────────────────────────────────────────
const StreamlineFooter: React.FC<{ primaryColor: string }> = ({ primaryColor }) => {
  const PAYMENT_ICONS = ['visa', 'mastercard', 'elo', 'amex', 'discover', 'diners', 'aura', 'pix'];
  return (
    <footer
      className="w-full border-t bg-white"
      style={{ borderColor: 'rgb(229,231,235)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Ícones de pagamento */}
          <div className="space-y-3">
            <p className="text-center text-sm font-medium" style={{ color: 'rgb(107,114,128)' }}>
              Formas de Pagamento
            </p>
            <div className="flex flex-wrap justify-center items-center gap-2">
              {PAYMENT_ICONS.map((m) => (
                <img key={m} src={`/icones-pay/card-${m}.svg`} alt={m} className="h-6" />
              ))}
            </div>
          </div>

          {/* Site Seguro — VERMELHO (primaryColor) */}
          <div className="flex justify-center">
            <div
              className="flex items-center gap-2 px-3 py-1.5"
              style={{ backgroundColor: primaryColor, borderRadius: '9999px' }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} />
              <span className="text-sm" style={{ color: '#ffffff' }}>Site Seguro</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// ─── BANNER TOPO ─────────────────────────────────────────────
// Referência: desktop ~272px tall | mobile ~120px tall
// Imagens configuráveis via theme.bannerImageDesktop / theme.bannerImageMobile
// Quando nenhuma imagem está configurada → placeholder Black Friday

const BlackFridayPlaceholder: React.FC<{ height: number; primaryColor: string }> = ({ height, primaryColor }) => (
  <div
    style={{
      width: '100%',
      height: `${height}px`,
      background: 'linear-gradient(135deg, #111111 0%, #1a0000 40%, #0d0d0d 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 48px',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}
  >
    {/* Hex grid pattern */}
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.08 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="hex-bg" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
          <polygon
            points="30,4 56,18 56,46 30,60 4,46 4,18"
            fill="none"
            stroke={primaryColor}
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hex-bg)" />
    </svg>

    {/* Left: BLACK FRIDAY image-style text */}
    <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div
        style={{
          fontSize: height > 160 ? '14px' : '10px',
          color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase',
          letterSpacing: '2px',
        }}
      >
        Oferta Especial
      </div>
      <div
        style={{
          fontFamily: '"Impact", "Arial Black", sans-serif',
          fontWeight: 900,
          lineHeight: 1,
          textTransform: 'uppercase',
        }}
      >
        <div style={{ fontSize: height > 160 ? '48px' : '28px', color: '#ffffff', lineHeight: 1 }}>BLACK</div>
        <div style={{ fontSize: height > 160 ? '48px' : '28px', color: primaryColor, lineHeight: 1 }}>FRIDAY</div>
      </div>
    </div>

    {/* Right: discount badge */}
    <div style={{ zIndex: 1, textAlign: 'right' }}>
      <div
        style={{
          fontFamily: '"Impact", "Arial Black", sans-serif',
          fontWeight: 900,
          lineHeight: 1,
          color: primaryColor,
          fontSize: height > 160 ? '72px' : '40px',
          textShadow: `0 0 30px ${primaryColor}99`,
        }}
      >
        60%
      </div>
      <div style={{ fontSize: height > 160 ? '13px' : '9px', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '1px' }}>
        de desconto
      </div>
    </div>
  </div>
);

const HeroBanner: React.FC<{
  theme: Record<string, unknown>;
  isMobile?: boolean;
  isPreview?: boolean;
  primaryColor: string;
}> = ({ theme, isMobile, isPreview, primaryColor }) => {
  const enabled = (theme.heroBannerEnabled as boolean) !== false;
  if (!enabled) return null;

  const desktopSrc =
    (theme.bannerImageDesktop as string) ||
    (theme.bannerImage as string);
  const mobileSrc =
    (theme.bannerImageMobile as string) ||
    desktopSrc;

  // ─── Desktop banner (272px) — editor-aware + CSS fallback ──
  // !isMobile → renderiza no DOM com classe `hidden lg:block` (real devices)
  // isMobile  → não renderiza (editor preview mobile não deve ver desktop banner)

  // ─── Mobile banner (120px) — sempre renderizado
  // isMobile=true  → visível diretamente
  // isMobile=false → classe `block lg:hidden` garante visibilidade só em tela pequena

  /* REGRA DE VISIBILIDADE:
     isPreview=true  + isMobile=true  → mobile banner 120px (sem CSS classes)
     isPreview=true  + isMobile=false → desktop banner 272px (sem CSS classes — ignora lg:)
     isPreview=false (visitante real) → usa classes CSS lg: para responsividade */
  return (
    <>
      {isMobile ? (
        /* Mobile preview ou mobile real: banner 120px */
        <div className="w-full overflow-hidden" style={{ lineHeight: 0 }}>
          {mobileSrc ? (
            <img
              src={mobileSrc}
              alt="Banner da loja"
              style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <BlackFridayPlaceholder height={120} primaryColor={primaryColor} />
          )}
        </div>
      ) : isPreview ? (
        /* Editor preview DESKTOP: sem classes hidden, sempre visível */
        <div className="w-full overflow-hidden" style={{ lineHeight: 0 }}>
          {desktopSrc ? (
            <img
              src={desktopSrc}
              alt="Banner da loja"
              style={{ width: '100%', height: '272px', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <BlackFridayPlaceholder height={272} primaryColor={primaryColor} />
          )}
        </div>
      ) : (
        /* Visitante real: usa CSS lg: para responsividade */
        <>
          <div className="hidden lg:block w-full overflow-hidden" style={{ lineHeight: 0 }}>
            {desktopSrc ? (
              <img
                src={desktopSrc}
                alt="Banner da loja"
                style={{ width: '100%', height: '272px', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <BlackFridayPlaceholder height={272} primaryColor={primaryColor} />
            )}
          </div>
          <div className="block lg:hidden w-full overflow-hidden" style={{ lineHeight: 0 }}>
            {mobileSrc ? (
              <img
                src={mobileSrc}
                alt="Banner da loja"
                style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <BlackFridayPlaceholder height={120} primaryColor={primaryColor} />
            )}
          </div>
        </>
      )}
    </>
  );
};

// ─── MAIN ────────────────────────────────────────────────────
type SLStep = 1 | 2 | 3;

const StreamlineTemplate: React.FC<TemplateRenderProps> = ({
  orderId, checkoutData, theme, checkoutConfig, templateConfig, isPreview = false,
  isMobile = false, onStepChange, onPaymentSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<SLStep>(1);

  // Prioriza config tipada; fallback para theme legado
  const primaryColor =
    checkoutConfig?.buttons.primaryBg ??
    (theme.primaryColor as string) ??
    '#E60000';
  const scarcityEnabled =
    checkoutConfig?.scarcity.enabled ??
    ((theme.showCountdownTimer as boolean) !== false);

  const advance = (s: SLStep) => {
    setCurrentStep(s);
    onStepChange?.(s);
    checkoutMonitor.stepAdvance(s, templateConfig.slug, orderId);
  };

  // ─── col esquerda: steps 1 + 2 ─────────────────────────────
  const LeftColumn = (
    <div className="space-y-4">

      {/* STEP 1 — Identificação */}
      {currentStep === 1 ? (
        <div
          className="p-4 sm:p-5 w-full rounded-xl bg-white"
          style={{ border: `2px solid ${primaryColor}` }}
        >
          <div className="mb-4">
            <h2 className="flex items-center" style={{ fontSize: '18px', fontWeight: 700 }}>
              <StepBadge num={1} active primaryColor={primaryColor} />
              Identificação
            </h2>
            <p className="text-[11px] mt-2 leading-tight" style={{ color: 'rgb(142,142,142)' }}>
              Pedimos apenas as informações essenciais para concluir sua compra com segurança.
            </p>
          </div>
          <MinimalStepCustomer
            theme={theme}
            isPreview={isPreview}
            onNext={() => advance(2)}
            primaryColor={primaryColor}
          />
        </div>
      ) : (
        /* Step 1 concluído — resumo clicável */
        <div
          className="rounded-xl bg-white p-4 flex items-center justify-between cursor-pointer"
          style={{ border: `1.5px solid ${primaryColor}` }}
          onClick={() => advance(1)}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <Check className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Identificação</p>
              <p className="text-xs text-gray-500">maria@email.com • (11) 99999-9999</p>
            </div>
          </div>
          <button type="button" className="text-xs font-medium" style={{ color: primaryColor }}>
            Editar
          </button>
        </div>
      )}

      {/* STEP 2 — Entrega */}
      {currentStep === 2 ? (
        <div
          className="p-4 sm:p-5 w-full rounded-xl bg-white"
          style={{ border: `2px solid ${primaryColor}` }}
        >
          <div className="mb-4">
            <h2 className="flex items-center" style={{ fontSize: '18px', fontWeight: 700 }}>
              <StepBadge num={2} active primaryColor={primaryColor} />
              Entrega
            </h2>
            <p className="text-[11px] mt-2 leading-tight" style={{ color: 'rgb(142,142,142)' }}>
              Informe o endereço para calcular o frete.
            </p>
          </div>
          <MinimalStepShipping
            theme={theme}
            isPreview={isPreview}
            onNext={() => advance(3)}
            onBack={() => advance(1)}
            primaryColor={primaryColor}
          />
        </div>
      ) : (
        /* Step 2 desabilitado ou concluído */
        <StepEntregaDisabled primaryColor={primaryColor} active={currentStep > 2} />
      )}

    </div>
  );

  // ─── col do meio: step 3 + benefits ────────────────────────
  const MiddleColumn = (
    <div className="space-y-4">

      {/* STEP 3 — Pagamento */}
      {currentStep === 3 ? (
        <div
          className="p-4 sm:p-5 w-full rounded-xl bg-white"
          style={{ border: `2px solid ${primaryColor}` }}
        >
          <div className="mb-4">
            <h2 className="flex items-center" style={{ fontSize: '18px', fontWeight: 700 }}>
              <StepBadge num={3} active primaryColor={primaryColor} />
              Pagamento
            </h2>
            <p className="text-[11px] mt-2 leading-tight" style={{ color: 'rgb(142,142,142)' }}>
              Para finalizar seu pedido escolha uma forma de pagamento
            </p>
          </div>
          <MinimalStepPayment
            theme={theme}
            isPreview={isPreview}
            checkoutData={checkoutData}
            orderId={orderId}
            onBack={() => advance(2)}
            onSuccess={onPaymentSuccess}
            primaryColor={primaryColor}
            templateSlug={templateConfig.slug}
          />
        </div>
      ) : (
        <StepPagamentoDisabled primaryColor={primaryColor} active={false} />
      )}

      {/* Benefits card */}
      <BenefitsCard primaryColor={primaryColor} />

    </div>
  );

  // ─── MOBILE — stack completo ────────────────────────────────
  const MobileLayout = (
    <div className="space-y-4 px-4 pb-8">
      {/* Step 1 */}
      {currentStep === 1 ? (
        <div className="p-4 rounded-xl bg-white" style={{ border: `2px solid ${primaryColor}` }}>
          <div className="mb-4">
            <h2 className="flex items-center" style={{ fontSize: '18px', fontWeight: 700 }}>
              <StepBadge num={1} active primaryColor={primaryColor} />
              Identificação
            </h2>
            <p className="text-[11px] mt-2 leading-tight" style={{ color: 'rgb(142,142,142)' }}>
              Pedimos apenas as informações essenciais para concluir sua compra com segurança.
            </p>
          </div>
          <MinimalStepCustomer
            theme={theme}
            isPreview={isPreview}
            onNext={() => advance(2)}
            primaryColor={primaryColor}
          />
        </div>
      ) : (
        <div
          className="rounded-xl bg-white p-4 flex items-center justify-between cursor-pointer"
          style={{ border: `1.5px solid ${primaryColor}` }}
          onClick={() => advance(1)}
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: primaryColor }}>
              <Check className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Identificação</p>
              <p className="text-xs text-gray-500">maria@email.com</p>
            </div>
          </div>
          <button type="button" className="text-xs font-medium" style={{ color: primaryColor }}>Editar</button>
        </div>
      )}

      {/* Step 2 */}
      {currentStep === 2 ? (
        <div className="p-4 rounded-xl bg-white" style={{ border: `2px solid ${primaryColor}` }}>
          <div className="mb-4">
            <h2 className="flex items-center" style={{ fontSize: '18px', fontWeight: 700 }}>
              <StepBadge num={2} active primaryColor={primaryColor} />
              Entrega
            </h2>
          </div>
          <MinimalStepShipping
            theme={theme}
            isPreview={isPreview}
            onNext={() => advance(3)}
            onBack={() => advance(1)}
            primaryColor={primaryColor}
          />
        </div>
      ) : (
        <StepEntregaDisabled primaryColor={primaryColor} active={currentStep > 2} />
      )}

      {/* Step 3 */}
      {currentStep === 3 ? (
        <div className="p-4 rounded-xl bg-white" style={{ border: `2px solid ${primaryColor}` }}>
          <div className="mb-4">
            <h2 className="flex items-center" style={{ fontSize: '18px', fontWeight: 700 }}>
              <StepBadge num={3} active primaryColor={primaryColor} />
              Pagamento
            </h2>
          </div>
          <MinimalStepPayment
            theme={theme}
            isPreview={isPreview}
            checkoutData={checkoutData}
            orderId={orderId}
            onBack={() => advance(2)}
            onSuccess={onPaymentSuccess}
            primaryColor={primaryColor}
            templateSlug={templateConfig.slug}
          />
        </div>
      ) : (
        <StepPagamentoDisabled primaryColor={primaryColor} active={false} />
      )}

      {/* Benefits */}
      <BenefitsCard primaryColor={primaryColor} />
    </div>
  );

  // ─── DESKTOP — 3 colunas ────────────────────────────────────
  const DesktopLayout = (
    <div
      className="hidden lg:grid gap-6 mt-8 px-4 sm:px-6 lg:px-8 pb-8"
      style={{ gridTemplateColumns: '1fr 1fr minmax(280px, 353px)' }}
    >
      {/* Coluna 1 */}
      <div>{LeftColumn}</div>
      {/* Coluna 2 */}
      <div>{MiddleColumn}</div>
      {/* Coluna 3 — Resumo sticky */}
      <div>
        <SummaryPanel
          checkoutData={checkoutData}
          isPreview={isPreview}
          primaryColor={primaryColor}
          theme={theme}
        />
      </div>
    </div>
  );

  return (
    <div
      style={{
        fontFamily: checkoutConfig?.typography.fontFamily ?? (theme.fontFamily as string) ?? '"Inter", system-ui, sans-serif',
        backgroundColor: 'rgb(248,249,251)',
        minHeight: '100vh',
      }}
    >
      {/* Notice Bar */}
      {(checkoutConfig?.noticeBar.enabled ?? (theme.noticeBarEnabled as boolean)) && (
        <NoticeBar theme={theme as Record<string, unknown>} />
      )}

      {/* Countdown */}
      {scarcityEnabled && (
        <CountdownBar primaryColor={primaryColor} scarcityConfig={checkoutConfig?.scarcity} />
      )}

      {/* Banner topo — desktop 272px | mobile 120px */}
      <HeroBanner theme={theme} isMobile={isMobile} isPreview={isPreview} primaryColor={primaryColor} />

      {/* Conteúdo principal */}
      {isMobile ? MobileLayout : (
        <>
          {DesktopLayout}
          {/* Mobile fallback para dispositivos reais < lg */}
          <div className="lg:hidden">
            {MobileLayout}
          </div>
        </>
      )}

      {/* Footer */}
      <StreamlineFooter primaryColor={primaryColor} />
    </div>
  );
};

export default StreamlineTemplate;
