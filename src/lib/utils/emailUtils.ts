/**
 * Utilitários para trabalhar com emails
 * Inclui formatação, validação e verificação online
 */

export interface EmailValidationResult {
  valid: boolean;
  formatted?: string;
  type?: 'personal' | 'business' | 'temporary';
  message?: string;
  domain?: string;
  suggestion?: string;
}

export interface EmailVerificationResult {
  valid: boolean;
  email: string;
  domain: string;
  disposable: boolean;
  smtp_valid: boolean;
  catch_all: boolean;
  role_account: boolean;
  free_provider: boolean;
  score: number; // 0-100, quanto maior melhor
  message?: string;
}

// Domínios de email descartáveis/temporários conhecidos
const DISPOSABLE_DOMAINS = [
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'tempmail.com',
  'trashmail.com',
  'throwaway.email',
  'yopmail.com',
  'getnada.com',
  'temp-mail.org',
  'mohmal.com',
  'sharklasers.com',
  'maildrop.cc',
];

// Provedores de email gratuitos
const FREE_EMAIL_PROVIDERS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'icloud.com',
  'aol.com',
  'protonmail.com',
  'mail.com',
  'zoho.com',
];

// Domínios comuns com erros de digitação
const COMMON_DOMAIN_TYPOS: { [key: string]: string } = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'yahooo.com': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
};

/**
 * Regex para validação de email (RFC 5322 simplificado)
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Limpa e formata o email
 * @param email - Email para limpar
 * @returns Email limpo e em lowercase
 */
export const cleanEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

/**
 * Formata email (limpa e valida formato)
 * @param email - Email para formatar
 * @returns Email formatado ou string vazia se inválido
 */
export const formatEmail = (email: string): string => {
  const cleaned = cleanEmail(email);
  return EMAIL_REGEX.test(cleaned) ? cleaned : '';
};

/**
 * Extrai o domínio do email
 * @param email - Email completo
 * @returns Domínio ou null
 */
export const extractDomain = (email: string): string | null => {
  const cleaned = cleanEmail(email);
  const parts = cleaned.split('@');
  return parts.length === 2 ? parts[1] : null;
};

/**
 * Extrai o username (parte antes do @) do email
 * @param email - Email completo
 * @returns Username ou null
 */
export const extractUsername = (email: string): string | null => {
  const cleaned = cleanEmail(email);
  const parts = cleaned.split('@');
  return parts.length === 2 ? parts[0] : null;
};

/**
 * Verifica se o email tem formato válido
 * @param email - Email para validar
 * @returns true se válido
 */
export const isValidEmailFormat = (email: string): boolean => {
  const cleaned = cleanEmail(email);
  return EMAIL_REGEX.test(cleaned);
};

/**
 * Verifica se é um email de provedor gratuito
 * @param email - Email para verificar
 * @returns true se for provedor gratuito
 */
export const isFreeEmailProvider = (email: string): boolean => {
  const domain = extractDomain(email);
  return domain ? FREE_EMAIL_PROVIDERS.includes(domain) : false;
};

/**
 * Verifica se é um email descartável/temporário
 * @param email - Email para verificar
 * @returns true se for descartável
 */
export const isDisposableEmail = (email: string): boolean => {
  const domain = extractDomain(email);
  return domain ? DISPOSABLE_DOMAINS.includes(domain) : false;
};

/**
 * Verifica se é potencialmente um email corporativo
 * @param email - Email para verificar
 * @returns true se parecer corporativo
 */
export const isBusinessEmail = (email: string): boolean => {
  const domain = extractDomain(email);
  if (!domain) return false;

  // Não é corporativo se for provedor gratuito ou descartável
  if (isFreeEmailProvider(email) || isDisposableEmail(email)) {
    return false;
  }

  // Heurística: domínios com mais de 2 partes geralmente não são corporativos
  // Exceto casos especiais como .com.br
  const parts = domain.split('.');
  if (parts.length > 2 && !domain.endsWith('.com.br') && !domain.endsWith('.co.uk')) {
    return false;
  }

  return true;
};

/**
 * Verifica se é um email de função/departamento (não pessoal)
 * @param email - Email para verificar
 * @returns true se for email de função
 */
export const isRoleEmail = (email: string): boolean => {
  const username = extractUsername(email);
  if (!username) return false;

  const roleKeywords = [
    'admin',
    'administrator',
    'contact',
    'info',
    'suporte',
    'support',
    'help',
    'sales',
    'vendas',
    'noreply',
    'no-reply',
    'marketing',
    'contato',
    'atendimento',
    'sac',
    'rh',
    'hr',
    'financeiro',
    'finance',
  ];

  return roleKeywords.some((keyword) => username.includes(keyword));
};

/**
 * Sugere correção para erros comuns de digitação
 * @param email - Email com possível erro
 * @returns Email corrigido ou null se não houver sugestão
 */
export const suggestEmailCorrection = (email: string): string | null => {
  const domain = extractDomain(email);
  const username = extractUsername(email);

  if (!domain || !username) return null;

  // Verificar erros conhecidos
  if (COMMON_DOMAIN_TYPOS[domain]) {
    return `${username}@${COMMON_DOMAIN_TYPOS[domain]}`;
  }

  // Verificar similaridade com domínios populares
  for (const popularDomain of FREE_EMAIL_PROVIDERS) {
    if (calculateLevenshteinDistance(domain, popularDomain) <= 2) {
      return `${username}@${popularDomain}`;
    }
  }

  return null;
};

/**
 * Calcula a distância de Levenshtein entre duas strings
 * (usado para detectar erros de digitação)
 */
const calculateLevenshteinDistance = (str1: string, str2: string): number => {
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
};

/**
 * Valida email localmente (sem API)
 * @param email - Email para validar
 * @returns Resultado da validação
 */
export const validateEmail = (email: string): EmailValidationResult => {
  const cleaned = cleanEmail(email);

  if (!cleaned) {
    return {
      valid: false,
      message: 'Email não pode estar vazio',
    };
  }

  if (!isValidEmailFormat(cleaned)) {
    return {
      valid: false,
      message: 'Formato de email inválido',
    };
  }

  const domain = extractDomain(cleaned);
  if (!domain) {
    return {
      valid: false,
      message: 'Domínio inválido',
    };
  }

  // Verificar se é descartável
  if (isDisposableEmail(cleaned)) {
    return {
      valid: false,
      message: 'Email temporário/descartável não permitido',
      type: 'temporary',
      domain,
    };
  }

  // Sugerir correção se houver erro de digitação
  const suggestion = suggestEmailCorrection(cleaned);

  // Determinar tipo
  let type: 'personal' | 'business' | 'temporary' = 'personal';
  if (isBusinessEmail(cleaned)) {
    type = 'business';
  } else if (isFreeEmailProvider(cleaned)) {
    type = 'personal';
  }

  return {
    valid: true,
    formatted: cleaned,
    type,
    domain,
    message: suggestion ? `Você quis dizer ${suggestion}?` : 'Email válido',
    suggestion: suggestion || undefined,
  };
};

/**
 * Valida email usando API externa (AbstractAPI)
 * Requer API key: https://www.abstractapi.com/api/email-validation-api
 * @param email - Email para validar
 * @param apiKey - API Key da AbstractAPI (opcional)
 * @returns Resultado da verificação online
 */
export const verifyEmailOnline = async (
  email: string,
  apiKey?: string
): Promise<EmailVerificationResult> => {
  const cleaned = cleanEmail(email);

  // Validação local primeiro
  const localValidation = validateEmail(cleaned);
  if (!localValidation.valid) {
    return {
      valid: false,
      email: cleaned,
      domain: localValidation.domain || '',
      disposable: isDisposableEmail(cleaned),
      smtp_valid: false,
      catch_all: false,
      role_account: isRoleEmail(cleaned),
      free_provider: isFreeEmailProvider(cleaned),
      score: 0,
      message: localValidation.message,
    };
  }

  // Se não tiver API key, usar validação local aprimorada
  if (!apiKey) {
    return {
      valid: true,
      email: cleaned,
      domain: localValidation.domain || '',
      disposable: false,
      smtp_valid: true, // Assumir válido localmente
      catch_all: false,
      role_account: isRoleEmail(cleaned),
      free_provider: isFreeEmailProvider(cleaned),
      score: 70, // Score médio para validação local
      message: 'Email validado localmente (sem verificação SMTP)',
    };
  }

  try {
    // Usar AbstractAPI para validação completa
    const response = await fetch(
      `https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${encodeURIComponent(cleaned)}`
    );

    if (!response.ok) {
      throw new Error('Erro ao consultar API de validação');
    }

    const data = await response.json();

    // Calcular score baseado nos resultados
    let score = 100;
    if (!data.is_valid_format.value) score -= 50;
    if (!data.is_smtp_valid.value) score -= 30;
    if (data.is_disposable_email.value) score -= 40;
    if (data.is_role_email.value) score -= 10;
    if (!data.is_mx_found.value) score -= 20;

    return {
      valid: data.is_valid_format.value && data.is_smtp_valid.value && !data.is_disposable_email.value,
      email: cleaned,
      domain: localValidation.domain || '',
      disposable: data.is_disposable_email.value || false,
      smtp_valid: data.is_smtp_valid.value || false,
      catch_all: data.is_catchall_email.value || false,
      role_account: data.is_role_email.value || false,
      free_provider: data.is_free_email.value || false,
      score: Math.max(0, score),
      message: score >= 70 ? 'Email válido e verificado' : 'Email com problemas detectados',
    };
  } catch (error) {
    console.error('Erro ao verificar email online:', error);

    // Fallback para validação local
    return {
      valid: true,
      email: cleaned,
      domain: localValidation.domain || '',
      disposable: isDisposableEmail(cleaned),
      smtp_valid: true,
      catch_all: false,
      role_account: isRoleEmail(cleaned),
      free_provider: isFreeEmailProvider(cleaned),
      score: 60,
      message: 'Email validado localmente (erro na verificação online)',
    };
  }
};

/**
 * Máscara de email (ocultar parte do email)
 * @param email - Email para mascarar
 * @returns Email mascarado (ex: j***@example.com)
 */
export const maskEmail = (email: string): string => {
  const cleaned = cleanEmail(email);
  const parts = cleaned.split('@');

  if (parts.length !== 2) return cleaned;

  const username = parts[0];
  const domain = parts[1];

  if (username.length <= 2) {
    return `${username[0]}***@${domain}`;
  }

  return `${username[0]}${'*'.repeat(username.length - 1)}@${domain}`;
};

/**
 * Gera um email de exemplo/placeholder
 * @param name - Nome para usar (opcional)
 * @returns Email de exemplo
 */
export const generateExampleEmail = (name?: string): string => {
  if (name) {
    const cleaned = name.toLowerCase().replace(/\s+/g, '.');
    return `${cleaned}@example.com`;
  }
  return 'usuario@example.com';
};

/**
 * Valida lista de emails
 * @param emails - Array de emails
 * @returns Resultado da validação de cada email
 */
export const validateEmailList = (emails: string[]): EmailValidationResult[] => {
  return emails.map((email) => validateEmail(email));
};

/**
 * Filtra emails válidos de uma lista
 * @param emails - Array de emails
 * @returns Apenas emails válidos
 */
export const filterValidEmails = (emails: string[]): string[] => {
  return emails.filter((email) => validateEmail(email).valid);
};
