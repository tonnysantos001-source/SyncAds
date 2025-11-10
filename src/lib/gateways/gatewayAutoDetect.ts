/**
 * SISTEMA DE AUTO-DETECÇÃO DE GATEWAYS
 *
 * Este módulo detecta automaticamente qual gateway está sendo usado
 * baseado nas credenciais fornecidas. Suporta múltiplos gateways.
 */

interface GatewayCredentials {
  publicKey?: string;
  secretKey?: string;
  apiKey?: string;
  apiSecret?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  [key: string]: any;
}

interface GatewayDetectResult {
  success: boolean;
  gateway?: {
    slug: string;
    name: string;
    type: string;
  };
  message: string;
  capabilities?: {
    pix: boolean;
    credit_card: boolean;
    debit_card: boolean;
    boleto: boolean;
  };
}

interface GatewayAdapter {
  slug: string;
  name: string;
  type: string;
  endpoints: {
    test: string;
    production?: string;
    sandbox?: string;
  };
  authType: 'basic' | 'bearer' | 'apikey' | 'oauth';
  requiredFields: string[];
  detect: (credentials: GatewayCredentials) => Promise<GatewayDetectResult>;
}

/**
 * PAGUE-X (inpagamentos.com)
 * Auth: Basic (publicKey:secretKey)
 */
const paguexAdapter: GatewayAdapter = {
  slug: 'paguex',
  name: 'Pague-X',
  type: 'payment_processor',
  endpoints: {
    test: 'https://api.inpagamentos.com/v1/transactions',
  },
  authType: 'basic',
  requiredFields: ['publicKey', 'secretKey'],
  async detect(credentials: GatewayCredentials): Promise<GatewayDetectResult> {
    const { publicKey, secretKey } = credentials;

    if (!publicKey || !secretKey) {
      return {
        success: false,
        message: 'Pague-X: publicKey e secretKey são obrigatórios',
      };
    }

    try {
      const authString = btoa(`${publicKey}:${secretKey}`);

      const response = await fetch(`${this.endpoints.test}?limit=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        return {
          success: true,
          gateway: {
            slug: this.slug,
            name: this.name,
            type: this.type,
          },
          message: 'Pague-X detectado e credenciais válidas',
          capabilities: {
            pix: true,
            credit_card: true,
            debit_card: true,
            boleto: true,
          },
        };
      }

      return {
        success: false,
        message: `Pague-X: Erro ${response.status}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Pague-X: ${error.message}`,
      };
    }
  },
};

/**
 * MERCADO PAGO
 * Auth: Bearer (accessToken)
 */
const mercadoPagoAdapter: GatewayAdapter = {
  slug: 'mercadopago',
  name: 'Mercado Pago',
  type: 'payment_processor',
  endpoints: {
    test: 'https://api.mercadopago.com/v1/account/settings',
  },
  authType: 'bearer',
  requiredFields: ['accessToken'],
  async detect(credentials: GatewayCredentials): Promise<GatewayDetectResult> {
    const { accessToken } = credentials;

    if (!accessToken) {
      return {
        success: false,
        message: 'Mercado Pago: accessToken é obrigatório',
      };
    }

    try {
      const response = await fetch(this.endpoints.test, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        return {
          success: true,
          gateway: {
            slug: this.slug,
            name: this.name,
            type: this.type,
          },
          message: 'Mercado Pago detectado e credenciais válidas',
          capabilities: {
            pix: true,
            credit_card: true,
            debit_card: false,
            boleto: true,
          },
        };
      }

      return {
        success: false,
        message: `Mercado Pago: Erro ${response.status}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Mercado Pago: ${error.message}`,
      };
    }
  },
};

/**
 * PAGSEGURO
 * Auth: Bearer (token)
 */
const pagSeguroAdapter: GatewayAdapter = {
  slug: 'pagseguro',
  name: 'PagSeguro',
  type: 'payment_processor',
  endpoints: {
    test: 'https://api.pagseguro.com/charges',
  },
  authType: 'bearer',
  requiredFields: ['apiKey'],
  async detect(credentials: GatewayCredentials): Promise<GatewayDetectResult> {
    const { apiKey } = credentials;

    if (!apiKey) {
      return {
        success: false,
        message: 'PagSeguro: apiKey é obrigatório',
      };
    }

    try {
      const response = await fetch(this.endpoints.test, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok || response.status === 400) {
        // 400 é esperado sem parâmetros, mas confirma que autenticou
        return {
          success: true,
          gateway: {
            slug: this.slug,
            name: this.name,
            type: this.type,
          },
          message: 'PagSeguro detectado e credenciais válidas',
          capabilities: {
            pix: true,
            credit_card: true,
            debit_card: true,
            boleto: true,
          },
        };
      }

      return {
        success: false,
        message: `PagSeguro: Erro ${response.status}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `PagSeguro: ${error.message}`,
      };
    }
  },
};

/**
 * STRIPE
 * Auth: Bearer (secret key)
 */
const stripeAdapter: GatewayAdapter = {
  slug: 'stripe',
  name: 'Stripe',
  type: 'payment_processor',
  endpoints: {
    test: 'https://api.stripe.com/v1/balance',
  },
  authType: 'bearer',
  requiredFields: ['secretKey'],
  async detect(credentials: GatewayCredentials): Promise<GatewayDetectResult> {
    const { secretKey } = credentials;

    if (!secretKey) {
      return {
        success: false,
        message: 'Stripe: secretKey é obrigatório',
      };
    }

    try {
      const response = await fetch(this.endpoints.test, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        return {
          success: true,
          gateway: {
            slug: this.slug,
            name: this.name,
            type: this.type,
          },
          message: 'Stripe detectado e credenciais válidas',
          capabilities: {
            pix: false,
            credit_card: true,
            debit_card: true,
            boleto: false,
          },
        };
      }

      return {
        success: false,
        message: `Stripe: Erro ${response.status}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Stripe: ${error.message}`,
      };
    }
  },
};

/**
 * ASAAS
 * Auth: API Key
 */
const asaasAdapter: GatewayAdapter = {
  slug: 'asaas',
  name: 'Asaas',
  type: 'payment_processor',
  endpoints: {
    test: 'https://api.asaas.com/v3/customers',
  },
  authType: 'apikey',
  requiredFields: ['apiKey'],
  async detect(credentials: GatewayCredentials): Promise<GatewayDetectResult> {
    const { apiKey } = credentials;

    if (!apiKey) {
      return {
        success: false,
        message: 'Asaas: apiKey é obrigatório',
      };
    }

    try {
      const response = await fetch(`${this.endpoints.test}?limit=1`, {
        method: 'GET',
        headers: {
          'access_token': apiKey,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        return {
          success: true,
          gateway: {
            slug: this.slug,
            name: this.name,
            type: this.type,
          },
          message: 'Asaas detectado e credenciais válidas',
          capabilities: {
            pix: true,
            credit_card: true,
            debit_card: false,
            boleto: true,
          },
        };
      }

      return {
        success: false,
        message: `Asaas: Erro ${response.status}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Asaas: ${error.message}`,
      };
    }
  },
};

/**
 * Lista de todos os adapters suportados
 */
const GATEWAY_ADAPTERS: GatewayAdapter[] = [
  paguexAdapter,
  mercadoPagoAdapter,
  pagSeguroAdapter,
  stripeAdapter,
  asaasAdapter,
];

/**
 * FUNÇÃO PRINCIPAL: Auto-detecta qual gateway está sendo usado
 *
 * Testa as credenciais contra todos os gateways suportados
 * e retorna o primeiro que autenticar com sucesso.
 */
export async function autoDetectGateway(
  credentials: GatewayCredentials
): Promise<GatewayDetectResult> {
  console.log('[Auto-Detect] Iniciando detecção de gateway...');

  // Normalizar campos de credenciais
  const normalizedCreds: GatewayCredentials = {
    publicKey: credentials.publicKey || credentials.PUBLIC_KEY || credentials.public_key,
    secretKey: credentials.secretKey || credentials.SECRET_KEY || credentials.secret_key,
    apiKey: credentials.apiKey || credentials.API_KEY || credentials.api_key,
    apiSecret: credentials.apiSecret || credentials.API_SECRET || credentials.api_secret,
    accessToken: credentials.accessToken || credentials.ACCESS_TOKEN || credentials.access_token,
    clientId: credentials.clientId || credentials.CLIENT_ID || credentials.client_id,
    clientSecret: credentials.clientSecret || credentials.CLIENT_SECRET || credentials.client_secret,
  };

  console.log('[Auto-Detect] Credenciais normalizadas:', Object.keys(normalizedCreds).filter(k => normalizedCreds[k]));

  // Testar cada gateway
  for (const adapter of GATEWAY_ADAPTERS) {
    console.log(`[Auto-Detect] Testando ${adapter.name}...`);

    try {
      const result = await adapter.detect(normalizedCreds);

      if (result.success) {
        console.log(`[Auto-Detect] ✅ ${adapter.name} detectado!`);
        return result;
      }

      console.log(`[Auto-Detect] ❌ ${adapter.name}: ${result.message}`);
    } catch (error: any) {
      console.error(`[Auto-Detect] Erro ao testar ${adapter.name}:`, error.message);
    }
  }

  // Nenhum gateway detectado
  return {
    success: false,
    message: 'Nenhum gateway compatível detectado. Verifique suas credenciais.',
  };
}

/**
 * Testa um gateway específico
 */
export async function testSpecificGateway(
  gatewaySlug: string,
  credentials: GatewayCredentials
): Promise<GatewayDetectResult> {
  const adapter = GATEWAY_ADAPTERS.find(a => a.slug === gatewaySlug);

  if (!adapter) {
    return {
      success: false,
      message: `Gateway '${gatewaySlug}' não suportado`,
    };
  }

  return adapter.detect(credentials);
}

/**
 * Retorna lista de gateways suportados
 */
export function getSupportedGateways() {
  return GATEWAY_ADAPTERS.map(adapter => ({
    slug: adapter.slug,
    name: adapter.name,
    type: adapter.type,
    authType: adapter.authType,
    requiredFields: adapter.requiredFields,
  }));
}

/**
 * Valida se as credenciais possuem os campos mínimos
 */
export function validateCredentials(credentials: GatewayCredentials): {
  valid: boolean;
  message: string;
} {
  const hasAnyCredential =
    credentials.publicKey ||
    credentials.secretKey ||
    credentials.apiKey ||
    credentials.accessToken ||
    credentials.clientId;

  if (!hasAnyCredential) {
    return {
      valid: false,
      message: 'Nenhuma credencial fornecida',
    };
  }

  return {
    valid: true,
    message: 'Credenciais fornecidas',
  };
}
