// ============================================
// ERROR HANDLING SYSTEM
// ============================================
// Sistema centralizado de tratamento de erros
// com categorização, logging e mensagens user-friendly
// ============================================

export enum ErrorType {
  // Network & API
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  TIMEOUT = 'TIMEOUT',
  
  // Authentication
  AUTH_ERROR = 'AUTH_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_FIELD = 'MISSING_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Database
  DATABASE_ERROR = 'DATABASE_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  
  // Business Logic
  BUSINESS_ERROR = 'BUSINESS_ERROR',
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Payment
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  INVALID_PAYMENT_METHOD = 'INVALID_PAYMENT_METHOD',
  
  // General
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AppError {
  type: ErrorType;
  message: string;
  userMessage: string;
  details?: any;
  code?: string;
  statusCode?: number;
  retryable?: boolean;
}

export class CustomError extends Error {
  type: ErrorType;
  userMessage: string;
  details?: any;
  code?: string;
  statusCode?: number;
  retryable: boolean;

  constructor(error: AppError) {
    super(error.message);
    this.name = 'CustomError';
    this.type = error.type;
    this.userMessage = error.userMessage;
    this.details = error.details;
    this.code = error.code;
    this.statusCode = error.statusCode || 500;
    this.retryable = error.retryable || false;
  }
}

// ===== ERROR PARSER =====

export function parseError(error: any): AppError {
  // Supabase errors
  if (error?.code) {
    return parseSupabaseError(error);
  }

  // Axios/Fetch errors
  if (error?.response) {
    return parseAPIError(error);
  }

  // Network errors
  if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
    return {
      type: ErrorType.NETWORK_ERROR,
      message: error.message,
      userMessage: 'Erro de conexão. Verifique sua internet.',
      retryable: true,
    };
  }

  // Timeout
  if (error?.message?.includes('timeout')) {
    return {
      type: ErrorType.TIMEOUT,
      message: error.message,
      userMessage: 'A operação demorou muito. Tente novamente.',
      retryable: true,
    };
  }

  // CustomError instance
  if (error instanceof CustomError) {
    return {
      type: error.type,
      message: error.message,
      userMessage: error.userMessage,
      details: error.details,
      code: error.code,
      statusCode: error.statusCode,
      retryable: error.retryable,
    };
  }

  // Default
  return {
    type: ErrorType.UNKNOWN_ERROR,
    message: error?.message || 'Erro desconhecido',
    userMessage: 'Algo deu errado. Tente novamente.',
    details: error,
    retryable: false,
  };
}

function parseSupabaseError(error: any): AppError {
  const code = error.code;
  const message = error.message || '';

  // Authentication errors
  if (code === 'PGRST301' || message.includes('JWT')) {
    return {
      type: ErrorType.SESSION_EXPIRED,
      message: message,
      userMessage: 'Sua sessão expirou. Faça login novamente.',
      code,
      statusCode: 401,
      retryable: false,
    };
  }

  // Not found
  if (code === 'PGRST116' || message.includes('not found')) {
    return {
      type: ErrorType.NOT_FOUND,
      message: message,
      userMessage: 'Registro não encontrado.',
      code,
      statusCode: 404,
      retryable: false,
    };
  }

  // Duplicate entry
  if (code === '23505' || message.includes('duplicate') || message.includes('already exists')) {
    return {
      type: ErrorType.DUPLICATE_ENTRY,
      message: message,
      userMessage: 'Este registro já existe.',
      code,
      statusCode: 409,
      retryable: false,
    };
  }

  // Permission denied
  if (message.includes('permission denied') || message.includes('RLS')) {
    return {
      type: ErrorType.FORBIDDEN,
      message: message,
      userMessage: 'Você não tem permissão para esta ação.',
      code,
      statusCode: 403,
      retryable: false,
    };
  }

  // Generic database error
  return {
    type: ErrorType.DATABASE_ERROR,
    message: message,
    userMessage: 'Erro ao acessar o banco de dados.',
    code,
    statusCode: 500,
    retryable: true,
  };
}

function parseAPIError(error: any): AppError {
  const status = error.response?.status;
  const data = error.response?.data;
  const message = data?.message || data?.error || error.message;

  switch (status) {
    case 400:
      return {
        type: ErrorType.VALIDATION_ERROR,
        message: message,
        userMessage: 'Dados inválidos. Verifique os campos.',
        statusCode: 400,
        details: data,
        retryable: false,
      };

    case 401:
      return {
        type: ErrorType.UNAUTHORIZED,
        message: message,
        userMessage: 'Você precisa fazer login.',
        statusCode: 401,
        retryable: false,
      };

    case 403:
      return {
        type: ErrorType.FORBIDDEN,
        message: message,
        userMessage: 'Você não tem permissão para esta ação.',
        statusCode: 403,
        retryable: false,
      };

    case 404:
      return {
        type: ErrorType.NOT_FOUND,
        message: message,
        userMessage: 'Recurso não encontrado.',
        statusCode: 404,
        retryable: false,
      };

    case 409:
      return {
        type: ErrorType.DUPLICATE_ENTRY,
        message: message,
        userMessage: 'Este registro já existe.',
        statusCode: 409,
        retryable: false,
      };

    case 429:
      return {
        type: ErrorType.RATE_LIMIT_EXCEEDED,
        message: message,
        userMessage: 'Muitas requisições. Aguarde um momento.',
        statusCode: 429,
        retryable: true,
      };

    case 500:
    case 502:
    case 503:
    case 504:
      return {
        type: ErrorType.API_ERROR,
        message: message,
        userMessage: 'Erro no servidor. Tente novamente em alguns instantes.',
        statusCode: status,
        retryable: true,
      };

    default:
      return {
        type: ErrorType.API_ERROR,
        message: message,
        userMessage: 'Erro na comunicação com o servidor.',
        statusCode: status,
        details: data,
        retryable: true,
      };
  }
}

// ===== ERROR LOGGER =====

interface ErrorLog {
  timestamp: string;
  type: ErrorType;
  message: string;
  userMessage: string;
  details?: any;
  code?: string;
  statusCode?: number;
  userId?: string;
  organizationId?: string;
  url?: string;
  userAgent?: string;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 100;

  log(error: AppError, context?: { userId?: string; organizationId?: string }) {
    const log: ErrorLog = {
      timestamp: new Date().toISOString(),
      type: error.type,
      message: error.message,
      userMessage: error.userMessage,
      details: error.details,
      code: error.code,
      statusCode: error.statusCode,
      userId: context?.userId,
      organizationId: context?.organizationId,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Console log in development
    if (import.meta.env.DEV) {
      console.error('❌ Error:', {
        type: error.type,
        message: error.message,
        userMessage: error.userMessage,
        details: error.details,
      });
    }

    // Store log
    this.logs.unshift(log);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // TODO: Send to Sentry or analytics service
    // this.sendToSentry(log);
  }

  getLogs(limit = 20): ErrorLog[] {
    return this.logs.slice(0, limit);
  }

  clear() {
    this.logs = [];
  }

  // TODO: Implement Sentry integration
  private sendToSentry(log: ErrorLog) {
    // Sentry.captureException(new Error(log.message), {
    //   level: 'error',
    //   tags: {
    //     errorType: log.type,
    //   },
    //   extra: log,
    // });
  }
}

export const errorLogger = new ErrorLogger();

// ===== HELPER FUNCTIONS =====

export function handleError(
  error: any,
  context?: { userId?: string; organizationId?: string }
): AppError {
  const parsedError = parseError(error);
  errorLogger.log(parsedError, context);
  return parsedError;
}

export function throwError(error: AppError): never {
  throw new CustomError(error);
}

// ===== RETRY LOGIC =====

interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  backoff?: boolean;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, backoff = true } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const parsedError = parseError(error);

      // Don't retry if not retryable
      if (!parsedError.retryable) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Wait before retry
      const delay = backoff ? delayMs * Math.pow(2, attempt) : delayMs;
      await new Promise((resolve) => setTimeout(resolve, delay));

      console.log(`🔄 Retry attempt ${attempt + 1}/${maxRetries}`);
    }
  }

  throw lastError;
}

// ===== VALIDATION HELPERS =====

export function validateRequired(value: any, fieldName: string) {
  if (value === null || value === undefined || value === '') {
    throwError({
      type: ErrorType.MISSING_FIELD,
      message: `${fieldName} is required`,
      userMessage: `O campo "${fieldName}" é obrigatório.`,
      code: 'MISSING_FIELD',
      statusCode: 400,
    });
  }
}

export function validateEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throwError({
      type: ErrorType.INVALID_FORMAT,
      message: 'Invalid email format',
      userMessage: 'Email inválido.',
      code: 'INVALID_EMAIL',
      statusCode: 400,
    });
  }
}

export function validateMinLength(value: string, minLength: number, fieldName: string) {
  if (value.length < minLength) {
    throwError({
      type: ErrorType.INVALID_FORMAT,
      message: `${fieldName} must be at least ${minLength} characters`,
      userMessage: `${fieldName} deve ter pelo menos ${minLength} caracteres.`,
      code: 'MIN_LENGTH',
      statusCode: 400,
    });
  }
}

