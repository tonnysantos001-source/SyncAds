/**
 * MinimalStepShipping — Endereço de entrega (v2)
 *
 * Inputs: 48px, border-radius 8px, padding 16px
 * Labels: 12px #6B7280
 * Botão Avançar: 48px bg primário, 100%; Voltar: borda cinza
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { formatCep, searchCep } from '@/lib/utils/cepUtils';

interface AddressData {
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
}

// ── estilos reutilizáveis ───────────────────────────────────

const getInputStyle = (theme: Record<string, unknown>, overrides?: React.CSSProperties): React.CSSProperties => ({
  width: '100%',
  height: '45px',
  padding: '0 16px',
  borderRadius: '8px',
  border: `1px solid ${(theme.inputBorderColor as string) || '#E5E7EB'}`,
  backgroundColor: (theme.inputBackgroundColor as string) || '#ffffff',
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

// ── componente ─────────────────────────────────────────────

export const MinimalStepShipping: React.FC<MinimalStepShippingProps> = ({
  theme, isPreview, onNext, onBack, primaryColor,
}) => {
  const [data, setData] = useState<AddressData>({
    zipCode: '', street: '', number: '', complement: '',
    neighborhood: '', city: '', state: '',
  });
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepFound, setCepFound]     = useState(false);

  const btnColor = primaryColor || '#0B1320';

  const handleCepChange = async (value: string) => {
    const formatted = formatCep(value);
    setData({ ...data, zipCode: formatted });
    setCepFound(false);

    if (formatted.replace(/\D/g, '').length === 8) {
      setLoadingCep(true);
      try {
        const result = await searchCep(formatted.replace(/\D/g, ''));
        if (result) {
          setData((prev) => ({
            ...prev,
            street:       result.street       || result.logradouro || '',
            neighborhood: result.neighborhood  || result.bairro     || '',
            city:         result.city          || result.localidade  || '',
            state:        result.state         || result.uf          || '',
          }));
          setCepFound(true);
        }
      } catch {}
      finally { setLoadingCep(false); }
    }
  };

  const advanceBtnStyle: React.CSSProperties = {
    flex: 1,
    height: '45px',
    backgroundColor: btnColor,
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontFamily: '"Inter", sans-serif',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    letterSpacing: '0.3px',
  };

  const backBtnStyle: React.CSSProperties = {
    height: '45px',
    paddingLeft: '16px',
    paddingRight: '16px',
    backgroundColor: 'transparent',
    color: (theme.textColor as string) || '#374151',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* CEP */}
      <div>
        <label style={getLabelStyle(theme)}>CEP *</label>
        <div style={{ position: 'relative' }}>
          <input
            style={getInputStyle(theme, {
              borderColor: cepFound ? '#16a34a' : (theme.inputBorderColor as string) || '#D1D5DB',
            })}
            placeholder="00000-000"
            maxLength={9}
            value={data.zipCode}
            onChange={(e) => handleCepChange(e.target.value)}
          />
          {loadingCep && (
            <Loader2 style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#9CA3AF' }} className="animate-spin" />
          )}
          {cepFound && !loadingCep && (
            <CheckCircle style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#16a34a' }} />
          )}
        </div>
      </div>

      {/* Rua + Número */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '12px' }}>
        <div>
          <label style={getLabelStyle(theme)}>Rua *</label>
          <input
            style={getInputStyle(theme)}
            placeholder="Nome da rua"
            value={data.street}
            onChange={(e) => setData({ ...data, street: e.target.value })}
          />
        </div>
        <div>
          <label style={getLabelStyle(theme)}>Nº *</label>
          <input
            style={getInputStyle(theme)}
            placeholder="123"
            value={data.number}
            onChange={(e) => setData({ ...data, number: e.target.value })}
          />
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
            onChange={(e) => setData({ ...data, complement: e.target.value })}
          />
        </div>
        <div>
          <label style={getLabelStyle(theme)}>Bairro *</label>
          <input
            style={getInputStyle(theme)}
            placeholder="Bairro"
            value={data.neighborhood}
            onChange={(e) => setData({ ...data, neighborhood: e.target.value })}
          />
        </div>
      </div>

      {/* Cidade + Estado */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '12px' }}>
        <div>
          <label style={getLabelStyle(theme)}>Cidade *</label>
          <input
            style={getInputStyle(theme)}
            placeholder="Cidade"
            value={data.city}
            onChange={(e) => setData({ ...data, city: e.target.value })}
          />
        </div>
        <div>
          <label style={getLabelStyle(theme)}>UF *</label>
          <input
            style={getInputStyle(theme)}
            placeholder="SP"
            maxLength={2}
            value={data.state}
            onChange={(e) => setData({ ...data, state: e.target.value.toUpperCase() })}
          />
        </div>
      </div>

      {/* Botões */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <button type="button" onClick={onBack} style={backBtnStyle}>
          <ChevronLeft style={{ width: '16px', height: '16px' }} />
          Voltar
        </button>

        <motion.button
          type="button"
          onClick={onNext}
          style={advanceBtnStyle}
          whileHover={{ opacity: 0.88 }}
          whileTap={{ scale: 0.98 }}
        >
          Ir para Pagamento
          <ChevronRight style={{ width: '18px', height: '18px' }} />
        </motion.button>
      </div>
    </div>
  );
};
