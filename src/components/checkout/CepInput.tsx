import React, { useState, useEffect } from 'react';
import { MapPin, Loader2, Check, X } from 'lucide-react';
import { formatCep, searchCep, isValidCep, cleanCep } from '@/lib/utils/cepUtils';
import type { AddressData } from '@/lib/utils/cepUtils';
import { cn } from '@/lib/utils';

interface CepInputProps {
  value: string;
  onChange: (value: string) => void;
  onAddressFound?: (address: AddressData | null) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  autoSearch?: boolean;
  showSearchIcon?: boolean;
  debounceMs?: number;
}

export const CepInput: React.FC<CepInputProps> = ({
  value,
  onChange,
  onAddressFound,
  placeholder = '00000-000',
  label,
  required = false,
  disabled = false,
  className = '',
  style = {},
  autoSearch = true,
  showSearchIcon = true,
  debounceMs = 500,
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [foundAddress, setFoundAddress] = useState<AddressData | null>(null);
  const [isTouched, setIsTouched] = useState(false);

  useEffect(() => {
    if (!autoSearch || !isTouched) return;

    const cleanValue = cleanCep(value);

    if (cleanValue.length === 8) {
      const timeoutId = setTimeout(() => {
        handleCepSearch(cleanValue);
      }, debounceMs);

      return () => clearTimeout(timeoutId);
    } else {
      // Limpar resultado se CEP incompleto
      setSearchResult(null);
      setFoundAddress(null);
      setErrorMessage('');
    }
  }, [value, autoSearch, isTouched]);

  const handleCepSearch = async (cep: string) => {
    if (!isValidCep(cep)) {
      setSearchResult('error');
      setErrorMessage('CEP inválido');
      onAddressFound?.(null);
      return;
    }

    setIsSearching(true);
    setSearchResult(null);
    setErrorMessage('');

    try {
      const result = await searchCep(cep);

      if (result) {
        setSearchResult('success');
        setFoundAddress(result);
        setErrorMessage('');
        onAddressFound?.(result);
      } else {
        setSearchResult('error');
        setErrorMessage('CEP não encontrado');
        setFoundAddress(null);
        onAddressFound?.(null);
      }
    } catch (error) {
      setSearchResult('error');
      setErrorMessage('Erro ao buscar CEP. Tente novamente.');
      setFoundAddress(null);
      onAddressFound?.(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    onChange(formatted);
  };

  const handleBlur = () => {
    setIsTouched(true);
    const cleanValue = cleanCep(value);

    if (cleanValue.length > 0 && cleanValue.length < 8) {
      setSearchResult('error');
      setErrorMessage('CEP incompleto');
    }
  };

  const handleFocus = () => {
    setErrorMessage('');
    if (searchResult === 'error' && cleanCep(value).length < 8) {
      setSearchResult(null);
    }
  };

  const getStatusIcon = () => {
    if (!showSearchIcon || !isTouched) return null;
    if (isSearching) return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    if (searchResult === 'success') return <Check className="h-4 w-4 text-green-500" />;
    if (searchResult === 'error' && cleanCep(value).length === 8) {
      return <X className="h-4 w-4 text-red-500" />;
    }
    return <MapPin className="h-4 w-4 text-gray-400" />;
  };

  const getInputClassName = () => {
    const baseClasses = 'w-full px-4 py-2 rounded-lg border transition-colors';

    let statusClasses = '';
    if (isTouched && searchResult === 'success') {
      statusClasses = 'border-green-500 focus:ring-green-500';
    } else if (isTouched && searchResult === 'error') {
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
          maxLength={9}
          className={getInputClassName()}
          style={style}
          aria-invalid={searchResult === 'error'}
          aria-describedby={errorMessage ? 'cep-error-message' : undefined}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
          {getStatusIcon()}
        </div>
      </div>

      {/* Mensagem de erro */}
      {isTouched && errorMessage && (
        <p
          id="cep-error-message"
          className="text-xs mt-1.5 text-red-600"
        >
          {errorMessage}
        </p>
      )}

      {/* Endereço encontrado */}
      {foundAddress && searchResult === 'success' && (
        <div className="mt-2 p-2.5 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs font-medium text-green-800 mb-1">
            ✓ Endereço encontrado
          </p>
          <p className="text-xs text-green-700">
            {foundAddress.street && `${foundAddress.street}, `}
            {foundAddress.neighborhood && `${foundAddress.neighborhood} - `}
            {foundAddress.city}/{foundAddress.state}
          </p>
        </div>
      )}

      {/* Dica de uso */}
      {!isTouched && !value && (
        <p className="text-xs mt-1.5 text-gray-500">
          Digite o CEP para buscar o endereço automaticamente
        </p>
      )}
    </div>
  );
};

export default CepInput;

