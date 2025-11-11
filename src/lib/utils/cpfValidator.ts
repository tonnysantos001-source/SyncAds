/**
 * CPF Validator
 * Validates Brazilian CPF (Cadastro de Pessoas Físicas) numbers
 * Using the official verification digit algorithm
 */

/**
 * Remove all non-numeric characters from CPF
 */
export const cleanCPF = (cpf: string): string => {
  return cpf.replace(/\D/g, "");
};

/**
 * Format CPF to pattern: 000.000.000-00
 */
export const formatCPF = (cpf: string): string => {
  const cleaned = cleanCPF(cpf);

  if (cleaned.length !== 11) {
    return cpf; // Return original if not 11 digits
  }

  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

/**
 * Validate CPF using verification digit algorithm
 */
export const validateCPF = (cpf: string): boolean => {
  const cleaned = cleanCPF(cpf);

  // Must have exactly 11 digits
  if (cleaned.length !== 11) {
    return false;
  }

  // Check if all digits are the same (invalid CPFs)
  if (/^(\d)\1{10}$/.test(cleaned)) {
    return false;
  }

  // Calculate first verification digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let firstDigit = 11 - (sum % 11);
  if (firstDigit >= 10) {
    firstDigit = 0;
  }

  // Check first verification digit
  if (firstDigit !== parseInt(cleaned.charAt(9))) {
    return false;
  }

  // Calculate second verification digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  let secondDigit = 11 - (sum % 11);
  if (secondDigit >= 10) {
    secondDigit = 0;
  }

  // Check second verification digit
  if (secondDigit !== parseInt(cleaned.charAt(10))) {
    return false;
  }

  return true;
};

/**
 * Validate and return error message if invalid
 */
export const getCPFError = (cpf: string): string | null => {
  const cleaned = cleanCPF(cpf);

  if (!cleaned) {
    return "CPF é obrigatório";
  }

  if (cleaned.length !== 11) {
    return "CPF deve ter 11 dígitos";
  }

  if (/^(\d)\1{10}$/.test(cleaned)) {
    return "CPF inválido";
  }

  if (!validateCPF(cpf)) {
    return "CPF inválido";
  }

  return null;
};
