/**
 * PremiumTemplate — Estilo Shopify Pay
 *
 * Layout Shopify-inspired: Grid 1fr | divider | 1fr no desktop,
 * accordion de resumo no mobile.
 *
 * FUNCIONALIDADES REAIS:
 *   - Estado controlado em todos os campos (contato, endereço, pagamento)
 *   - useCepLookup (ViaCEP): preenche endereço ao digitar CEP
 *   - checkoutValidators: máscaras de CPF/CNPJ, telefone, cartão, validade
 *   - Validação completa inline antes de submeter
 *   - usePaymentProcessor: fluxo real → Order → split → Transaction → Edge Function
 *   - Parcelamento dinâmico baseado em checkoutData.total
 *   - Preview mode seguro (sem tocar no banco)
 *
 * @version 3.0 — Totalmente funcional e conectado ao banco de dados
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Lock, ChevronDown, ChevronUp, AlertCircle, Loader2 } from 'lucide-react';
import { checkoutMonitor } from '@/lib/checkoutMonitor';
import type { TemplateRenderProps } from '@/types/checkout.types';
import type { CheckoutConfig } from '@/types/checkout-config.types';
import { NoticeBar } from '@/components/checkout/NoticeBar';
import { useCepLookup } from '@/hooks/useCepLookup';
import { usePaymentProcessor } from '@/hooks/usePaymentProcessor';
import {
  formatCEP,
  formatCPFCNPJ,
  formatPhone,
  formatCardNumber,
  formatExpiry,
  validateEmail,
  validatePhone,
  validateCPFCNPJ,
  validateCEP,
  validateCardNumber,
  validateExpiry,
} from '@/utils/checkoutValidators';

// ============================================================
// TIPOS DE ESTADO DO FORMULÁRIO
// ============================================================

type PaymentMethodType = 'PIX' | 'CREDIT_CARD' | 'BOLETO';

interface ContactState {
  email: string;
  name: string;
  phone: string;
  document: string;
}

interface AddressState {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface CardState {
  number: string;
  holderName: string;
  expiry: string;
  cvv: string;
  installments: number;
}

type FormErrors = Record<string, string>;

const emptyContact = (): ContactState => ({ email: '', name: '', phone: '', document: '' });
const emptyAddress = (): AddressState => ({ cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '' });
const emptyCard = (): CardState => ({ number: '', holderName: '', expiry: '', cvv: '', installments: 1 });

// ============================================================
// COMPONENTE: INPUT BASE
// ============================================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

const Field = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-gray-600">{label}</label>}
      <input
        ref={ref}
        className={cn(
          'flex h-12 w-full rounded-lg border bg-white px-4 text-[13px]',
          'placeholder:text-gray-400 focus-visible:outline-none transition-colors font-inter',
          error
            ? 'border-red-400 focus:border-red-400 bg-red-50/30'
            : 'border-gray-200 focus:border-gray-400',
          className
        )}
        style={{ color: '#222222' }}
        {...props}
      />
      {error && (
        <span className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {error}
        </span>
      )}
    </div>
  )
);
Field.displayName = 'Field';

// ============================================================
// COMPONENTE: TIMER DE ESCASSEZ
// ============================================================

const TimerBar = ({ scarcityConfig }: { scarcityConfig?: CheckoutConfig['scarcity'] }) => {
  const durationMinutes = scarcityConfig?.durationMinutes ?? 14;
  const storageKey = scarcityConfig?.storageKey ?? 'premium_shopify_exp_v1';
  const [time, setTime] = React.useState({ h: '00', m: String(durationMinutes).padStart(2, '0'), s: '59' });

  React.useEffect(() => {
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
      setTime({
        h: String(Math.floor(diff / 3600000)).padStart(2, '0'),
        m: String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
        s: String(Math.floor((diff % 60000) / 1000)).padStart(2, '0'),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [storageKey, durationMinutes]);

  return (
    <div className="relative w-full py-3 px-4 flex items-center justify-center gap-2 rounded-xl" style={{ backgroundColor: 'rgb(243, 244, 246)' }}>
      <span className="text-sm font-medium text-gray-600">Oferta termina em:</span>
      <div className="flex items-center gap-2 ml-2">
        {[time.h, time.m, time.s].map((v, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-gray-900 font-bold">:</span>}
            <span className="font-bold text-[22px] text-gray-900">{v}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// COMPONENTE: FORMULÁRIO DE CONTATO (CONTROLADO)
// ============================================================

interface ContactFormProps {
  data: ContactState;
  errors: FormErrors;
  onChange: (field: keyof ContactState, value: string) => void;
}

const ContactForm: React.FC<ContactFormProps> = ({ data, errors, onChange }) => (
  <div className="mb-6">
    <h2 className="mb-4 font-semibold text-[19px] text-[#222222]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      Informações de contato
    </h2>
    <div className="space-y-3">
      <Field
        placeholder="Email"
        type="email"
        value={data.email}
        onChange={e => onChange('email', e.target.value)}
        error={errors.email}
        autoComplete="email"
      />
      <Field
        placeholder="Nome completo"
        value={data.name}
        onChange={e => onChange('name', e.target.value)}
        error={errors.name}
        autoComplete="name"
      />
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        {/* Telefone com bandeira */}
        <div className="flex flex-col gap-1">
          <div className={cn(
            'relative w-full border rounded-lg h-12 overflow-hidden transition-colors flex items-center bg-white',
            errors.phone ? 'border-red-400 bg-red-50/30' : 'border-gray-200 focus-within:border-gray-400'
          )}>
            <button type="button" className="h-full px-3 border-r border-gray-200 flex items-center gap-1.5 bg-transparent hover:bg-gray-50">
              <img src="https://flagcdn.com/w20/br.png" alt="BR" className="w-5 h-4 object-cover rounded-sm" />
              <span className="text-xs text-gray-500">+55</span>
            </button>
            <input
              className="flex-1 h-full bg-transparent px-3 text-[13px] outline-none"
              placeholder="(11) 96123-4567"
              type="tel"
              maxLength={15}
              style={{ color: '#222222' }}
              value={data.phone}
              onChange={e => onChange('phone', formatPhone(e.target.value))}
              autoComplete="tel"
            />
          </div>
          {errors.phone && (
            <span className="flex items-center gap-1 text-xs text-red-500">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />{errors.phone}
            </span>
          )}
        </div>
        <Field
          placeholder="CPF / CNPJ"
          inputMode="numeric"
          value={data.document}
          onChange={e => onChange('document', formatCPFCNPJ(e.target.value))}
          error={errors.document}
          maxLength={18}
          autoComplete="off"
        />
      </div>
    </div>
  </div>
);

// ============================================================
// COMPONENTE: FORMULÁRIO DE ENDEREÇO (CONTROLADO + CEP LOOKUP)
// ============================================================

interface ShippingFormProps {
  data: AddressState;
  errors: FormErrors;
  cepLoading: boolean;
  onChange: (field: keyof AddressState, value: string) => void;
  onCepBlur: () => void;
}

const ShippingForm: React.FC<ShippingFormProps> = ({ data, errors, cepLoading, onChange, onCepBlur }) => (
  <div className="mb-6">
    <h2 className="mb-4 font-semibold text-[19px] text-[#222222]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      Endereço de entrega
    </h2>
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <div className="relative">
          <Field
            placeholder="CEP"
            inputMode="numeric"
            value={data.cep}
            onChange={e => onChange('cep', formatCEP(e.target.value))}
            onBlur={onCepBlur}
            error={errors.cep}
            maxLength={9}
            autoComplete="postal-code"
          />
          {cepLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
          )}
        </div>
      </div>
      <Field
        placeholder="Rua / Logradouro"
        value={data.street}
        onChange={e => onChange('street', e.target.value)}
        error={errors.street}
        autoComplete="address-line1"
      />
      <Field
        placeholder="Bairro"
        value={data.neighborhood}
        onChange={e => onChange('neighborhood', e.target.value)}
        error={errors.neighborhood}
      />
      <Field
        placeholder="Complemento (opcional)"
        value={data.complement}
        onChange={e => onChange('complement', e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          placeholder="Número"
          value={data.number}
          onChange={e => onChange('number', e.target.value)}
          error={errors.number}
          autoComplete="address-line2"
        />
        <Field
          placeholder="Cidade"
          value={data.city}
          onChange={e => onChange('city', e.target.value)}
          error={errors.city}
          autoComplete="address-level2"
        />
      </div>
      <Field
        placeholder="Estado (UF)"
        value={data.state}
        onChange={e => onChange('state', e.target.value.toUpperCase().slice(0, 2))}
        error={errors.state}
        maxLength={2}
        autoComplete="address-level1"
      />
    </div>
  </div>
);

// ============================================================
// COMPONENTE: ITEM DE MÉTODO DE PAGAMENTO (ACCORDION)
// ============================================================

interface MethodItemProps {
  id: PaymentMethodType;
  label: string;
  isCreditCard?: boolean;
  method: PaymentMethodType;
  setMethod: (m: PaymentMethodType) => void;
  primaryColor: string;
  card: CardState;
  cardErrors: FormErrors;
  onCardChange: (field: keyof CardState, value: string | number) => void;
  total: number;
}

const MethodItem: React.FC<MethodItemProps> = ({
  id, label, isCreditCard, method, setMethod, primaryColor,
  card, cardErrors, onCardChange, total,
}) => {
  const isSelected = method === id;

  const installmentOptions = useMemo(() => {
    const maxInstallments = 12;
    return Array.from({ length: maxInstallments }, (_, i) => i + 1).map(n => ({
      value: n,
      label: `${n}x de R$ ${(total / n).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')} sem juros`,
    }));
  }, [total]);

  return (
    <div
      className={cn('border rounded-xl overflow-hidden transition-all mb-3', isSelected ? 'bg-white shadow-sm' : 'bg-[#F9FAFB] border-gray-200')}
      style={isSelected ? { borderColor: primaryColor } : {}}
    >
      <div className="flex items-center p-4 cursor-pointer gap-3" onClick={() => setMethod(id)}>
        {/* Radio */}
        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: isSelected ? primaryColor : '#D1D5DB' }}>
          {isSelected && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />}
        </div>
        <span className="font-semibold text-sm text-gray-900">{label}</span>
        {isCreditCard && (
          <div className="flex items-center gap-1.5 ml-2">
            <img src="/icones-pay/card-mastercard.svg" alt="Mastercard" className="h-4" />
            <img src="/icones-pay/card-visa.svg" alt="Visa" className="h-4" />
            <img src="/icones-pay/card-amex.svg" alt="Amex" className="h-4 hidden sm:block" />
            <img src="/icones-pay/card-elo.svg" alt="Elo" className="h-4 hidden sm:block" />
          </div>
        )}
        {id === 'BOLETO' && (
          <span className="ml-auto text-xs text-gray-500">Venc. 3 dias</span>
        )}
      </div>

      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 overflow-hidden"
          >
            {id === 'PIX' && (
              <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-center">
                <p className="text-sm font-semibold text-green-800">Aprovação instantânea</p>
                <p className="text-xs text-green-700 mt-1">O código Pix será gerado após clicar em Finalizar.</p>
              </div>
            )}
            {id === 'BOLETO' && (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-center">
                <p className="text-sm font-semibold text-amber-800">Boleto Bancário</p>
                <p className="text-xs text-amber-700 mt-1">O boleto será enviado para o seu email após finalizar.</p>
              </div>
            )}
            {id === 'CREDIT_CARD' && (
              <div className="space-y-3 mt-2">
                <Field
                  placeholder="Número do cartão"
                  inputMode="numeric"
                  maxLength={19}
                  value={card.number}
                  onChange={e => onCardChange('number', formatCardNumber(e.target.value))}
                  error={cardErrors.cardNumber}
                  autoComplete="cc-number"
                />
                <Field
                  placeholder="Nome impresso no cartão"
                  value={card.holderName}
                  onChange={e => onCardChange('holderName', e.target.value.toUpperCase())}
                  error={cardErrors.cardName}
                  autoComplete="cc-name"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    placeholder="Validade (MM/AA)"
                    inputMode="numeric"
                    maxLength={5}
                    value={card.expiry}
                    onChange={e => onCardChange('expiry', formatExpiry(e.target.value))}
                    error={cardErrors.cardExpiry}
                    autoComplete="cc-exp"
                  />
                  <Field
                    placeholder="CVV"
                    inputMode="numeric"
                    maxLength={4}
                    value={card.cvv}
                    onChange={e => onCardChange('cvv', e.target.value.replace(/\D/g, ''))}
                    error={cardErrors.cardCvv}
                    autoComplete="cc-csc"
                    type="password"
                  />
                </div>
                <select
                  className={cn(
                    'flex h-12 w-full rounded-lg border border-gray-200 bg-white px-4 text-[13px]',
                    'focus-visible:outline-none focus:border-gray-400 focus:ring-0 font-inter cursor-pointer text-[#222222]'
                  )}
                  value={card.installments}
                  onChange={e => onCardChange('installments', Number(e.target.value))}
                >
                  {installmentOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================
// COMPONENTE: PAINEL DE RESUMO DO PEDIDO
// ============================================================

const SummaryPanelContent = ({
  checkoutData, totalPrefix, primaryColor,
  onApplyCoupon, onRemoveCoupon, appliedCouponCode, couponError,
}: {
  checkoutData?: TemplateRenderProps['checkoutData'];
  totalPrefix: string;
  primaryColor: string;
  onApplyCoupon?: (code: string) => Promise<{ success: boolean; discountAmount?: number; error?: string }>;
  onRemoveCoupon?: () => void;
  appliedCouponCode?: string;
  couponError?: string;
}) => {
  const [couponCode, setCouponCode] = useState(appliedCouponCode || '');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
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

  const products = checkoutData?.products?.filter((p: any) => p.id !== 'shipping') ?? [];
  const subtotal = checkoutData?.subtotal ?? checkoutData?.total ?? 0;
  const shipping = checkoutData?.shipping ?? 0;
  const discount = checkoutData?.discount ?? 0;
  const total = checkoutData?.total ?? 0;

  return (
    <div className="w-full min-w-0 pt-0 lg:pt-[10px] rounded-xl font-inter space-y-4">
      {/* Bloco de Cupom de Desconto */}
      <div className="pb-3 border-b border-gray-200">
        {!appliedCouponCode ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={e => setCouponCode(e.target.value)}
                placeholder="Código de desconto"
                disabled={loading}
                className="flex-1 border border-gray-200 rounded-lg h-10 px-3 text-xs focus:outline-none focus:border-gray-400 bg-white"
              />
              <button
                type="button"
                onClick={handleApply}
                disabled={loading || !couponCode}
                className="px-4 h-10 rounded-lg text-xs font-semibold text-white transition-opacity disabled:opacity-60"
                style={{ backgroundColor: primaryColor }}
              >
                {loading ? 'Aplicando...' : 'Aplicar'}
              </button>
            </div>
            {(localError || couponError) && (
              <span className="text-[11px] text-red-500 ml-1">
                {localError || couponError}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-2 px-3">
            <span className="text-xs font-bold text-green-600 uppercase tracking-wider">🎟️ {appliedCouponCode}</span>
            <button
              type="button"
              onClick={handleRemove}
              className="text-xs font-semibold text-red-500 hover:text-red-600"
            >
              Remover
            </button>
          </div>
        )}
      </div>

      <div className="mb-5 flex flex-col gap-5">
        {products.length === 0 ? (
          <div className="flex gap-4">
            <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg border border-gray-200 animate-pulse" />
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
            </div>
          </div>
        ) : (
          products.map((it: any, idx: number) => (
            <div key={idx} className="flex gap-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                <div className="w-full h-full bg-white flex items-center justify-center rounded-lg border border-gray-200 overflow-hidden">
                  {it.image ? <img src={it.image} alt={it.name} className="w-full h-full object-cover" /> : (
                    <span className="text-2xl">🛍️</span>
                  )}
                </div>
                {it.quantity > 1 && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#6B7280' }}>
                    {it.quantity}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-[14px] font-medium text-[#222222] leading-tight flex-1 line-clamp-2">{it.name || 'Produto'}</h4>
                  <p className="text-[14px] font-semibold text-[#222222] flex-shrink-0">R$ {(it.price * (it.quantity || 1)).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</p>
                </div>
                {it.variant && <p className="text-xs text-gray-500">{it.variant}</p>}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-gray-200 pt-4 space-y-2 text-[14px]">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{totalPrefix} {subtotal.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between" style={{ color: primaryColor }}>
            <span>Desconto</span>
            <span>-{totalPrefix} {discount.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-600">
          <span>Frete</span>
          <span>{shipping === 0 ? <span className="font-medium text-green-600">Grátis</span> : `${totalPrefix} ${shipping.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`}</span>
        </div>
        <div className="flex justify-between font-bold text-[16px] text-[#222222] pt-2 border-t border-gray-200">
          <span>Total</span>
          <span>{totalPrefix} {total.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// COMPONENTE: MOBILE SUMMARY ACCORDION
// ============================================================

const MobileSummaryAccordion = ({
  checkoutData, totalPrefix, primaryColor,
  onApplyCoupon, onRemoveCoupon, appliedCouponCode, couponError,
}: {
  checkoutData?: TemplateRenderProps['checkoutData'];
  totalPrefix: string;
  primaryColor: string;
  onApplyCoupon?: (code: string) => Promise<{ success: boolean; discountAmount?: number; error?: string }>;
  onRemoveCoupon?: () => void;
  appliedCouponCode?: string;
  couponError?: string;
}) => {
  const [open, setOpen] = useState(false);
  const total = checkoutData?.total ?? 0;

  return (
    <div className="border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
      <button type="button" onClick={() => setOpen(!open)} className="w-full px-4 py-4 flex items-center justify-between">
        <span className="flex items-center gap-2 text-[#111827] text-sm font-medium">
          🛒 Resumo do pedido
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
        <span className="text-[16px] font-bold text-[#111827]">R$ {total.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-6 pt-2">
              <SummaryPanelContent
                checkoutData={checkoutData}
                totalPrefix={totalPrefix}
                primaryColor={primaryColor}
                onApplyCoupon={onApplyCoupon}
                onRemoveCoupon={onRemoveCoupon}
                appliedCouponCode={appliedCouponCode}
                couponError={couponError}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================
// TEMPLATE PRINCIPAL
// ============================================================

const PremiumTemplate: React.FC<TemplateRenderProps> = ({
  orderId, checkoutData, theme, checkoutConfig, templateConfig,
  isPreview = false, isMobile = false, onPaymentSuccess,
  onApplyCoupon, onRemoveCoupon, appliedCouponCode, couponError,
}) => {
  // ── Configurações visuais ──────────────────────────────────
  const primaryColor = checkoutConfig?.buttons.primaryBg ?? (theme.primaryColor as string) ?? '#10B981';
  const fontFamily = checkoutConfig?.typography.fontFamily ?? (theme.fontFamily as string) ?? 'Inter, system-ui, sans-serif';
  const bgColor = (theme.backgroundColor as string) ?? '#FFFFFF';
  const totalPrefix = (theme.totalPrefix as string) ?? 'R$';
  const scarcityEnabled = checkoutConfig?.scarcity.enabled ?? ((theme.showCountdownTimer as boolean) !== false);
  const noticeBarEnabled = checkoutConfig?.noticeBar.enabled ?? (theme.noticeBarEnabled as boolean) ?? false;
  const total = checkoutData?.total ?? 0;

  // Favicon dinâmico
  useEffect(() => {
    const faviconUrl = checkoutConfig?.header.faviconUrl;
    if (!faviconUrl) return;
    let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = faviconUrl;
  }, [checkoutConfig?.header.faviconUrl]);

  // ── Estado dos formulários ─────────────────────────────────
  const [contact, setContact] = useState<ContactState>(emptyContact);
  const [address, setAddress] = useState<AddressState>(emptyAddress);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('PIX');
  const [card, setCard] = useState<CardState>(emptyCard);
  const [errors, setErrors] = useState<FormErrors>({});

  // ── Handlers de campo ──────────────────────────────────────
  const handleContactChange = useCallback((field: keyof ContactState, value: string) => {
    setContact(prev => ({ ...prev, [field]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  }, []);

  const handleAddressChange = useCallback((field: keyof AddressState, value: string) => {
    setAddress(prev => ({ ...prev, [field]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  }, []);

  const handleCardChange = useCallback((field: keyof CardState, value: string | number) => {
    setCard(prev => ({ ...prev, [field]: value }));
    const errKey = field === 'number' ? 'cardNumber' : field === 'holderName' ? 'cardName' : field === 'expiry' ? 'cardExpiry' : field === 'cvv' ? 'cardCvv' : field;
    setErrors(prev => { const n = { ...prev }; delete n[errKey]; return n; });
  }, []);

  // ── CEP Lookup ─────────────────────────────────────────────
  const { lookup: lookupCep, loading: cepLoading } = useCepLookup();

  const handleCepBlur = useCallback(async () => {
    const raw = address.cep.replace(/\D/g, '');
    if (raw.length !== 8) return;
    const result = await lookupCep(raw);
    if (result) {
      setAddress(prev => ({
        ...prev,
        street: result.street || prev.street,
        neighborhood: result.neighborhood || prev.neighborhood,
        city: result.city || prev.city,
        state: result.state || prev.state,
      }));
      setErrors(prev => {
        const n = { ...prev };
        delete n.street; delete n.neighborhood; delete n.city; delete n.state; delete n.cep;
        return n;
      });
    }
  }, [address.cep, lookupCep]);

  // ── Pagamento real ─────────────────────────────────────────
  const { processPayment, processing, error: paymentError } = usePaymentProcessor({
    orderId: orderId ?? '',
    total,
    templateSlug: templateConfig.slug,
  });

  // ── Validação ──────────────────────────────────────────────
  const validate = useCallback((): boolean => {
    const errs: FormErrors = {};

    // Contato
    if (!validateEmail(contact.email)) errs.email = 'Email inválido';
    if (!contact.name.trim() || contact.name.trim().split(' ').length < 2) errs.name = 'Nome completo obrigatório';
    if (!validatePhone(contact.phone)) errs.phone = 'Telefone inválido (ex: (11) 99999-9999)';
    if (!validateCPFCNPJ(contact.document)) errs.document = 'CPF ou CNPJ inválido';

    // Endereço
    if (!validateCEP(address.cep)) errs.cep = 'CEP inválido';
    if (!address.street.trim()) errs.street = 'Rua obrigatória';
    if (!address.number.trim()) errs.number = 'Número obrigatório';
    if (!address.neighborhood.trim()) errs.neighborhood = 'Bairro obrigatório';
    if (!address.city.trim()) errs.city = 'Cidade obrigatória';
    if (!address.state.trim() || address.state.length !== 2) errs.state = 'UF obrigatória (ex: SP)';

    // Cartão
    if (paymentMethod === 'CREDIT_CARD') {
      if (!validateCardNumber(card.number)) errs.cardNumber = 'Número de cartão inválido';
      if (!card.holderName.trim()) errs.cardName = 'Nome do titular obrigatório';
      if (!validateExpiry(card.expiry)) errs.cardExpiry = 'Validade inválida ou expirada';
      if (card.cvv.length < 3) errs.cardCvv = 'CVV inválido';
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      // Scroll para o primeiro campo com erro
      setTimeout(() => {
        document.querySelector('[class*="border-red"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    }
    return Object.keys(errs).length === 0;
  }, [contact, address, paymentMethod, card]);

  // ── Finalizar pedido ───────────────────────────────────────
  const handleFinalize = useCallback(async () => {
    if (isPreview) {
      onPaymentSuccess?.(orderId || 'preview');
      return;
    }

    if (!validate()) return;

    checkoutMonitor.paymentAttempt(paymentMethod, templateConfig.slug, orderId);

    const [month, yearShort] = card.expiry.split('/');

    await processPayment({
      paymentMethod,
      customerData: {
        name: contact.name.trim(),
        email: contact.email.trim(),
        phone: contact.phone,
        document: contact.document,
      },
      addressData: {
        zipCode: address.cep,
        street: address.street.trim(),
        number: address.number.trim(),
        complement: address.complement.trim(),
        neighborhood: address.neighborhood.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
      },
      ...(paymentMethod === 'CREDIT_CARD'
        ? {
            cardData: {
              number: card.number,
              holderName: card.holderName.trim(),
              expirationMonth: month,
              expirationYear: yearShort ? `20${yearShort}` : '',
              cvv: card.cvv,
              installments: card.installments,
              cpf: contact.document,
            },
          }
        : {}),
    });
  }, [isPreview, validate, paymentMethod, contact, address, card, processPayment, orderId, onPaymentSuccess, templateConfig, checkoutMonitor]);

  return (
    <div
      className="flex flex-col w-full min-w-0 overflow-x-hidden font-inter relative"
      style={{ backgroundColor: bgColor, fontFamily }}
    >
      {/* NoticeBar */}
      {noticeBarEnabled && (
        <NoticeBar theme={theme as Record<string, unknown>} noticeBarConfig={checkoutConfig?.noticeBar} />
      )}

      {/* Mobile: Accordion Resumo */}
      {isMobile && (
        <MobileSummaryAccordion
          checkoutData={checkoutData}
          totalPrefix={totalPrefix}
          primaryColor={primaryColor}
          onApplyCoupon={onApplyCoupon}
          onRemoveCoupon={onRemoveCoupon}
          appliedCouponCode={appliedCouponCode}
          couponError={couponError}
        />
      )}

      <main className="flex-1 flex flex-col items-start min-w-0 overflow-x-hidden">
        <div className="w-full min-w-0 max-w-full overflow-x-hidden">
          <div className={cn('w-full min-w-0 pt-0', !isMobile && 'grid grid-cols-[1fr_auto_1fr] gap-0')}>

            {/* ── Painel Esquerdo: Formulários ── */}
            <div className={cn('min-w-0 w-full flex justify-end', isMobile ? 'px-4 pt-6 pb-6' : 'pt-6 pb-6 lg:px-[38px]')}>
              <div className="w-full min-w-0 space-y-0 max-w-[503px]">

                {scarcityEnabled && !isPreview && (
                  <div className="mb-5">
                    <TimerBar scarcityConfig={checkoutConfig?.scarcity} />
                  </div>
                )}

                {/* Contato */}
                <ContactForm
                  data={contact}
                  errors={errors}
                  onChange={handleContactChange}
                />

                {/* Endereço */}
                <ShippingForm
                  data={address}
                  errors={errors}
                  cepLoading={cepLoading}
                  onChange={handleAddressChange}
                  onCepBlur={handleCepBlur}
                />

                {/* Pagamento */}
                <div className="mb-6">
                  <h2 className="mb-1 font-semibold text-[19px] text-[#222222]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
                    Pagamento
                  </h2>
                  <p className="text-sm text-[#666666] mb-4">Todos os dados são seguros e criptografados</p>

                  <div className="mt-2">
                    <MethodItem
                      id="PIX" label="PIX"
                      method={paymentMethod} setMethod={setPaymentMethod}
                      primaryColor={primaryColor}
                      card={card} cardErrors={errors}
                      onCardChange={handleCardChange}
                      total={total}
                    />
                    <MethodItem
                      id="CREDIT_CARD" label="Cartão de Crédito" isCreditCard
                      method={paymentMethod} setMethod={setPaymentMethod}
                      primaryColor={primaryColor}
                      card={card} cardErrors={errors}
                      onCardChange={handleCardChange}
                      total={total}
                    />
                    <MethodItem
                      id="BOLETO" label="Boleto Bancário"
                      method={paymentMethod} setMethod={setPaymentMethod}
                      primaryColor={primaryColor}
                      card={card} cardErrors={errors}
                      onCardChange={handleCardChange}
                      total={total}
                    />
                  </div>

                  {/* Erro global do processamento de pagamento */}
                  {paymentError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{paymentError}</p>
                    </div>
                  )}

                  {/* Erros de validação (resumo) */}
                  {Object.keys(errors).length > 0 && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-700">Por favor, corrija os campos destacados em vermelho antes de continuar.</p>
                    </div>
                  )}

                  {/* Botão Finalizar */}
                  <div className="pt-4 mt-2">
                    <button
                      type="button"
                      onClick={handleFinalize}
                      disabled={processing}
                      className={cn(
                        'w-full flex items-center justify-center gap-2 h-14 px-4 py-2 font-bold text-base text-white transition-all shadow-md rounded-xl',
                        processing ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-95 hover:scale-[1.01] active:scale-[0.99]'
                      )}
                      style={{ backgroundColor: primaryColor }}
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Processando...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5" />
                          <span>Finalizar Pedido</span>
                          {total > 0 && (
                            <span className="ml-1 opacity-90">· R$ {total.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</span>
                          )}
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Divisor */}
            {!isMobile && (
              <div className="w-px self-stretch shrink-0" style={{ backgroundColor: '#dedede' }} />
            )}

            {/* ── Painel Direito: Resumo (Desktop) ── */}
            {!isMobile && (
              <div className="flex pt-6 pb-6 w-full min-w-0 min-h-full self-stretch justify-start" style={{ backgroundColor: '#F9FAFB', paddingLeft: '38px', paddingRight: '38px' }}>
                <div className="w-full max-w-[480px]">
                  <div className="sticky top-6 w-full min-w-0">
                    <SummaryPanelContent
                      checkoutData={checkoutData}
                      totalPrefix={totalPrefix}
                      primaryColor={primaryColor}
                      onApplyCoupon={onApplyCoupon}
                      onRemoveCoupon={onRemoveCoupon}
                      appliedCouponCode={appliedCouponCode}
                      couponError={couponError}
                    />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Rodapé */}
      <footer className="border-t" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-center text-sm font-medium" style={{ color: '#6B7280' }}>Formas de Pagamento</p>
              <div className="flex flex-wrap justify-center items-center gap-2">
                {['card-visa', 'card-mastercard', 'card-elo', 'card-amex', 'card-discover', 'card-diners', 'card-aura', 'card-pix'].map(icon => (
                  <img key={icon} src={`/icones-pay/${icon}.svg`} alt={icon.replace('card-', '')} className="h-6" />
                ))}
              </div>
            </div>
            <div className="flex justify-center items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: '#EFF6FF' }}>
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-[#111827]">Site Seguro</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PremiumTemplate;
