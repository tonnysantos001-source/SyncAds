/**
 * MinimalStepShipping — Endereço de entrega do checkout minimalista
 *
 * FUNCIONALIDADES REAIS:
 *   - Estado controlado via props (estado elevado no MinimalTemplate)
 *   - CEP lookup via ViaCEP (hook useCepLookup) — preenche endereço automaticamente
 *   - Máscara de CEP
 *   - Validação completa antes de avançar
 *   - Erros inline por campo
 *
 * @version 3.0
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';
import { useCepLookup } from '@/hooks/useCepLookup';
import { formatCEP, validateCEP } from '@/utils/checkoutValidators';
import { ShippingLogo } from '@/components/checkout/ShippingLogo';
import type { ButtonCfg } from './MinimalStepCustomer';

export interface AddressData {
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface MinimalStepShippingProps {
  theme: Record<string, unknown>;
  isPreview: boolean;
  onNext: () => void;
  onBack: () => void;
  primaryColor: string;
  buttonCfg?: ButtonCfg;
  /** Estado elevado — controlado pelo MinimalTemplate */
  data: AddressData;
  onChange: (field: keyof AddressData, value: string) => void;
  shippingMethods?: any[];
  selectedShippingMethod?: any;
  onSelectShippingMethod?: (method: any) => void;
}

// ── estilos reutilizáveis ─────────────────────────────────────

const getInputStyle = (
  theme: Record<string, unknown>,
  hasError?: boolean,
  overrides?: React.CSSProperties
): React.CSSProperties => ({
  width: '100%',
  height: '45px',
  padding: '0 16px',
  borderRadius: '8px',
  border: `1px solid ${hasError ? '#ef4444' : (theme.inputBorderColor as string) || '#E5E7EB'}`,
  backgroundColor: hasError ? '#fff5f5' : (theme.inputBackgroundColor as string) || '#ffffff',
  color: '#111827',
  fontSize: '13px',
  fontFamily: '"Rubik", sans-serif',
  outline: 'none',
  transition: 'border-color 0.2s ease',
  boxSizing: 'border-box',
  ...overrides,
});

const getLabelStyle = (theme: Record<string, unknown>): React.CSSProperties => ({
  display: 'block',
  fontSize: '13px',
  fontFamily: '"Rubik", sans-serif',
  fontWeight: '500',
  color: (theme.labelColor as string) || '#111827',
  marginBottom: '6px',
});

const errorStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '11px',
  color: '#ef4444',
  marginTop: '4px',
  fontFamily: '"Rubik", sans-serif',
};

// ── componente ─────────────────────────────────────────────

export const MinimalStepShipping: React.FC<MinimalStepShippingProps> = ({
  theme, isPreview, onNext, onBack, primaryColor, buttonCfg, data, onChange,
  shippingMethods, selectedShippingMethod, onSelectShippingMethod,
}) => {
  const [errors, setErrors] = useState<Partial<Record<keyof AddressData, string>>>({});
  const [cepFound, setCepFound] = useState(false);

  const { lookup: lookupCep, loading: loadingCep } = useCepLookup();

  const btnBg     = buttonCfg?.primaryBg     ?? primaryColor ?? '#0B1320';
  const btnText   = buttonCfg?.primaryText   ?? '#ffffff';
  const btnRadius = buttonCfg?.primaryRadius ?? '8px';
  const btnFlow   = buttonCfg?.primaryFlow   ?? false;

  const clearError = (field: keyof AddressData) => {
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  // CEP lookup automático ao digitar 8 dígitos
  const handleCepChange = async (value: string) => {
    const formatted = formatCEP(value);
    onChange('zipCode', formatted);
    setCepFound(false);
    clearError('zipCode');

    const digits = formatted.replace(/\D/g, '');
    if (digits.length === 8) {
      const result = await lookupCep(digits);
      if (result) {
        onChange('street', result.street || '');
        onChange('neighborhood', result.neighborhood || '');
        onChange('city', result.city || '');
        onChange('state', result.state || '');
        setCepFound(true);
        setErrors(prev => {
          const n = { ...prev };
          delete n.street; delete n.neighborhood; delete n.city; delete n.state; delete n.zipCode;
          return n;
        });
      } else {
        setErrors(prev => ({ ...prev, zipCode: 'CEP não encontrado' }));
      }
    }
  };

  const validate = (): boolean => {
    if (isPreview) return true;
    const errs: Partial<Record<keyof AddressData, string>> = {};
    if (!validateCEP(data.zipCode)) errs.zipCode = 'CEP inválido';
    if (!data.street.trim()) errs.street = 'Rua obrigatória';
    if (!data.number.trim()) errs.number = 'Número obrigatório';
    if (!data.neighborhood.trim()) errs.neighborhood = 'Bairro obrigatório';
    if (!data.city.trim()) errs.city = 'Cidade obrigatória';
    if (!data.state.trim() || data.state.length !== 2) errs.state = 'UF obrigatória';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    onNext();
  };

  const advanceBtnStyle: React.CSSProperties = {
    flex: 1,
    height: '45px',
    backgroundColor: btnBg,
    color: btnText,
    border: 'none',
    borderRadius: btnRadius,
    fontFamily: '"Inter", sans-serif',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    letterSpacing: '0.3px',
    position: 'relative',
    overflow: 'hidden',
    ...(btnFlow ? {
      backgroundImage: `linear-gradient(90deg, ${btnBg} 0%, ${btnBg}cc 40%, #ffffff33 50%, ${btnBg}cc 60%, ${btnBg} 100%)`,
      backgroundSize: '200% 100%',
      animation: 'btnFlow 1.8s linear infinite',
    } : {}),
  };

  const backBtnStyle: React.CSSProperties = {
    height: '45px',
    paddingLeft: '16px',
    paddingRight: '16px',
    backgroundColor: 'transparent',
    color: (theme.textColor as string) || '#374151',
    border: '1px solid #D1D5DB',
    borderRadius: btnRadius,
    fontFamily: '"Inter", sans-serif',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    whiteSpace: 'nowrap',
  };

  return (
    <>
      {btnFlow && (
        <style>{`@keyframes btnFlow { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      )}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* CEP */}
      <div>
        <label style={getLabelStyle(theme)}>CEP *</label>
        <div style={{ position: 'relative' }}>
          <input
            style={getInputStyle(theme, !!errors.zipCode, {
              borderColor: cepFound && !errors.zipCode ? '#16a34a' : undefined,
              paddingRight: '36px',
            })}
            placeholder="00000-000"
            maxLength={9}
            inputMode="numeric"
            value={data.zipCode}
            autoComplete="postal-code"
            onChange={(e) => handleCepChange(e.target.value)}
          />
          {loadingCep && (
            <Loader2 style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#9CA3AF' }} className="animate-spin" />
          )}
          {cepFound && !loadingCep && (
            <CheckCircle style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#16a34a' }} />
          )}
        </div>
        {errors.zipCode && <div style={errorStyle}><AlertCircle style={{ width: '11px', height: '11px' }} />{errors.zipCode}</div>}
      </div>

      {/* Rua + Número */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '12px' }}>
        <div>
          <label style={getLabelStyle(theme)}>Rua *</label>
          <input
            style={getInputStyle(theme, !!errors.street)}
            placeholder="Nome da rua"
            value={data.street}
            autoComplete="address-line1"
            onChange={(e) => { onChange('street', e.target.value); clearError('street'); }}
          />
          {errors.street && <div style={errorStyle}><AlertCircle style={{ width: '11px', height: '11px' }} />{errors.street}</div>}
        </div>
        <div>
          <label style={getLabelStyle(theme)}>Nº *</label>
          <input
            style={getInputStyle(theme, !!errors.number)}
            placeholder="123"
            value={data.number}
            onChange={(e) => { onChange('number', e.target.value); clearError('number'); }}
          />
          {errors.number && <div style={errorStyle}><AlertCircle style={{ width: '11px', height: '11px' }} />{errors.number}</div>}
        </div>
      </div>

      {/* Complemento + Bairro */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={getLabelStyle(theme)}>Complemento</label>
          <input
            style={getInputStyle(theme)}
            placeholder="Apto 101"
            value={data.complement}
            onChange={(e) => onChange('complement', e.target.value)}
          />
        </div>
        <div>
          <label style={getLabelStyle(theme)}>Bairro *</label>
          <input
            style={getInputStyle(theme, !!errors.neighborhood)}
            placeholder="Bairro"
            value={data.neighborhood}
            onChange={(e) => { onChange('neighborhood', e.target.value); clearError('neighborhood'); }}
          />
          {errors.neighborhood && <div style={errorStyle}><AlertCircle style={{ width: '11px', height: '11px' }} />{errors.neighborhood}</div>}
        </div>
      </div>

      {/* Cidade + Estado */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '12px' }}>
        <div>
          <label style={getLabelStyle(theme)}>Cidade *</label>
          <input
            style={getInputStyle(theme, !!errors.city)}
            placeholder="Cidade"
            value={data.city}
            autoComplete="address-level2"
            onChange={(e) => { onChange('city', e.target.value); clearError('city'); }}
          />
          {errors.city && <div style={errorStyle}><AlertCircle style={{ width: '11px', height: '11px' }} />{errors.city}</div>}
        </div>
        <div>
          <label style={getLabelStyle(theme)}>UF *</label>
          <input
            style={getInputStyle(theme, !!errors.state)}
            placeholder="SP"
            maxLength={2}
            value={data.state}
            autoComplete="address-level1"
            onChange={(e) => { onChange('state', e.target.value.toUpperCase()); clearError('state'); }}
          />
          {errors.state && <div style={errorStyle}><AlertCircle style={{ width: '11px', height: '11px' }} />{errors.state}</div>}
        </div>
      </div>

      {/* Seleção de Frete */}
      {shippingMethods && shippingMethods.length > 0 && (
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={getLabelStyle(theme)}>Método de envio *</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {shippingMethods.map((method) => {
              const isSelected = selectedShippingMethod?.id === method.id;
              return (
                <div
                  key={method.id}
                  onClick={() => onSelectShippingMethod?.(method)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: `2px solid ${isSelected ? primaryColor : '#E5E7EB'}`,
                    backgroundColor: isSelected ? `${primaryColor}08` : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                    <input
                      type="radio"
                      checked={isSelected}
                      onChange={() => onSelectShippingMethod?.(method)}
                      style={{ accentColor: primaryColor, cursor: 'pointer' }}
                    />
                    <ShippingLogo name={method.name} size={18} />
                    <div style={{ fontFamily: '"Rubik", sans-serif', minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#111827', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {method.name}
                      </p>
                      {method.description && (
                        <p style={{ margin: 0, fontSize: '11px', color: '#6B7280', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {method.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: '"Rubik", sans-serif', flexShrink: 0 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#111827' }}>
                      {Number(method.price) === 0 ? 'Grátis' : `R$ ${Number(method.price).toFixed(2).replace('.', ',')}`}
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#6B7280' }}>
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

      {/* Botões */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <button type="button" onClick={onBack} style={backBtnStyle}>
          <ChevronLeft style={{ width: '16px', height: '16px' }} />
          Voltar
        </button>

        <motion.button
          type="button"
          onClick={handleNext}
          style={advanceBtnStyle}
          whileHover={{ opacity: 0.88 }}
          whileTap={{ scale: 0.98 }}
        >
          Ir para Pagamento
          <ChevronRight style={{ width: '18px', height: '18px' }} />
        </motion.button>
      </div>
    </div>
    </>
  );
};
