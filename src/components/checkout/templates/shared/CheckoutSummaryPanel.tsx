/**
 * CheckoutSummaryPanel — Painel de Resumo do Pedido (v2)
 *
 * - Sticky: para antes do footer (position sticky, top: 24px)
 * - Total em verde (#16a34a), maior e bold
 * - Border-radius 12px, shadow leve, padding 20px
 * - Campo cupom: input + botão inline
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Tag, Truck, Package } from 'lucide-react';
import type { CheckoutData } from '@/types/checkout.types';
import type { CheckoutConfig } from '@/types/checkout-config.types';

interface CheckoutSummaryPanelProps {
  checkoutData?: CheckoutData;
  theme: Record<string, unknown>;
  /** Config tipada do store — substitui campos legados do theme */
  checkoutConfig?: CheckoutConfig;
  isPreview?: boolean;
  collapsibleOnMobile?: boolean;
  totalPrefix?: string;
  totalColor?: string;

  // Props de cupom
  onApplyCoupon?: (code: string) => Promise<{ success: boolean; discountAmount?: number; error?: string }>;
  onRemoveCoupon?: () => void;
  appliedCouponCode?: string;
  couponError?: string;

  // Props de cashback
  availableCashback?: number;
  useCashback?: boolean;
  onToggleCashback?: (checked: boolean) => void;
  potentialCashback?: number;
}

// Produto de preview
const PREVIEW_PRODUCTS = [
  { id: '1', name: 'Produto Exemplo', price: 197.00, quantity: 1, image: '' },
];

export const CheckoutSummaryPanel: React.FC<CheckoutSummaryPanelProps> = ({
  checkoutData,
  theme,
  checkoutConfig,
  isPreview = false,
  collapsibleOnMobile = false,
  totalPrefix,
  totalColor,
  onApplyCoupon,
  onRemoveCoupon,
  appliedCouponCode,
  couponError,
  availableCashback: propAvailableCashback = 0,
  useCashback: propUseCashback = false,
  onToggleCashback: propOnToggleCashback,
  potentialCashback: propPotentialCashback = 0,
}) => {
  const [couponCode, setCouponCode]     = useState(appliedCouponCode || '');
  const [loading, setLoading]           = useState(false);
  const [localError, setLocalError]     = useState('');
  const [isExpanded, setIsExpanded]       = useState(() => (checkoutConfig?.cart.display ?? 'open') !== 'closed');

  // Sincronizar se appliedCouponCode mudar
  React.useEffect(() => {
    if (appliedCouponCode) {
      setCouponCode(appliedCouponCode);
    } else {
      setCouponCode('');
    }
  }, [appliedCouponCode]);

  const handleApply = async () => {
    if (!couponCode) return;
    setLoading(true);
    setLocalError('');
    if (onApplyCoupon) {
      const res = await onApplyCoupon(couponCode);
      if (!res.success) {
        setLocalError(res.error || 'Erro ao aplicar cupom');
      }
    }
    setLoading(false);
  };

  const handleRemove = () => {
    setCouponCode('');
    setLocalError('');
    if (onRemoveCoupon) {
      onRemoveCoupon();
    }
  };

  const products = checkoutData?.products ?? (isPreview ? PREVIEW_PRODUCTS : []);
  const subtotal  = checkoutData?.subtotal ?? (isPreview ? 197.00 : 0);
  const shipping  = checkoutData?.shipping ?? (isPreview ? 15.00 : 0);
  const couponDiscount = checkoutData?.couponDiscount ?? 0;
  const cashbackDiscount = checkoutData?.cashbackDiscount ?? 0;
  const paymentMethodDiscount = checkoutData?.paymentMethodDiscount ?? 0;
  const discount  = (couponDiscount > 0 || cashbackDiscount > 0 || paymentMethodDiscount > 0)
    ? 0
    : (checkoutData?.discount ?? 0);
  const total     = checkoutData?.total     ?? (isPreview ? 212.00 : 0);

  // Sincronização de Cashback
  const availableCashback = checkoutData?.availableCashback ?? propAvailableCashback;
  const useCashback = checkoutData?.useCashback ?? propUseCashback;
  const onToggleCashback = checkoutData?.onToggleCashback ?? propOnToggleCashback;
  const potentialCashback = checkoutData?.potentialCashback ?? propPotentialCashback;

  // Resolve: store (novo) > theme (legado)
  const primaryColor         = checkoutConfig?.buttons.checkoutBg
                              ?? checkoutConfig?.buttons.primaryBg
                              ?? (theme.primaryColor as string)
                              ?? '#0B1320';
  const cartBorderColor      = checkoutConfig?.cart.borderColor
                              ?? (theme.cartBorderColor as string)
                              ?? '#E5E7EB';
  const cartBgColor          = (theme.cartBackgroundColor as string) ?? '#ffffff';
  const effectiveTotalColor  = totalColor ?? (theme.totalColor as string) ?? '#16a34a';
  const effectiveTotalPrefix = totalPrefix ?? (theme.totalPrefix as string) ?? '';
  const couponEnabled        = checkoutConfig?.cart.couponEnabled ?? true;
  // Quantity badge colors
  const qtyCircleColor       = checkoutConfig?.cart.quantityCircleColor ?? '#6B7280';
  const qtyTextColor         = checkoutConfig?.cart.quantityTextColor   ?? '#ffffff';

  const formatCurrency = (v: number) =>
    `R$ ${v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

  const cardStyle: React.CSSProperties = {
    backgroundColor: cartBgColor,
    borderRadius: '12px',
    border: `1px solid ${cartBorderColor}`,
    boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
    position: 'sticky',
    top: '24px',
    overflow: 'hidden',
  };

  return (
    <div style={cardStyle}>

      {/* ── HEADER ─────────────────────────────────────── */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${cartBorderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
            Resumo ({products.length})
          </span>
          {isExpanded
            ? <ChevronUp style={{ width: '14px', height: '14px', color: '#9CA3AF' }} />
            : <ChevronDown style={{ width: '14px', height: '14px', color: '#9CA3AF' }} />
          }
        </button>
      </div>

      {/* ── BODY ───────────────────────────────────────── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={collapsibleOnMobile ? { height: 0, opacity: 0 } : false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Campo de cupom */}
              {couponEnabled && !appliedCouponCode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Tag
                        style={{
                          position: 'absolute', left: '10px', top: '50%',
                          transform: 'translateY(-50%)', width: '14px', height: '14px', color: '#9CA3AF',
                        }}
                      />
                      <input
                        style={{
                          width: '100%',
                          height: '38px',
                          paddingLeft: '30px',
                          paddingRight: '10px',
                          borderRadius: '7px',
                          border: `1px solid ${(theme.inputBorderColor as string) || cartBorderColor}`,
                          backgroundColor: (theme.inputBackgroundColor as string) || '#fff',
                          fontSize: '13px',
                          color: '#111827',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                        placeholder="Código de desconto"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApply}
                      disabled={loading || !couponCode}
                      style={{
                        height: '38px',
                        paddingLeft: '14px',
                        paddingRight: '14px',
                        backgroundColor: primaryColor,
                        color: '#fff',
                        border: 'none',
                        borderRadius: '7px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: loading || !couponCode ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'opacity 0.15s',
                        opacity: loading || !couponCode ? 0.6 : 1,
                      }}
                      onMouseOver={(e) => {
                        if (!loading && couponCode) e.currentTarget.style.opacity = '0.85';
                      }}
                      onMouseOut={(e) => {
                        if (!loading && couponCode) e.currentTarget.style.opacity = '1';
                      }}
                    >
                      {loading ? 'Aplicando...' : 'Aplicar'}
                    </button>
                  </div>
                  {(localError || couponError) && (
                    <span style={{ fontSize: '12px', color: '#ef4444', marginLeft: '2px' }}>
                      {localError || couponError}
                    </span>
                  )}
                </div>
              ) : couponEnabled && (
                <div
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
                    borderRadius: '7px', padding: '8px 12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#16a34a' }}>
                    <Tag style={{ width: '14px', height: '14px' }} />
                    <span style={{ fontWeight: '600' }}>{appliedCouponCode}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemove}
                    style={{ background: 'none', border: 'none', fontSize: '12px', color: '#ef4444', cursor: 'pointer' }}
                  >
                    Remover
                  </button>
                </div>
              )}
              {availableCashback > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#f0fdf4',
                    border: '1px dashed #34d399',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    marginTop: '4px',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '600', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Cashback Disponível
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#065f46' }}>
                      {formatCurrency(availableCashback)}
                    </span>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={useCashback}
                      onChange={(e) => onToggleCashback && onToggleCashback(e.target.checked)}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: '#059669',
                        cursor: 'pointer',
                      }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#047857' }}>
                      Resgatar
                    </span>
                  </label>
                </div>
              )}

              {/* Separador */}
              <div style={{ height: '1px', backgroundColor: cartBorderColor }} />

              {/* Produtos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {products.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <Package style={{ width: '28px', height: '28px', color: '#D1D5DB', margin: '0 auto 6px' }} />
                    <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>Nenhum produto</p>
                  </div>
                ) : (
                  products.map((p) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Imagem com badge de quantidade */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div
                          style={{
                            width: '52px', height: '52px', borderRadius: '8px',
                            border: `1px solid ${cartBorderColor}`,
                            backgroundColor: '#F9FAFB',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden',
                          }}
                        >
                          {p.image
                            ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <Package style={{ width: '20px', height: '20px', color: '#D1D5DB' }} />
                          }
                        </div>
                        {/* Badge de quantidade */}
                        <span
                          style={{
                            position: 'absolute', top: '-6px', right: '-6px',
                            minWidth: '18px', height: '18px',
                            backgroundColor: qtyCircleColor,
                            color: qtyTextColor,
                            borderRadius: '50%',
                            fontSize: '10px', fontWeight: '700',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1.5px solid #fff',
                            lineHeight: 1,
                            padding: '0 2px',
                          }}
                        >
                          {p.quantity}
                        </span>
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: '500', color: '#111827', margin: '0 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.name}
                        </p>
                        <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                          {formatCurrency(p.price)} / un
                        </p>
                      </div>

                      {/* Preço total */}
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', flexShrink: 0, margin: 0 }}>
                        {formatCurrency(p.price * p.quantity)}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Separador */}
              <div style={{ height: '1px', backgroundColor: cartBorderColor }} />

              {/* Totais */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Subtotal */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>Produtos</span>
                  <span style={{ fontSize: '13px', color: '#374151' }}>{formatCurrency(subtotal)}</span>
                </div>

                {/* Frete */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Truck style={{ width: '13px', height: '13px' }} /> Frete
                  </span>
                  <span style={{ fontSize: '13px', color: shipping === 0 ? '#16a34a' : '#374151', fontWeight: shipping === 0 ? '500' : '400' }}>
                    {shipping === 0 ? 'Grátis' : `+ ${formatCurrency(shipping)}`}
                  </span>
                </div>

                {/* Desconto genérico */}
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#16a34a' }}>Desconto</span>
                    <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '500' }}>- {formatCurrency(discount)}</span>
                  </div>
                )}

                {/* Desconto de Cupom */}
                {couponDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#16a34a' }}>Desconto (Cupom)</span>
                    <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '500' }}>- {formatCurrency(couponDiscount)}</span>
                  </div>
                )}

                {/* Desconto de Forma de Pagamento */}
                {paymentMethodDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#16a34a' }}>Desconto (Forma de Pagamento)</span>
                    <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '500' }}>- {formatCurrency(paymentMethodDiscount)}</span>
                  </div>
                )}

                {/* Desconto de Cashback */}
                {cashbackDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#059669', fontWeight: '500' }}>Cashback Utilizado</span>
                    <span style={{ fontSize: '13px', color: '#059669', fontWeight: '600' }}>- {formatCurrency(cashbackDiscount)}</span>
                  </div>
                )}

                {/* Separador e Total */}
                <div
                  style={{
                    borderTop: `1px solid ${cartBorderColor}`,
                    paddingTop: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '2px',
                  }}
                >
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>Total</span>
                  <div style={{ textAlign: 'right' }}>
                    {effectiveTotalPrefix && (
                      <span style={{ fontSize: '11px', color: '#9CA3AF', marginRight: '4px' }}>
                        {effectiveTotalPrefix}
                      </span>
                    )}
                    <span style={{ fontSize: '20px', fontWeight: '700', color: effectiveTotalColor }}>
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                {/* Acúmulo Estimado de Cashback */}
                {potentialCashback > 0 && (
                  <div
                    style={{
                      marginTop: '12px',
                      backgroundColor: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>🎉</span>
                    <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: '500', textAlign: 'center' }}>
                      Ganhe <strong style={{ color: '#1e3a8a' }}>{formatCurrency(potentialCashback)}</strong> de cashback com este pedido!
                    </span>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
