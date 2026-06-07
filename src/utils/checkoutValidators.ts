/**
 * checkoutValidators.ts
 * Helpers de formatação e validação para os formulários de checkout.
 */

// ─── FORMATADORES ─────────────────────────────────────────────────────────────

/** Formata valor como moeda BRL: 1234.5 → "R$ 1.234,50" */
export const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Máscara de CEP: "12345678" → "12345-678" */
export const formatCEP = (v: string) => {
  const c = v.replace(/\D/g, '').slice(0, 8);
  return c.length > 5 ? `${c.slice(0, 5)}-${c.slice(5)}` : c;
};

/** Máscara de CPF: "12345678909" → "123.456.789-09" */
export const formatCPF = (v: string) => {
  const c = v.replace(/\D/g, '').slice(0, 11);
  return c
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

/** Máscara de CNPJ: "12345678000195" → "12.345.678/0001-95" */
export const formatCNPJ = (v: string) => {
  const c = v.replace(/\D/g, '').slice(0, 14);
  return c
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

/** Formata CPF ou CNPJ automaticamente baseado no tamanho */
export const formatCPFCNPJ = (v: string) => {
  const digits = v.replace(/\D/g, '');
  return digits.length <= 11 ? formatCPF(digits) : formatCNPJ(digits);
};

/** Máscara de telefone brasileiro: "(11) 99999-9999" */
export const formatPhone = (v: string) => {
  const c = v.replace(/\D/g, '').slice(0, 11);
  if (c.length <= 2) return `(${c}`;
  if (c.length <= 7) return `(${c.slice(0, 2)}) ${c.slice(2)}`;
  if (c.length <= 10) return `(${c.slice(0, 2)}) ${c.slice(2, 6)}-${c.slice(6)}`;
  return `(${c.slice(0, 2)}) ${c.slice(2, 7)}-${c.slice(7)}`;
};

/** Máscara de número de cartão: "4111 1111 1111 1111" */
export const formatCardNumber = (v: string) =>
  v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

/** Máscara de validade MM/AA */
export const formatExpiry = (v: string) => {
  const c = v.replace(/\D/g, '').slice(0, 4);
  return c.length > 2 ? `${c.slice(0, 2)}/${c.slice(2)}` : c;
};

// ─── VALIDADORES ──────────────────────────────────────────────────────────────

/** Valida CPF usando algoritmo de módulo 11 */
export const validateCPF = (cpf: string): boolean => {
  const c = cpf.replace(/\D/g, '');
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  let s = 0;
  for (let i = 0; i < 9; i++) s += +c[i] * (10 - i);
  let d = 11 - (s % 11);
  if (d >= 10) d = 0;
  if (d !== +c[9]) return false;
  s = 0;
  for (let i = 0; i < 10; i++) s += +c[i] * (11 - i);
  d = 11 - (s % 11);
  if (d >= 10) d = 0;
  return d === +c[10];
};

/** Valida CNPJ */
export const validateCNPJ = (cnpj: string): boolean => {
  const c = cnpj.replace(/\D/g, '');
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
  const calc = (s: string, w: number[]) =>
    w.reduce((acc, wt, i) => acc + +s[i] * wt, 0);
  const d1 = calc(c, [5,4,3,2,9,8,7,6,5,4,3,2]) % 11;
  if (+c[12] !== (d1 < 2 ? 0 : 11 - d1)) return false;
  const d2 = calc(c, [6,5,4,3,2,9,8,7,6,5,4,3,2]) % 11;
  return +c[13] === (d2 < 2 ? 0 : 11 - d2);
};

/** Valida CPF ou CNPJ automaticamente */
export const validateCPFCNPJ = (v: string): boolean => {
  const digits = v.replace(/\D/g, '');
  return digits.length <= 11 ? validateCPF(digits) : validateCNPJ(digits);
};

/** Valida e-mail */
export const validateEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

/** Valida telefone brasileiro (mínimo 10 dígitos) */
export const validatePhone = (phone: string): boolean => {
  const c = phone.replace(/\D/g, '');
  return c.length >= 10 && c.length <= 11;
};

/** Valida CEP (8 dígitos) */
export const validateCEP = (cep: string): boolean =>
  cep.replace(/\D/g, '').length === 8;

/** Valida número de cartão via algoritmo de Luhn */
export const validateCardNumber = (number: string): boolean => {
  const digits = number.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
};

/** Identifica bandeira do cartão */
export const detectCardBrand = (number: string): 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard' | 'unknown' => {
  const n = number.replace(/\D/g, '');
  if (/^4/.test(n)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'mastercard';
  if (/^(6(?:011|5|4[4-9]|22(?:1(?:2[6-9]|[3-9]\d)|[2-8]\d{2}|9(?:[01]\d|2[0-5]))))/.test(n)) return 'elo';
  if (/^3[47]/.test(n)) return 'amex';
  if (/^(60889|38590|60|3841)/.test(n)) return 'hipercard';
  return 'unknown';
};

/** Valida data de validade MM/AA (não expirado) */
export const validateExpiry = (expiry: string): boolean => {
  const [mm, yy] = expiry.split('/');
  if (!mm || !yy || mm.length !== 2 || yy.length !== 2) return false;
  const month = parseInt(mm, 10);
  const year = parseInt(`20${yy}`, 10);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const exp = new Date(year, month - 1, 1);
  return exp >= new Date(now.getFullYear(), now.getMonth(), 1);
};
