/**
 * MinimalStepCustomer — Dados pessoais do checkout minimalista
 *
 * FUNCIONALIDADES REAIS:
 *   - Estado controlado via props (estado elevado no MinimalTemplate)
 *   - Máscara CPF/CNPJ com validação real (algoritmo módulo 11)
 *   - Máscara de telefone brasileira
 *   - Validação de email e nome completo antes de avançar
 *   - Erros inline por campo
 *
 * @version 3.0
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronRight, AlertCircle } from 'lucide-react';
import {
  formatCPFCNPJ,
  formatPhone,
  validateEmail,
  validatePhone,
  validateCPFCNPJ,
} from '@/utils/checkoutValidators';

export interface CustomerData {
  name: string;
  email: string;
  phone: string;
  document: string; // CPF ou CNPJ (com máscara)
}

/** Config do botão vinda do Conteúdo (sidebar) */
export interface ButtonCfg {
  primaryBg: string;
  primaryText: string;
  primaryRadius: string;   // '4px' | '8px' | '999px'
  primaryFlow: boolean;    // shimmer
  primaryHover: boolean;
  checkoutBg: string;
  checkoutText: string;
  checkoutRadius: string;
  pulse: boolean;
}

interface MinimalStepCustomerProps {
  theme: Record<string, unknown>;
  isPreview: boolean;
  onNext: () => void;
  primaryColor: string;
  /** Config de estilo dos botões (do Conteúdo) */
  buttonCfg?: ButtonCfg;
  /** Estado elevado — controlado pelo MinimalTemplate */
  data: CustomerData;
  onChange: (field: keyof CustomerData, value: string) => void;
}

// ── estilos base ─────────────────────────────────────────────

const getInputStyle = (
  theme: Record<string, unknown>,
  hasError?: boolean
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

export const MinimalStepCustomer: React.FC<MinimalStepCustomerProps> = ({
  theme, isPreview, onNext, primaryColor, buttonCfg, data, onChange,
}) => {
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerData, string>>>({});
  const [nameValid, setNameValid] = useState<null | boolean>(null);
  const [emailValid, setEmailValid] = useState<null | boolean>(null);

  const btnBg    = buttonCfg?.primaryBg   ?? primaryColor ?? '#0B1320';
  const btnText  = buttonCfg?.primaryText ?? (theme.buttonTextColor as string) ?? '#ffffff';
  const btnRadius = buttonCfg?.primaryRadius ?? '8px';
  const btnFlow  = buttonCfg?.primaryFlow ?? false;

  const validate = (): boolean => {
    if (isPreview) return true;

    const errs: Partial<Record<keyof CustomerData, string>> = {};

    const nameParts = data.name.trim().split(/\s+/);
    if (!data.name.trim()) {
      errs.name = 'Nome obrigatório';
    } else if (nameParts.length < 2) {
      errs.name = 'Informe o nome completo (nome e sobrenome)';
    }

    if (!validateEmail(data.email)) {
      errs.email = 'Email inválido (ex: maria@email.com)';
    }

    if (!validateCPFCNPJ(data.document)) {
      errs.document = 'CPF ou CNPJ inválido';
    }

    if (!validatePhone(data.phone)) {
      errs.phone = 'Telefone inválido (ex: (11) 99999-9999)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    onNext();
  };

  const clearError = (field: keyof CustomerData) => {
    if (errors[field]) {
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
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
    marginTop: '8px',
    letterSpacing: '0.3px',
    transition: 'opacity 0.15s ease',
    position: 'relative',
    overflow: 'hidden',
    // Flow shimmer via background-size trick
    ...(btnFlow ? {
      backgroundImage: `linear-gradient(90deg, ${btnBg} 0%, ${btnBg}cc 40%, #ffffff33 50%, ${btnBg}cc 60%, ${btnBg} 100%)`,
      backgroundSize: '200% 100%',
      animation: 'btnFlow 1.8s linear infinite',
    } : {}),
  };

  return (
    <>
      {btnFlow && (
        <style>{`@keyframes btnFlow { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      )}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Nome */}
      <div>
        <label style={getLabelStyle(theme)}>Nome completo *</label>
        <div style={{ position: 'relative' }}>
          <input
            style={getInputStyle(theme, !!errors.name)}
            placeholder="Ex: Maria da Silva"
            value={data.name}
            autoComplete="name"
            onChange={(e) => {
              const v = e.target.value;
              onChange('name', v);
              clearError('name');
              // Indicador visual de nome válido
              const parts = v.trim().split(/\s+/);
              setNameValid(parts.length >= 2 && parts.every(p => p.length >= 2));
            }}
          />
          {nameValid === true && !errors.name && (
            <Check style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#16a34a' }} />
          )}
        </div>
        {errors.name && (
          <div style={errorStyle}><AlertCircle style={{ width: '11px', height: '11px' }} />{errors.name}</div>
        )}
      </div>

      {/* E-mail */}
      <div>
        <label style={getLabelStyle(theme)}>E-mail *</label>
        <div style={{ position: 'relative' }}>
          <input
            style={getInputStyle(theme, !!errors.email)}
            type="email"
            placeholder="Ex: maria@email.com"
            value={data.email}
            autoComplete="email"
            onChange={(e) => {
              const v = e.target.value.toLowerCase().trim();
              onChange('email', v);
              clearError('email');
              setEmailValid(validateEmail(v));
            }}
          />
          {emailValid === true && !errors.email && (
            <Check style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#16a34a' }} />
          )}
        </div>
        {errors.email && (
          <div style={errorStyle}><AlertCircle style={{ width: '11px', height: '11px' }} />{errors.email}</div>
        )}
      </div>

      {/* CPF / CNPJ */}
      <div>
        <label style={getLabelStyle(theme)}>CPF / CNPJ *</label>
        <input
          style={getInputStyle(theme, !!errors.document)}
          placeholder="000.000.000-00"
          maxLength={18}
          inputMode="numeric"
          value={data.document}
          autoComplete="off"
          onChange={(e) => {
            onChange('document', formatCPFCNPJ(e.target.value));
            clearError('document');
          }}
        />
        {errors.document && (
          <div style={errorStyle}><AlertCircle style={{ width: '11px', height: '11px' }} />{errors.document}</div>
        )}
      </div>

      {/* Celular */}
      <div>
        <label style={getLabelStyle(theme)}>Celular (WhatsApp) *</label>
        <div style={{ display: 'flex', gap: '8px' }}>
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
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <input
              style={{ ...getInputStyle(theme, !!errors.phone), width: '100%' }}
              type="tel"
              placeholder="(00) 00000-0000"
              maxLength={15}
              value={data.phone}
              autoComplete="tel"
              onChange={(e) => {
                onChange('phone', formatPhone(e.target.value));
                clearError('phone');
              }}
            />
            {errors.phone && (
              <div style={errorStyle}><AlertCircle style={{ width: '11px', height: '11px' }} />{errors.phone}</div>
            )}
          </div>
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
    </>
  );
};
