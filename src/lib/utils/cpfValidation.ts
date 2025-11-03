// ============================================
// VALIDAÇÃO E CONSULTA DE CPF
// ============================================
//
// Utilitário para validar CPF localmente e via API
// Inclui formatação, máscara e consulta à Receita Federal
// ============================================

export interface CPFValidationResult {
  isValid: boolean;
  formatted?: string;
  message?: string;
  data?: {
    name?: string;
    birthDate?: string;
    status?: string;
  };
}

/**
 * Remove caracteres não numéricos do CPF
 */
export const cleanCPF = (cpf: string): string => {
  return cpf.replace(/\D/g, "");
};

/**
 * Formata CPF para XXX.XXX.XXX-XX
 */
export const formatCPF = (cpf: string): string => {
  const cleaned = cleanCPF(cpf);

  if (cleaned.length !== 11) {
    return cpf;
  }

  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

/**
 * Aplica máscara de CPF enquanto digita
 */
export const maskCPF = (value: string): string => {
  const cleaned = cleanCPF(value);
  const limited = cleaned.slice(0, 11);

  if (limited.length <= 3) {
    return limited;
  }
  if (limited.length <= 6) {
    return limited.replace(/(\d{3})(\d+)/, "$1.$2");
  }
  if (limited.length <= 9) {
    return limited.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
  }
  return limited.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, "$1.$2.$3-$4");
};

/**
 * Valida formato do CPF (apenas estrutura)
 */
export const isValidCPFFormat = (cpf: string): boolean => {
  const cleaned = cleanCPF(cpf);

  // CPF deve ter 11 dígitos
  if (cleaned.length !== 11) {
    return false;
  }

  // Verifica se todos os dígitos são iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(cleaned)) {
    return false;
  }

  return true;
};

/**
 * Valida CPF completo (formato + dígitos verificadores)
 */
export const validateCPF = (cpf: string): boolean => {
  const cleaned = cleanCPF(cpf);

  // Valida formato primeiro
  if (!isValidCPFFormat(cleaned)) {
    return false;
  }

  // Validação dos dígitos verificadores
  let sum = 0;
  let remainder: number;

  // Calcula o primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }

  if (remainder !== parseInt(cleaned.substring(9, 10))) {
    return false;
  }

  // Calcula o segundo dígito verificador
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }

  if (remainder !== parseInt(cleaned.substring(10, 11))) {
    return false;
  }

  return true;
};

/**
 * Consulta CPF na API da Receita Federal (ReceitaWS)
 * NOTA: Esta é uma API pública gratuita com rate limit
 */
export const consultCPFAPI = async (
  cpf: string
): Promise<CPFValidationResult> => {
  const cleaned = cleanCPF(cpf);

  // Validação local primeiro
  if (!validateCPF(cleaned)) {
    return {
      isValid: false,
      message: "CPF inválido",
    };
  }

  try {
    // API ReceitaWS (gratuita, mas com rate limit)
    const response = await fetch(
      `https://www.receitaws.com.br/v1/cpf/${cleaned}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      // Se a API falhar, retorna validação local
      return {
        isValid: true,
        formatted: formatCPF(cleaned),
        message: "CPF válido (validação local)",
      };
    }

    const data = await response.json();

    // API retornou erro
    if (data.status === "ERROR") {
      return {
        isValid: false,
        message: data.message || "CPF não encontrado",
      };
    }

    // Sucesso
    return {
      isValid: true,
      formatted: formatCPF(cleaned),
      message: "CPF válido",
      data: {
        name: data.nome,
        birthDate: data.nascimento,
        status: data.situacao,
      },
    };
  } catch (error) {
    console.error("Erro ao consultar CPF na API:", error);

    // Em caso de erro na API, retorna validação local
    return {
      isValid: true,
      formatted: formatCPF(cleaned),
      message: "CPF válido (validação local - API indisponível)",
    };
  }
};

/**
 * Valida CPF de forma assíncrona (tenta API, fallback para validação local)
 */
export const validateCPFAsync = async (
  cpf: string
): Promise<CPFValidationResult> => {
  const cleaned = cleanCPF(cpf);

  // Validação local básica
  if (!isValidCPFFormat(cleaned)) {
    return {
      isValid: false,
      message: "Formato de CPF inválido",
    };
  }

  if (!validateCPF(cleaned)) {
    return {
      isValid: false,
      message: "CPF inválido",
    };
  }

  // Tenta consultar na API (com timeout)
  try {
    const timeoutPromise = new Promise<CPFValidationResult>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 5000)
    );

    const apiPromise = consultCPFAPI(cleaned);

    const result = await Promise.race([apiPromise, timeoutPromise]);
    return result;
  } catch (error) {
    // Fallback para validação local se API falhar
    return {
      isValid: true,
      formatted: formatCPF(cleaned),
      message: "CPF válido (validação local)",
    };
  }
};

/**
 * Gera CPF válido aleatório (apenas para testes)
 */
export const generateRandomCPF = (): string => {
  const randomDigits = () => Math.floor(Math.random() * 10);

  // Gera 9 dígitos aleatórios
  let cpf = "";
  for (let i = 0; i < 9; i++) {
    cpf += randomDigits();
  }

  // Calcula primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf[i]) * (10 - i);
  }
  let digit1 = 11 - (sum % 11);
  if (digit1 >= 10) digit1 = 0;
  cpf += digit1;

  // Calcula segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf[i]) * (11 - i);
  }
  let digit2 = 11 - (sum % 11);
  if (digit2 >= 10) digit2 = 0;
  cpf += digit2;

  return formatCPF(cpf);
};

/**
 * Extrai apenas números do CPF (útil para envio ao backend)
 */
export const getCPFNumbers = (cpf: string): string => {
  return cleanCPF(cpf);
};

/**
 * Verifica se o CPF está no formato correto (com máscara)
 */
export const isCPFFormatted = (cpf: string): boolean => {
  return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf);
};

/**
 * Oculta parte do CPF para exibição (XXX.XXX.XXX-XX -> XXX.XXX.**X-XX)
 */
export const maskCPFDisplay = (cpf: string): string => {
  const formatted = formatCPF(cpf);
  return formatted.replace(/(\d{3}\.\d{3}\.)(\d{3})(-\d{2})/, "$1***$3");
};
