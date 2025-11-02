import React, { useState, useEffect } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { formatCpf, validateCpf, validateCpfOnline } from '@/lib/utils/cpfUtils';
import { cn } from '@/lib/utils';

interface CpfInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  useOnlineValidation?: boolean;
  showValidationIcon?: boolean;
  validateOnBlur?: boolean;
  autoFormat?: boolean;
}

export const CpfInput: React.FC<CpfInputProps> = ({
  value,
  onChange,
  onValidationChange,
  placeholder = '000.000.000-00',
  label,
  required = false,
  disabled = false,
  className = '',
  style = {},
  useOnlineValidation = false,
  showValidationIcon = true,
  validateOnBlur = true,
  autoFormat = true,
}) => {
  const [isTouched, setIsTouched] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [onlineName, setOnlineName] = useState<string>('');

  useEffect(() => {
    if (isTouched && value) {
      validateCpfValue(value);
    }
  }, [value, isTouched]);

  const validateCpfValue = async (cpfValue: string) => {
    const cleanValue = cpfValue.replace(/\D/g, '');

    // Se não tem 11 dígitos, não valida ainda
    if (cleanValue.length < 11) {
      setIsValid(null);
      setValidationMessage('');
      onValidationChange?.(false);
      return;
    }

    if (cleanValue.length === 11) {
      if (useOnlineValidation) {
        setIsValidating(true);
        try {
          const result = await validateCpfOnline(cpfValue);
          setIsValid(result.valid);
          setValidationMessage(result.message || '');
          setOnlineName(result.name || '');
          onValidationChange?.(result.valid);
        } catch (error) {
          // Fallback para validação local
          const localResult = validateCpf(cpfValue);
          setIsValid(localResult.valid);
          setValidationMessage(localResult.message || '');
          onValidationChange?.(localResult.valid);
        } finally {
          setIsValidating(false);
        }
      } else {
        const result = validateCpf(cpfValue);
        setIsValid(result.valid);
        setValidationMessage(result.message || '');
        onValidationChange?.(result.valid);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    if (autoFormat) {
      const formatted = formatCpf(inputValue);
      onChange(formatted);
    } else {
      onChange(inputValue);
    }
  };

  const handleBlur = () => {
    setIsTouched(true);
    if (validateOnBlur && value) {
      validateCpfValue(value);
    }
  };

  const handleFocus = () => {
    setValidationMessage('');
  };

  const getValidationIcon = () => {
    if (!showValidationIcon || !isTouched) return null;
    if (isValidating) return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />;
    if (isValid === true) return <Check className="h-4 w-4 text-green-500" />;
    if (isValid === false) return <X className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getInputClassName = () => {
    const baseClasses = 'w-full px-4 py-2 rounded-lg border transition-colors';

    let statusClasses = '';
    if (isTouched && isValid === true) {
      statusClasses = 'border-green-500 focus:ring-green-500';
    } else if (isTouched && isValid === false) {
      statusClasses = 'border-red-500 focus:ring-red-500';
    } else {
      statusClasses = 'border-gray-300 focus:ring-blue-500';
    }

    return cn(baseClasses, statusClasses, className);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={14}
          className={getInputClassName()}
          style={style}
          aria-invalid={isValid === false}
          aria-describedby={validationMessage ? 'cpf-validation-message' : undefined}
        />

        {showValidationIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            {getValidationIcon()}
          </div>
        )}
      </div>

      {/* Mensagem de validação */}
      {isTouched && validationMessage && (
        <p
          id="cpf-validation-message"
          className={cn(
            'text-xs mt-1.5',
            isValid ? 'text-green-600' : 'text-red-600'
          )}
        >
          {validationMessage}
        </p>
      )}

      {/* Nome da pessoa (se validação online estiver ativa e encontrar) */}
      {onlineName && isValid && (
        <p className="text-xs mt-1 text-gray-600">
          ✓ {onlineName}
        </p>
      )}
    </div>
  );
};

export default CpfInput;
