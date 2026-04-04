/**
 * MinimalStepPayment — Step de pagamento para templates stepped
 * Suporta PIX / Cartão / Boleto com seleção visual
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Smartphone, FileText, CheckCircle,
  Lock, ChevronLeft, ShieldCheck,
} from 'lucide-react';
import { checkoutMonitor } from '@/lib/checkoutMonitor';
import type { CheckoutData } from '@/types/checkout.types';

type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'BOLETO';

interface MinimalStepPaymentProps {
  theme: Record<string, unknown>;
  isPreview: boolean;
  checkoutData?: CheckoutData;
  orderId?: string;
  onBack: () => void;
  onSuccess?: (orderId: string) => void;
  primaryColor: string;
  templateSlug: string;
}

const METHODS = [
  {
    id: 'PIX' as PaymentMethod,
    label: 'PIX',
    description: 'Aprovação instantânea',
    icon: Smartphone,
    color: '#16a34a',
  },
  {
    id: 'CREDIT_CARD' as PaymentMethod,
    label: 'Cartão de Crédito',
    description: 'Parcele em até 12x',
    icon: CreditCard,
    color: '#6366f1',
  },
  {
    id: 'BOLETO' as PaymentMethod,
    label: 'Boleto Bancário',
    description: 'Vencimento em 3 dias',
    icon: FileText,
    color: '#d97706',
  },
];

export const MinimalStepPayment: React.FC<MinimalStepPaymentProps> = ({
  theme, isPreview, checkoutData, orderId, onBack, onSuccess, primaryColor, templateSlug,
}) => {
  const [method, setMethod]           = useState<PaymentMethod>('PIX');
  const [installments, setInstallments] = useState(1);
  const [processing, setProcessing]   = useState(false);

  const total = checkoutData?.total ?? 0;

  const inputStyle: React.CSSProperties = {
    width: '100%', height: '45px', padding: '0 12px',
    borderRadius: '8px',
    border: `1px solid ${(theme.inputBorderColor as string) || '#E5E7EB'}`,
    backgroundColor: (theme.inputBackgroundColor as string) || '#ffffff',
    color: (theme.textColor as string) || '#111827',
    fontSize: '13px',
    fontFamily: '"Rubik", sans-serif',
    outline: 'none',
  };

  const handleFinalize = async () => {
    if (isPreview) {
      onSuccess?.(orderId || 'preview');
      return;
    }
    setProcessing(true);
    checkoutMonitor.paymentAttempt(method, templateSlug, orderId);
    try {
      await new Promise((r) => setTimeout(r, 1200)); // simulação
      checkoutMonitor.paymentSuccess(method, templateSlug, orderId);
      onSuccess?.(orderId || '');
    } catch (e) {
      checkoutMonitor.paymentError(method, String(e), templateSlug, orderId);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4 pt-2">

      {/* Seleção de método */}
      <div className="space-y-2">
        {METHODS.map((m) => {
          const isSelected = method === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              className="w-full text-left flex items-center gap-3 p-3 border-2 transition-all"
              style={{
                borderRadius: '8px',
                borderColor: isSelected ? primaryColor : (theme.inputBorderColor as string) || '#e5e7eb',
                backgroundColor: isSelected ? `${primaryColor}10` : '#fff',
                cursor: 'pointer',
              }}
            >
              <m.icon className="w-5 h-5 flex-shrink-0" style={{ color: isSelected ? primaryColor : '#9ca3af' }} />
              <div className="flex-1">
                <div className="text-sm font-semibold" style={{ color: isSelected ? primaryColor : '#111827' }}>
                  {m.label}
                </div>
                <div className="text-xs text-gray-500">{m.description}</div>
              </div>
              {isSelected && <CheckCircle className="w-5 h-5" style={{ color: primaryColor }} />}
            </button>
          );
        })}
      </div>

      {/* Cartão: campos adicionais */}
      <AnimatePresence>
        {method === 'CREDIT_CARD' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            <input style={inputStyle} placeholder="Número do cartão" maxLength={19} />
            <div className="grid grid-cols-2 gap-3">
              <input style={inputStyle} placeholder="Nome no cartão" />
              <input style={inputStyle} placeholder="MM/AA" maxLength={5} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input style={inputStyle} placeholder="CVV" maxLength={4} />
              {total > 0 && (
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={installments}
                  onChange={(e) => setInstallments(Number(e.target.value))}
                >
                  {[1,2,3,4,5,6].map((n) => (
                    <option key={n} value={n}>
                      {n}x de R$ {(total / n).toFixed(2).replace('.', ',')}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </motion.div>
        )}

        {method === 'PIX' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-green-50 border border-green-200 p-4 text-center"
            style={{ borderRadius: '8px' }}
          >
            <Smartphone className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-800">
              Clique em "Finalizar Compra" para gerar o QR Code PIX
            </p>
            <p className="text-xs text-green-600 mt-1">Aprovação instantânea</p>
          </motion.div>
        )}

        {method === 'BOLETO' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-orange-50 border border-orange-200 p-4 text-center"
            style={{ borderRadius: '8px' }}
          >
            <FileText className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-orange-800">
              Clique em "Finalizar Compra" para gerar o Boleto
            </p>
            <p className="text-xs text-orange-600 mt-1">Vencimento em 3 dias úteis</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Segurança */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <ShieldCheck className="w-4 h-4 text-green-500" />
        <span>Pagamento 100% seguro e criptografado</span>
      </div>

      {/* Botões */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 px-4 py-3 font-medium text-sm"
          style={{
            height: '45px',
            borderRadius: '8px',
            fontFamily: '"Inter", sans-serif',
            border: `1px solid ${(theme.inputBorderColor as string) || '#d1d5db'}`,
            backgroundColor: 'transparent',
            cursor: 'pointer',
            color: (theme.textColor as string) || '#374151',
          }}
        >
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>

        <motion.button
          type="button"
          onClick={handleFinalize}
          disabled={processing}
          className="flex-1 flex items-center justify-center gap-2 font-bold py-3 text-sm"
          style={{
            height: '45px',
            backgroundColor: processing ? '#9ca3af' : primaryColor,
            color: (theme.buttonTextColor as string) || '#ffffff',
            border: 'none',
            fontFamily: '"Inter", sans-serif',
            cursor: processing ? 'not-allowed' : 'pointer',
            borderRadius: '8px',
          }}
          whileHover={{ opacity: processing ? 1 : 0.92 }}
          whileTap={{ scale: processing ? 1 : 0.98 }}
        >
          <Lock className="w-4 h-4" />
          {processing ? 'Processando...' : 'Finalizar Compra'}
        </motion.button>
      </div>

    </div>
  );
};
