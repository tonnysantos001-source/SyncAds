/**
 * ModernCreditCardPayment — Wrapper de Pagamento por Cartão de Crédito
 *
 * Componente reconstruído após arquivo corrompido (0 bytes).
 * Encapsula o CreditCardForm com a interface correta para uso nos templates.
 *
 * @version 1.0
 */

import React, { useState, useCallback } from 'react';
import { CreditCardForm, type CardData } from './CreditCardForm';

interface ModernCreditCardPaymentProps {
  isPreview?: boolean;
  primaryColor?: string;
  theme?: Record<string, unknown>;
  onCardDataChange?: (data: CardData) => void;
  errors?: Record<string, string>;
}

export const ModernCreditCardPayment: React.FC<ModernCreditCardPaymentProps> = ({
  isPreview = false,
  primaryColor = '#0082ec',
  theme = {},
  onCardDataChange,
  errors = {},
}) => {
  const [, setCardData] = useState<CardData | null>(null);

  const handleCardDataChange = useCallback((data: CardData) => {
    setCardData(data);
    onCardDataChange?.(data);
  }, [onCardDataChange]);

  const themeForForm = {
    primaryButtonBackgroundColor: primaryColor,
    checkoutButtonBackgroundColor: (theme.checkoutButtonBackgroundColor as string) || primaryColor,
    inputBorderRadius: (theme.inputBorderRadius as string) || '9999px',
    textColor: (theme.textColor as string) || '#111827',
    labelColor: (theme.labelColor as string) || '#374151',
  };

  return (
    <CreditCardForm
      onCardDataChange={handleCardDataChange}
      theme={themeForForm}
      errors={errors}
    />
  );
};

export default ModernCreditCardPayment;
