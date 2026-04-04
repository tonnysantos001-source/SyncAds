/**
 * MinimalStepCustomer — Dados pessoais do checkout minimalista (v2)
 *
 * Inputs: 48px, border-radius 8px, padding 16px
 * Labels: 12px #6B7280
 * Botão:  48px, bg #0B1320, 100% largura
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronRight } from 'lucide-react';
import { formatPhone } from '@/lib/utils/phoneUtils';
import { formatCpf } from '@/lib/utils/cpfUtils';
import {
  validateNameDebounced,
  validateEmailDebounced,
  capitalizeWords,
} from '@/lib/utils/validationUtils';

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  document: string;
}

interface MinimalStepCustomerProps {
  theme: Record<string, unknown>;
  isPreview: boolean;
  onNext: () => void;
  primaryColor: string;
}

// ── estilos compartilhados ──────────────────────────────────
const getInputStyle = (theme: Record<string, unknown>, valid?: boolean | null): React.CSSProperties => ({
  width: '100%',
  height: '45px',
  padding: '0 16px',
  borderRadius: '8px',
  border: `1px solid ${valid === true ? '#16a34a' : valid === false ? '#ef4444' : (theme.inputBorderColor as string) || '#E5E7EB'}`,
  backgroundColor: (theme.inputBackgroundColor as string) || '#ffffff',
  color: '#111827',
  fontSize: '13px',
  fontFamily: '"Rubik", sans-serif',
  outline: 'none',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  boxSizing: 'border-box',
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

export const MinimalStepCustomer: React.FC<MinimalStepCustomerProps> = ({
  theme, isPreview, onNext, primaryColor,
}) => {
  const [data, setData] = useState<CustomerData>({ name: '', email: '', phone: '', document: '' });
  const [nameValid, setNameValid]   = useState<null | boolean>(null);
  const [emailValid, setEmailValid] = useState<null | boolean>(null);

  const btnColor = primaryColor || '#0B1320';

  const handleNext = () => {
    if (!isPreview) {
      if (!data.name || !data.email || !data.phone) return;
    }
    onNext();
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    height: '45px',
    backgroundColor: btnColor,
    color: (theme.buttonTextColor as string) || '#ffffff',
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
    marginTop: '8px',
    letterSpacing: '0.3px',
    transition: 'opacity 0.15s ease',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Nome */}
      <div>
        <label style={getLabelStyle(theme)}>Nome completo *</label>
        <div style={{ position: 'relative' }}>
          <input
            style={getInputStyle(theme, nameValid)}
            placeholder="Ex: Maria da Silva"
            value={data.name}
            onChange={(e) => {
              const v = capitalizeWords(e.target.value);
              setData({ ...data, name: v });
              validateNameDebounced(v, (r) => setNameValid(r?.isValid ?? null));
            }}
          />
          {nameValid === true && (
            <Check style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#16a34a' }} />
          )}
        </div>
      </div>

      {/* E-mail */}
      <div>
        <label style={getLabelStyle(theme)}>E-mail *</label>
        <div style={{ position: 'relative' }}>
          <input
            style={getInputStyle(theme, emailValid)}
            type="email"
            placeholder="Ex: maria@email.com"
            value={data.email}
            onChange={(e) => {
              const v = e.target.value.toLowerCase().trim();
              setData({ ...data, email: v });
              validateEmailDebounced(v, (r) => setEmailValid(r?.isValid ?? null));
            }}
          />
          {emailValid === true && (
            <Check style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#16a34a' }} />
          )}
        </div>
      </div>

      {/* CPF */}
      <div>
        <label style={getLabelStyle(theme)}>CPF *</label>
        <input
          style={getInputStyle(theme)}
          placeholder="000.000.000-00"
          maxLength={14}
          value={data.document}
          onChange={(e) => setData({ ...data, document: formatCpf(e.target.value) })}
        />
      </div>

      {/* Celular */}
      <div>
        <label style={getLabelStyle(theme)}>Celular (WhatsApp) *</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* DDI */}
          <div
            style={{
              ...getInputStyle(theme),
              width: '80px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              color: '#374151',
              justifyContent: 'center',
            }}
          >
            🇧🇷 <span>+55</span>
          </div>
          <input
            style={{ ...getInputStyle(theme), flex: 1 }}
            type="tel"
            placeholder="(00) 00000-0000"
            maxLength={15}
            value={data.phone}
            onChange={(e) => setData({ ...data, phone: formatPhone(e.target.value) })}
          />
        </div>
      </div>

      {/* Botão Próximo */}
      <motion.button
        type="button"
        onClick={handleNext}
        style={buttonStyle}
        whileHover={{ opacity: 0.88 }}
        whileTap={{ scale: 0.98 }}
      >
        {(theme.buttonText as string) || 'PRÓXIMO'}
        <ChevronRight style={{ width: '18px', height: '18px' }} />
      </motion.button>
    </div>
  );
};
