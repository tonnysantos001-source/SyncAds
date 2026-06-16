/**
 * MinimalStepPayment — Step de pagamento do checkout minimalista
 *
 * FUNCIONALIDADES REAIS:
 *   - Recebe customerData + addressData do MinimalTemplate (estado elevado)
 *   - Estado controlado de todos os campos do cartão
 *   - Máscaras: número do cartão, validade, CVV
 *   - Validação Luhn do cartão antes de submeter
 *   - Parcelamento dinâmico (1x–12x) baseado no total real
 *   - usePaymentProcessor → fluxo real: Order → split → Transaction → Edge Function
 *   - PIX → redireciona /pix/:orderId/:txId
 *   - Cartão/Boleto → redireciona /checkout/success/:txId
 *   - Preview mode seguro (sem tocar no banco)
 *   - Erros inline + erro global acima do botão
 *
 * @version 3.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Smartphone, FileText, CheckCircle,
  Lock, ChevronLeft, ShieldCheck, AlertCircle, Loader2,
} from 'lucide-react';
import { checkoutMonitor } from '@/lib/checkoutMonitor';
import type { CheckoutData } from '@/types/checkout.types';
import {
  usePaymentProcessor,
  type CheckoutPaymentMethod,
} from '@/hooks/usePaymentProcessor';
import type { CustomerData, ButtonCfg } from './MinimalStepCustomer';
import type { AddressData } from './MinimalStepShipping';
import {
  formatCardNumber,
  formatExpiry,
  validateCardNumber,
  validateExpiry,
} from '@/utils/checkoutValidators';

interface CardState {
  number: string;
  holderName: string;
  expiry: string;
  cvv: string;
  installments: number;
}

interface MinimalStepPaymentProps {
  theme: Record<string, unknown>;
  isPreview: boolean;
  checkoutData?: CheckoutData;
  orderId?: string;
  onBack: () => void;
  onSuccess?: (orderId: string) => void;
  primaryColor: string;
  buttonCfg?: ButtonCfg;
  templateSlug: string;
  initialMethod?: CheckoutPaymentMethod;
  /** Dados do cliente (coletados na etapa 1) */
  customerData: CustomerData;
  /** Dados de endereço (coletados na etapa 2) */
  addressData: AddressData;
  appliedCouponCode?: string;
}

const METHODS = [
  {
    id: 'PIX' as CheckoutPaymentMethod,
    label: 'PIX',
    description: 'Aprovação instantânea',
    icon: Smartphone,
    color: '#16a34a',
  },
  {
    id: 'CREDIT_CARD' as CheckoutPaymentMethod,
    label: 'Cartão de Crédito',
    description: 'Parcele em até 12x sem juros',
    icon: CreditCard,
    color: '#6366f1',
  },
  {
    id: 'BOLETO' as CheckoutPaymentMethod,
    label: 'Boleto Bancário',
    description: 'Vencimento em 3 dias',
    icon: FileText,
    color: '#d97706',
  },
];

export const MinimalStepPayment: React.FC<MinimalStepPaymentProps> = ({
  theme, isPreview, checkoutData, orderId, onBack, onSuccess,
  primaryColor, buttonCfg, templateSlug, initialMethod,
  customerData, addressData, appliedCouponCode,
}) => {
  const [method, setMethod] = useState<CheckoutPaymentMethod>(initialMethod || 'PIX');
  const [card, setCard] = useState<CardState>({
    number: '', holderName: '', expiry: '', cvv: '', installments: 1,
  });
  const [cardErrors, setCardErrors] = useState<Partial<Record<keyof CardState, string>>>({});

  const total = checkoutData?.total ?? 0;

  // ── Parcelamento dinâmico ─────────────────────────────────
  const installmentOptions = useMemo(() => {
    if (total <= 0) return [{ value: 1, label: '1x sem juros' }];
    return Array.from({ length: 12 }, (_, i) => i + 1).map(n => ({
      value: n,
      label: `${n}x de R$ ${(total / n).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')} sem juros`,
    }));
  }, [total]);

  // ── usePaymentProcessor ───────────────────────────────────
  const { processPayment, processing, error: paymentError } = usePaymentProcessor({
    orderId: orderId ?? '',
    total,
    templateSlug,
  });

  // ── Validação do cartão ───────────────────────────────────
  const validateCard = (): boolean => {
    const errs: Partial<Record<keyof CardState, string>> = {};
    if (!validateCardNumber(card.number)) errs.number = 'Número de cartão inválido';
    if (!card.holderName.trim()) errs.holderName = 'Nome do titular obrigatório';
    if (!validateExpiry(card.expiry)) errs.expiry = 'Validade inválida ou expirada';
    if (card.cvv.length < 3) errs.cvv = 'CVV inválido';
    setCardErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Finalizar pagamento ───────────────────────────────────
  const handleFinalize = async () => {
    if (isPreview) {
      onSuccess?.(orderId || 'preview');
      return;
    }

    if (method === 'CREDIT_CARD' && !validateCard()) return;

    checkoutMonitor.paymentAttempt(method, templateSlug, orderId);

    const [month, yearShort] = card.expiry.split('/');

    await processPayment({
      paymentMethod: method,
      customerData: {
        name: customerData.name.trim(),
        email: customerData.email.trim(),
        phone: customerData.phone,
        document: customerData.document,
      },
      addressData: {
        zipCode: addressData.zipCode,
        street: addressData.street.trim(),
        number: addressData.number.trim(),
        complement: addressData.complement.trim(),
        neighborhood: addressData.neighborhood.trim(),
        city: addressData.city.trim(),
        state: addressData.state.trim(),
      },
      ...(method === 'CREDIT_CARD'
        ? {
            cardData: {
              number: card.number,
              holderName: card.holderName.trim(),
              expirationMonth: month,
              expirationYear: yearShort ? `20${yearShort}` : '',
              cvv: card.cvv,
              installments: card.installments,
              cpf: customerData.document,
            },
          }
        : {}),
      items: checkoutData?.products,
      couponCode: appliedCouponCode || null,
      discount: checkoutData?.discount || 0,
    });
  };

  // ── estilos ───────────────────────────────────────────────
  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: '100%', height: '45px', padding: '0 12px',
    borderRadius: '8px',
    border: `1px solid ${hasError ? '#ef4444' : (theme.inputBorderColor as string) || '#E5E7EB'}`,
    backgroundColor: hasError ? '#fff5f5' : (theme.inputBackgroundColor as string) || '#ffffff',
    color: (theme.textColor as string) || '#111827',
    fontSize: '13px',
    fontFamily: '"Rubik", sans-serif',
    outline: 'none',
  });

  const errorTxt: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '4px',
    fontSize: '11px', color: '#ef4444', marginTop: '4px',
    fontFamily: '"Rubik", sans-serif',
  };

  const clearCardError = (field: keyof CardState) => {
    if (cardErrors[field]) setCardErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
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
              onClick={() => { setMethod(m.id); setCardErrors({}); }}
              className="w-full text-left flex items-center gap-3 p-3 border-2 transition-all"
              style={{
                borderRadius: '8px',
                borderColor: isSelected ? primaryColor : (theme.inputBorderColor as string) || '#e5e7eb',
                backgroundColor: isSelected ? `${primaryColor}12` : '#fff',
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

      {/* Campos expandidos por método */}
      <AnimatePresence mode="wait">

        {/* PIX */}
        {method === 'PIX' && (
          <motion.div
            key="pix"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-green-50 border border-green-200 p-4 text-center overflow-hidden"
            style={{ borderRadius: '8px' }}
          >
            <Smartphone className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-green-800">Clique em "Finalizar Compra" para gerar o QR Code PIX</p>
            <p className="text-xs text-green-600 mt-1">Aprovação instantânea</p>
          </motion.div>
        )}

        {/* BOLETO */}
        {method === 'BOLETO' && (
          <motion.div
            key="boleto"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-orange-50 border border-orange-200 p-4 text-center overflow-hidden"
            style={{ borderRadius: '8px' }}
          >
            <FileText className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-orange-800">Clique em "Finalizar Compra" para gerar o Boleto</p>
            <p className="text-xs text-orange-600 mt-1">Vencimento em 3 dias úteis • Enviado por email</p>
          </motion.div>
        )}

        {/* CARTÃO */}
        {method === 'CREDIT_CARD' && (
          <motion.div
            key="credit"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            {/* Número do cartão */}
            <div>
              <input
                style={inputStyle(!!cardErrors.number)}
                placeholder="Número do cartão"
                inputMode="numeric"
                maxLength={19}
                value={card.number}
                autoComplete="cc-number"
                onChange={(e) => {
                  setCard(prev => ({ ...prev, number: formatCardNumber(e.target.value) }));
                  clearCardError('number');
                }}
              />
              {cardErrors.number && <div style={errorTxt}><AlertCircle style={{ width: '11px', height: '11px' }} />{cardErrors.number}</div>}
            </div>

            {/* Nome + Validade */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  style={inputStyle(!!cardErrors.holderName)}
                  placeholder="Nome no cartão"
                  value={card.holderName}
                  autoComplete="cc-name"
                  onChange={(e) => {
                    setCard(prev => ({ ...prev, holderName: e.target.value.toUpperCase() }));
                    clearCardError('holderName');
                  }}
                />
                {cardErrors.holderName && <div style={errorTxt}><AlertCircle style={{ width: '11px', height: '11px' }} />{cardErrors.holderName}</div>}
              </div>
              <div>
                <input
                  style={inputStyle(!!cardErrors.expiry)}
                  placeholder="MM/AA"
                  inputMode="numeric"
                  maxLength={5}
                  value={card.expiry}
                  autoComplete="cc-exp"
                  onChange={(e) => {
                    setCard(prev => ({ ...prev, expiry: formatExpiry(e.target.value) }));
                    clearCardError('expiry');
                  }}
                />
                {cardErrors.expiry && <div style={errorTxt}><AlertCircle style={{ width: '11px', height: '11px' }} />{cardErrors.expiry}</div>}
              </div>
            </div>

            {/* CVV + Parcelamento */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  style={inputStyle(!!cardErrors.cvv)}
                  placeholder="CVV"
                  inputMode="numeric"
                  maxLength={4}
                  type="password"
                  value={card.cvv}
                  autoComplete="cc-csc"
                  onChange={(e) => {
                    setCard(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '') }));
                    clearCardError('cvv');
                  }}
                />
                {cardErrors.cvv && <div style={errorTxt}><AlertCircle style={{ width: '11px', height: '11px' }} />{cardErrors.cvv}</div>}
              </div>
              <div>
                <select
                  style={{ ...inputStyle(), cursor: 'pointer' }}
                  value={card.installments}
                  onChange={(e) => setCard(prev => ({ ...prev, installments: Number(e.target.value) }))}
                >
                  {installmentOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Segurança */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <ShieldCheck className="w-4 h-4 text-green-500" />
        <span>Pagamento 100% seguro e criptografado</span>
      </div>

      {/* Erro global de pagamento */}
      {paymentError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{paymentError}</p>
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-3">
        {/* Voltar */}
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 px-4 py-3 font-medium text-sm"
          style={{
            height: '45px',
            borderRadius: buttonCfg?.primaryRadius ?? '8px',
            fontFamily: '"Inter", sans-serif',
            border: `1px solid ${(theme.inputBorderColor as string) || '#d1d5db'}`,
            backgroundColor: 'transparent',
            cursor: 'pointer',
            color: (theme.textColor as string) || '#374151',
          }}
          disabled={processing}
        >
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>

        {/* Finalizar */}
        {(buttonCfg?.pulse ?? true) && (
          <style>{`@keyframes checkoutPulse { 0%, 100% { box-shadow: 0 0 0 0 ${(buttonCfg?.checkoutBg ?? primaryColor)}66 } 50% { box-shadow: 0 0 0 8px transparent } }`}</style>
        )}
        <motion.button
          type="button"
          onClick={handleFinalize}
          disabled={processing}
          className="flex-1 flex items-center justify-center gap-2 font-bold py-3 text-sm"
          style={{
            height: '45px',
            backgroundColor: processing ? '#9ca3af' : (buttonCfg?.checkoutBg ?? primaryColor),
            color: buttonCfg?.checkoutText ?? (theme.buttonTextColor as string) ?? '#ffffff',
            border: 'none',
            fontFamily: '"Inter", sans-serif',
            cursor: processing ? 'not-allowed' : 'pointer',
            borderRadius: buttonCfg?.checkoutRadius ?? '8px',
            animation: (!processing && (buttonCfg?.pulse ?? true)) ? 'checkoutPulse 2s ease infinite' : undefined,
          }}
          whileHover={{ opacity: processing ? 1 : 0.92 }}
          whileTap={{ scale: processing ? 1 : 0.98 }}
        >
          {processing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
          ) : (
            <><Lock className="w-4 h-4" /> Finalizar Compra</>
          )}
        </motion.button>
      </div>

    </div>
  );
};
