/**
 * OrderSummary — Resumo do Pedido
 *
 * Componente reconstruído após arquivo stub (114 bytes).
 * Exibe os produtos, totais, frete e desconto de forma clara e tipada.
 *
 * @version 1.0
 */

import React from 'react';
import { Package } from 'lucide-react';

interface OrderProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface OrderSummaryProps {
  checkoutData: {
    products?: OrderProduct[];
    subtotal?: number;
    total?: number;
    shipping?: number;
    discount?: number;
  };
  finalTotal?: number;
  theme?: Record<string, unknown>;
  isPreview?: boolean;
}

const formatCurrency = (value: number): string =>
  `R$ ${value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  checkoutData,
  finalTotal,
  theme = {},
  isPreview = false,
}) => {
  const products = checkoutData?.products ?? [];
  const subtotal = checkoutData?.subtotal ?? 0;
  const shipping = checkoutData?.shipping ?? 0;
  const discount = checkoutData?.discount ?? 0;
  const total = finalTotal ?? checkoutData?.total ?? 0;

  const primaryColor = (theme.primaryColor as string) || '#0082ec';

  return (
    <div style={{ fontFamily: 'inherit' }}>
      {/* Produtos */}
      <div style={{ marginBottom: '16px' }}>
        {products.length === 0 && isPreview && (
          <div
            style={{
              padding: '16px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Package size={20} color="#9ca3af" />
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Produto Exemplo</span>
            <span style={{ marginLeft: 'auto', fontSize: '14px', fontWeight: '600' }}>
              {formatCurrency(197)}
            </span>
          </div>
        )}

        {products.map((product) => (
          <div
            key={product.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 0',
              borderBottom: '1px solid #f3f4f6',
            }}
          >
            {/* Imagem ou ícone */}
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '8px',
                backgroundColor: '#f3f4f6',
                overflow: 'hidden',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Package size={20} color="#9ca3af" />
              )}
              {/* Badge de quantidade */}
              <div
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  backgroundColor: '#6b7280',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontSize: '10px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {product.quantity}
              </div>
            </div>

            {/* Nome e preço */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#111827',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {product.name}
              </p>
            </div>

            <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827', flexShrink: 0 }}>
              {formatCurrency(product.price * product.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Linha separadora */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px' }} />

      {/* Totais */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
          <span style={{ color: '#6b7280' }}>Subtotal</span>
          <span style={{ fontWeight: '500', color: '#111827' }}>{formatCurrency(subtotal)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
          <span style={{ color: '#6b7280' }}>Frete</span>
          <span style={{ fontWeight: '500', color: shipping === 0 ? '#16a34a' : '#111827' }}>
            {shipping === 0 ? 'Grátis' : formatCurrency(shipping)}
          </span>
        </div>

        {discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ color: '#16a34a' }}>Desconto</span>
            <span style={{ fontWeight: '500', color: '#16a34a' }}>-{formatCurrency(discount)}</span>
          </div>
        )}

        {/* Total final */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid #e5e7eb',
            marginTop: '4px',
          }}
        >
          <span style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>Total</span>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '20px', fontWeight: '800', color: primaryColor }}>
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
