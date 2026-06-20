/**
 * TikTokTemplate.tsx — Template TikTok/Tokvex refatorado
 *
 * Fase 1 completa:
 * ✅ Formulários controlados com validação em tempo real
 * ✅ CEP → autopreenchimento via ViaCEP API
 * ✅ Formulário de cartão de crédito expande inline ao selecionar o método
 * ✅ Máscaras: CPF, CNPJ, telefone, CEP, número do cartão, validade
 * ✅ Validação antes de enviar (campos obrigatórios)
 * ✅ Apple Pay marcado como "Em breve"
 * ✅ DropZone com upload real (Supabase Storage)
 * ✅ Botões Trocar/Apagar nas zonas de banner
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  ShieldCheck, ChevronDown, ChevronUp,
  Package, User, Plus, Minus, Camera, Loader2, X as XIcon, Lock,
  CheckCircle2, AlertCircle, CreditCard, Tag, Heart, MessageCircle
} from 'lucide-react';
import type { TemplateRenderProps } from '@/types/checkout.types';
import { supabase } from '@/lib/supabase';
import { useCheckoutConfigStore } from '@/store/checkoutConfigStore';
import { useCepLookup } from '@/hooks/useCepLookup';
import { usePaymentProcessor } from '@/hooks/usePaymentProcessor';
import { NoticeBar } from '@/components/checkout/NoticeBar';
import { OrderBumpCard } from '@/components/checkout/OrderBumpCard';
import { CrossSellCard } from '@/components/checkout/CrossSellCard';
import { ShippingLogo } from '@/components/checkout/ShippingLogo';
import {
  fmtBRL, formatCEP, formatCPFCNPJ, formatPhone, formatCardNumber, formatExpiry,
  validateCPFCNPJ, validateEmail, validatePhone, validateCEP,
  validateCardNumber, validateExpiry, detectCardBrand,
} from '@/utils/checkoutValidators';

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface ContactState { name: string; email: string; phone: string }
interface AddressState { cep: string; street: string; number: string; complement: string; neighborhood: string; city: string; state: string }
interface CardState { holderName: string; cpf: string; number: string; expiry: string; cvv: string; installments: number }

const emptyContact = (): ContactState => ({ name: '', email: '', phone: '' });
const emptyAddress = (): AddressState => ({ cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '' });
const emptyCard = (): CardState => ({ holderName: '', cpf: '', number: '', expiry: '', cvv: '', installments: 1 });

type FormErrors = Partial<Record<string, string>>;

// ─── DROP ZONE ───────────────────────────────────────────────────────────────

const DropZone: React.FC<{
  imageUrl?: string;
  isPreview?: boolean;
  className?: string;
  minHeight?: number;
  label?: string;
  recommendedSize?: string;
  onImageChange?: (url: string) => void;
}> = ({ imageUrl, isPreview = false, className, minHeight = 80, label = 'Solte aqui', recommendedSize, onImageChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localUrl, setLocalUrl] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const preview = URL.createObjectURL(file);
    setLocalUrl(preview);
    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop() ?? 'webp';
      const path = `banner-zones/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('checkout-images').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('checkout-images').getPublicUrl(path);
      const permanentUrl = urlData.publicUrl;
      setLocalUrl(permanentUrl);
      onImageChange?.(permanentUrl);
    } catch {
      setLocalUrl(undefined);
      onImageChange?.('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); if (isPreview) setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (!isPreview) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };
  const handleDelete = useCallback(() => { setLocalUrl(undefined); onImageChange?.(''); }, [onImageChange]);

  const displayUrl = localUrl || imageUrl;

  const fileInput = (
    <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
      onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
  );

  if (displayUrl) {
    return (
      <div className={cn('w-full rounded-xl overflow-hidden relative group', className)}
        style={{ minHeight }} onDragOver={isPreview ? handleDragOver : undefined}
        onDragLeave={isPreview ? handleDragLeave : undefined} onDrop={isPreview ? handleDrop : undefined}>
        {fileInput}
        <img src={displayUrl} alt="Banner" className="w-full object-cover" style={{ minHeight }} />
        {isPreview && (
          <div className="absolute inset-0 flex items-center justify-center gap-3 transition-opacity duration-200"
            style={{ backgroundColor: isUploading ? 'rgba(0,0,0,0.55)' : undefined }}>
            {isUploading ? (
              <><Loader2 className="w-5 h-5 text-white animate-spin" /><p className="text-white text-xs font-semibold">Enviando...</p></>
            ) : (
              <div className="opacity-0 group-hover:opacity-100 w-full h-full flex items-center justify-center gap-2 transition-opacity duration-200"
                style={{ backgroundColor: 'rgba(0,0,0,0.50)' }}>
                <button type="button" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold shadow-lg transition-all duration-150 hover:scale-105"
                  style={{ backgroundColor: 'rgba(255,255,255,0.92)', color: '#111827' }}>
                  <Camera className="w-3.5 h-3.5" /> Trocar
                </button>
                <button type="button" onClick={e => { e.stopPropagation(); handleDelete(); }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold shadow-lg transition-all duration-150 hover:scale-105"
                  style={{ backgroundColor: 'rgba(239,68,68,0.92)', color: '#fff' }}>
                  <XIcon className="w-3.5 h-3.5" /> Apagar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (!isPreview) return null;

  return (
    <div className={cn('rounded-lg relative cursor-pointer select-none', className)}
      style={{ minHeight }} onClick={() => fileInputRef.current?.click()}
      onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      {fileInput}
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg px-4 transition-all duration-150" style={{
        minHeight,
        border: isDragging ? '1.82px dashed rgba(99,102,241,0.7)' : '1.82px dashed rgba(229,231,235,0.5)',
        backgroundColor: isDragging ? 'rgba(99,102,241,0.04)' : 'transparent',
      }}>
        {isUploading ? (
          <><Loader2 className="w-5 h-5 animate-spin" style={{ color: 'rgba(156,163,175,0.9)' }} />
          <p className="text-xs" style={{ color: 'rgba(156,163,175,0.9)' }}>Enviando imagem...</p></>
        ) : (
          <>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: isDragging ? 'rgba(99,102,241,0.1)' : 'rgba(243,244,246,0.5)' }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isDragging ? 'rgba(99,102,241,0.7)' : 'rgba(156,163,175,0.6)' }} />
              <p className="text-sm font-medium" style={{ color: isDragging ? 'rgba(99,102,241,0.9)' : 'rgba(156,163,175,0.9)' }}>
                {isDragging ? 'Solte para adicionar' : label}
              </p>
            </div>
            {recommendedSize && <p className="text-[10px] font-medium" style={{ color: 'rgba(156,163,175,0.7)' }}>Recomendado: {recommendedSize}</p>}
          </>
        )}
      </div>
    </div>
  );
};

// ─── CONTROLLED PILL INPUT ───────────────────────────────────────────────────

const PillInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  readOnly?: boolean;
  className?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}> = ({ value, onChange, placeholder, type = 'text', error, readOnly, className, maxLength, inputMode }) => (
  <div className={cn('flex flex-col', className)}>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      maxLength={maxLength}
      inputMode={inputMode}
      className={cn(
        'w-full h-12 border rounded-xl px-4 text-sm text-gray-700 placeholder-gray-400 bg-white',
        'focus:outline-none transition-all',
        error
          ? 'border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-100'
          : 'border-gray-200 focus:border-pink-300 focus:ring-1 focus:ring-pink-100',
        readOnly && 'bg-gray-50',
      )}
    />
    {error && (
      <p className="flex items-center gap-1 text-xs text-red-500 mt-1 px-1">
        <AlertCircle className="w-3 h-3 flex-shrink-0" /> {error}
      </p>
    )}
  </div>
);

// ─── ADDRESS FIELDS (with CEP auto-fill) ─────────────────────────────────────

const AddressFields: React.FC<{
  data: AddressState;
  onChange: (d: AddressState) => void;
  errors?: FormErrors;
}> = ({ data, onChange, errors }) => {
  const { lookup, loading: cepLoading } = useCepLookup();

  const handleCep = async (raw: string) => {
    const formatted = formatCEP(raw);
    onChange({ ...data, cep: formatted });
    const clean = formatted.replace(/\D/g, '');
    if (clean.length === 8) {
      const result = await lookup(clean);
      if (result) {
        onChange({
          ...data, cep: formatted,
          street: result.street,
          neighborhood: result.neighborhood,
          city: result.city,
          state: result.state,
        });
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <PillInput value={data.cep} onChange={handleCep} placeholder="00000-000" maxLength={9}
          inputMode="numeric" error={errors?.cep} />
        {cepLoading && <Loader2 className="absolute right-3 top-3.5 w-4 h-4 animate-spin text-pink-400" />}
      </div>
      <div className="grid grid-cols-[1fr_90px] gap-3">
        <PillInput value={data.street} onChange={v => onChange({ ...data, street: v })} placeholder="Rua *" readOnly={cepLoading} error={errors?.street} />
        <PillInput value={data.number} onChange={v => onChange({ ...data, number: v })} placeholder="Nº *" inputMode="numeric" error={errors?.number} />
      </div>
      <PillInput value={data.complement} onChange={v => onChange({ ...data, complement: v })} placeholder="Complemento" />
      <div className="grid grid-cols-[1fr_1fr_70px] gap-3">
        <PillInput value={data.neighborhood} onChange={v => onChange({ ...data, neighborhood: v })} placeholder="Bairro *" error={errors?.neighborhood} readOnly={cepLoading} />
        <PillInput value={data.city} onChange={v => onChange({ ...data, city: v })} placeholder="Cidade *" error={errors?.city} readOnly={cepLoading} />
        <PillInput value={data.state} onChange={v => onChange({ ...data, state: v.toUpperCase().slice(0, 2) })} placeholder="UF" maxLength={2} error={errors?.state} readOnly={cepLoading} />
      </div>
    </div>
  );
};

// ─── SECTION CARD ─────────────────────────────────────────────────────────────

const SectionCard: React.FC<{ icon?: React.ReactNode; title: string; children: React.ReactNode; className?: string }> = ({ icon, title, children, className }) => (
  <div className={cn('bg-white rounded-xl p-6 border border-gray-200', className)}>
    <div className="flex items-center gap-2 mb-5">
      {icon && <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">{icon}</div>}
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
    </div>
    {children}
  </div>
);

// ─── DESKTOP FORM CARDS (controlled) ──────────────────────────────────────────

const DesktopContactCard: React.FC<{ data: ContactState; onChange: (d: ContactState) => void; errors?: FormErrors }> = ({ data, onChange, errors }) => (
  <SectionCard icon={<User className="w-3.5 h-3.5 text-gray-500" />} title="Informações de Contato">
    <div className="space-y-3">
      <PillInput value={data.name} onChange={v => onChange({ ...data, name: v })} placeholder="Nome completo *" error={errors?.name} />
      <div className="grid grid-cols-2 gap-3">
        <PillInput value={data.email} onChange={v => onChange({ ...data, email: v })} placeholder="E-mail *" type="email" error={errors?.email} />
        <PillInput value={data.phone} onChange={v => onChange({ ...data, phone: formatPhone(v) })} placeholder="Telefone *" inputMode="tel" error={errors?.phone} />
      </div>
    </div>
  </SectionCard>
);
const DesktopAddressCard: React.FC<{ data: AddressState; onChange: (d: AddressState) => void; errors?: FormErrors }> = ({ data, onChange, errors }) => (
  <SectionCard title="Endereço de Entrega">
    <AddressFields data={data} onChange={onChange} errors={errors} />
  </SectionCard>
);

const DesktopShippingCard: React.FC<{
  shippingMethods?: any[];
  selectedShippingMethod?: any;
  onSelectShippingMethod?: (method: any) => void;
  primaryColor: string;
}> = ({ shippingMethods, selectedShippingMethod, onSelectShippingMethod, primaryColor }) => {
  if (!shippingMethods || shippingMethods.length === 0) return null;

  return (
    <SectionCard title="Método de Envio">
      <div className="flex flex-col gap-2.5">
        {shippingMethods.map((method) => {
          const isSelected = selectedShippingMethod?.id === method.id;
          return (
            <div
              key={method.id}
              onClick={() => onSelectShippingMethod?.(method)}
              className={cn(
                "flex items-center justify-between p-3.5 rounded-xl border-2 transition-all cursor-pointer",
                isSelected
                  ? "border-[#E91E8C] bg-[#E91E8C]/5"
                  : "border-gray-100 bg-white hover:border-gray-200"
              )}
              style={isSelected ? { borderColor: primaryColor, backgroundColor: `${primaryColor}08` } : {}}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  checked={isSelected}
                  onChange={() => onSelectShippingMethod?.(method)}
                  style={isSelected ? { accentColor: primaryColor } : {}}
                  className="w-4 h-4"
                />
                <ShippingLogo name={method.name} size={18} />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{method.name}</p>
                  {method.description && <p className="text-xs text-gray-400">{method.description}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800">
                  {Number(method.price) === 0 ? 'Grátis' : `R$ ${Number(method.price).toFixed(2).replace('.', ',')}`}
                </p>
                <p className="text-[10px] text-gray-400">
                  {method.estimatedDaysMin && method.estimatedDaysMax
                    ? `${method.estimatedDaysMin} a ${method.estimatedDaysMax} dias`
                    : `${method.estimatedDays || 5} dias`}
                  {method.isBusinessDays ? ' úteis' : ' corridos'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
};

const DesktopCpfCard: React.FC<{ value: string; onChange: (v: string) => void; error?: string }> = ({ value, onChange, error }) => (
  <SectionCard title="CPF / CNPJ">
    <PillInput value={value} onChange={v => onChange(formatCPFCNPJ(v))} placeholder="000.000.000-00" inputMode="numeric" error={error} />
  </SectionCard>
);

// ─── PAYMENT SECTION (radio buttons + inline card form) ───────────────────────

const PIX_ICON = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M6.5 6.5L12 1L17.5 6.5L12 12L6.5 6.5Z" fill="#00BFA5"/>
    <path d="M17.5 6.5L23 12L17.5 17.5L12 12L17.5 6.5Z" fill="#00BFA5"/>
    <path d="M17.5 17.5L12 23L6.5 17.5L12 12L17.5 17.5Z" fill="#00BFA5"/>
    <path d="M6.5 17.5L1 12L6.5 6.5L12 12L6.5 17.5Z" fill="#00BFA5"/>
    <path d="M9.5 9.5L12 7L14.5 9.5L12 12L9.5 9.5Z" fill="white"/>
    <path d="M14.5 9.5L17 12L14.5 14.5L12 12L14.5 9.5Z" fill="white"/>
    <path d="M14.5 14.5L12 17L9.5 14.5L12 12L14.5 14.5Z" fill="white"/>
    <path d="M9.5 14.5L7 12L9.5 9.5L12 12L9.5 14.5Z" fill="white"/>
  </svg>
);

const CARD_ICON = () => (
  <div className="w-8 h-6 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-md flex flex-col justify-between p-1">
    <div className="w-4 h-1 bg-white/60 rounded" />
    <div className="flex gap-0.5">
      <div className="w-2 h-1 bg-white/40 rounded" />
      <div className="w-2 h-1 bg-white/40 rounded" />
    </div>
  </div>
);

const APPLE_ICON = () => (
  <svg width="20" height="24" viewBox="0 0 20 24" fill="currentColor" className="text-gray-800">
    <path d="M16.71 17.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C1.25 15-.06 10.45 1.7 7.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M11 1.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

const PaymentRadio: React.FC<{
  label: string; sublabel?: string; sublabelColor?: string; sublabel2?: string;
  icon: React.ReactNode; selected: boolean; onClick: () => void;
  rightBadge?: React.ReactNode;
}> = ({ label, sublabel, sublabelColor, sublabel2, icon, selected, onClick, rightBadge }) => (
  <button type="button" onClick={onClick}
    className="w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-gray-100 last:border-0">
    <div className="flex-shrink-0 w-8 flex items-center justify-center">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-800">{label}</p>
      {sublabel && <p className="text-xs mt-0.5" style={{ color: sublabelColor || '#6b7280' }}>{sublabel}</p>}
      {sublabel2 && <p className="text-xs text-gray-400">{sublabel2}</p>}
    </div>
    {rightBadge}
    <div className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
      style={selected ? { borderColor: '#E91E8C', backgroundColor: '#E91E8C' } : { borderColor: '#d1d5db' }}>
      {selected && <div className="w-2 h-2 bg-white rounded-full" />}
    </div>
  </button>
);

// Brand logos SVG inline (small)
const CardBrands: React.FC = () => (
  <div className="flex items-center gap-1.5 mt-1">
    {/* Mastercard */}
    <svg width="28" height="18" viewBox="0 0 38 24" fill="none">
      <rect width="38" height="24" rx="4" fill="#F4F4F4"/>
      <circle cx="15" cy="12" r="8" fill="#EB001B"/>
      <circle cx="23" cy="12" r="8" fill="#F79E1B"/>
      <path d="M19 7a8 8 0 0 1 0 10A8 8 0 0 1 19 7z" fill="#FF5F00"/>
    </svg>
    {/* Visa */}
    <svg width="28" height="18" viewBox="0 0 38 24" fill="none">
      <rect width="38" height="24" rx="4" fill="#F4F4F4"/>
      <text x="6" y="16" fontFamily="Arial" fontWeight="bold" fontSize="11" fill="#1A1F71">VISA</text>
    </svg>
    {/* Elo */}
    <svg width="28" height="18" viewBox="0 0 38 24" fill="none">
      <rect width="38" height="24" rx="4" fill="#F4F4F4"/>
      <text x="8" y="16" fontFamily="Arial" fontWeight="bold" fontSize="10" fill="#000">elo</text>
    </svg>
    {/* Amex */}
    <svg width="28" height="18" viewBox="0 0 38 24" fill="none">
      <rect width="38" height="24" rx="4" fill="#007BC1"/>
      <text x="4" y="16" fontFamily="Arial" fontWeight="bold" fontSize="7.5" fill="white">AMEX</text>
    </svg>
  </div>
);

const InlineCardForm: React.FC<{
  data: CardState;
  onChange: (d: CardState) => void;
  errors?: FormErrors;
  total: number;
  inputClass?: string;
  selectClass?: string;
}> = ({ data, onChange, errors, total, inputClass, selectClass }) => {
  const brand = detectCardBrand(data.number);
  const maxInstallments = 12;

  const baseInput: React.CSSProperties = {
    width: '100%', height: '44px', padding: '0 12px', borderRadius: '10px',
    border: '1px solid #e5e7eb', backgroundColor: '#fff', color: '#111827',
    fontSize: '13px', outline: 'none', transition: 'border-color 0.15s',
  };

  return (
    <div className="px-4 py-4 bg-gray-50 space-y-3" style={{ borderTop: '1px solid #f3f4f6' }}>
      {/* Bandeiras */}
      <CardBrands />
      {brand !== 'unknown' && (
        <p className="text-xs text-indigo-600 font-medium capitalize">{brand} detectado ✓</p>
      )}

      {/* Nome no cartão */}
      <div>
        <input style={baseInput} placeholder="Nome no cartão *"
          className={inputClass} value={data.holderName}
          onChange={e => onChange({ ...data, holderName: e.target.value.toUpperCase() })} />
        {errors?.holderName && <p className="text-xs text-red-500 mt-1">{errors.holderName}</p>}
      </div>

      {/* CPF do titular */}
      <div>
        <input style={baseInput} placeholder="CPF / CNPJ do titular *"
          className={inputClass} value={data.cpf} inputMode="numeric"
          onChange={e => onChange({ ...data, cpf: formatCPFCNPJ(e.target.value) })} />
        {errors?.cpfCard && <p className="text-xs text-red-500 mt-1">{errors.cpfCard}</p>}
      </div>

      {/* Número do cartão */}
      <div>
        <input style={baseInput} placeholder="Número do cartão *"
          className={inputClass} value={data.number} inputMode="numeric" maxLength={19}
          onChange={e => onChange({ ...data, number: formatCardNumber(e.target.value) })} />
        {errors?.cardNumber && <p className="text-xs text-red-500 mt-1">{errors.cardNumber}</p>}
      </div>

      {/* Validade + CVV */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <input style={baseInput} placeholder="MM/AA *"
            className={inputClass} value={data.expiry} inputMode="numeric" maxLength={5}
            onChange={e => onChange({ ...data, expiry: formatExpiry(e.target.value) })} />
          {errors?.expiry && <p className="text-xs text-red-500 mt-1">{errors.expiry}</p>}
        </div>
        <div>
          <input style={baseInput} placeholder="CVV *"
            className={inputClass} value={data.cvv} inputMode="numeric" maxLength={4}
            onChange={e => onChange({ ...data, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
          {errors?.cvv && <p className="text-xs text-red-500 mt-1">{errors.cvv}</p>}
        </div>
      </div>

      {/* Parcelas */}
      {total > 0 && (
        <select
          style={{ ...baseInput, cursor: 'pointer' }}
          className={selectClass}
          value={data.installments}
          onChange={e => onChange({ ...data, installments: Number(e.target.value) })}
        >
          {Array.from({ length: maxInstallments }, (_, i) => i + 1).map(n => (
            <option key={n} value={n}>
              {n === 1
                ? `1x de ${fmtBRL(total)} (à vista)`
                : `${n}x de ${fmtBRL(total / n)} sem juros`}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

const PaymentSection: React.FC<{
  primaryColor: string;
  payMethod: string;
  setPayMethod: (m: string) => void;
  cardData: CardState;
  onCardChange: (d: CardState) => void;
  cardErrors?: FormErrors;
  total: number;
}> = ({ primaryColor, payMethod, setPayMethod, cardData, onCardChange, cardErrors, total }) => (
  <div>
    <PaymentRadio label="Pix" sublabel="Pague em até 24 horas e obtenha confirmação instantânea."
      icon={<PIX_ICON />} selected={payMethod === 'pix'} onClick={() => setPayMethod('pix')} />

    <PaymentRadio label="Cartão de crédito" sublabel="Sem juros" sublabelColor={primaryColor}
      sublabel2="Pague em até 12 parcelas" icon={<CARD_ICON />}
      selected={payMethod === 'credit'} onClick={() => setPayMethod('credit')} />

    <AnimatePresence>
      {payMethod === 'credit' && (
        <motion.div key="card-form" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
          <InlineCardForm data={cardData} onChange={onCardChange} errors={cardErrors} total={total} />
        </motion.div>
      )}
    </AnimatePresence>

    <PaymentRadio label="Apple Pay" icon={<APPLE_ICON />}
      selected={payMethod === 'apple'} onClick={() => setPayMethod('apple')}
      rightBadge={<span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full mr-2">Em breve</span>}
    />

    {payMethod === 'apple' && (
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">Apple Pay estará disponível em breve.</p>
      </div>
    )}
  </div>
);

// ─── QTY SELECTOR ─────────────────────────────────────────────────────────────

const QtySelector: React.FC<{ qty: number; onMinus: () => void; onPlus: () => void }> = ({ qty, onMinus, onPlus }) => (
  <div className="flex items-center gap-2 mt-2">
    <button type="button" onClick={onMinus} className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50">
      <Minus className="w-3 h-3" />
    </button>
    <span className="text-sm font-semibold text-gray-800 w-4 text-center">{qty}</span>
    <button type="button" onClick={onPlus} className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50">
      <Plus className="w-3 h-3" />
    </button>
  </div>
);

// ─── MOBILE SECTION HELPERS ───────────────────────────────────────────────────

const MobileExpandButton: React.FC<{ label: string; children: React.ReactNode; primaryColor: string; forceOpen?: boolean }> = ({ label, children, primaryColor, forceOpen }) => {
  const [open, setOpen] = useState(false);
  const isOpen = forceOpen !== undefined ? forceOpen : open;
  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      <button type="button" onClick={() => setOpen(!isOpen)} className="w-full flex items-center gap-3 px-5 py-4 text-left">
        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: isOpen ? primaryColor : '#e5e7eb' }}>
          {isOpen ? <Minus className="w-3 h-3 text-white" /> : <Plus className="w-3 h-3 text-gray-500" />}
        </div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MobileProgressBar: React.FC = () => {
  const segments = ['#06B6D4', '#E91E8C', '#06B6D4', '#E91E8C', '#06B6D4', '#E91E8C', '#06B6D4', '#E91E8C'];
  return (
    <div className="flex gap-1 px-0 py-1">
      {segments.map((color, i) => <div key={i} className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: color }} />)}
    </div>
  );
};

const MobileSummaryRow: React.FC<{ checkoutData: any; primaryColor: string }> = ({ checkoutData, primaryColor }) => {
  const [open, setOpen] = useState(false);
  const products: any[] = checkoutData?.products || [];
  const total = products.reduce((s, p) => s + (p.price ?? 0) * (p.quantity ?? 1), 0) || 119.90;
  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
            <Package className="w-3.5 h-3.5" style={{ color: primaryColor }} />
          </div>
          <span className="text-sm font-semibold text-gray-700">Resumo do Pedido</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-gray-900">{fmtBRL(total)}</span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-gray-100">
            <div className="px-5 py-3 space-y-2">
              {products.length > 0 ? products.map((p: any, i: number) => (
                <div key={p.id ?? i} className="flex items-center justify-between py-1">
                  <span className="text-xs text-gray-600 flex-1 mr-2 truncate">{p.name} × {p.quantity ?? 1}</span>
                  <span className="text-xs font-bold" style={{ color: primaryColor }}>{fmtBRL(p.price ?? 0)}</span>
                </div>
              )) : (
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-gray-600">Produto de Demonstração × 1</span>
                  <span className="text-xs font-bold" style={{ color: primaryColor }}>R$ 119,90</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── FORM VALIDATION HELPER ───────────────────────────────────────────────────

function validateCheckoutForm(contact: ContactState, address: AddressState, cpf: string, payMethod: string, card: CardState): FormErrors {
  const errors: FormErrors = {};
  if (!contact.name.trim()) errors.name = 'Nome obrigatório';
  if (!validateEmail(contact.email)) errors.email = 'E-mail inválido';
  if (!validatePhone(contact.phone)) errors.phone = 'Telefone inválido (mínimo 10 dígitos)';
  if (!validateCEP(address.cep)) errors.cep = 'CEP inválido';
  if (!address.street.trim()) errors.street = 'Rua obrigatória';
  if (!address.number.trim()) errors.number = 'Número obrigatório';
  if (!address.neighborhood.trim()) errors.neighborhood = 'Bairro obrigatório';
  if (!address.city.trim()) errors.city = 'Cidade obrigatória';
  if (!address.state.trim()) errors.state = 'UF obrigatória';
  if (!validateCPFCNPJ(cpf)) errors.cpf = 'CPF/CNPJ inválido';

  if (payMethod === 'credit') {
    if (!card.holderName.trim()) errors.holderName = 'Nome no cartão obrigatório';
    if (!validateCPFCNPJ(card.cpf)) errors.cpfCard = 'CPF/CNPJ inválido';
    if (!validateCardNumber(card.number)) errors.cardNumber = 'Número do cartão inválido';
    if (!validateExpiry(card.expiry)) errors.expiry = 'Data de validade inválida ou expirada';
    if (card.cvv.length < 3) errors.cvv = 'CVV inválido';
  }
  return errors;
}

// ─── DESKTOP ORDER PANEL ──────────────────────────────────────────────────────

const DesktopOrderPanel: React.FC<{
  checkoutData: any; theme: any; primaryColor: string; gradient: string;
  isPreview: boolean; orderId: string; onSuccess?: (id: string) => void; templateSlug: string;
  contact: ContactState; address: AddressState; cpf: string;
  onFormError?: (errors: FormErrors) => void;
  onApplyCoupon?: (code: string) => Promise<{ success: boolean; discountAmount?: number; error?: string }>;
  onRemoveCoupon?: () => void;
  appliedCouponCode?: string;
  couponError?: string;
  orderBumps?: any[];
  selectedOrderBumps?: string[];
  onToggleOrderBump?: (id: string) => void;
  crossSells?: any[];
  selectedCrossSells?: string[];
  onToggleCrossSell?: (id: string) => void;
  paymentMethod?: string;
  onPaymentMethodChange?: (method: string) => void;
}> = ({ checkoutData, theme, primaryColor, gradient, isPreview, orderId, onSuccess, templateSlug, contact, address, cpf, onFormError, onApplyCoupon, onRemoveCoupon, appliedCouponCode, couponError, orderBumps = [], selectedOrderBumps = [], onToggleOrderBump, crossSells = [], selectedCrossSells = [], onToggleCrossSell, paymentMethod, onPaymentMethodChange }) => {
  const [localPayMethod, setLocalPayMethod] = useState('pix');
  const payMethod = paymentMethod 
    ? (paymentMethod === 'CREDIT_CARD' ? 'credit' : paymentMethod === 'PIX' ? 'pix' : 'boleto') 
    : localPayMethod;
  const setPayMethod = (m: string) => {
    if (onPaymentMethodChange) {
      onPaymentMethodChange(m === 'credit' ? 'CREDIT_CARD' : m === 'pix' ? 'PIX' : 'BOLETO');
    } else {
      setLocalPayMethod(m);
    }
  };
  const [couponCode, setCouponCode] = useState(appliedCouponCode || '');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [cardData, setCardData] = useState<CardState>(emptyCard());
  const [cardErrors, setCardErrors] = useState<FormErrors>({});
  const [paySuccess, setPaySuccess] = useState(false);

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

  const products: any[] = checkoutData?.products || [];
  const subtotal = products.reduce((s, p) => s + (p.price ?? 0) * (qtys[p.id] ?? p.quantity ?? 1), 0) || 119.90;
  const shipping = checkoutData?.shipping ?? 0;
  const discount = checkoutData?.discount ?? 0;
  const total = subtotal + shipping - discount;

  const getQty = (p: any) => qtys[p.id] ?? p.quantity ?? 1;
  const setQty = (id: string, v: number) => setQtys(prev => ({ ...prev, [id]: Math.max(1, v) }));

  const { processPayment, processing, error: processorError } = usePaymentProcessor({
    orderId, total, templateSlug,
  });

  const handleSubmit = async () => {
    if (isPreview) { onSuccess?.(orderId || 'preview'); return; }

    const allErrors = validateCheckoutForm(contact, address, cpf, payMethod, cardData);
    if (Object.keys(allErrors).length > 0) {
      onFormError?.(allErrors);
      const cardErrs: FormErrors = {};
      if (allErrors.holderName) cardErrs.holderName = allErrors.holderName;
      if (allErrors.cpfCard) cardErrs.cpfCard = allErrors.cpfCard;
      if (allErrors.cardNumber) cardErrs.cardNumber = allErrors.cardNumber;
      if (allErrors.expiry) cardErrs.expiry = allErrors.expiry;
      if (allErrors.cvv) cardErrs.cvv = allErrors.cvv;
      setCardErrors(cardErrs);
      return;
    }
    setCardErrors({});
    setLocalError(null);

    // Parse expiry MM/YY
    const [expiryMonth, expiryYear] = (cardData.expiry || '/').split('/');

    await processPayment({
      paymentMethod: payMethod === 'credit' ? 'CREDIT_CARD' : payMethod === 'pix' ? 'PIX' : 'BOLETO',
      customerData: {
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        document: cpf,
      },
      addressData: {
        zipCode: address.cep,
        street: address.street,
        number: address.number,
        complement: address.complement,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
      },
      cardData: payMethod === 'credit' ? {
        number: cardData.number,
        holderName: cardData.holderName,
        expirationMonth: expiryMonth || '',
        expirationYear: expiryYear || '',
        cvv: cardData.cvv,
        installments: cardData.installments,
        cpf: cardData.cpf,
      } : undefined,
      items: products,
      couponCode: appliedCouponCode || null,
      discount: discount,
      shipping: shipping,
    });
  };

  if (paySuccess) {
    return (
      <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Pedido confirmado!</h3>
        <p className="text-sm text-gray-500">Redirecionando...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 text-base">Resumo do Pedido</h3>
        <div className="flex items-center gap-1.5 mt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
          <span className="text-xs text-green-600 font-medium">Seus dados estão seguros e criptografados.</span>
        </div>
      </div>

      {/* Products */}
      <div className="border-b border-gray-100">
        <button type="button" onClick={() => setSummaryOpen(!summaryOpen)} className="w-full flex items-center justify-between px-5 py-3">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Produtos ({products.length || 1})</span>
          {summaryOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        <AnimatePresence>
          {summaryOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="px-5 pb-5 divide-y divide-gray-50">
                {products.length > 0 ? products.map((p: any, i: number) => {
                  const imgSrc = p.image || p.imageUrl || null;
                  const origPrice = p.originalPrice ?? p.compareAtPrice ?? (p.price ? p.price * 1.4 : null);
                  const discPct = origPrice ? Math.round((1 - p.price / origPrice) * 100) : null;
                  return (
                    <div key={p.id ?? i} className="flex items-start gap-3 py-4 first:pt-0">
                      <div className="relative flex-shrink-0">
                        {imgSrc ? <img src={imgSrc} alt={p.name} className="w-16 h-16 rounded-xl object-cover border border-gray-100" />
                          : <div className="w-16 h-16 rounded-xl flex items-center justify-center border border-gray-100" style={{ background: 'linear-gradient(135deg,#f3f4f6,#e5e7eb)' }}><Package className="w-5 h-5 text-gray-400" /></div>}
                        <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-gray-800 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">{getQty(p)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug">{p.name}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <p className="text-sm font-bold" style={{ color: primaryColor }}>{fmtBRL(p.price ?? 0)}</p>
                          {origPrice && <><p className="text-xs text-gray-400 line-through">{fmtBRL(origPrice)}</p>
                            {discPct && <span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full" style={{ backgroundColor: primaryColor }}>-{discPct}%</span>}</>}
                        </div>
                        <QtySelector qty={getQty(p)} onMinus={() => setQty(p.id, getQty(p) - 1)} onPlus={() => setQty(p.id, getQty(p) + 1)} />
                      </div>
                    </div>
                  );
                }) : (
                  <div className="flex items-start gap-3 py-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center border border-gray-100" style={{ background: 'linear-gradient(135deg,#fce7f3,#fdf2f8)' }}>
                        <Package className="w-5 h-5" style={{ color: primaryColor }} />
                      </div>
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 text-white text-[10px] font-bold rounded-full flex items-center justify-center">1</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-800">Produto de Demonstração Premium</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <p className="text-sm font-bold" style={{ color: primaryColor }}>R$ 119,90</p>
                        <p className="text-xs text-gray-400 line-through">R$ 199,90</p>
                        <span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full" style={{ backgroundColor: primaryColor }}>-40%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ORDER BUMPS */}
      {theme?.orderBumpEnabled && orderBumps && orderBumps.length > 0 && (
        <div className="border-b border-gray-100 px-5 py-4 space-y-3 bg-gray-50/50">
          <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">🎁 Oferta Especial</h4>
          {orderBumps.map((bump: any) => (
            <OrderBumpCard
              key={bump.id}
              orderBump={bump}
              theme={theme}
              orderBumpConfig={theme?._checkoutConfig?.orderBump}
              selected={selectedOrderBumps?.includes(bump.id)}
              onToggle={onToggleOrderBump || (() => {})}
            />
          ))}
        </div>
      )}

      {/* CROSS-SELLS */}
      {crossSells && crossSells.length > 0 && (
        <div className="border-b border-gray-100 px-5 py-4 space-y-3 bg-gray-50/50">
          <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">🔥 Aproveite e compre junto</h4>
          <div className="grid grid-cols-1 gap-2.5">
            {crossSells.map((product: any) => (
              <CrossSellCard
                key={product.id}
                product={product}
                selected={selectedCrossSells?.includes(product.id)}
                onToggle={() => onToggleCrossSell && onToggleCrossSell(product.id)}
                primaryColor={primaryColor}
              />
            ))}
          </div>
        </div>
      )}

      {/* Discount */}
      {discount > 0 && (
        <div className="px-5 py-3 flex items-center justify-between border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-700">Desconto</span>
          <span className="text-sm font-bold" style={{ color: primaryColor }}>- {fmtBRL(discount)}</span>
        </div>
      )}

      {/* Coupon */}
      <div className="border-b border-gray-100 px-5 py-3.5 space-y-3">
        <div className="flex items-center gap-1.5">
          <Tag className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Cupom de Desconto</span>
        </div>
        {!appliedCouponCode ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={e => setCouponCode(e.target.value)}
                placeholder="Código de desconto"
                disabled={loading}
                className="flex-1 border border-gray-200 rounded-xl h-10 px-3 text-xs focus:outline-none focus:border-pink-300 focus:ring-1 focus:ring-pink-100 bg-white"
              />
              <button
                type="button"
                onClick={handleApply}
                disabled={loading || !couponCode}
                className="px-4 h-10 rounded-xl text-xs font-bold text-white transition-opacity disabled:opacity-60"
                style={{ backgroundColor: primaryColor }}
              >
                {loading ? 'Aplicando...' : 'Aplicar'}
              </button>
            </div>
            {(localError || couponError) && (
              <span className="text-[10px] text-red-500 ml-1">
                {localError || couponError}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-2 px-3">
            <span className="text-xs font-bold text-green-600 uppercase tracking-wider">{appliedCouponCode}</span>
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

      {/* Totals */}
      <div className="px-5 py-3 border-b border-gray-100 space-y-2">
        <div className="flex justify-between"><span className="text-xs text-gray-500">Subtotal</span><span className="text-xs font-medium text-gray-700">{fmtBRL(subtotal)}</span></div>
        <div className="flex justify-between"><span className="text-xs text-gray-500">Frete</span>
          {shipping > 0 ? <span className="text-xs font-medium text-gray-700">+ {fmtBRL(shipping)}</span> : <span className="text-xs font-semibold text-green-600">Grátis</span>}
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <span className="text-sm font-bold text-gray-900">Total ({products.length || 1} {(products.length || 1) === 1 ? 'item' : 'itens'})</span>
          <span className="text-base font-extrabold" style={{ color: primaryColor }}>{fmtBRL(total)}</span>
        </div>
      </div>

      {/* Payment */}
      <div className="border-b border-gray-100">
        <div className="px-5 pt-4 pb-2">
          <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Forma de pagamento</h4>
        </div>
        <PaymentSection primaryColor={primaryColor} payMethod={payMethod} setPayMethod={setPayMethod}
          cardData={cardData} onCardChange={setCardData} cardErrors={cardErrors} total={total} />
      </div>

        {(localError || processorError) && (
          <div className="px-5 py-3 bg-red-50 border-t border-red-100">
            <p className="text-xs text-red-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {localError || processorError}
            </p>
          </div>
        )}
        {/* CTA */}
      <div className="px-5 py-4">
        <motion.button type="button" onClick={handleSubmit} disabled={processing}
          className="w-full py-4 rounded-full text-white font-bold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2"
          style={{ background: processing ? '#9ca3af' : gradient }}
          whileHover={{ opacity: processing ? 1 : 0.92 }} whileTap={{ scale: processing ? 1 : 0.97 }}>
          {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
            : <><Lock className="w-4 h-4" /> Fazer pedido</>}
        </motion.button>
        <div className="flex items-center justify-center gap-1.5 mt-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-gray-400 font-medium">Compra 100% Segura e Criptografada</span>
        </div>
      </div>
    </div>
  );
};

// ─── MOBILE CONTACT + PAYMENT CARD ──────────────────────────────────────────

const MobileContactPaymentCard: React.FC<{
  primaryColor: string; gradient: string; checkoutData: any; theme: any;
  isPreview: boolean; orderId: string; onSuccess?: (id: string) => void; templateSlug: string;
  address: AddressState; onAddressChange: (d: AddressState) => void;
  cpf: string; onCpfChange: (v: string) => void;
  orderBumps?: any[];
  selectedOrderBumps?: string[];
  onToggleOrderBump?: (id: string) => void;
  crossSells?: any[];
  selectedCrossSells?: string[];
  onToggleCrossSell?: (id: string) => void;
  paymentMethod?: string;
  onPaymentMethodChange?: (method: string) => void;
  shippingMethods?: any[];
  selectedShippingMethod?: any;
  onSelectShippingMethod?: (method: any) => void;
}> = ({ primaryColor, gradient, checkoutData, theme, isPreview, orderId, onSuccess, address, onAddressChange, cpf, onCpfChange, templateSlug, orderBumps = [], selectedOrderBumps = [], onToggleOrderBump, crossSells = [], selectedCrossSells = [], onToggleCrossSell, paymentMethod, onPaymentMethodChange, shippingMethods, selectedShippingMethod, onSelectShippingMethod }) => {
  const [localPayMethod, setLocalPayMethod] = useState('pix');
  const payMethod = paymentMethod 
    ? (paymentMethod === 'CREDIT_CARD' ? 'credit' : paymentMethod === 'PIX' ? 'pix' : 'boleto') 
    : localPayMethod;
  const setPayMethod = (m: string) => {
    if (onPaymentMethodChange) {
      onPaymentMethodChange(m === 'credit' ? 'CREDIT_CARD' : m === 'pix' ? 'PIX' : 'BOLETO');
    } else {
      setLocalPayMethod(m);
    }
  };
  const [cardData, setCardData] = useState<CardState>(emptyCard());
  const [contact, setContact] = useState<ContactState>(emptyContact());
  const [errors, setErrors] = useState<FormErrors>({});
  const [paySuccess, setPaySuccess] = useState(false);

  const products: any[] = checkoutData?.products || [];
  const subtotal = products.reduce((s, p) => s + (p.price ?? 0) * (p.quantity ?? 1), 0) || 119.90;
  const shipping = checkoutData?.shipping ?? 0;
  const discount = checkoutData?.discount ?? 0;
  const total = subtotal + shipping - discount;

  const { processPayment, processing, error: processorError } = usePaymentProcessor({
    orderId, total, templateSlug,
  });

  const handleSubmit = async () => {
    if (isPreview) { onSuccess?.(orderId || 'preview'); return; }

    const allErrors = validateCheckoutForm(contact, address, cpf, payMethod, cardData);
    if (Object.keys(allErrors).length > 0) { setErrors(allErrors); return; }
    setErrors({});

    const [expiryMonth, expiryYear] = (cardData.expiry || '/').split('/');

    await processPayment({
      paymentMethod: payMethod === 'credit' ? 'CREDIT_CARD' : payMethod === 'pix' ? 'PIX' : 'BOLETO',
      customerData: {
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        document: cpf,
      },
      addressData: {
        zipCode: address.cep,
        street: address.street,
        number: address.number,
        complement: address.complement,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
      },
      cardData: payMethod === 'credit' ? {
        number: cardData.number,
        holderName: cardData.holderName,
        expirationMonth: expiryMonth || '',
        expirationYear: expiryYear || '',
        cvv: cardData.cvv,
        installments: cardData.installments,
        cpf: cardData.cpf,
      } : undefined,
      items: products,
      discount: discount,
      shipping: shipping,
    });
  };

  if (paySuccess) {
    return (
      <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Pedido confirmado!</h3>
        <p className="text-sm text-gray-500">Redirecionando...</p>
      </div>
    );
  }

  return (
    <>
      {/* Contact */}
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-gray-500" />
          </div>
          <span className="text-sm font-semibold text-gray-700">Informações de Contato</span>
        </div>
        <div className="px-5 py-4 space-y-3">
          <PillInput value={contact.name} onChange={v => setContact(c => ({ ...c, name: v }))} placeholder="Nome completo *" error={errors.name} />
          <div className="grid grid-cols-2 gap-3">
            <PillInput value={contact.email} onChange={v => setContact(c => ({ ...c, email: v }))} placeholder="E-mail *" type="email" error={errors.email} />
            <PillInput value={contact.phone} onChange={v => setContact(c => ({ ...c, phone: formatPhone(v) }))} placeholder="Telefone *" error={errors.phone} />
          </div>
        </div>
      </div>

      {/* Address expandable */}
      <MobileExpandButton label="Adicionar endereço de entrega" primaryColor={primaryColor}>
        <AddressFields data={address} onChange={onAddressChange} errors={errors} />
        {errors.cep && !errors.street && <p className="text-xs text-red-500 mt-2">{errors.cep}</p>}
      </MobileExpandButton>

      {/* Seleção de Frete (Mobile) */}
      {shippingMethods && shippingMethods.length > 0 && (
        <div className="bg-white rounded-2xl overflow-hidden px-5 py-4 space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">🚚 Método de Envio</h4>
          <div className="flex flex-col gap-2.5">
            {shippingMethods.map((method) => {
              const isSelected = selectedShippingMethod?.id === method.id;
              return (
                <div
                  key={method.id}
                  onClick={() => onSelectShippingMethod?.(method)}
                  className={cn(
                    "flex items-center justify-between p-3.5 rounded-xl border-2 transition-all cursor-pointer",
                    isSelected
                      ? "border-[#E91E8C] bg-[#E91E8C]/5"
                      : "border-gray-100 bg-white hover:border-gray-200"
                  )}
                  style={isSelected ? { borderColor: primaryColor, backgroundColor: `${primaryColor}08` } : {}}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      checked={isSelected}
                      onChange={() => onSelectShippingMethod?.(method)}
                      style={isSelected ? { accentColor: primaryColor } : {}}
                      className="w-4 h-4"
                    />
                    <ShippingLogo name={method.name} size={18} />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{method.name}</p>
                      {method.description && <p className="text-xs text-gray-400">{method.description}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">
                      {Number(method.price) === 0 ? 'Grátis' : `R$ ${Number(method.price).toFixed(2).replace('.', ',')}`}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {method.estimatedDaysMin && method.estimatedDaysMax
                        ? `${method.estimatedDaysMin} a ${method.estimatedDaysMax} dias`
                        : `${method.estimatedDays || 5} dias`}
                      {method.isBusinessDays ? ' úteis' : ' corridos'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CPF expandable */}
      <MobileExpandButton label="Adicionar CPF" primaryColor={primaryColor}>
        <PillInput value={cpf} onChange={v => onCpfChange(formatCPFCNPJ(v))} placeholder="000.000.000-00"
          inputMode="numeric" error={errors.cpf} />
      </MobileExpandButton>

      {/* ORDER BUMPS */}
      {theme?.orderBumpEnabled && orderBumps && orderBumps.length > 0 && (
        <div className="bg-white rounded-2xl overflow-hidden px-5 py-4 space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">🎁 Oferta Especial</h4>
          {orderBumps.map((bump: any) => (
            <OrderBumpCard
              key={bump.id}
              orderBump={bump}
              theme={theme}
              orderBumpConfig={theme?._checkoutConfig?.orderBump}
              selected={selectedOrderBumps?.includes(bump.id)}
              onToggle={onToggleOrderBump || (() => {})}
            />
          ))}
        </div>
      )}

      {/* CROSS-SELLS */}
      {crossSells && crossSells.length > 0 && (
        <div className="bg-white rounded-2xl overflow-hidden px-5 py-4 space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">🔥 Aproveite e compre junto</h4>
          <div className="grid grid-cols-1 gap-2.5">
            {crossSells.map((product: any) => (
              <CrossSellCard
                key={product.id}
                product={product}
                selected={selectedCrossSells?.includes(product.id)}
                onToggle={() => onToggleCrossSell && onToggleCrossSell(product.id)}
                primaryColor={primaryColor}
              />
            ))}
          </div>
        </div>
      )}

      {/* Payment */}
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700">Forma de pagamento</h4>
        </div>
        <PaymentSection primaryColor={primaryColor} payMethod={payMethod} setPayMethod={setPayMethod}
          cardData={cardData} onCardChange={setCardData} cardErrors={errors} total={total} />
      </div>

      {/* Total + CTA */}
      <div className="bg-white rounded-2xl px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500">Total ({products.length || 1} {(products.length || 1) === 1 ? 'item' : 'itens'}):</span>
          <span className="text-lg font-extrabold text-gray-900">{fmtBRL(total)}</span>
        </div>
        <motion.button type="button" onClick={handleSubmit} disabled={processing}
          className="w-full py-4 rounded-full text-white font-bold text-sm tracking-wide hover:opacity-90 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2"
          style={{ background: processing ? '#9ca3af' : gradient }}
          whileTap={{ scale: processing ? 1 : 0.97 }}>
          {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
            : <><Lock className="w-4 h-4" /> Fazer pedido</>}
        </motion.button>
        <div className="flex items-center justify-center gap-1.5 mt-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-gray-400 font-medium">Compra 100% Segura</span>
        </div>
        {(errors._global || processorError) && (
          <p className="flex items-center gap-1.5 text-xs text-red-500 mt-2 text-center justify-center">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {errors._global || processorError}
          </p>
        )}
      </div>
    </>
  );
};

// ─── MOBILE DISCOUNT ROW ─────────────────────────────────────────────────────

const MobileDiscountRow: React.FC<{ discount: number; primaryColor: string }> = ({ discount, primaryColor }) => {
  if (discount <= 0) return null;
  return (
    <div className="bg-white rounded-2xl flex items-center justify-between px-5 py-3.5">
      <span className="text-sm font-semibold text-gray-700">Desconto</span>
      <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: primaryColor }}>- {fmtBRL(discount)}</span>
    </div>
  );
};

// ─── MOBILE COUPON ROW ────────────────────────────────────────────────────────

const MobileCouponRow: React.FC<{
  appliedCouponCode?: string;
  couponError?: string;
  onApplyCoupon?: (code: string) => Promise<{ success: boolean; discountAmount?: number; error?: string }>;
  onRemoveCoupon?: () => void;
  primaryColor: string;
}> = ({ appliedCouponCode, couponError, onApplyCoupon, onRemoveCoupon, primaryColor }) => {
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

  return (
    <div className="bg-white rounded-2xl p-4 space-y-2.5">
      <div className="flex items-center gap-1.5 pb-1 border-b border-gray-50">
        <Tag className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-xs font-semibold text-gray-700">Cupom de Desconto</span>
      </div>
      {!appliedCouponCode ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <input
              value={couponCode}
              onChange={e => setCouponCode(e.target.value)}
              placeholder="Adicionar cupom"
              disabled={loading}
              className="flex-1 border border-gray-200 rounded-xl h-10 px-3 text-xs focus:outline-none focus:border-pink-300 focus:ring-1 focus:ring-pink-100 bg-white"
            />
            <button
              onClick={handleApply}
              disabled={loading || !couponCode}
              className="px-4 h-10 rounded-xl text-xs font-bold text-white transition-opacity disabled:opacity-60"
              style={{ backgroundColor: primaryColor }}
            >
              {loading ? 'Aplicando...' : 'Aplicar'}
            </button>
          </div>
          {(localError || couponError) && (
            <span className="text-[10px] text-red-500 ml-1">
              {localError || couponError}
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-2 px-3">
          <span className="text-xs font-bold text-green-600 uppercase tracking-wider">{appliedCouponCode}</span>
          <button
            onClick={handleRemove}
            className="text-xs font-semibold text-red-500 hover:text-red-600"
          >
            Remover
          </button>
        </div>
      )}
    </div>
  );
};

// ─── TIKTOK COMMENTS SECTION ──────────────────────────────────────────────────
interface TikTokCommentProps {
  id: string;
  authorName: string;
  rating: number;
  avatarUrl?: string;
  relativeTime: string;
  message: string;
  likes: number;
  likedByUser?: boolean;
}

const TikTokComments = ({ socialProofs }: { socialProofs?: any[] }) => {
  const [reviewsList, setReviewsList] = useState<TikTokCommentProps[]>([]);

  const initialReviews: TikTokCommentProps[] = useMemo(() => {
    const raw = socialProofs?.filter((p) => p.type === 'REVIEW') || [];
    return raw.map((p) => ({
      id: p.id,
      authorName: p.display?.authorName || "Cliente Anônimo",
      rating: Number(p.display?.rating || 5),
      avatarUrl: p.display?.avatarUrl || "",
      relativeTime: p.display?.relativeTime || "recente",
      message: p.message,
      likes: Math.floor(Math.random() * 80) + 12,
    }));
  }, [socialProofs]);

  useEffect(() => {
    setReviewsList(initialReviews);
  }, [initialReviews]);

  const toggleLike = (id: string) => {
    setReviewsList((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            likedByUser: !r.likedByUser,
            likes: r.likedByUser ? r.likes - 1 : r.likes + 1,
          };
        }
        return r;
      })
    );
  };

  const getUsername = (name: string) => {
    const clean = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
    return `@${clean || "cliente"}_${Math.floor(Math.random() * 90) + 10}`;
  };

  if (reviewsList.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 mt-6 w-full shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
        <MessageCircle size={20} className="text-gray-800" />
        <h3 className="font-bold text-sm text-gray-800">
          Comentários ({reviewsList.length * 2})
        </h3>
      </div>

      <div className="space-y-6">
        {reviewsList.map((review) => {
          const username = getUsername(review.authorName);
          return (
            <div key={review.id} className="relative">
              {/* Comentário Pai */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  {review.avatarUrl ? (
                    <img
                      src={review.avatarUrl}
                      alt={review.authorName}
                      className="w-8 h-8 rounded-full object-cover border border-gray-100"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-semibold text-xs border border-gray-200">
                      {review.authorName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-gray-900">
                        {review.authorName}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {username}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 mt-1 leading-normal">
                      {review.message}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400 font-semibold">
                      <span>{review.relativeTime}</span>
                      <span className="cursor-pointer hover:text-gray-600">
                        Responder
                      </span>
                    </div>
                  </div>
                </div>

                {/* Curtida do Comentário Pai */}
                <button
                  onClick={() => toggleLike(review.id)}
                  className="flex flex-col items-center justify-center text-gray-400 hover:text-red-500 transition-colors animate-none"
                >
                  <Heart
                    size={14}
                    className={cn(
                      "transition-all",
                      review.likedByUser ? "text-rose-500 fill-rose-500 scale-110" : ""
                    )}
                  />
                  <span className="text-[9px] mt-0.5 font-medium">
                    {review.likes}
                  </span>
                </button>
              </div>

              {/* Linha vertical conectora azul */}
              <div className="absolute left-[15px] top-9 bottom-3 w-[2px] bg-blue-500/20 rounded" />

              {/* Resposta do Criador (Sub-reply) */}
              <div className="ml-10 mt-3 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[9px]">
                  SA
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-gray-900">
                      SyncAds
                    </span>
                    <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.2 rounded font-bold uppercase tracking-wider scale-90 origin-left">
                      Criador
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 leading-normal font-normal">
                    Muito obrigado pelo feedback, <span className="text-blue-500 font-medium">{username}</span>! Nosso objetivo é sempre oferecer o melhor atendimento e qualidade. ❤️🚀
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400 font-semibold">
                    <span>{review.relativeTime}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── MAIN TEMPLATE ────────────────────────────────────────────────────────────

const TikTokTemplate: React.FC<TemplateRenderProps> = ({
  orderId, checkoutData, theme, checkoutConfig, templateConfig, isPreview = false,
  isMobile = false, onPaymentSuccess,
  onApplyCoupon, onRemoveCoupon, appliedCouponCode, couponError,
  orderBumps = [], selectedOrderBumps = [], onToggleOrderBump,
  crossSells = [], selectedCrossSells = [], onToggleCrossSell,
  discountBanners = [],
  paymentMethod,
  onPaymentMethodChange,
  socialProofs,
  shippingMethods,
  selectedShippingMethod,
  onSelectShippingMethod,
}) => {
  // Mapeamento dinâmico das faixas de desconto ativas
  const headerNoticeBarConfig = useMemo(() => {
    const activeHeaderBanner = (discountBanners || []).find(
      (b) => b.type === "HEADER" && b.status === "ACTIVE"
    );
    if (activeHeaderBanner) {
      return {
        enabled: true,
        message: activeHeaderBanner.message,
        style: 'normal',
        position: 'top',
        animation: 'slide',
        bgColor: activeHeaderBanner.backgroundColor,
        textColor: activeHeaderBanner.textColor,
        ctaText: activeHeaderBanner.ctaText,
        ctaLink: activeHeaderBanner.ctaLink,
        discountCode: activeHeaderBanner.discountCode,
        buttonBackgroundColor: activeHeaderBanner.buttonBackgroundColor,
        buttonTextColor: activeHeaderBanner.buttonTextColor,
        closeable: activeHeaderBanner.closable ?? activeHeaderBanner.showCloseButton,
      };
    }
    return checkoutConfig?.noticeBar;
  }, [discountBanners, checkoutConfig?.noticeBar]);

  const footerNoticeBarConfig = useMemo(() => {
    const activeFooterBanner = (discountBanners || []).find(
      (b) => b.type === "FOOTER" && b.status === "ACTIVE"
    );
    if (activeFooterBanner) {
      return {
        enabled: true,
        message: activeFooterBanner.message,
        style: 'normal',
        position: 'bottom',
        animation: 'slide',
        bgColor: activeFooterBanner.backgroundColor,
        textColor: activeFooterBanner.textColor,
        ctaText: activeFooterBanner.ctaText,
        ctaLink: activeFooterBanner.ctaLink,
        discountCode: activeFooterBanner.discountCode,
        buttonBackgroundColor: activeFooterBanner.buttonBackgroundColor,
        buttonTextColor: activeFooterBanner.buttonTextColor,
        closeable: activeFooterBanner.closable ?? activeFooterBanner.showCloseButton,
      };
    }
    return checkoutConfig?.noticeBar;
  }, [discountBanners, checkoutConfig?.noticeBar]);

  const showHeaderNoticeBar = useMemo(() => {
    const activeHeaderBanner = (discountBanners || []).find(
      (b) => b.type === "HEADER" && b.status === "ACTIVE"
    );
    if (activeHeaderBanner) return true;

    const enabled = checkoutConfig?.noticeBar?.enabled ?? theme?.noticeBarEnabled;
    const position = checkoutConfig?.noticeBar?.position ?? theme?.noticeBarPosition ?? 'top';
    return !!enabled && position === 'top';
  }, [discountBanners, checkoutConfig?.noticeBar, theme]);

  const showFooterNoticeBar = useMemo(() => {
    const activeFooterBanner = (discountBanners || []).find(
      (b) => b.type === "FOOTER" && b.status === "ACTIVE"
    );
    if (activeFooterBanner) return true;

    const enabled = checkoutConfig?.noticeBar?.enabled ?? theme?.noticeBarEnabled;
    const position = checkoutConfig?.noticeBar?.position ?? theme?.noticeBarPosition ?? 'top';
    return !!enabled && position === 'bottom';
  }, [discountBanners, checkoutConfig?.noticeBar, theme]);

  // Resolve: store (novo) > theme (legado)
  const primaryColor =
    checkoutConfig?.buttons.primaryBg ??
    (theme.primaryColor as string) ??
    '#E91E8C';
  const gradient =
    (theme.buttonGradient as string) ||
    `linear-gradient(135deg, ${primaryColor}, #FF4559)`;
  const fontFamily =
    checkoutConfig?.typography.fontFamily ??
    (theme.fontFamily as string) ??
    "'Inter', system-ui, sans-serif";
  const discount = checkoutData?.discount ?? 0;

  // Favicon dinâmico
  useEffect(() => {
    const faviconUrl = checkoutConfig?.header.faviconUrl;
    if (!faviconUrl) return;
    let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = faviconUrl;
  }, [checkoutConfig?.header.faviconUrl]);

  // Banner state — lê do theme legado (vem do DB via TemplateRenderer)
  // updateConfig usa campos canônicos banner.* para que o delete (null) seja persistido
  const { updateConfig } = useCheckoutConfigStore();
  const [bannerTop, setBannerTop] = useState<string | undefined>(
    (theme.bannerTopUrl as string | null | undefined) || undefined
  );
  const [bannerLeft, setBannerLeft] = useState<string | undefined>(
    (theme.bannerLeftUrl as string | null | undefined) || undefined
  );
  const [bannerRight, setBannerRight] = useState<string | undefined>(
    (theme.bannerRightUrl as string | null | undefined) || undefined
  );

  // Shared form state (used by desktop forms + desktop order panel)
  const [contactData, setContactData] = useState<ContactState>(emptyContact());
  const [addressData, setAddressData] = useState<AddressState>(emptyAddress());
  const [cpfData, setCpfData] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Usa campos canônicos banner.* — null = explicitamente apagado, string = URL
  const handleBannerTopChange = useCallback((url: string) => {
    const val = url || null; setBannerTop(val || undefined);
    updateConfig({ banner: { desktopUrl: val } });
  }, [updateConfig]);

  const handleBannerLeftChange = useCallback((url: string) => {
    const val = url || null; setBannerLeft(val || undefined);
    updateConfig({ banner: { leftTopUrl: val } });
  }, [updateConfig]);

  const handleBannerRightChange = useCallback((url: string) => {
    const val = url || null; setBannerRight(val || undefined);
    updateConfig({ banner: { rightTopUrl: val } });
  }, [updateConfig]);

  return (
    <div className={cn('flex flex-col w-full', isPreview ? 'bg-[#f0f0f0]' : 'min-h-screen bg-[#f0f0f0]')}
      style={{ fontFamily }}>

      {/* NoticeBar */}
      {showHeaderNoticeBar && (
        <NoticeBar
          theme={theme as Record<string, unknown>}
          noticeBarConfig={headerNoticeBarConfig}
          onApplyCoupon={onApplyCoupon}
        />
      )}

      {/* ─── DESKTOP LAYOUT ─────────────────────────────────────────── */}
      {!isMobile && (
        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
          <DropZone imageUrl={bannerTop} isPreview={isPreview} minHeight={80} className="mb-4"
            label="Solte aqui" recommendedSize="980 × 80px" onImageChange={handleBannerTopChange} />
          <div className="grid grid-cols-[1fr_380px] gap-6 items-start">
            {/* LEFT: Forms */}
            <div className="space-y-4">
              <DropZone imageUrl={bannerLeft} isPreview={isPreview} minHeight={80}
                label="Solte aqui" recommendedSize="580 × 80px" onImageChange={handleBannerLeftChange} />
              <DesktopAddressCard data={addressData} onChange={setAddressData} errors={formErrors} />
              <DesktopShippingCard
                shippingMethods={shippingMethods}
                selectedShippingMethod={selectedShippingMethod}
                onSelectShippingMethod={onSelectShippingMethod}
                primaryColor={primaryColor}
              />
              <DesktopCpfCard value={cpfData} onChange={setCpfData} error={formErrors.cpf} />
              <DesktopContactCard data={contactData} onChange={setContactData} errors={formErrors} />
              {checkoutConfig?.orderBump?.enabled !== false && orderBumps.map(bump => (
                <OrderBumpCard
                  key={bump.id}
                  orderBump={bump}
                  theme={theme}
                  orderBumpConfig={checkoutConfig?.orderBump}
                  selected={selectedOrderBumps.includes(bump.id)}
                  onToggle={onToggleOrderBump || (() => {})}
                />
              ))}
              {crossSells && crossSells.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">🔥 Aproveite e compre junto</h4>
                  <div className="grid grid-cols-1 gap-2.5">
                    {crossSells.map(product => (
                      <CrossSellCard
                        key={product.id}
                        product={product}
                        selected={selectedCrossSells.includes(product.id)}
                        onToggle={() => onToggleCrossSell && onToggleCrossSell(product.id)}
                        primaryColor={primaryColor}
                      />
                    ))}
                  </div>
                </div>
              )}
              {/* REAL SOCIAL PROOFS / COMMENTS */}
              <TikTokComments socialProofs={socialProofs} />
            </div>
            {/* RIGHT: Order Summary */}
            <div className="sticky top-4">
              <DropZone imageUrl={bannerRight} isPreview={isPreview} minHeight={80} className="mb-4"
                label="Solte aqui" recommendedSize="380 × 80px" onImageChange={handleBannerRightChange} />
              <DesktopOrderPanel
                checkoutData={checkoutData} theme={theme} primaryColor={primaryColor} gradient={gradient}
                isPreview={isPreview} orderId={orderId} onSuccess={onPaymentSuccess}
                templateSlug={templateConfig.slug}
                contact={contactData} address={addressData} cpf={cpfData}
                onFormError={setFormErrors}
                onApplyCoupon={onApplyCoupon}
                onRemoveCoupon={onRemoveCoupon}
                appliedCouponCode={appliedCouponCode}
                couponError={couponError}
                orderBumps={orderBumps}
                selectedOrderBumps={selectedOrderBumps}
                onToggleOrderBump={onToggleOrderBump}
                crossSells={crossSells}
                selectedCrossSells={selectedCrossSells}
                onToggleCrossSell={onToggleCrossSell}
                paymentMethod={paymentMethod}
                onPaymentMethodChange={onPaymentMethodChange}
              />
            </div>
          </div>
        </main>
      )}

      {/* ─── MOBILE LAYOUT ──────────────────────────────────────────── */}
      {isMobile && (
        <main className="flex-1 px-4 py-4 space-y-3">
          <DropZone imageUrl={bannerTop} isPreview={isPreview} minHeight={70}
            label="Solte aqui" recommendedSize="360 × 70px" onImageChange={handleBannerTopChange} />

          <MobileProgressBar />
          <MobileSummaryRow checkoutData={checkoutData} primaryColor={primaryColor} />
          <MobileDiscountRow discount={discount} primaryColor={primaryColor} />
          <MobileCouponRow
            appliedCouponCode={appliedCouponCode}
            couponError={couponError}
            onApplyCoupon={onApplyCoupon}
            onRemoveCoupon={onRemoveCoupon}
            primaryColor={primaryColor}
          />

          <MobileContactPaymentCard
            primaryColor={primaryColor} gradient={gradient} checkoutData={checkoutData}
            theme={theme} isPreview={isPreview} orderId={orderId} onSuccess={onPaymentSuccess}
            templateSlug={templateConfig.slug}
            address={addressData} onAddressChange={setAddressData}
            cpf={cpfData} onCpfChange={setCpfData}
            orderBumps={orderBumps}
            selectedOrderBumps={selectedOrderBumps}
            onToggleOrderBump={onToggleOrderBump}
            crossSells={crossSells}
            selectedCrossSells={selectedCrossSells}
            onToggleCrossSell={onToggleCrossSell}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={onPaymentMethodChange}
            shippingMethods={shippingMethods}
            selectedShippingMethod={selectedShippingMethod}
            onSelectShippingMethod={onSelectShippingMethod}
          />
          {/* REAL SOCIAL PROOFS / COMMENTS */}
          <TikTokComments socialProofs={socialProofs} />
        </main>
      )}

      {/* NoticeBar — RODAPÉ (position=bottom) */}
      {showFooterNoticeBar && (
        <NoticeBar
          theme={theme as Record<string, unknown>}
          noticeBarConfig={footerNoticeBarConfig}
          onApplyCoupon={onApplyCoupon}
        />
      )}
    </div>
  );
};

export default TikTokTemplate;
