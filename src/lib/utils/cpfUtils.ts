/**
 * Utilitários para trabalhar com CPF (Brasil)
 * Inclui formatação, validação e integração com APIs
 */

export interface CpfValidationResult {
  valid: boolean;
  formatted?: string;
  message?: string;
}

/**
 * Formata CPF adicionando pontos e hífen
 * @param value - CPF com ou sem formatação
 * @returns CPF formatado (000.000.000-00)
 */
export const formatCpf = (value: string): string => {
  const numbers = value.replace(/\D/g, '');

  if (numbers.length === 0) return '';
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  }

  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
};

/**
 * Remove formatação do CPF
 * @param cpf - CPF formatado
 * @returns Apenas números
 */
export const cleanCpf = (cpf: string): string => {
  return cpf.replace(/\D/g, '');
};

/**
 * Valida CPF usando o algoritmo oficial dos dígitos verificadores
 * @param cpf - CPF para validar (com ou sem formatação)
 * @returns true se válido
 */
export const isValidCpf = (cpf: string): boolean => {
  const clean = cleanCpf(cpf);

  // CPF deve ter 11 dígitos
  if (clean.length !== 11) return false;

  // Elimina CPFs inválidos conhecidos (todos os dígitos iguais)
  if (/^(\d)\1{10}$/.test(clean)) return false;

  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  let digit1 = remainder >= 10 ? 0 : remainder;

  if (digit1 !== parseInt(clean.charAt(9))) return false;

  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  let digit2 = remainder >= 10 ? 0 : remainder;

  if (digit2 !== parseInt(clean.charAt(10))) return false;

  return true;
};

/**
 * Valida CPF e retorna resultado detalhado
 * @param cpf - CPF para validar
 * @returns Objeto com resultado da validação
 */
export const validateCpf = (cpf: string): CpfValidationResult => {
  const clean = cleanCpf(cpf);

  if (!clean) {
    return {
      valid: false,
      message: 'CPF não pode estar vazio'
    };
  }

  if (clean.length !== 11) {
    return {
      valid: false,
      message: 'CPF deve conter 11 dígitos'
    };
  }

  if (/^(\d)\1{10}$/.test(clean)) {
    return {
      valid: false,
      message: 'CPF inválido'
    };
  }

  if (!isValidCpf(clean)) {
    return {
      valid: false,
      message: 'CPF inválido. Verifique os números digitados.'
    };
  }

  return {
    valid: true,
    formatted: formatCpf(clean),
    message: 'CPF válido'
  };
};

/**
 * Máscara para input de CPF
 * Formata enquanto o usuário digita
 * @param value - Valor atual do input
 * @returns Valor formatado
 */
export const maskCpf = (value: string): string => {
  return formatCpf(value);
};

/**
 * Valida CPF usando API externa (ReceitaWS - gratuita)
 * ATENÇÃO: Use com moderação, API tem rate limit
 * @param cpf - CPF para validar
 * @returns Dados do CPF se válido
 */
export const validateCpfOnline = async (cpf: string): Promise<{
  valid: boolean;
  name?: string;
  birthDate?: string;
  situation?: string;
  message?: string;
}> => {
  const clean = cleanCpf(cpf);

  if (!isValidCpf(clean)) {
    return {
      valid: false,
      message: 'CPF com formato inválido'
    };
  }

  try {
    // API gratuita da ReceitaWS (limite: 3 consultas/minuto)
    const response = await fetch(`https://www.receitaws.com.br/v1/cpf/${clean}`);

    if (!response.ok) {
      throw new Error('Erro ao consultar CPF');
    }

    const data = await response.json();

    if (data.status === 'ERROR') {
      return {
        valid: false,
        message: data.message || 'CPF não encontrado na Receita Federal'
      };
    }

    return {
      valid: true,
      name: data.nome,
      birthDate: data.nascimento,
      situation: data.situacao,
      message: 'CPF válido e ativo na Receita Federal'
    };
  } catch (error) {
    console.error('Erro ao validar CPF online:', error);

    // Fallback: se API falhar, retorna validação local
    const localValidation = isValidCpf(clean);
    return {
      valid: localValidation,
      message: localValidation
        ? 'CPF válido (validação offline)'
        : 'CPF inválido'
    };
  }
};

/**
 * Hook React para validação de CPF com debounce
 * @param cpf - CPF para validar
 * @param onValidate - Callback chamado quando validação completa
 * @param delay - Delay em ms (padrão: 500)
 * @param useOnlineValidation - Se deve usar API externa (padrão: false)
 */
export const useCpfValidation = (
  cpf: string,
  onValidate: (result: CpfValidationResult) => void,
  delay: number = 500,
  useOnlineValidation: boolean = false
) => {
  let timeoutId: NodeJS.Timeout | null = null;

  const validate = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const clean = cleanCpf(cpf);

    if (clean.length === 11) {
      timeoutId = setTimeout(async () => {
        if (useOnlineValidation) {
          const result = await validateCpfOnline(clean);
          onValidate({
            valid: result.valid,
            formatted: formatCpf(clean),
            message: result.message
          });
        } else {
          onValidate(validateCpf(clean));
        }
      }, delay);
    } else if (clean.length > 0) {
      // Validação parcial
      onValidate({
        valid: false,
        message: `Digite ${11 - clean.length} dígitos restantes`
      });
    }
  };

  return { validate };
};

/**
 * Gera CPF válido aleatório (apenas para testes)
 * NÃO USE EM PRODUÇÃO COM DADOS REAIS
 */
export const generateRandomCpf = (): string => {
  const random = (n: number) => Math.floor(Math.random() * n);

  const numbers = Array.from({ length: 9 }, () => random(10));

  // Calcula primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += numbers[i] * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  const digit1 = remainder >= 10 ? 0 : remainder;
  numbers.push(digit1);

  // Calcula segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += numbers[i] * (11 - i);
  }
  remainder = 11 - (sum % 11);
  const digit2 = remainder >= 10 ? 0 : remainder;
  numbers.push(digit2);

  return formatCpf(numbers.join(''));
};

/**
 * Lista de CPFs conhecidos como inválidos (teste, exemplo, etc)
 */
export const INVALID_CPFS = [
  '00000000000',
  '11111111111',
  '22222222222',
  '33333333333',
  '44444444444',
  '55555555555',
  '66666666666',
  '77777777777',
  '88888888888',
  '99999999999',
  '12345678909', // CPF de exemplo comum
];

/**
 * Verifica se CPF está na lista de conhecidos como inválidos
 */
export const isKnownInvalidCpf = (cpf: string): boolean => {
  const clean = cleanCpf(cpf);
  return INVALID_CPFS.includes(clean);
};

/**
 * Extrai informações do CPF (região de emissão)
 * O último dígito antes dos verificadores indica a região
 */
export const getCpfRegion = (cpf: string): string => {
  const clean = cleanCpf(cpf);
  if (clean.length !== 11) return 'Inválido';

  const regionDigit = parseInt(clean.charAt(8));

  const regions: { [key: number]: string } = {
    0: 'Rio Grande do Sul',
    1: 'Distrito Federal, Goiás, Mato Grosso, Mato Grosso do Sul e Tocantins',
    2: 'Pará, Amazonas, Acre, Amapá, Rondônia e Roraima',
    3: 'Ceará, Maranhão e Piauí',
    4: 'Pernambuco, Rio Grande do Norte, Paraíba e Alagoas',
    5: 'Bahia e Sergipe',
    6: 'Minas Gerais',
    7: 'Rio de Janeiro e Espírito Santo',
    8: 'São Paulo',
    9: 'Paraná e Santa Catarina'
  };

  return regions[regionDigit] || 'Região desconhecida';
};
