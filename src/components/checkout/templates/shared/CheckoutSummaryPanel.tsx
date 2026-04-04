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

interface CheckoutSummaryPanelProps {
  checkoutData?: CheckoutData;
  theme: Record<string, unknown>;
  isPreview?: boolean;
  collapsibleOnMobile?: boolean;
  totalPrefix?: string;
  totalColor?: string;
}

// Produto de preview
const PREVIEW_PRODUCTS = [
  { id: '1', name: 'Produto Exemplo', price: 197.00, quantity: 1, image: '' },
];

export const CheckoutSummaryPanel: React.FC<CheckoutSummaryPanelProps> = ({
  checkoutData,
  theme,
  isPreview = false,
  collapsibleOnMobile = false,
  totalPrefix,
  totalColor,
}) => {
  const [couponCode, setCouponCode]     = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [isExpanded, setIsExpanded]       = useState(true);

  const products = checkoutData?.products ?? (isPreview ? PREVIEW_PRODUCTS : []);
  const subtotal  = checkoutData?.subtotal ?? (isPreview ? 197.00 : 0);
  const shipping  = checkoutData?.shipping ?? (isPreview ? 15.00 : 0);
  const discount  = checkoutData?.discount ?? 0;
  const total     = checkoutData?.total     ?? (isPreview ? 212.00 : 0);

  const primaryColor          = (theme.primaryColor as string) || '#0B1320';
  const effectiveTotalColor   = totalColor || (theme.totalColor as string) || '#16a34a';
  const effectiveTotalPrefix  = totalPrefix || (theme.totalPrefix as string) || '';

  const formatCurrency = (v: number) =>
    `R$ ${v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

  const cardStyle: React.CSSProperties = {
    backgroundColor: (theme.cartBackgroundColor as string) || '#ffffff',
    borderRadius: '12px',
    border: `1px solid ${(theme.cartBorderColor as string) || '#E5E7EB'}`,
    boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
    // Sticky — para antes do footer com `self-start` no pai
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
          borderBottom: `1px solid ${(theme.cartBorderColor as string) || '#E5E7EB'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
          Resumo ({products.length})
        </span>
        {collapsibleOnMobile && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
            className="lg:hidden"
          >
            {isExpanded
              ? <ChevronUp style={{ width: '16px', height: '16px', color: '#6B7280' }} />
              : <ChevronDown style={{ width: '16px', height: '16px', color: '#6B7280' }} />
            }
          </button>
        )}
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
              {!couponApplied ? (
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
                        border: `1px solid ${(theme.inputBorderColor as string) || '#D1D5DB'}`,
                        backgroundColor: (theme.inputBackgroundColor as string) || '#fff',
                        fontSize: '13px',
                        color: '#111827',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      placeholder="Código de desconto"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => couponCode && setCouponApplied(true)}
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
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'opacity 0.15s',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
                    onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    Aplicar
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
                    borderRadius: '7px', padding: '8px 12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#16a34a' }}>
                    <Tag style={{ width: '14px', height: '14px' }} />
                    <span style={{ fontWeight: '600' }}>{couponCode}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setCouponApplied(false); setCouponCode(''); }}
                    style={{ background: 'none', border: 'none', fontSize: '12px', color: '#ef4444', cursor: 'pointer' }}
                  >
                    Remover
                  </button>
                </div>
              )}

              {/* Separador */}
              <div style={{ height: '1px', backgroundColor: (theme.cartBorderColor as string) || '#E5E7EB' }} />

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
                      {/* Imagem */}
                      <div
                        style={{
                          width: '48px', height: '48px', borderRadius: '8px',
                          border: `1px solid ${(theme.cartBorderColor as string) || '#E5E7EB'}`,
                          backgroundColor: '#F9FAFB', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        {p.image
                          ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <Package style={{ width: '20px', height: '20px', color: '#D1D5DB' }} />
                        }
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: '500', color: '#111827', margin: '0 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.name}
                        </p>
                        <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                          Qtd: {p.quantity}
                        </p>
                      </div>

                      {/* Preço */}
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', flexShrink: 0, margin: 0 }}>
                        {formatCurrency(p.price * p.quantity)}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Separador */}
              <div style={{ height: '1px', backgroundColor: (theme.cartBorderColor as string) || '#E5E7EB' }} />

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

                {/* Desconto */}
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#16a34a' }}>Desconto</span>
                    <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '500' }}>- {formatCurrency(discount)}</span>
                  </div>
                )}

                {/* Separador e Total */}
                <div
                  style={{
                    borderTop: `1px solid ${(theme.cartBorderColor as string) || '#E5E7EB'}`,
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
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
