// ============================================
// VALIDATORS - Validação de Documentos BR
// ============================================
// Validadores para CPF, CNPJ, CEP e outras
// validações específicas do Brasil
// ============================================

// ===== CPF =====

/**
 * Remove caracteres não numéricos
 */
function cleanNumericString(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Valida CPF brasileiro
 */
export function isValidCPF(cpf: string): boolean {
  const cleaned = cleanNumericString(cpf);

  // CPF deve ter 11 dígitos
  if (cleaned.length !== 11) {
    return false;
  }

  // Rejeitar CPFs com todos os dígitos iguais
  if (/^(\d)\1{10}$/.test(cleaned)) {
    return false;
  }

  // Validar primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  const digit1 = remainder >= 10 ? 0 : remainder;

  if (digit1 !== parseInt(cleaned.charAt(9))) {
    return false;
  }

  // Validar segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  const digit2 = remainder >= 10 ? 0 : remainder;

  return digit2 === parseInt(cleaned.charAt(10));
}

/**
 * Formata CPF: 000.000.000-00
 */
export function formatCPF(cpf: string): string {
  const cleaned = cleanNumericString(cpf);

  if (cleaned.length !== 11) {
    return cpf;
  }

  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// ===== CNPJ =====

/**
 * Valida CNPJ brasileiro
 */
export function isValidCNPJ(cnpj: string): boolean {
  const cleaned = cleanNumericString(cnpj);

  // CNPJ deve ter 14 dígitos
  if (cleaned.length !== 14) {
    return false;
  }

  // Rejeitar CNPJs com todos os dígitos iguais
  if (/^(\d)\1{13}$/.test(cleaned)) {
    return false;
  }

  // Validar primeiro dígito verificador
  let length = cleaned.length - 2;
  let numbers = cleaned.substring(0, length);
  const digits = cleaned.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) {
    return false;
  }

  // Validar segundo dígito verificador
  length = length + 1;
  numbers = cleaned.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(digits.charAt(1));
}

/**
 * Formata CNPJ: 00.000.000/0000-00
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = cleanNumericString(cnpj);

  if (cleaned.length !== 14) {
    return cnpj;
  }

  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

// ===== CPF ou CNPJ =====

/**
 * Valida CPF ou CNPJ automaticamente
 */
export function isValidDocument(doc: string): boolean {
  const cleaned = cleanNumericString(doc);

  if (cleaned.length === 11) {
    return isValidCPF(cleaned);
  } else if (cleaned.length === 14) {
    return isValidCNPJ(cleaned);
  }

  return false;
}

/**
 * Formata CPF ou CNPJ automaticamente
 */
export function formatDocument(doc: string): string {
  const cleaned = cleanNumericString(doc);

  if (cleaned.length === 11) {
    return formatCPF(cleaned);
  } else if (cleaned.length === 14) {
    return formatCNPJ(cleaned);
  }

  return doc;
}

// ===== CEP =====

/**
 * Valida formato de CEP brasileiro
 */
export function isValidCEP(cep: string): boolean {
  const cleaned = cleanNumericString(cep);
  return cleaned.length === 8;
}

/**
 * Formata CEP: 00000-000
 */
export function formatCEP(cep: string): string {
  const cleaned = cleanNumericString(cep);

  if (cleaned.length !== 8) {
    return cep;
  }

  return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
}

/**
 * Interface para dados de endereço do ViaCEP
 */
export interface AddressData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

/**
 * Busca endereço por CEP usando ViaCEP API
 */
export async function fetchAddressByCEP(cep: string): Promise<AddressData | null> {
  const cleaned = cleanNumericString(cep);

  if (!isValidCEP(cleaned)) {
    throw new Error('CEP inválido');
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);

    if (!response.ok) {
      throw new Error('Erro ao buscar CEP');
    }

    const data = await response.json();

    if (data.erro) {
      throw new Error('CEP não encontrado');
    }

    return data as AddressData;
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    throw error;
  }
}

// ===== TELEFONE =====

/**
 * Valida telefone brasileiro (fixo ou celular)
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = cleanNumericString(phone);

  // Telefone fixo: (11) 1234-5678 = 10 dígitos
  // Celular: (11) 91234-5678 = 11 dígitos
  return cleaned.length === 10 || cleaned.length === 11;
}

/**
 * Formata telefone: (11) 91234-5678 ou (11) 1234-5678
 */
export function formatPhone(phone: string): string {
  const cleaned = cleanNumericString(phone);

  if (cleaned.length === 10) {
    // Fixo
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 11) {
    // Celular
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }

  return phone;
}

// ===== EMAIL =====

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// ===== CARTÃO DE CRÉDITO =====

/**
 * Valida número de cartão de crédito usando algoritmo de Luhn
 */
export function isValidCreditCard(cardNumber: string): boolean {
  const cleaned = cleanNumericString(cardNumber);

  if (cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  // Loop do último dígito para o primeiro
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i));

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Identifica a bandeira do cartão
 */
export function getCardBrand(cardNumber: string): string {
  const cleaned = cleanNumericString(cardNumber);

  if (/^4/.test(cleaned)) {
    return 'Visa';
  } else if (/^5[1-5]/.test(cleaned)) {
    return 'Mastercard';
  } else if (/^3[47]/.test(cleaned)) {
    return 'Amex';
  } else if (/^6(?:011|5)/.test(cleaned)) {
    return 'Discover';
  } else if (/^(?:2131|1800|35)/.test(cleaned)) {
    return 'JCB';
  } else if (/^50|^60|^65/.test(cleaned)) {
    return 'Elo';
  } else if (/^36/.test(cleaned)) {
    return 'Diners';
  } else if (/^(606282|3841)/.test(cleaned)) {
    return 'Hipercard';
  }

  return 'Unknown';
}

/**
 * Formata número de cartão: 0000 0000 0000 0000
 */
export function formatCreditCard(cardNumber: string): string {
  const cleaned = cleanNumericString(cardNumber);
  return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/**
 * Valida CVV do cartão
 */
export function isValidCVV(cvv: string, cardBrand?: string): boolean {
  const cleaned = cleanNumericString(cvv);

  // Amex tem 4 dígitos, outros têm 3
  if (cardBrand === 'Amex') {
    return cleaned.length === 4;
  }

  return cleaned.length === 3;
}

// ===== VALIDAÇÃO DE CARTÃO COMPLETA =====

export interface CardValidation {
  isValid: boolean;
  brand: string;
  errors: string[];
}

/**
 * Valida cartão de crédito completo
 */
export function validateCreditCardFull(
  cardNumber: string,
  holderName: string,
  expiryMonth: string,
  expiryYear: string,
  cvv: string
): CardValidation {
  const errors: string[] = [];

  // Validar número do cartão
  if (!isValidCreditCard(cardNumber)) {
    errors.push('Número do cartão inválido');
  }

  const brand = getCardBrand(cardNumber);

  // Validar nome do titular
  if (!holderName || holderName.trim().length < 3) {
    errors.push('Nome do titular inválido');
  }

  // Validar data de expiração
  const month = parseInt(expiryMonth);
  const year = parseInt(expiryYear);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear() % 100; // Últimos 2 dígitos

  if (month < 1 || month > 12) {
    errors.push('Mês de expiração inválido');
  }

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    errors.push('Cartão expirado');
  }

  // Validar CVV
  if (!isValidCVV(cvv, brand)) {
    errors.push('CVV inválido');
  }

  return {
    isValid: errors.length === 0,
    brand,
    errors
  };
}

// ===== UTILITÁRIOS =====

/**
 * Mascara número de cartão: **** **** **** 1234
 */
export function maskCreditCard(cardNumber: string): string {
  const cleaned = cleanNumericString(cardNumber);

  if (cleaned.length < 4) {
    return cardNumber;
  }

  const last4 = cleaned.slice(-4);
  const masked = '*'.repeat(cleaned.length - 4);

  return formatCreditCard(masked + last4);
}

/**
 * Mascara email: u****@example.com
 */
export function maskEmail(email: string): string {
  const [username, domain] = email.split('@');

  if (!domain) {
    return email;
  }

  const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 1);
  return `${maskedUsername}@${domain}`;
}

/**
 * Mascara CPF: ***.456.789-**
 */
export function maskCPF(cpf: string): string {
  const cleaned = cleanNumericString(cpf);

  if (cleaned.length !== 11) {
    return cpf;
  }

  return `***.${cleaned.substring(3, 6)}.${cleaned.substring(6, 9)}-**`;
}

/**
 * Mascara telefone: (11) ****-5678
 */
export function maskPhone(phone: string): string {
  const cleaned = cleanNumericString(phone);

  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 2)}) ****-${cleaned.substring(6)}`;
  } else if (cleaned.length === 11) {
    return `(${cleaned.substring(0, 2)}) *****-${cleaned.substring(7)}`;
  }

  return phone;
}
