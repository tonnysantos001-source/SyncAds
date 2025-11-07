/**
 * Utilitários de Validação para Checkout SyncAds
 *
 * Funções de validação em tempo real para:
 * - Nome completo
 * - Email
 * - Telefone
 * - Documentos
 *
 * @version 1.0
 * @date 2025-01-07
 */

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  suggestion?: string;
  score?: number; // 0-100
}

export interface NameValidationResult extends ValidationResult {
  firstName?: string;
  lastName?: string;
  fullName?: string;
}

export interface EmailValidationResult extends ValidationResult {
  domain?: string;
  isDisposable?: boolean;
  suggestion?: string;
}

// ============================================
// CONFIGURAÇÕES
// ============================================

const DEBOUNCE_DELAY = 500; // ms

// Domínios de email descartáveis conhecidos
const DISPOSABLE_DOMAINS = [
  'tempmail.com',
  'guerrillamail.com',
  'mailinator.com',
  '10minutemail.com',
  'throwaway.email',
  'temp-mail.org',
];

// Domínios comuns no Brasil
const COMMON_DOMAINS = [
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'yahoo.com',
  'icloud.com',
  'uol.com.br',
  'bol.com.br',
  'ig.com.br',
  'terra.com.br',
];

// Erros comuns de digitação em domínios
const DOMAIN_TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmil.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmil.com': 'hotmail.com',
  'outloo.com': 'outlook.com',
  'outlok.com': 'outlook.com',
  'yahooo.com': 'yahoo.com',
  'yaho.com': 'yahoo.com',
};

// ============================================
// VALIDAÇÃO DE NOME
// ============================================

/**
 * Valida nome completo do cliente
 * Verifica se tem pelo menos nome e sobrenome
 */
export async function validateName(name: string): Promise<NameValidationResult> {
  // Remove espaços extras
  const trimmedName = name.trim().replace(/\s+/g, ' ');

  // Verifica se está vazio
  if (!trimmedName) {
    return {
      isValid: false,
      error: 'Nome é obrigatório',
      score: 0,
    };
  }

  // Verifica comprimento mínimo
  if (trimmedName.length < 3) {
    return {
      isValid: false,
      error: 'Nome muito curto',
      score: 20,
    };
  }

  // Verifica se contém apenas letras, espaços e caracteres especiais permitidos
  const nameRegex = /^[a-zA-ZÀ-ÿ\s'\-]+$/;
  if (!nameRegex.test(trimmedName)) {
    return {
      isValid: false,
      error: 'Nome contém caracteres inválidos',
      score: 30,
    };
  }

  // Separa nome e sobrenome
  const nameParts = trimmedName.split(' ').filter(part => part.length > 0);

  if (nameParts.length < 2) {
    return {
      isValid: false,
      error: 'Digite nome e sobrenome',
      suggestion: 'Ex: João Silva',
      score: 50,
    };
  }

  // Verifica se cada parte tem pelo menos 2 caracteres (exceto preposições)
  const prepositions = ['de', 'da', 'do', 'das', 'dos', 'e'];
  const validParts = nameParts.filter(part => {
    if (prepositions.includes(part.toLowerCase())) return true;
    return part.length >= 2;
  });

  if (validParts.length < 2) {
    return {
      isValid: false,
      error: 'Nome ou sobrenome muito curto',
      score: 60,
    };
  }

  // Verifica se não é um nome genérico/teste
  const testNames = ['teste', 'test', 'asdf', 'qwerty', 'nome', 'sobrenome'];
  const lowerName = trimmedName.toLowerCase();
  if (testNames.some(test => lowerName.includes(test))) {
    return {
      isValid: false,
      error: 'Por favor, insira seu nome real',
      score: 40,
    };
  }

  // Nome válido!
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ');

  return {
    isValid: true,
    firstName: capitalizeWords(firstName),
    lastName: capitalizeWords(lastName),
    fullName: capitalizeWords(trimmedName),
    score: 100,
  };
}

/**
 * Valida nome em tempo real (com debounce)
 */
let nameDebounceTimer: NodeJS.Timeout;
export function validateNameDebounced(
  name: string,
  callback: (result: NameValidationResult) => void
): void {
  clearTimeout(nameDebounceTimer);
  nameDebounceTimer = setTimeout(async () => {
    const result = await validateName(name);
    callback(result);
  }, DEBOUNCE_DELAY);
}

// ============================================
// VALIDAÇÃO DE EMAIL
// ============================================

/**
 * Valida email do cliente
 * Verifica formato, domínio e sugere correções
 */
export async function validateEmail(email: string): Promise<EmailValidationResult> {
  // Remove espaços
  const trimmedEmail = email.trim().toLowerCase();

  // Verifica se está vazio
  if (!trimmedEmail) {
    return {
      isValid: false,
      error: 'Email é obrigatório',
      score: 0,
    };
  }

  // Regex básico de email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmedEmail)) {
    return {
      isValid: false,
      error: 'Email inválido',
      suggestion: 'Ex: seu@email.com',
      score: 20,
    };
  }

  // Extrai domínio
  const [localPart, domain] = trimmedEmail.split('@');

  // Verifica se local part não é muito curto
  if (localPart.length < 2) {
    return {
      isValid: false,
      error: 'Email muito curto',
      score: 30,
    };
  }

  // Verifica se o domínio não é muito curto
  if (domain.length < 4) {
    return {
      isValid: false,
      error: 'Domínio inválido',
      score: 40,
    };
  }

  // Verifica se é um domínio descartável
  if (DISPOSABLE_DOMAINS.includes(domain)) {
    return {
      isValid: false,
      error: 'Emails temporários não são permitidos',
      suggestion: 'Use um email permanente',
      score: 30,
      isDisposable: true,
    };
  }

  // Verifica erros comuns de digitação
  if (DOMAIN_TYPOS[domain]) {
    return {
      isValid: false,
      error: 'Possível erro no email',
      suggestion: `Você quis dizer ${localPart}@${DOMAIN_TYPOS[domain]}?`,
      domain: DOMAIN_TYPOS[domain],
      score: 70,
    };
  }

  // Verifica padrões suspeitos
  if (localPart.includes('..') || localPart.startsWith('.') || localPart.endsWith('.')) {
    return {
      isValid: false,
      error: 'Email com formato inválido',
      score: 40,
    };
  }

  // Email válido!
  return {
    isValid: true,
    domain,
    isDisposable: false,
    score: 100,
  };
}

/**
 * Valida email em tempo real (com debounce)
 */
let emailDebounceTimer: NodeJS.Timeout;
export function validateEmailDebounced(
  email: string,
  callback: (result: EmailValidationResult) => void
): void {
  clearTimeout(emailDebounceTimer);
  emailDebounceTimer = setTimeout(async () => {
    const result = await validateEmail(email);
    callback(result);
  }, DEBOUNCE_DELAY);
}

/**
 * Sugere correção de email baseado em domínios comuns
 */
export function suggestEmailCorrection(email: string): string | null {
  const trimmedEmail = email.trim().toLowerCase();
  const [localPart, domain] = trimmedEmail.split('@');

  if (!domain) return null;

  // Verifica erro de digitação conhecido
  if (DOMAIN_TYPOS[domain]) {
    return `${localPart}@${DOMAIN_TYPOS[domain]}`;
  }

  // Calcula distância de Levenshtein para domínios comuns
  const closestDomain = findClosestDomain(domain, COMMON_DOMAINS);

  if (closestDomain && levenshteinDistance(domain, closestDomain) <= 2) {
    return `${localPart}@${closestDomain}`;
  }

  return null;
}

// ============================================
// VALIDAÇÃO DE TELEFONE
// ============================================

/**
 * Valida telefone brasileiro
 */
export async function validatePhone(phone: string): Promise<ValidationResult> {
  // Remove formatação
  const cleanPhone = phone.replace(/\D/g, '');

  // Verifica se está vazio
  if (!cleanPhone) {
    return {
      isValid: false,
      error: 'Telefone é obrigatório',
      score: 0,
    };
  }

  // Verifica comprimento (deve ser 10 ou 11 dígitos)
  if (cleanPhone.length < 10) {
    return {
      isValid: false,
      error: 'Telefone incompleto',
      suggestion: 'Digite o DDD + número',
      score: 50,
    };
  }

  if (cleanPhone.length > 11) {
    return {
      isValid: false,
      error: 'Telefone com muitos dígitos',
      score: 30,
    };
  }

  // Verifica se o DDD é válido (11 a 99)
  const ddd = parseInt(cleanPhone.substring(0, 2));
  if (ddd < 11 || ddd > 99) {
    return {
      isValid: false,
      error: 'DDD inválido',
      score: 40,
    };
  }

  // Verifica se não é uma sequência repetida
  if (/^(\d)\1+$/.test(cleanPhone)) {
    return {
      isValid: false,
      error: 'Telefone inválido',
      score: 20,
    };
  }

  // Celular deve começar com 9
  if (cleanPhone.length === 11 && cleanPhone[2] !== '9') {
    return {
      isValid: false,
      error: 'Celular deve começar com 9',
      score: 60,
    };
  }

  // Telefone válido!
  return {
    isValid: true,
    score: 100,
  };
}

/**
 * Valida telefone em tempo real (com debounce)
 */
let phoneDebounceTimer: NodeJS.Timeout;
export function validatePhoneDebounced(
  phone: string,
  callback: (result: ValidationResult) => void
): void {
  clearTimeout(phoneDebounceTimer);
  phoneDebounceTimer = setTimeout(async () => {
    const result = await validatePhone(phone);
    callback(result);
  }, DEBOUNCE_DELAY);
}

// ============================================
// FORMATAÇÃO
// ============================================

/**
 * Formata telefone brasileiro
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 11) {
    // Celular: (XX) 9XXXX-XXXX
    return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    // Fixo: (XX) XXXX-XXXX
    return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }

  return phone;
}

/**
 * Capitaliza palavras corretamente
 */
export function capitalizeWords(text: string): string {
  const prepositions = ['de', 'da', 'do', 'das', 'dos', 'e'];

  return text
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      // Primeira palavra sempre capitalizada
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }

      // Preposições em minúsculo
      if (prepositions.includes(word)) {
        return word;
      }

      // Outras palavras capitalizadas
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

// ============================================
// UTILITÁRIOS
// ============================================

/**
 * Calcula distância de Levenshtein entre duas strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Encontra o domínio mais próximo de uma lista
 */
function findClosestDomain(domain: string, domains: string[]): string | null {
  let minDistance = Infinity;
  let closestDomain: string | null = null;

  for (const commonDomain of domains) {
    const distance = levenshteinDistance(domain, commonDomain);
    if (distance < minDistance) {
      minDistance = distance;
      closestDomain = commonDomain;
    }
  }

  return closestDomain;
}

// ============================================
// VALIDAÇÕES COMBINADAS
// ============================================

/**
 * Valida todos os dados do cliente de uma vez
 */
export interface CustomerValidation {
  name: NameValidationResult;
  email: EmailValidationResult;
  phone: ValidationResult;
  isValid: boolean;
  score: number;
}

export async function validateCustomerData(
  name: string,
  email: string,
  phone: string
): Promise<CustomerValidation> {
  const [nameResult, emailResult, phoneResult] = await Promise.all([
    validateName(name),
    validateEmail(email),
    validatePhone(phone),
  ]);

  const isValid = nameResult.isValid && emailResult.isValid && phoneResult.isValid;
  const score = Math.round(
    ((nameResult.score || 0) + (emailResult.score || 0) + (phoneResult.score || 0)) / 3
  );

  return {
    name: nameResult,
    email: emailResult,
    phone: phoneResult,
    isValid,
    score,
  };
}

// ============================================
// EXPORTAÇÕES
// ============================================

export const validationUtils = {
  validateName,
  validateNameDebounced,
  validateEmail,
  validateEmailDebounced,
  suggestEmailCorrection,
  validatePhone,
  validatePhoneDebounced,
  validateCustomerData,
  formatPhone,
  capitalizeWords,
};

export default validationUtils;
