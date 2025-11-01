// ============================================
// LISTA COMPLETA DE GATEWAYS DE PAGAMENTO
// Baseado na Adoorei e principais do mercado
// ============================================

export interface GatewayConfig {
  id: string;
  name: string;
  slug: string;
  logo: string; // URL da logo
  type: "nacional" | "global" | "both";
  status: "active" | "inactive";
  description: string;
  features: string[];
  paymentMethods: (
    | "credit_card"
    | "debit_card"
    | "pix"
    | "boleto"
    | "wallet"
  )[];
  configFields: {
    name: string;
    label: string;
    type: "text" | "password" | "select" | "checkbox";
    required: boolean;
    placeholder?: string;
    options?: { label: string; value: string }[];
  }[];
  apiDocs: string;
  testMode: boolean;
}

// ============================================
// GATEWAYS BRASILEIROS (MAIS POPULARES)
// ============================================

export const gatewaysList: GatewayConfig[] = [
  // 1. MERCADO PAGO
  {
    id: "mercadopago",
    name: "Mercado Pago",
    slug: "mercadopago",
    logo: "https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/5.21.22/mercadopago/logo__large_plus.png",
    type: "both",
    status: "active",
    description: "Gateway de pagamento líder na América Latina",
    features: [
      "Pix",
      "Cartão de Crédito",
      "Boleto",
      "QR Code",
      "Link de Pagamento",
    ],
    paymentMethods: ["credit_card", "debit_card", "pix", "boleto"],
    configFields: [
      {
        name: "publicKey",
        label: "Public Key",
        type: "text",
        required: true,
        placeholder: "APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      },
      {
        name: "accessToken",
        label: "Access Token",
        type: "password",
        required: true,
        placeholder: "APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      },
      {
        name: "testMode",
        label: "Modo de Teste",
        type: "checkbox",
        required: false,
      },
    ],
    apiDocs: "https://www.mercadopago.com.br/developers/pt/docs",
    testMode: true,
  },

  // 2. STRIPE
  {
    id: "stripe",
    name: "Stripe",
    slug: "stripe",
    logo: "https://images.ctfassets.net/fzn2n1nzq965/HTTOloNPhisV9P4hlMPNA/cacf1bb88b9fc492dfad34378d844280/Stripe_icon_-_square.svg",
    type: "global",
    status: "active",
    description: "Gateway de pagamento global mais usado no mundo",
    features: ["Cartão de Crédito", "Pix", "Boleto", "Apple Pay", "Google Pay"],
    paymentMethods: ["credit_card", "debit_card", "pix", "boleto"],
    configFields: [
      {
        name: "publishableKey",
        label: "Publishable Key",
        type: "text",
        required: true,
        placeholder: "pk_live_xxxxxxxxxxxxxxxxxxxx",
      },
      {
        name: "secretKey",
        label: "Secret Key",
        type: "password",
        required: true,
        placeholder: "sk_live_xxxxxxxxxxxxxxxxxxxx",
      },
      {
        name: "webhookSecret",
        label: "Webhook Secret",
        type: "password",
        required: false,
        placeholder: "whsec_xxxxxxxxxxxxxxxxxxxx",
      },
      {
        name: "testMode",
        label: "Modo de Teste",
        type: "checkbox",
        required: false,
      },
    ],
    apiDocs: "https://stripe.com/docs",
    testMode: true,
  },

  // 3. PAGSEGURO
  {
    id: "pagseguro",
    name: "PagSeguro",
    slug: "pagseguro",
    logo: "https://assets.pagseguro.com.br/ps-public-assets/brand/logo-pagseguro.svg",
    type: "nacional",
    status: "active",
    description: "Solução completa de pagamentos online do Brasil",
    features: [
      "Pix",
      "Cartão",
      "Boleto",
      "Débito Online",
      "Split de Pagamento",
    ],
    paymentMethods: ["credit_card", "debit_card", "pix", "boleto"],
    configFields: [
      {
        name: "email",
        label: "Email da Conta",
        type: "text",
        required: true,
        placeholder: "seu-email@exemplo.com",
      },
      {
        name: "token",
        label: "Token",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "environment",
        label: "Ambiente",
        type: "select",
        required: true,
        options: [
          { label: "Produção", value: "production" },
          { label: "Sandbox", value: "sandbox" },
        ],
      },
    ],
    apiDocs: "https://dev.pagseguro.uol.com.br/reference/api-reference",
    testMode: true,
  },

  // 4. ASAAS
  {
    id: "asaas",
    name: "Asaas",
    slug: "asaas",
    logo: "https://www.asaas.com/images/logo-asaas.svg",
    type: "nacional",
    status: "active",
    description: "Plataforma completa de cobranças e pagamentos",
    features: [
      "Pix",
      "Boleto",
      "Cartão de Crédito",
      "Link de Pagamento",
      "Recorrência",
    ],
    paymentMethods: ["credit_card", "pix", "boleto"],
    configFields: [
      {
        name: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
        placeholder: "$aact_YTU5YTE0M2M2N2I4MTliNzk0YTI5N2U5MzY",
      },
      {
        name: "environment",
        label: "Ambiente",
        type: "select",
        required: true,
        options: [
          { label: "Produção", value: "production" },
          { label: "Sandbox", value: "sandbox" },
        ],
      },
    ],
    apiDocs: "https://docs.asaas.com/",
    testMode: true,
  },

  // 5. PAGAR.ME
  {
    id: "pagarme",
    name: "Pagar.me",
    slug: "pagarme",
    logo: "https://avatars.githubusercontent.com/u/3846050?s=200&v=4",
    type: "nacional",
    status: "active",
    description: "Gateway brasileiro com foco em desenvolvedores",
    features: ["Pix", "Cartão", "Boleto", "Split", "Antifraude"],
    paymentMethods: ["credit_card", "debit_card", "pix", "boleto"],
    configFields: [
      {
        name: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
        placeholder: "sk_test_xxxxxxxxxxxxxxxxxxxx",
      },
      {
        name: "encryptionKey",
        label: "Encryption Key",
        type: "password",
        required: true,
        placeholder: "ek_test_xxxxxxxxxxxxxxxxxxxx",
      },
    ],
    apiDocs: "https://docs.pagar.me/",
    testMode: true,
  },

  // 6. CIELO
  {
    id: "cielo",
    name: "Cielo",
    slug: "cielo",
    logo: "https://www.cielo.com.br/assets/images/logo-cielo.svg",
    type: "nacional",
    status: "active",
    description: "Maior adquirente do Brasil",
    features: [
      "Cartão de Crédito",
      "Cartão de Débito",
      "Pix",
      "Link de Pagamento",
    ],
    paymentMethods: ["credit_card", "debit_card", "pix"],
    configFields: [
      {
        name: "merchantId",
        label: "Merchant ID",
        type: "text",
        required: true,
        placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      },
      {
        name: "merchantKey",
        label: "Merchant Key",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "environment",
        label: "Ambiente",
        type: "select",
        required: true,
        options: [
          { label: "Produção", value: "production" },
          { label: "Sandbox", value: "sandbox" },
        ],
      },
    ],
    apiDocs: "https://developercielo.github.io/manual/cielo-ecommerce",
    testMode: true,
  },

  // 7. PAYPAL
  {
    id: "paypal",
    name: "PayPal",
    slug: "paypal",
    logo: "https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg",
    type: "global",
    status: "active",
    description: "Gateway de pagamento global mais conhecido",
    features: [
      "Cartão de Crédito",
      "Carteira Digital",
      "PayPal Credit",
      "Venmo",
    ],
    paymentMethods: ["credit_card", "wallet"],
    configFields: [
      {
        name: "clientId",
        label: "Client ID",
        type: "text",
        required: true,
        placeholder: "AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxX",
      },
      {
        name: "clientSecret",
        label: "Client Secret",
        type: "password",
        required: true,
        placeholder: "ExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxX",
      },
      {
        name: "environment",
        label: "Ambiente",
        type: "select",
        required: true,
        options: [
          { label: "Live", value: "production" },
          { label: "Sandbox", value: "sandbox" },
        ],
      },
    ],
    apiDocs: "https://developer.paypal.com/docs/api/overview/",
    testMode: true,
  },

  // 8. PICPAY
  {
    id: "picpay",
    name: "PicPay",
    slug: "picpay",
    logo: "https://logodownload.org/wp-content/uploads/2020/02/picpay-logo-0.png",
    type: "nacional",
    status: "active",
    description: "Carteira digital brasileira",
    features: ["Carteira Digital", "QR Code", "Pix", "Cashback"],
    paymentMethods: ["wallet", "pix"],
    configFields: [
      {
        name: "picpayToken",
        label: "PicPay Token",
        type: "password",
        required: true,
        placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      },
      {
        name: "sellerToken",
        label: "Seller Token",
        type: "password",
        required: true,
        placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      },
    ],
    apiDocs: "https://ecommerce.picpay.com/doc/",
    testMode: true,
  },

  // 9. REDE
  {
    id: "rede",
    name: "Rede",
    slug: "rede",
    logo: "https://www.userede.com.br/Content/images/logo-rede.svg",
    type: "nacional",
    status: "active",
    description: "Adquirente do Itaú",
    features: ["Cartão de Crédito", "Cartão de Débito", "Pix"],
    paymentMethods: ["credit_card", "debit_card", "pix"],
    configFields: [
      {
        name: "pv",
        label: "PV (Número do estabelecimento)",
        type: "text",
        required: true,
        placeholder: "1234567890",
      },
      {
        name: "token",
        label: "Token",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "environment",
        label: "Ambiente",
        type: "select",
        required: true,
        options: [
          { label: "Produção", value: "production" },
          { label: "Homologação", value: "sandbox" },
        ],
      },
    ],
    apiDocs: "https://www.userede.com.br/desenvolvedores",
    testMode: true,
  },

  // 10. GETNET
  {
    id: "getnet",
    name: "GetNet",
    slug: "getnet",
    logo: "https://site.getnet.com.br/wp-content/themes/getnet/assets/images/logo-getnet.svg",
    type: "nacional",
    status: "active",
    description: "Adquirente do Santander",
    features: ["Cartão de Crédito", "Cartão de Débito", "Pix", "Boleto"],
    paymentMethods: ["credit_card", "debit_card", "pix", "boleto"],
    configFields: [
      {
        name: "sellerId",
        label: "Seller ID",
        type: "text",
        required: true,
        placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      },
      {
        name: "clientId",
        label: "Client ID",
        type: "text",
        required: true,
        placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      },
      {
        name: "clientSecret",
        label: "Client Secret",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "environment",
        label: "Ambiente",
        type: "select",
        required: true,
        options: [
          { label: "Produção", value: "production" },
          { label: "Homologação", value: "sandbox" },
        ],
      },
    ],
    apiDocs: "https://developers.getnet.com.br/api",
    testMode: true,
  },

  // 11. STONE
  {
    id: "stone",
    name: "Stone",
    slug: "stone",
    logo: "https://www.stone.com.br/wp-content/themes/stone/images/logo-stone.svg",
    type: "nacional",
    status: "active",
    description: "Adquirente e banking digital",
    features: ["Cartão de Crédito", "Cartão de Débito", "Pix"],
    paymentMethods: ["credit_card", "debit_card", "pix"],
    configFields: [
      {
        name: "stoneCode",
        label: "Stone Code",
        type: "text",
        required: true,
        placeholder: "123456789",
      },
      {
        name: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
    ],
    apiDocs: "https://docs.stone.com.br/",
    testMode: true,
  },

  // 12. IUGU
  {
    id: "iugu",
    name: "Iugu",
    slug: "iugu",
    logo: "https://iugu.com/assets/images/logo.svg",
    type: "nacional",
    status: "active",
    description: "Solução completa de pagamentos recorrentes",
    features: ["Cartão de Crédito", "Boleto", "Pix", "Assinaturas", "Split"],
    paymentMethods: ["credit_card", "boleto", "pix"],
    configFields: [
      {
        name: "apiToken",
        label: "API Token",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "accountId",
        label: "Account ID",
        type: "text",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "testMode",
        label: "Modo de Teste",
        type: "checkbox",
        required: false,
      },
    ],
    apiDocs: "https://dev.iugu.com/reference",
    testMode: true,
  },

  // 13. VINDI
  {
    id: "vindi",
    name: "Vindi",
    slug: "vindi",
    logo: "https://vindi.com.br/wp-content/uploads/2021/10/logo-vindi.svg",
    type: "nacional",
    status: "active",
    description: "Plataforma de pagamentos recorrentes",
    features: ["Cartão", "Boleto", "Pix", "Assinaturas", "Gestão de cobranças"],
    paymentMethods: ["credit_card", "boleto", "pix"],
    configFields: [
      {
        name: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
    ],
    apiDocs: "https://vindi.github.io/api-docs/dist/",
    testMode: true,
  },

  // 14. WIRECARD (MOIP)
  {
    id: "wirecard",
    name: "Wirecard (Moip)",
    slug: "wirecard",
    logo: "https://logodownload.org/wp-content/uploads/2020/11/moip-logo.png",
    type: "nacional",
    status: "active",
    description: "Solução completa de pagamentos online",
    features: ["Cartão", "Boleto", "Débito Online", "Carteira Digital"],
    paymentMethods: ["credit_card", "debit_card", "boleto", "wallet"],
    configFields: [
      {
        name: "token",
        label: "Token",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "key",
        label: "Key",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "environment",
        label: "Ambiente",
        type: "select",
        required: true,
        options: [
          { label: "Produção", value: "production" },
          { label: "Sandbox", value: "sandbox" },
        ],
      },
    ],
    apiDocs: "https://dev.moip.com.br/reference",
    testMode: true,
  },

  // 15. SAFETYPAY
  {
    id: "safetypay",
    name: "SafetyPay",
    slug: "safetypay",
    logo: "https://www.safetypay.com/images/logo-safetypay.svg",
    type: "global",
    status: "active",
    description: "Solução de pagamento online segura para América Latina",
    features: ["Transferência Bancária", "Cash", "Wallet"],
    paymentMethods: ["debit_card", "wallet"],
    configFields: [
      {
        name: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "signatureKey",
        label: "Signature Key",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
    ],
    apiDocs: "https://developer.safetypay.com/",
    testMode: true,
  },

  // 16. ALLUS
  {
    id: "allus",
    name: "Allus",
    slug: "allus",
    logo: "https://cdn-icons-png.flaticon.com/512/9374/9374276.png",
    type: "nacional",
    status: "active",
    description: "Gateway de pagamento brasileiro",
    features: ["Pix", "Cartão", "Boleto"],
    paymentMethods: ["credit_card", "pix", "boleto"],
    configFields: [
      {
        name: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "merchantId",
        label: "Merchant ID",
        type: "text",
        required: true,
        placeholder: "merchant_xxx",
      },
    ],
    apiDocs: "https://allus.com.br/docs",
    testMode: true,
  },

  // 17. ALPA
  {
    id: "alpa",
    name: "Alpa",
    slug: "alpa",
    logo: "https://cdn-icons-png.flaticon.com/512/5968/5968534.png",
    type: "both",
    status: "active",
    description: "Solução de pagamentos nacional e internacional",
    features: ["Pix", "Cartão", "Transferência"],
    paymentMethods: ["credit_card", "debit_card", "pix"],
    configFields: [
      {
        name: "clientId",
        label: "Client ID",
        type: "text",
        required: true,
        placeholder: "client_xxx",
      },
      {
        name: "clientSecret",
        label: "Client Secret",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
    ],
    apiDocs: "https://alpa.com/api-docs",
    testMode: true,
  },

  // 18. ALPHACASH
  {
    id: "alphacash",
    name: "Alphacash",
    slug: "alphacash",
    logo: "https://cdn-icons-png.flaticon.com/512/3135/3135706.png",
    type: "both",
    status: "active",
    description: "Gateway global de pagamentos",
    features: ["Cartão", "Crypto", "Wire Transfer"],
    paymentMethods: ["credit_card", "debit_card", "wallet"],
    configFields: [
      {
        name: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "secretKey",
        label: "Secret Key",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
    ],
    apiDocs: "https://alphacash.com/developers",
    testMode: true,
  },

  // 19. ANUBISPAY
  {
    id: "anubispay",
    name: "AnubisPay",
    slug: "anubispay",
    logo: "https://cdn-icons-png.flaticon.com/512/3062/3062634.png",
    type: "both",
    status: "active",
    description: "Pagamentos nacionais e globais",
    features: ["Pix", "Cartão", "Boleto", "Wire Transfer"],
    paymentMethods: ["credit_card", "debit_card", "pix", "boleto"],
    configFields: [
      {
        name: "merchantId",
        label: "Merchant ID",
        type: "text",
        required: true,
        placeholder: "merchant_xxx",
      },
      {
        name: "apiToken",
        label: "API Token",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
    ],
    apiDocs: "https://anubispay.com/docs",
    testMode: true,
  },

  // 20. APPMAX
  {
    id: "appmax",
    name: "Appmax",
    slug: "appmax",
    logo: "https://cdn-icons-png.flaticon.com/512/5968/5968292.png",
    type: "nacional",
    status: "active",
    description: "CRM e gateway de pagamentos",
    features: ["Pix", "Cartão", "Boleto", "CRM Integrado"],
    paymentMethods: ["credit_card", "pix", "boleto"],
    configFields: [
      {
        name: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "accountId",
        label: "Account ID",
        type: "text",
        required: true,
        placeholder: "account_xxx",
      },
    ],
    apiDocs: "https://appmax.com.br/api",
    testMode: true,
  },

  // 21. ASSET
  {
    id: "asset",
    name: "Asset",
    slug: "asset",
    logo: "https://cdn-icons-png.flaticon.com/512/2936/2936886.png",
    type: "both",
    status: "active",
    description: "Processamento de pagamentos global",
    features: ["Cartão", "Transferência", "Crypto"],
    paymentMethods: ["credit_card", "debit_card", "wallet"],
    configFields: [
      {
        name: "publicKey",
        label: "Public Key",
        type: "text",
        required: true,
        placeholder: "pk_xxx",
      },
      {
        name: "privateKey",
        label: "Private Key",
        type: "password",
        required: true,
        placeholder: "sk_xxx",
      },
    ],
    apiDocs: "https://asset.com/api-reference",
    testMode: true,
  },

  // 22. ASTON PAY
  {
    id: "astonpay",
    name: "Aston Pay",
    slug: "astonpay",
    logo: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
    type: "both",
    status: "active",
    description: "Gateway de pagamentos internacional",
    features: ["Cartão", "Wallet", "Bank Transfer"],
    paymentMethods: ["credit_card", "debit_card", "wallet"],
    configFields: [
      {
        name: "merchantCode",
        label: "Merchant Code",
        type: "text",
        required: true,
        placeholder: "MC-XXXXX",
      },
      {
        name: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
    ],
    apiDocs: "https://astonpay.com/developers",
    testMode: true,
  },

  // 23. ATLAS PAY
  {
    id: "atlaspay",
    name: "Atlas Pay",
    slug: "atlaspay",
    logo: "https://cdn-icons-png.flaticon.com/512/2936/2936647.png",
    type: "both",
    status: "active",
    description: "Processamento global de pagamentos",
    features: ["Cartão", "Pix", "Wire Transfer"],
    paymentMethods: ["credit_card", "debit_card", "pix"],
    configFields: [
      {
        name: "apiId",
        label: "API ID",
        type: "text",
        required: true,
        placeholder: "api_xxx",
      },
      {
        name: "apiSecret",
        label: "API Secret",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
    ],
    apiDocs: "https://atlaspay.com/docs",
    testMode: true,
  },

  // 24. AXELPAY
  {
    id: "axelpay",
    name: "Axelpay",
    slug: "axelpay",
    logo: "https://cdn-icons-png.flaticon.com/512/891/891462.png",
    type: "nacional",
    status: "active",
    description: "Gateway brasileiro de pagamentos",
    features: ["Pix", "Cartão", "Boleto"],
    paymentMethods: ["credit_card", "pix", "boleto"],
    configFields: [
      {
        name: "token",
        label: "Token",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "storeId",
        label: "Store ID",
        type: "text",
        required: true,
        placeholder: "store_xxx",
      },
    ],
    apiDocs: "https://axelpay.com.br/api",
    testMode: true,
  },

  // 25. AXION PAY
  {
    id: "axionpay",
    name: "Axion Pay",
    slug: "axionpay",
    logo: "https://cdn-icons-png.flaticon.com/512/5968/5968350.png",
    type: "both",
    status: "active",
    description: "Solução de pagamentos versátil",
    features: ["Cartão", "Pix", "Boleto", "Crypto"],
    paymentMethods: ["credit_card", "debit_card", "pix", "boleto"],
    configFields: [
      {
        name: "clientId",
        label: "Client ID",
        type: "text",
        required: true,
        placeholder: "client_xxx",
      },
      {
        name: "clientSecret",
        label: "Client Secret",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
    ],
    apiDocs: "https://axionpay.com/developers",
    testMode: true,
  },

  // 26. AZCEND
  {
    id: "azcend",
    name: "Azcend",
    slug: "azcend",
    logo: "https://cdn-icons-png.flaticon.com/512/3135/3135789.png",
    type: "both",
    status: "active",
    description: "Plataforma de pagamentos avançada",
    features: ["Cartão", "Pix", "Wallet", "Crypto"],
    paymentMethods: ["credit_card", "debit_card", "pix", "wallet"],
    configFields: [
      {
        name: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "merchantId",
        label: "Merchant ID",
        type: "text",
        required: true,
        placeholder: "merchant_xxx",
      },
    ],
    apiDocs: "https://azcend.com/api-docs",
    testMode: true,
  },

  // 27. BESTFY
  {
    id: "bestfy",
    name: "Bestfy",
    slug: "bestfy",
    logo: "https://cdn-icons-png.flaticon.com/512/2936/2936719.png",
    type: "both",
    status: "active",
    description: "Gateway de pagamentos moderno",
    features: ["Cartão", "Pix", "Boleto", "Link de Pagamento"],
    paymentMethods: ["credit_card", "debit_card", "pix", "boleto"],
    configFields: [
      {
        name: "token",
        label: "Token",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "environment",
        label: "Ambiente",
        type: "select",
        required: true,
        options: [
          { label: "Produção", value: "production" },
          { label: "Sandbox", value: "sandbox" },
        ],
      },
    ],
    apiDocs: "https://bestfy.com/developers",
    testMode: true,
  },

  // 28. BLACKCAT
  {
    id: "blackcat",
    name: "Blackcat",
    slug: "blackcat",
    logo: "https://cdn-icons-png.flaticon.com/512/2138/2138440.png",
    type: "both",
    status: "active",
    description: "Processamento seguro de pagamentos",
    features: ["Cartão", "Wallet", "Crypto"],
    paymentMethods: ["credit_card", "debit_card", "wallet"],
    configFields: [
      {
        name: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "secretKey",
        label: "Secret Key",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
    ],
    apiDocs: "https://blackcat.io/docs",
    testMode: true,
  },

  // 29. BRAVOS PAY
  {
    id: "bravospay",
    name: "Bravos Pay",
    slug: "bravospay",
    logo: "https://cdn-icons-png.flaticon.com/512/5968/5968204.png",
    type: "nacional",
    status: "active",
    description: "Gateway brasileiro completo",
    features: ["Pix", "Cartão", "Boleto"],
    paymentMethods: ["credit_card", "pix", "boleto"],
    configFields: [
      {
        name: "merchantId",
        label: "Merchant ID",
        type: "text",
        required: true,
        placeholder: "merchant_xxx",
      },
      {
        name: "apiToken",
        label: "API Token",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
    ],
    apiDocs: "https://bravospay.com.br/api",
    testMode: true,
  },

  // 30. BRAZA PAY
  {
    id: "brazapay",
    name: "Braza Pay",
    slug: "brazapay",
    logo: "https://cdn-icons-png.flaticon.com/512/5968/5968292.png",
    type: "both",
    status: "active",
    description: "Pagamentos Brasil e exterior",
    features: ["Pix", "Cartão", "Boleto", "International"],
    paymentMethods: ["credit_card", "debit_card", "pix", "boleto"],
    configFields: [
      {
        name: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "accountId",
        label: "Account ID",
        type: "text",
        required: true,
        placeholder: "account_xxx",
      },
    ],
    apiDocs: "https://brazapay.com/docs",
    testMode: true,
  },

  // 31. BYNET
  {
    id: "bynet",
    name: "Bynet",
    slug: "bynet",
    logo: "https://cdn-icons-png.flaticon.com/512/2936/2936886.png",
    type: "both",
    status: "active",
    description: "Solução completa de pagamentos",
    features: ["Cartão", "Pix", "Boleto", "Link"],
    paymentMethods: ["credit_card", "debit_card", "pix", "boleto"],
    configFields: [
      {
        name: "clientId",
        label: "Client ID",
        type: "text",
        required: true,
        placeholder: "client_xxx",
      },
      {
        name: "clientSecret",
        label: "Client Secret",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
    ],
    apiDocs: "https://bynet.com/api-reference",
    testMode: true,
  },

  // 32. CARTHERO
  {
    id: "carthero",
    name: "Carthero",
    slug: "carthero",
    logo: "https://cdn-icons-png.flaticon.com/512/3135/3135706.png",
    type: "nacional",
    status: "active",
    description: "Gateway focado em cartões",
    features: ["Cartão de Crédito", "Cartão de Débito", "Parcelamento"],
    paymentMethods: ["credit_card", "debit_card"],
    configFields: [
      {
        name: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "storeId",
        label: "Store ID",
        type: "text",
        required: true,
        placeholder: "store_xxx",
      },
    ],
    apiDocs: "https://carthero.com.br/docs",
    testMode: true,
  },

  // 33. CENTURION PAY
  {
    id: "centurionpay",
    name: "Centurion Pay",
    slug: "centurionpay",
    logo: "https://cdn-icons-png.flaticon.com/512/2936/2936647.png",
    type: "nacional",
    status: "active",
    description: "Gateway de pagamentos premium",
    features: ["Pix", "Cartão", "Boleto"],
    paymentMethods: ["credit_card", "pix", "boleto"],
    configFields: [
      {
        name: "merchantId",
        label: "Merchant ID",
        type: "text",
        required: true,
        placeholder: "merchant_xxx",
      },
      {
        name: "apiToken",
        label: "API Token",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
    ],
    apiDocs: "https://centurionpay.com/api",
    testMode: true,
  },

  // 34. CREDPAGO
  {
    id: "credpago",
    name: "Credpago",
    slug: "credpago",
    logo: "https://cdn-icons-png.flaticon.com/512/891/891462.png",
    type: "nacional",
    status: "active",
    description: "Crédito e pagamentos online",
    features: ["Pix", "Cartão", "Boleto", "Crédito Digital"],
    paymentMethods: ["credit_card", "pix", "boleto"],
    configFields: [
      {
        name: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "partnerId",
        label: "Partner ID",
        type: "text",
        required: true,
        placeholder: "partner_xxx",
      },
    ],
    apiDocs: "https://credpago.com.br/developers",
    testMode: true,
  },

  // 35. CREDWAVE
  {
    id: "credwave",
    name: "Credwave",
    slug: "credwave",
    logo: "https://cdn-icons-png.flaticon.com/512/5968/5968350.png",
    type: "both",
    status: "active",
    description: "Pagamentos e crédito para e-commerce",
    features: ["Pix", "Cartão", "Boleto", "Financiamento"],
    paymentMethods: ["credit_card", "pix", "boleto"],
    configFields: [
      {
        name: "token",
        label: "Token",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "sellerId",
        label: "Seller ID",
        type: "text",
        required: true,
        placeholder: "seller_xxx",
      },
    ],
    apiDocs: "https://credwave.com.br/api-docs",
    testMode: true,
  },

  // 36. CÚPULA HUB
  {
    id: "cupulahub",
    name: "Cúpula Hub",
    slug: "cupulahub",
    logo: "https://cdn-icons-png.flaticon.com/512/3062/3062646.png",
    type: "both",
    status: "active",
    description: "Hub de pagamentos e serviços financeiros",
    features: ["Pix", "Cartão", "Boleto", "Hub Financeiro"],
    paymentMethods: ["credit_card", "debit_card", "pix", "boleto"],
    configFields: [
      {
        name: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "hubId",
        label: "Hub ID",
        type: "text",
        required: true,
        placeholder: "hub_xxx",
      },
    ],
    apiDocs: "https://cupulahub.com/api",
    testMode: true,
  },

  // 37. CYBERHUB
  {
    id: "cyberhub",
    name: "Cyberhub",
    slug: "cyberhub",
    logo: "https://cdn-icons-png.flaticon.com/512/2103/2103633.png",
    type: "both",
    status: "active",
    description: "Plataforma de pagamentos digitais",
    features: ["Pix", "Cartão", "Crypto", "Digital Wallet"],
    paymentMethods: ["credit_card", "debit_card", "pix", "wallet"],
    configFields: [
      {
        name: "clientId",
        label: "Client ID",
        type: "text",
        required: true,
        placeholder: "client_xxx",
      },
      {
        name: "clientSecret",
        label: "Client Secret",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
    ],
    apiDocs: "https://cyberhub.io/developers",
    testMode: true,
  },

  // 38. CODIGUZ HUB
  {
    id: "codiguzhub",
    name: "Codiguz Hub",
    slug: "codiguzhub",
    logo: "https://cdn-icons-png.flaticon.com/512/2103/2103658.png",
    type: "both",
    status: "active",
    description: "Hub de integração de pagamentos",
    features: ["Pix", "Cartão", "Boleto", "API Integrada"],
    paymentMethods: ["credit_card", "pix", "boleto"],
    configFields: [
      {
        name: "apiToken",
        label: "API Token",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "merchantCode",
        label: "Merchant Code",
        type: "text",
        required: true,
        placeholder: "MC-XXXXX",
      },
    ],
    apiDocs: "https://codiguzhub.com/docs",
    testMode: true,
  },

  // 39. DIASMARKETPLACE
  {
    id: "diasmarketplace",
    name: "Diasmarketplace",
    slug: "diasmarketplace",
    logo: "https://cdn-icons-png.flaticon.com/512/5968/5968204.png",
    type: "nacional",
    status: "active",
    description: "Marketplace e gateway de pagamentos",
    features: ["Pix", "Cartão", "Boleto", "Marketplace"],
    paymentMethods: ["credit_card", "pix", "boleto"],
    configFields: [
      {
        name: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "storeId",
        label: "Store ID",
        type: "text",
        required: true,
        placeholder: "store_xxx",
      },
    ],
    apiDocs: "https://diasmarketplace.com.br/api",
    testMode: true,
  },

  // 40. DOM PAGAMENTOS
  {
    id: "dompagamentos",
    name: "Dom Pagamentos",
    slug: "dompagamentos",
    logo: "https://cdn-icons-png.flaticon.com/512/2936/2936886.png",
    type: "nacional",
    status: "active",
    description: "Solução completa de pagamentos online",
    features: ["Pix", "Cartão", "Boleto", "Link de Pagamento"],
    paymentMethods: ["credit_card", "pix", "boleto"],
    configFields: [
      {
        name: "token",
        label: "Token",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "merchantId",
        label: "Merchant ID",
        type: "text",
        required: true,
        placeholder: "merchant_xxx",
      },
    ],
    apiDocs: "https://dompagamentos.com.br/developers",
    testMode: true,
  },

  // 41. DORAPAG
  {
    id: "dorapag",
    name: "Dorapag",
    slug: "dorapag",
    logo: "https://cdn-icons-png.flaticon.com/512/3135/3135789.png",
    type: "both",
    status: "active",
    description: "Gateway de pagamentos nacional e internacional",
    features: ["Pix", "Cartão", "Boleto", "Wire Transfer"],
    paymentMethods: ["credit_card", "debit_card", "pix", "boleto"],
    configFields: [
      {
        name: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "secretKey",
        label: "Secret Key",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
    ],
    apiDocs: "https://dorapag.com/api-docs",
    testMode: true,
  },

  // 42. DUBAI PAY
  {
    id: "dubaipay",
    name: "Dubai Pay",
    slug: "dubaipay",
    logo: "https://cdn-icons-png.flaticon.com/512/2936/2936647.png",
    type: "nacional",
    status: "active",
    description: "Gateway de pagamentos brasileiro",
    features: ["Pix", "Cartão", "Boleto"],
    paymentMethods: ["credit_card", "pix", "boleto"],
    configFields: [
      {
        name: "merchantId",
        label: "Merchant ID",
        type: "text",
        required: true,
        placeholder: "merchant_xxx",
      },
      {
        name: "apiToken",
        label: "API Token",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
    ],
    apiDocs: "https://dubaipay.com.br/api",
    testMode: true,
  },

  // 43. EFÍ
  {
    id: "efi",
    name: "Efí",
    slug: "efi",
    logo: "https://cdn-icons-png.flaticon.com/512/891/891462.png",
    type: "nacional",
    status: "active",
    description: "Gateway de pagamentos digital (antiga Gerencianet)",
    features: ["Pix", "Cartão", "Boleto", "Carnê", "Assinaturas"],
    paymentMethods: ["credit_card", "pix", "boleto"],
    configFields: [
      {
        name: "clientId",
        label: "Client ID",
        type: "text",
        required: true,
        placeholder: "Client_Id_xxx",
      },
      {
        name: "clientSecret",
        label: "Client Secret",
        type: "password",
        required: true,
        placeholder: "Client_Secret_xxx",
      },
      {
        name: "environment",
        label: "Ambiente",
        type: "select",
        required: true,
        options: [
          { label: "Produção", value: "production" },
          { label: "Sandbox", value: "sandbox" },
        ],
      },
    ],
    apiDocs: "https://dev.efipay.com.br/docs",
    testMode: true,
  },

  // 44. EVER PAY
  {
    id: "everpay",
    name: "Ever Pay",
    slug: "everpay",
    logo: "https://cdn-icons-png.flaticon.com/512/3135/3135706.png",
    type: "nacional",
    status: "active",
    description: "Solução de pagamentos digitais",
    features: ["Pix", "Cartão", "Boleto", "Link"],
    paymentMethods: ["credit_card", "pix", "boleto"],
    configFields: [
      {
        name: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "accountId",
        label: "Account ID",
        type: "text",
        required: true,
        placeholder: "account_xxx",
      },
    ],
    apiDocs: "https://everpay.com.br/developers",
    testMode: true,
  },

  // 45. FAST PAY
  {
    id: "fastpay",
    name: "Fast Pay",
    slug: "fastpay",
    logo: "https://cdn-icons-png.flaticon.com/512/5968/5968292.png",
    type: "global",
    status: "active",
    description: "Pagamentos rápidos globais",
    features: ["Cartão", "Wire Transfer", "Digital Wallet"],
    paymentMethods: ["credit_card", "debit_card", "wallet"],
    configFields: [
      {
        name: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "merchantId",
        label: "Merchant ID",
        type: "text",
        required: true,
        placeholder: "merchant_xxx",
      },
    ],
    apiDocs: "https://fastpay.io/docs",
    testMode: true,
  },

  // 46. FIRE PAG
  {
    id: "firepag",
    name: "Fire Pag",
    slug: "firepag",
    logo: "https://cdn-icons-png.flaticon.com/512/785/785116.png",
    type: "nacional",
    status: "active",
    description: "Gateway de pagamentos nacional",
    features: ["Pix", "Cartão", "Boleto"],
    paymentMethods: ["credit_card", "pix", "boleto"],
    configFields: [
      {
        name: "token",
        label: "Token",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "storeId",
        label: "Store ID",
        type: "text",
        required: true,
        placeholder: "store_xxx",
      },
    ],
    apiDocs: "https://firepag.com.br/api",
    testMode: true,
  },

  // 47. FIVEPAY
  {
    id: "fivepay",
    name: "Fivepay",
    slug: "fivepay",
    logo: "https://cdn-icons-png.flaticon.com/512/5968/5968534.png",
    type: "nacional",
    status: "active",
    description: "Gateway brasileiro de pagamentos",
    features: ["Pix", "Cartão", "Boleto"],
    paymentMethods: ["credit_card", "pix", "boleto"],
    configFields: [
      {
        name: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "partnerId",
        label: "Partner ID",
        type: "text",
        required: true,
        placeholder: "partner_xxx",
      },
    ],
    apiDocs: "https://fivepay.com.br/developers",
    testMode: true,
  },

  // 48. FLASHPAY
  {
    id: "flashpay",
    name: "FlashPay",
    slug: "flashpay",
    logo: "https://cdn-icons-png.flaticon.com/512/3103/3103456.png",
    type: "nacional",
    status: "active",
    description: "Pagamentos instantâneos",
    features: ["Pix", "Cartão", "Boleto", "Pagamento Rápido"],
    paymentMethods: ["credit_card", "pix", "boleto"],
    configFields: [
      {
        name: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "merchantId",
        label: "Merchant ID",
        type: "text",
        required: true,
        placeholder: "merchant_xxx",
      },
    ],
    apiDocs: "https://flashpay.com.br/api-docs",
    testMode: true,
  },

  // 49. FLOWSPAY
  {
    id: "flowspay",
    name: "Flowspay",
    slug: "flowspay",
    logo: "https://cdn-icons-png.flaticon.com/512/5968/5968350.png",
    type: "both",
    status: "active",
    description: "Fluxo de pagamentos otimizado",
    features: ["Pix", "Cartão", "Boleto", "Wire Transfer"],
    paymentMethods: ["credit_card", "debit_card", "pix", "boleto"],
    configFields: [
      {
        name: "clientId",
        label: "Client ID",
        type: "text",
        required: true,
        placeholder: "client_xxx",
      },
      {
        name: "clientSecret",
        label: "Client Secret",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
    ],
    apiDocs: "https://flowspay.com/developers",
    testMode: true,
  },

  // 50. FLY PAYMENTS
  {
    id: "flypayments",
    name: "Fly Payments",
    slug: "flypayments",
    logo: "https://cdn-icons-png.flaticon.com/512/3062/3062634.png",
    type: "nacional",
    status: "active",
    description: "Gateway de pagamentos nacional",
    features: ["Pix", "Cartão", "Boleto"],
    paymentMethods: ["credit_card", "pix", "boleto"],
    configFields: [
      {
        name: "apiToken",
        label: "API Token",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "sellerId",
        label: "Seller ID",
        type: "text",
        required: true,
        placeholder: "seller_xxx",
      },
    ],
    apiDocs: "https://flypayments.com.br/api",
    testMode: true,
  },

  // 51. FORTREX
  {
    id: "fortrex",
    name: "Fortrex",
    slug: "fortrex",
    logo: "https://cdn-icons-png.flaticon.com/512/2936/2936719.png",
    type: "nacional",
    status: "active",
    description: "Segurança em pagamentos online",
    features: ["Pix", "Cartão", "Boleto", "Segurança Avançada"],
    paymentMethods: ["credit_card", "pix", "boleto"],
    configFields: [
      {
        name: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "merchantCode",
        label: "Merchant Code",
        type: "text",
        required: true,
        placeholder: "MC-XXXXX",
      },
    ],
    apiDocs: "https://fortrex.com.br/developers",
    testMode: true,
  },

  // 52. FREEPAY
  {
    id: "freepay",
    name: "FreePay",
    slug: "freepay",
    logo: "https://cdn-icons-png.flaticon.com/512/2138/2138440.png",
    type: "nacional",
    status: "active",
    description: "Pagamentos sem taxas iniciais",
    features: ["Pix", "Cartão", "Boleto"],
    paymentMethods: ["credit_card", "pix", "boleto"],
    configFields: [
      {
        name: "token",
        label: "Token",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "accountId",
        label: "Account ID",
        type: "text",
        required: true,
        placeholder: "account_xxx",
      },
    ],
    apiDocs: "https://freepay.com.br/api-docs",
    testMode: true,
  },

  // 53. FUSIONPAY
  {
    id: "fusionpay",
    name: "FusionPay",
    slug: "fusionpay",
    logo: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
    type: "both",
    status: "active",
    description: "Fusão de métodos de pagamento",
    features: ["Pix", "Cartão", "Boleto", "Crypto", "Wire Transfer"],
    paymentMethods: ["credit_card", "debit_card", "pix", "boleto", "wallet"],
    configFields: [
      {
        name: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "secretKey",
        label: "Secret Key",
        type: "password",
        required: true,
        placeholder: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      {
        name: "environment",
        label: "Ambiente",
        type: "select",
        required: true,
        options: [
          { label: "Produção", value: "production" },
          { label: "Sandbox", value: "sandbox" },
        ],
      },
    ],
    apiDocs: "https://fusionpay.io/api",
    testMode: true,
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getGatewayBySlug = (slug: string): GatewayConfig | undefined => {
  return gatewaysList.find((g) => g.slug === slug);
};

export const getActiveGateways = (): GatewayConfig[] => {
  return gatewaysList.filter((g) => g.status === "active");
};

export const getGatewaysByType = (
  type: "nacional" | "global" | "both",
): GatewayConfig[] => {
  return gatewaysList.filter((g) => g.type === type || g.type === "both");
};

export const getGatewaysByPaymentMethod = (
  method: "credit_card" | "debit_card" | "pix" | "boleto" | "wallet",
): GatewayConfig[] => {
  return gatewaysList.filter((g) => g.paymentMethods.includes(method));
};
