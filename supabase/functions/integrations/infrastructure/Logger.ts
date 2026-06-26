// =========================================================================
// MÓDULO DE INTEGRAÇÕES GLOBAL - LOGGING E SANITIZAÇÃO DE DADOS (Deno)
// =========================================================================

import { LoggerInterface } from "../types.ts";

export class Logger implements LoggerInterface {
  private category: string;

  constructor(category: string) {
    this.category = category;
  }

  /**
   * Log de Informações
   */
  info(message: string, context?: Record<string, any>): void {
    const cleanContext = context ? this.sanitize(context) : undefined;
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "INFO",
        category: this.category,
        message,
        context: cleanContext,
      })
    );
  }

  /**
   * Log de Alertas
   */
  warn(message: string, context?: Record<string, any>): void {
    const cleanContext = context ? this.sanitize(context) : undefined;
    console.warn(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "WARN",
        category: this.category,
        message,
        context: cleanContext,
      })
    );
  }

  /**
   * Log de Erros
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    const cleanContext = context ? this.sanitize(context) : undefined;
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "ERROR",
        category: this.category,
        message,
        errorName: error?.name,
        errorMessage: error?.message,
        errorStack: error?.stack,
        context: cleanContext,
      })
    );
  }

  /**
   * Sanitiza recursivamente objetos, mascarando cartões, CVV e credenciais de APIs
   */
  sanitize(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === "string") {
      return this.sanitizeString(data);
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item));
    }

    if (typeof data === "object") {
      const sanitizedObj: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(data)) {
        if (this.isSensitiveKey(key)) {
          sanitizedObj[key] = this.maskSensitiveValue(key, value);
        } else {
          sanitizedObj[key] = this.sanitize(value);
        }
      }
      return sanitizedObj;
    }

    return data;
  }

  /**
   * Detecta se a chave do objeto contém termos sensíveis
   */
  private isSensitiveKey(key: string): boolean {
    const keyLower = key.toLowerCase();
    const sensitiveTerms = [
      "cardnumber",
      "card_number",
      "number",
      "cvv",
      "cvv2",
      "securitycode",
      "security_code",
      "cvc",
      "password",
      "passwd",
      "apikey",
      "api_key",
      "secretkey",
      "secret_key",
      "secret",
      "token",
      "accesstoken",
      "access_token",
      "authorization",
      "auth",
      "signature",
      "privatekey",
      "private_key",
      "credentials",
      "clientsecret",
      "client_secret",
    ];

    return sensitiveTerms.some((term) => keyLower.includes(term));
  }

  /**
   * Mascara dados sensíveis com base no tipo
   */
  private maskSensitiveValue(key: string, value: any): string {
    if (value === null || value === undefined) {
      return "";
    }
    
    const strValue = String(value);
    const keyLower = key.toLowerCase();

    // 1. Se for CVV (3 ou 4 dígitos)
    if (keyLower.includes("cvv") || keyLower.includes("cvc") || keyLower.includes("security")) {
      return "***";
    }

    // 2. Se for número de cartão (exibe apenas os 4 últimos dígitos)
    if (keyLower.includes("cardnumber") || keyLower.includes("card_number") || (keyLower.includes("number") && strValue.length >= 13 && strValue.length <= 19)) {
      const cleanNum = strValue.replace(/\D/g, "");
      if (cleanNum.length >= 4) {
        return `****-****-****-${cleanNum.slice(-4)}`;
      }
      return "****";
    }

    // 3. Demais chaves sensíveis (secrets/tokens)
    if (strValue.length <= 8) {
      return "****";
    }
    return `${strValue.slice(0, 4)}****${strValue.slice(-4)}`;
  }

  /**
   * Remove números de cartões soltos em strings de texto brutas
   */
  private sanitizeString(str: string): string {
    // Regex simples para capturar números de cartões de 13 a 19 dígitos
    const cardRegex = /\b(?:\d[ -]*?){13,19}\b/g;
    return str.replace(cardRegex, (match) => {
      const clean = match.replace(/\D/g, "");
      if (clean.length >= 4) {
        return `****-****-****-${clean.slice(-4)}`;
      }
      return "****";
    });
  }
}
