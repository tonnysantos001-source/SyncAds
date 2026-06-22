import {
  ShoppingCart,
  Package,
  MessageCircle,
  TrendingUp,
  Zap
} from "lucide-react";

export type Integration = {
  id: string;
  name: string;
  description: string;
  logo: React.FC<any>;
  comingSoon?: boolean;
};

export type IntegrationCategory = {
  title: string;
  integrations: Integration[];
};

// CONFIGURAÇÃO FIXA de integrações disponíveis oficiais (SyncAds)
export const AVAILABLE_INTEGRATIONS: IntegrationCategory[] = [
  {
    title: "E-commerce",
    integrations: [
      {
        id: "shopify",
        name: "Shopify",
        description: "Conecte sua loja Shopify para sincronizar produtos, pedidos e clientes automaticamente.",
        logo: ShoppingCart,
      },
      {
        id: "woocommerce",
        name: "WooCommerce",
        description: "Integração com WooCommerce para WordPress para sincronizar produtos e pedidos.",
        logo: ShoppingCart,
      }
    ]
  },
  {
    title: "Logística",
    integrations: [
      {
        id: "melhor-envio",
        name: "Melhor Envio",
        description: "Calcule fretes, gere etiquetas de envio e rastreie encomendas com desconto.",
        logo: Package,
      },
      {
        id: "superfrete",
        name: "SuperFrete",
        description: "Emita etiquetas de frete com até 60% de desconto pelos Correios.",
        logo: Package,
      }
    ]
  },
  {
    title: "Atendimento",
    integrations: [
      {
        id: "reportana",
        name: "Reportana",
        description: "Recupere carrinhos abandonados e automatize a comunicação pós-venda.",
        logo: MessageCircle,
      }
    ]
  },
  {
    title: "Marketing",
    integrations: [
      {
        id: "utmify",
        name: "UTMify",
        description: "Rastreie suas vendas em tempo real e analise o ROI de tráfego pago.",
        logo: TrendingUp,
      }
    ]
  },
  {
    title: "Automação",
    integrations: [
      {
        id: "syncads-automation",
        name: "SyncAds Automação",
        description: "Automações exclusivas e personalizadas para escalar a sua operação.",
        logo: Zap,
      }
    ]
  }
];
