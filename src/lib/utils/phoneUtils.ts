/**
 * Utilitários para trabalhar com telefones brasileiros
 * Inclui formatação, validação e identificação de tipo
 */

export interface PhoneValidationResult {
  valid: boolean;
  formatted?: string;
  type?: 'mobile' | 'landline';
  message?: string;
}

// DDDs válidos no Brasil
const VALID_DDDS = [
  11, 12, 13, 14, 15, 16, 17, 18, 19, // SP
  21, 22, 24, // RJ
  27, 28, // ES
  31, 32, 33, 34, 35, 37, 38, // MG
  41, 42, 43, 44, 45, 46, // PR
  47, 48, 49, // SC
  51, 53, 54, 55, // RS
  61, // DF
  62, 64, // GO
  63, // TO
  65, 66, // MT
  67, // MS
  68, // AC
  69, // RO
  71, 73, 74, 75, 77, // BA
  79, // SE
  81, 87, // PE
  82, // AL
  83, // PB
  84, // RN
  85, 88, // CE
  86, 89, // PI
  91, 93, 94, // PA
  92, 97, // AM
  95, // RR
  96, // AP
  98, 99, // MA
];

/**
 * Formata telefone brasileiro
 * @param value - Telefone com ou sem formatação
 * @returns Telefone formatado
 */
export const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, '');

  if (numbers.length === 0) return '';
  if (numbers.length <= 2) return `(${numbers}`;
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 10) {
    // Fixo: (11) 3456-7890
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
  }
  // Celular: (11) 98765-4321
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
};

/**
 * Remove formatação do telefone
 * @param phone - Telefone formatado
 * @returns Apenas números
 */
export const cleanPhone = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

/**
 * Valida DDD
 * @param ddd - DDD para validar (2 dígitos)
 * @returns true se válido
 */
export const isValidDDD = (ddd: number): boolean => {
  return VALID_DDDS.includes(ddd);
};

/**
 * Identifica tipo de telefone
 * @param phone - Telefone para identificar
 * @returns 'mobile', 'landline' ou null
 */
export const getPhoneType = (phone: string): 'mobile' | 'landline' | null => {
  const clean = cleanPhone(phone);

  if (clean.length === 11) {
    // Celular: 11 dígitos, 9º dígito (terceiro após DDD)
    const thirdDigit = parseInt(clean.charAt(2));
    return thirdDigit === 9 ? 'mobile' : null;
  }

  if (clean.length === 10) {
    // Fixo: 10 dígitos
    const thirdDigit = parseInt(clean.charAt(2));
    return thirdDigit >= 2 && thirdDigit <= 5 ? 'landline' : null;
  }

  return null;
};

/**
 * Valida telefone brasileiro
 * @param phone - Telefone para validar
 * @returns true se válido
 */
export const isValidPhone = (phone: string): boolean => {
  const clean = cleanPhone(phone);

  // Deve ter 10 (fixo) ou 11 (celular) dígitos
  if (clean.length !== 10 && clean.length !== 11) return false;

  // Validar DDD
  const ddd = parseInt(clean.slice(0, 2));
  if (!isValidDDD(ddd)) return false;

  // Validar tipo
  const type = getPhoneType(phone);
  if (!type) return false;

  // Validar números repetidos
  if (/^(\d)\1+$/.test(clean)) return false;

  return true;
};

/**
 * Valida telefone e retorna resultado detalhado
 * @param phone - Telefone para validar
 * @returns Objeto com resultado da validação
 */
export const validatePhone = (phone: string): PhoneValidationResult => {
  const clean = cleanPhone(phone);

  if (!clean) {
    return {
      valid: false,
      message: 'Telefone não pode estar vazio',
    };
  }

  if (clean.length < 10) {
    return {
      valid: false,
      message: `Digite mais ${10 - clean.length} dígitos`,
    };
  }

  if (clean.length > 11) {
    return {
      valid: false,
      message: 'Telefone deve ter no máximo 11 dígitos',
    };
  }

  const ddd = parseInt(clean.slice(0, 2));
  if (!isValidDDD(ddd)) {
    return {
      valid: false,
      message: 'DDD inválido',
    };
  }

  const type = getPhoneType(phone);
  if (!type) {
    if (clean.length === 11) {
      return {
        valid: false,
        message: 'Celular deve começar com 9 após o DDD',
      };
    }
    return {
      valid: false,
      message: 'Formato de telefone inválido',
    };
  }

  if (/^(\d)\1+$/.test(clean)) {
    return {
      valid: false,
      message: 'Telefone inválido',
    };
  }

  return {
    valid: true,
    formatted: formatPhone(clean),
    type: type,
    message: type === 'mobile' ? 'Celular válido' : 'Telefone fixo válido',
  };
};

/**
 * Máscara para input de telefone
 * @param value - Valor atual do input
 * @returns Valor formatado
 */
export const maskPhone = (value: string): string => {
  return formatPhone(value);
};

/**
 * Valida telefone usando API externa (TrueCaller, etc)
 * ATENÇÃO: APIs comerciais podem ter custo
 * @param phone - Telefone para validar
 * @returns Dados do telefone se válido
 */
export const validatePhoneOnline = async (
  phone: string
): Promise<{
  valid: boolean;
  carrier?: string;
  location?: string;
  type?: 'mobile' | 'landline';
  message?: string;
}> => {
  const clean = cleanPhone(phone);

  if (!isValidPhone(clean)) {
    return {
      valid: false,
      message: 'Telefone com formato inválido',
    };
  }

  try {
    // API exemplo: BrasilAPI (gratuita, mas limitada)
    const ddd = clean.slice(0, 2);
    const response = await fetch(`https://brasilapi.com.br/api/ddd/v1/${ddd}`);

    if (!response.ok) {
      throw new Error('Erro ao consultar DDD');
    }

    const data = await response.json();

    return {
      valid: true,
      location: data.state || undefined,
      type: getPhoneType(phone) || undefined,
      message: `Telefone válido - ${data.state || 'Brasil'}`,
    };
  } catch (error) {
    console.error('Erro ao validar telefone online:', error);

    // Fallback: validação local
    const localValidation = validatePhone(clean);
    return {
      valid: localValidation.valid,
      type: localValidation.type,
      message: localValidation.message || 'Telefone válido (validação offline)',
    };
  }
};

/**
 * Retorna informações sobre o DDD
 * @param ddd - DDD para consultar
 * @returns Estado e cidades principais
 */
export const getDDDInfo = (ddd: number): {
  state: string;
  cities: string[];
} | null => {
  const dddMap: { [key: number]: { state: string; cities: string[] } } = {
    11: { state: 'SP', cities: ['São Paulo (capital e região)'] },
    12: { state: 'SP', cities: ['São José dos Campos', 'Taubaté'] },
    13: { state: 'SP', cities: ['Santos', 'São Vicente'] },
    14: { state: 'SP', cities: ['Bauru', 'Marília'] },
    15: { state: 'SP', cities: ['Sorocaba', 'Itapetininga'] },
    16: { state: 'SP', cities: ['Ribeirão Preto', 'Araraquara'] },
    17: { state: 'SP', cities: ['São José do Rio Preto', 'Catanduva'] },
    18: { state: 'SP', cities: ['Presidente Prudente', 'Araçatuba'] },
    19: { state: 'SP', cities: ['Campinas', 'Piracicaba'] },
    21: { state: 'RJ', cities: ['Rio de Janeiro (capital e região)'] },
    22: { state: 'RJ', cities: ['Campos dos Goytacazes', 'Macaé'] },
    24: { state: 'RJ', cities: ['Volta Redonda', 'Petrópolis'] },
    27: { state: 'ES', cities: ['Vitória', 'Vila Velha'] },
    28: { state: 'ES', cities: ['Cachoeiro de Itapemirim', 'Linhares'] },
    31: { state: 'MG', cities: ['Belo Horizonte (capital e região)'] },
    32: { state: 'MG', cities: ['Juiz de Fora', 'São João del-Rei'] },
    33: { state: 'MG', cities: ['Governador Valadares', 'Teófilo Otoni'] },
    34: { state: 'MG', cities: ['Uberlândia', 'Uberaba'] },
    35: { state: 'MG', cities: ['Poços de Caldas', 'Varginha'] },
    37: { state: 'MG', cities: ['Divinópolis', 'Itaúna'] },
    38: { state: 'MG', cities: ['Montes Claros', 'Pirapora'] },
    41: { state: 'PR', cities: ['Curitiba (capital e região)'] },
    42: { state: 'PR', cities: ['Ponta Grossa', 'Guarapuava'] },
    43: { state: 'PR', cities: ['Londrina', 'Apucarana'] },
    44: { state: 'PR', cities: ['Maringá', 'Umuarama'] },
    45: { state: 'PR', cities: ['Foz do Iguaçu', 'Cascavel'] },
    46: { state: 'PR', cities: ['Francisco Beltrão', 'Pato Branco'] },
    47: { state: 'SC', cities: ['Joinville', 'Blumenau'] },
    48: { state: 'SC', cities: ['Florianópolis (capital e região)'] },
    49: { state: 'SC', cities: ['Chapecó', 'Lages'] },
    51: { state: 'RS', cities: ['Porto Alegre (capital e região)'] },
    53: { state: 'RS', cities: ['Pelotas', 'Rio Grande'] },
    54: { state: 'RS', cities: ['Caxias do Sul', 'Passo Fundo'] },
    55: { state: 'RS', cities: ['Santa Maria', 'Uruguaiana'] },
    61: { state: 'DF', cities: ['Brasília (capital federal)'] },
    62: { state: 'GO', cities: ['Goiânia', 'Anápolis'] },
    63: { state: 'TO', cities: ['Palmas', 'Araguaína'] },
    64: { state: 'GO', cities: ['Rio Verde', 'Caldas Novas'] },
    65: { state: 'MT', cities: ['Cuiabá', 'Várzea Grande'] },
    66: { state: 'MT', cities: ['Rondonópolis', 'Sinop'] },
    67: { state: 'MS', cities: ['Campo Grande', 'Dourados'] },
    68: { state: 'AC', cities: ['Rio Branco', 'Cruzeiro do Sul'] },
    69: { state: 'RO', cities: ['Porto Velho', 'Ji-Paraná'] },
    71: { state: 'BA', cities: ['Salvador (capital e região)'] },
    73: { state: 'BA', cities: ['Ilhéus', 'Itabuna'] },
    74: { state: 'BA', cities: ['Juazeiro', 'Irecê'] },
    75: { state: 'BA', cities: ['Feira de Santana', 'Alagoinhas'] },
    77: { state: 'BA', cities: ['Vitória da Conquista', 'Barreiras'] },
    79: { state: 'SE', cities: ['Aracaju', 'Estância'] },
    81: { state: 'PE', cities: ['Recife (capital e região)'] },
    82: { state: 'AL', cities: ['Maceió', 'Arapiraca'] },
    83: { state: 'PB', cities: ['João Pessoa', 'Campina Grande'] },
    84: { state: 'RN', cities: ['Natal', 'Mossoró'] },
    85: { state: 'CE', cities: ['Fortaleza (capital e região)'] },
    86: { state: 'PI', cities: ['Teresina', 'Parnaíba'] },
    87: { state: 'PE', cities: ['Petrolina', 'Garanhuns'] },
    88: { state: 'CE', cities: ['Juazeiro do Norte', 'Sobral'] },
    89: { state: 'PI', cities: ['Picos', 'Floriano'] },
    91: { state: 'PA', cities: ['Belém (capital e região)'] },
    92: { state: 'AM', cities: ['Manaus', 'Parintins'] },
    93: { state: 'PA', cities: ['Santarém', 'Altamira'] },
    94: { state: 'PA', cities: ['Marabá', 'Parauapebas'] },
    95: { state: 'RR', cities: ['Boa Vista', 'Rorainópolis'] },
    96: { state: 'AP', cities: ['Macapá', 'Santana'] },
    97: { state: 'AM', cities: ['Tefé', 'Coari'] },
    98: { state: 'MA', cities: ['São Luís (capital e região)'] },
    99: { state: 'MA', cities: ['Imperatriz', 'Caxias'] },
  };

  return dddMap[ddd] || null;
};

/**
 * Adiciona código do país (+55)
 * @param phone - Telefone brasileiro
 * @returns Telefone com código do país
 */
export const addCountryCode = (phone: string): string => {
  const clean = cleanPhone(phone);
  if (!clean) return '';

  // Se já tem código do país
  if (clean.startsWith('55')) return `+${clean}`;

  return `+55${clean}`;
};

/**
 * Remove código do país (+55 ou 55)
 * @param phone - Telefone com código do país
 * @returns Telefone sem código do país
 */
export const removeCountryCode = (phone: string): string => {
  const clean = cleanPhone(phone);

  if (clean.startsWith('55') && clean.length > 11) {
    return clean.slice(2);
  }

  return clean;
};

/**
 * Converte telefone para formato WhatsApp
 * @param phone - Telefone brasileiro
 * @returns Formato: 5511987654321
 */
export const toWhatsAppFormat = (phone: string): string => {
  const clean = cleanPhone(phone);
  if (!isValidPhone(clean)) return '';

  // WhatsApp usa formato: código país + DDD + número
  return addCountryCode(clean).replace('+', '');
};

/**
 * Gera link para WhatsApp
 * @param phone - Telefone brasileiro
 * @param message - Mensagem opcional
 * @returns URL do WhatsApp Web
 */
export const generateWhatsAppLink = (phone: string, message?: string): string => {
  const whatsappNumber = toWhatsAppFormat(phone);
  if (!whatsappNumber) return '';

  const encodedMessage = message ? `&text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${whatsappNumber}?${encodedMessage}`;
};

/**
 * Lista de telefones conhecidos como inválidos
 */
export const INVALID_PHONES = [
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
  '1234567890',
  '11987654321', // Exemplo comum
];

/**
 * Verifica se telefone está na lista de conhecidos como inválidos
 */
export const isKnownInvalidPhone = (phone: string): boolean => {
  const clean = cleanPhone(phone);
  return INVALID_PHONES.includes(clean);
};
