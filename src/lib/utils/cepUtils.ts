/**
 * Utilitários para trabalhar com CEP (Brasil)
 * Usa a API ViaCEP para buscar endereços
 */

export interface CepData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export interface AddressData {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

/**
 * Formata CEP adicionando hífen
 * @param value - CEP com ou sem formatação
 * @returns CEP formatado (00000-000)
 */
export const formatCep = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 5) {
    return numbers;
  }
  return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
};

/**
 * Remove formatação do CEP
 * @param cep - CEP formatado
 * @returns Apenas números
 */
export const cleanCep = (cep: string): string => {
  return cep.replace(/\D/g, '');
};

/**
 * Valida se o CEP tem 8 dígitos
 * @param cep - CEP para validar
 * @returns true se válido
 */
export const isValidCep = (cep: string): boolean => {
  const clean = cleanCep(cep);
  return clean.length === 8;
};

/**
 * Busca endereço pelo CEP na API ViaCEP
 * @param cep - CEP para buscar (com ou sem formatação)
 * @returns Dados do endereço ou null se não encontrado
 */
export const searchCep = async (cep: string): Promise<AddressData | null> => {
  const clean = cleanCep(cep);

  if (!isValidCep(clean)) {
    throw new Error('CEP inválido. Deve conter 8 dígitos.');
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${clean}/json/`);

    if (!response.ok) {
      throw new Error('Erro ao buscar CEP');
    }

    const data: CepData = await response.json();

    if (data.erro) {
      return null;
    }

    return {
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || '',
      zipCode: formatCep(clean)
    };
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    throw error;
  }
};

/**
 * Hook para usar busca de CEP com debounce
 * @param cep - CEP para buscar
 * @param callback - Função chamada quando CEP é encontrado
 * @param delay - Delay em ms (padrão: 500)
 */
export const useCepSearch = (
  cep: string,
  callback: (address: AddressData | null) => void,
  delay: number = 500
) => {
  const timeoutRef = { current: null as NodeJS.Timeout | null };

  const search = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const clean = cleanCep(cep);

    if (clean.length === 8) {
      timeoutRef.current = setTimeout(async () => {
        try {
          const address = await searchCep(clean);
          callback(address);
        } catch (error) {
          callback(null);
        }
      }, delay);
    }
  };

  return { search };
};
