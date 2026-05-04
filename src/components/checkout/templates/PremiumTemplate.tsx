/**
 * PremiumTemplate — Checkout Premium (Luxury/Inspiration Layout)
 *
 * Layout: Grid 1fr auto 1fr no desktop, stack com Mobile Summary no mobile.
 * Cor primária: Customizável via formulário, botão verde gigante com cadeado
 * Fluxo: Single Page (Contato, Endereço, Pagamento na mesma tela)
 *
 * @version 2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { checkoutMonitor } from '@/lib/checkoutMonitor';
import type { TemplateRenderProps } from '@/types/checkout.types';
import type { CheckoutConfig } from '@/types/checkout-config.types';

// ============================================================
// INTERNAL COMPONENTS FOR THIS TEMPLATE
// ============================================================

const InputBase = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, style, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-12 w-full rounded-lg border border-gray-200 bg-white px-4 text-[13px]",
      "ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium",
      "placeholder:text-gray-500 focus-visible:outline-none focus:border-gray-400 focus:ring-0",
      "disabled:cursor-not-allowed disabled:opacity-50 font-inter transition-colors",
      className
    )}
    style={{ color: '#222222', ...style }}
    {...props}
  />
));
InputBase.displayName = 'InputBase';

const TimerBar = ({ scarcityConfig }: { scarcityConfig?: CheckoutConfig['scarcity'] }) => {
  const durationMinutes = scarcityConfig?.durationMinutes ?? 14;
  const storageKey = scarcityConfig?.storageKey ?? 'premium_checkout_exp_v1';
  const [time, setTime] = React.useState({ h: '00', m: String(durationMinutes).padStart(2,'0'), s: '59' });

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
    <div className="relative w-full py-2 px-4 flex items-center justify-center gap-2" style={{ backgroundColor: 'rgb(243, 244, 246)', borderRadius: '12px' }}>
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium" style={{ color: '#666666' }}>Oferta termina em:</span>
        <div className="flex items-center gap-2 ml-2">
          <div className="flex items-center"><span className="font-bold text-[24px] text-gray-900">{time.h}</span><span className="text-xs ml-1 text-gray-900">h</span></div>
          <span className="text-gray-900">:</span>
          <div className="flex items-center"><span className="font-bold text-[24px] text-gray-900">{time.m}</span><span className="text-xs ml-1 text-gray-900">m</span></div>
          <span className="text-gray-900">:</span>
          <div className="flex items-center"><span className="font-bold text-[24px] text-gray-900">{time.s}</span><span className="text-xs ml-1 text-gray-900">s</span></div>
        </div>
      </div>
    </div>
  );
};

const ContactForm = () => {
  return (
    <div className="rounded-md mt-4 mb-4" style={{ borderRadius: '12px', borderColor: '#E5E7EB' }}>
      <div className="mb-3">
        <h2 className="mb-1 font-medium text-[21px] text-[#222222]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif' }}>
          Informações de contato
        </h2>
      </div>
      <div className="space-y-3">
        <div><InputBase placeholder="Email" type="email" /></div>
        <div><InputBase placeholder="Nome completo" /></div>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <div className="relative w-full font-inter border-[#dedede] bg-white flex items-center border rounded-lg h-12 overflow-hidden transition-colors focus-within:border-gray-400">
              <button
                type="button"
                className="justify-center whitespace-nowrap text-sm font-medium focus-visible:outline-none flex items-center gap-1.5 h-full px-4 hover:bg-gray-50 bg-transparent border-r border-[#dedede]"
              >
                <img src="https://flagcdn.com/w20/br.png" alt="BR" className="w-5 h-4 object-cover rounded-sm block" />
                <span className="text-sm text-gray-500">+55</span>
              </button>
              <input
                className="flex-1 h-full bg-transparent px-3 text-[13px] outline-none w-full"
                placeholder="(11) 96123-4567"
                type="tel"
                maxLength={15}
                style={{ color: '#222222' }}
              />
            </div>
          </div>
          <div><InputBase placeholder="CPF/CNPJ" inputMode="numeric" /></div>
        </div>
      </div>
    </div>
  );
};

const ShippingForm = () => {
  return (
    <div className="rounded-md mt-6 mb-4" style={{ borderRadius: '12px', borderColor: '#E5E7EB' }}>
      <div className="mb-3">
        <h2 className="mb-1 font-medium text-[21px] text-[#222222]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif' }}>
          Endereço de entrega
        </h2>
      </div>
      <div className="space-y-3">
        <div><InputBase placeholder="CEP" inputMode="numeric" /></div>
        <div><InputBase placeholder="Rua" /></div>
        <div><InputBase placeholder="Bairro" /></div>
        <div><InputBase placeholder="Complemento" /></div>
        <div className="grid grid-cols-2 gap-3">
          <InputBase placeholder="Número" />
          <InputBase placeholder="Cidade" />
        </div>
        <div><InputBase placeholder="Estado" /></div>
      </div>
    </div>
  );
};

const MethodItem = ({ 
  id, 
  label, 
  isCreditCard = false,
  method,
  setMethod,
  primaryColor
}: { 
  id: 'PIX'|'CREDIT_CARD'|'BOLETO', 
  label: string, 
  isCreditCard?: boolean,
  method: 'PIX'|'CREDIT_CARD'|'BOLETO',
  setMethod: (m: 'PIX'|'CREDIT_CARD'|'BOLETO') => void,
  primaryColor: string
}) => {
  const isSelected = method === id;
  return (
    <div 
      className={cn("border rounded-lg overflow-hidden transition-colors mb-3", isSelected ? "bg-white" : "bg-[#F9FAFB] border-gray-200")}
      style={isSelected ? { borderColor: primaryColor } : {}}
    >
      <div 
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setMethod(id)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: isSelected ? primaryColor : '#D1D5DB' }}>
            {isSelected && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />}
          </div>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="font-semibold text-sm text-gray-900">{label}</span>
            {isCreditCard && (
              <div className="flex items-center gap-1.5 ml-2 overflow-hidden max-w-[120px] sm:max-w-none">
                <img src="/icones-pay/card-mastercard.svg" alt="Mastercard" className="h-4 flex-shrink-0" />
                <img src="/icones-pay/card-visa.svg" alt="Visa" className="h-4 flex-shrink-0" />
                <img src="/icones-pay/card-amex.svg" alt="Amex" className="h-4 flex-shrink-0 max-sm:hidden" />
                <img src="/icones-pay/card-elo.svg" alt="Elo" className="h-4 flex-shrink-0 max-sm:hidden" />
              </div>
            )}
            {id === 'BOLETO' && (
              <div className="ml-auto text-xs text-gray-500">Venc. 3 dias</div>
            )}
          </div>
        </div>
      </div>
      
      {/* Accordion Content */}
      <AnimatePresence>
        {isSelected && (
         <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 overflow-hidden"
         >
            {id === 'PIX' && (
              <div className="p-3 bg-green-50 border border-green-100 rounded text-center">
                <p className="text-sm font-medium text-green-800">Aprovação instantânea</p>
                <p className="text-xs text-green-700 mt-1">O código Pix será gerado após clicar em Finalizar.</p>
              </div>
            )}
            {id === 'BOLETO' && (
              <div className="p-3 bg-orange-50 border border-orange-100 rounded text-center">
                <p className="text-sm font-medium text-orange-800">Boleto Bancário</p>
                <p className="text-xs text-orange-700 mt-1">O boleto será gerado após clicar em Finalizar.</p>
              </div>
            )}
            {id === 'CREDIT_CARD' && (
              <div className="space-y-3 mt-2">
                <InputBase placeholder="Número do cartão" />
                <InputBase placeholder="Nome impresso no cartão" />
                <div className="grid grid-cols-2 gap-3">
                  <InputBase placeholder="Validade (MM/AA)" />
                  <InputBase placeholder="CVV" />
                </div>
                <select className={cn(
                  "flex h-12 w-full rounded-lg border border-gray-200 bg-white px-4 text-[13px]",
                  "focus-visible:outline-none focus:border-gray-400 focus:ring-0 font-inter cursor-pointer text-[#222222]"
                )}>
                  <option value="">Selecione o parcelamento</option>
                  <option value="1">1x sem juros</option>
                </select>
              </div>
            )}
         </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PaymentForm = ({ onFinalize, processing, primaryColor }: { onFinalize: () => void, processing: boolean, primaryColor: string }) => {
  const [method, setMethod] = useState<'PIX'|'CREDIT_CARD'|'BOLETO'>('PIX');

  return (
    <div className="rounded-md mt-6 mb-4" style={{ borderRadius: '12px', borderColor: '#E5E7EB' }}>
      <div className="mb-3">
        <h2 className="mb-1 font-medium text-[21px] text-[#222222]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif' }}>
          Pagamento
        </h2>
        <p className="text-sm font-inter font-normal text-[#666666]">
          Todos os dados são seguros e criptografados
        </p>
      </div>

      <div className="mt-4">
        <MethodItem id="PIX" label="PIX" method={method} setMethod={setMethod} primaryColor={primaryColor} />
        <MethodItem id="CREDIT_CARD" label="Cartão de Crédito" isCreditCard method={method} setMethod={setMethod} primaryColor={primaryColor} />
        <MethodItem id="BOLETO" label="Boleto Bancário" method={method} setMethod={setMethod} primaryColor={primaryColor} />
      </div>

      <div className="pt-2 mt-4">
        <button
          onClick={onFinalize}
          disabled={processing}
          className={cn(
            "w-full flex items-center justify-center gap-2 h-12 px-4 py-2 font-bold text-sm text-white transition-all shadow-sm",
            processing ? "opacity-70 cursor-not-allowed" : "hover:brightness-95 hover:scale-[1.01]"
          )}
          style={{ backgroundColor: primaryColor, borderRadius: '10px' }}
        >
          <Lock className="w-4 h-4" />
          <span className="truncate">{processing ? 'Processando...' : 'Finalizar Pedido'}</span>
        </button>
      </div>
    </div>
  );
};

const SummaryPanelContent = ({
  checkoutData, totalPrefix, primaryColor,
}: {
  checkoutData?: TemplateRenderProps['checkoutData'];
  totalPrefix: string;
  primaryColor: string;
}) => {
  const total = checkoutData?.total ?? 197;
  const itemPrice = total > 15 ? total - 15 : total; // Mock
  
  return (
    <div className="w-full min-w-0 pt-0 lg:pt-[10px] rounded-xl font-inter">
      <div className="mb-5 flex flex-col gap-5">
        {/* Mock Product Items */}
        {checkoutData?.items?.filter((i: any) => i.id !== 'shipping').map((it: any, idx: number) => (
          <div key={idx} className="flex gap-4">
            <div className="relative w-16 h-16 flex-shrink-0">
              <div className="w-full h-full bg-white flex items-center justify-center rounded-lg border border-gray-200 overflow-hidden">
                {it.image ? <img src={it.image} alt={it.name} className="w-full h-full object-cover" /> : null}
              </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h4 className="text-[14px] font-medium text-[#222222] leading-tight flex-1 line-clamp-1">{it.name || 'Produto Exemplo'}</h4>
                <p className="text-[14px] font-semibold text-[#222222] flex-shrink-0">R$ {it.price?.toFixed(2).replace('.', ',')}</p>
              </div>
              <div className="flex items-center gap-2.5 ml-auto">
                <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                  <button type="button" className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-900 rounded-l-lg" disabled>-</button>
                  <span className="text-[14px] font-semibold w-7 text-center text-gray-900">{it.quantity || 1}</span>
                  <button type="button" className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-900 rounded-r-lg" disabled>+</button>
                </div>
              </div>
            </div>
          </div>
        )) || (
          <div className="flex gap-4">
            <div className="relative w-16 h-16 flex-shrink-0">
              <div className="w-full h-full bg-white flex items-center justify-center rounded-lg border border-gray-200">
                <div className="w-8 h-8 bg-gray-200 rounded-sm" />
              </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h4 className="text-[14px] font-medium text-[#222222] leading-tight flex-1 line-clamp-1">Produto Exemplo</h4>
                <p className="text-[14px] font-semibold text-[#222222] flex-shrink-0">R$ {itemPrice.toFixed(2).replace('.', ',')}</p>
              </div>
              <div className="flex items-center gap-2.5 ml-auto">
                <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                  <button type="button" className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-l-lg">-</button>
                  <span className="text-sm font-semibold w-7 text-center text-gray-900">1</span>
                  <button type="button" className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-r-lg">+</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Coupon */}
      <div className="mb-6 pt-5 border-t border-gray-200">
        <div className="flex gap-2">
          <InputBase placeholder="Código do cupom" className="flex-1 h-11 border-gray-300" />
          <button type="button" className="px-6 h-11 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all whitespace-nowrap" style={{ borderRadius: '10px' }}>
            Aplicar
          </button>
        </div>
      </div>

      {/* Totals */}
      <div className="pt-5 border-t border-gray-200">
        <div className="space-y-2.5 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#666666] font-normal">Subtotal • 1 item</span>
            <span className="text-sm font-semibold text-[#222222]">R$ {itemPrice.toFixed(2).replace('.', ',')}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#666666] font-normal">Frete</span>
            <span className="text-sm font-semibold text-[#666666]">R$ 15,00</span>
          </div>
        </div>
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <span className="text-[16px] font-bold text-[#222222]">Total</span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-normal text-[#999999] uppercase">{totalPrefix}</span>
            <span className="text-[20px] font-bold text-[#222222]">R$ {total.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const MobileSummaryAccordion = ({
  checkoutData, totalPrefix, primaryColor,
}: {
  checkoutData?: TemplateRenderProps['checkoutData'];
  totalPrefix: string;
  primaryColor: string;
}) => {
  const [open, setOpen] = useState(false);
  const total = checkoutData?.total ?? 197;

  return (
    <div className="w-full bg-[#f3f4f6]" style={{ borderBottom: '1px solid #E5E7EB' }}>
      <button 
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-4 max-w-7xl mx-auto flex items-center justify-between"
      >
        <span className="flex items-center gap-2 text-[#111827] text-sm font-medium">
          🛒 Resumo do pedido
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
        <span className="text-[16px] font-bold text-[#111827]">
          R$ {total.toFixed(2).replace('.', ',')}
        </span>
      </button>
      <AnimatePresence>
        {open && (
           <motion.div
             initial={{ height: 0, opacity: 0 }}
             animate={{ height: 'auto', opacity: 1 }}
             exit={{ height: 0, opacity: 0 }}
             className="overflow-hidden"
           >
             <div className="px-4 pb-6 pt-2 max-w-7xl mx-auto">
                <SummaryPanelContent checkoutData={checkoutData} totalPrefix={totalPrefix} primaryColor={primaryColor} />
             </div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// MAIN TEMPLATE - Grid Layout
// ============================================================

const PremiumTemplate: React.FC<TemplateRenderProps> = ({
  orderId, checkoutData, theme, checkoutConfig, templateConfig, isPreview = false,
  isMobile = false, onPaymentSuccess
}) => {
  const [processing, setProcessing] = useState(false);

  // Prioriza config tipada; fallback para theme legado
  const primaryColor =
    checkoutConfig?.buttons.primaryBg ??
    (theme.primaryColor as string) ??
    '#22C55E';
  const fontFamily =
    checkoutConfig?.typography.fontFamily ??
    (theme.fontFamily as string) ??
    'Inter, system-ui, sans-serif';
  const bgColor =
    (theme.backgroundColor as string) ?? '#FFFFFF';
  const totalPrefix = (theme.totalPrefix as string) ?? 'BRL';
  const scarcityEnabled =
    checkoutConfig?.scarcity.enabled ??
    ((theme.showCountdownTimer as boolean) !== false);

  const handleFinalize = async () => {
    if (isPreview) {
      if (onPaymentSuccess) onPaymentSuccess(orderId || 'preview');
      else if (onSuccess) onSuccess(); 
      return;
    }
    setProcessing(true);
    checkoutMonitor.paymentAttempt('PIX', templateConfig.slug, orderId);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      checkoutMonitor.paymentSuccess('PIX', templateConfig.slug, orderId);
      if (onPaymentSuccess) onPaymentSuccess(orderId || '');
      else if (onSuccess) onSuccess();
    } catch (e) {
      checkoutMonitor.paymentError('PIX', String(e), templateConfig.slug, orderId);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div
      className="flex flex-col w-full min-w-0 overflow-x-hidden font-inter relative"
      style={{
        backgroundColor: bgColor,
        fontFamily,
      }}
    >
      {isMobile && (
        <MobileSummaryAccordion checkoutData={checkoutData} totalPrefix={totalPrefix} primaryColor={primaryColor} />
      )}

      <main className="flex-1 flex flex-col items-start min-w-0 overflow-x-hidden">
        <div className="w-full min-w-0 max-w-full overflow-x-hidden">
          <div className={cn(
            'w-full min-w-0 pt-0',
            !isMobile && 'grid grid-cols-[1fr_auto_1fr] gap-0',
          )}>
            {/* Left Panel: Forms */}
            <div className={cn('min-w-0 w-full flex justify-end', isMobile ? 'px-4 pt-6 pb-6' : 'pt-6 pb-6 lg:px-[38px]')}>
              <div className="w-full min-w-0 space-y-4 max-w-[503px]">
                {scarcityEnabled && <TimerBar scarcityConfig={checkoutConfig?.scarcity} />}
                <ContactForm />
                <ShippingForm />
                <PaymentForm processing={processing} onFinalize={handleFinalize} primaryColor={primaryColor} />
              </div>
            </div>

            {/* Divider */}
            {!isMobile && (
              <div className="w-px self-stretch shrink-0" style={{ backgroundColor: '#dedede' }} />
            )}

            {/* Right Panel: Summary */}
            {!isMobile && (
              <div className="flex pt-6 pb-6 lg:pb-6 w-full min-w-0 min-h-full self-stretch justify-start" style={{ backgroundColor: '#F9FAFB', paddingLeft: '38px', paddingRight: '38px' }}>
                <div className="w-full max-w-[480px]">
                  <div className="sticky top-6 w-full min-w-0">
                    <SummaryPanelContent checkoutData={checkoutData} totalPrefix={totalPrefix} primaryColor={primaryColor} />
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </main>

      <footer className="border-t transition-all duration-150" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-center text-sm font-medium" style={{ color: '#6B7280' }}>Formas de Pagamento</p>
              <div className="flex flex-wrap justify-center items-center gap-2">
                <img src="/icones-pay/card-visa.svg" alt="Visa" className="h-6" />
                <img src="/icones-pay/card-mastercard.svg" alt="Mastercard" className="h-6" />
                <img src="/icones-pay/card-elo.svg" alt="Elo" className="h-6" />
                <img src="/icones-pay/card-amex.svg" alt="Amex" className="h-6" />
                <img src="/icones-pay/card-discover.svg" alt="Discover" className="h-6" />
                <img src="/icones-pay/card-diners.svg" alt="Diners" className="h-6" />
                <img src="/icones-pay/card-aura.svg" alt="Aura" className="h-6" />
                <img src="/icones-pay/card-pix.svg" alt="Pix" className="h-6" />
              </div>
            </div>
            <div className="flex justify-center items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5" style={{ backgroundColor: '#EFF6FF', borderRadius: '9999px' }}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22C55E' }} />
                <span className="text-sm font-medium" style={{ color: '#111827' }}>Site Seguro</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PremiumTemplate;
