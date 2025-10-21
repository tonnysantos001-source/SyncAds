import { BarChart3, Search, Anchor, Globe, Facebook, BrainCircuit, Newspaper, Music, Linkedin, FolderKanban, Database, Instagram, Twitter, MessageCircle, Phone, Send, Video, Link, ShoppingBag, Store, ShoppingCart, Package, Calendar, PenSquare, LayoutTemplate, Flame, CreditCard, Wallet, Payment, TrendingUp, Palette, Slack, Mail, Github, Webhook, Server } from 'lucide-react';

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

// CONFIGURAÇÃO FIXA de integrações disponíveis (NÃO é mock)
export const AVAILABLE_INTEGRATIONS: IntegrationCategory[] = [
    {
        title: "Análise",
        integrations: [
            { id: 'google-analytics', name: 'Google Analytics', description: 'Usa o Google Analytics para rastrear e analisar o tráfego do site.', logo: BarChart3 },
            { id: 'google-search-console', name: 'Google Search Console', description: 'Usa o Google Search Console para analisar o desempenho da pesquisa.', logo: Search },
            { id: 'ahrefs', name: 'Ahrefs', description: 'Usa Ahrefs para análise de SEO, pesquisa de palavras-chave e monitoramento de backlinks.', logo: Anchor, comingSoon: true },
        ]
    },
    {
        title: "Anúncios Pagos",
        integrations: [
            { id: 'google-ads', name: 'Google Ads', description: 'Usa o Google Ads para gerenciamento e otimização de campanhas.', logo: Globe },
            { id: 'meta-ads', name: 'Meta Ads', description: 'Utiliza Meta Ads (Facebook/Instagram) para gerenciamento e otimização de campanhas.', logo: Facebook },
            { id: 'bing-ads', name: 'Bing Ads', description: 'Usa o Bing Ads para marketing de mecanismos de busca e otimização de campanhas.', logo: Globe },
            { id: 'outbrain', name: 'Outbrain', description: 'Utiliza o Outbrain para descoberta de conteúdo e campanhas de publicidade nativa.', logo: BrainCircuit },
            { id: 'taboola', name: 'Taboola', description: 'Usa Taboola para descoberta de conteúdo e campanhas de publicidade nativa.', logo: Newspaper },
            { id: 'tiktok-ads', name: 'TikTok Ads', description: 'Usa o TikTok Ads para campanhas de publicidade em vídeo e segmentação de público.', logo: Music, comingSoon: true },
            { id: 'linkedin-ads', name: 'LinkedIn Ads', description: 'Utiliza anúncios do LinkedIn para campanhas publicitárias B2B e geração de leads.', logo: Linkedin, comingSoon: true },
        ]
    },
    {
        title: "Armazenamento",
        integrations: [
            { id: 'google-drive', name: 'Google Drive', description: 'Permite que os usuários criem arquivos em seu próprio Google Drive.', logo: FolderKanban },
            { id: 'postgresql', name: 'PostgreSQL', description: 'Conecte-se a bancos de dados PostgreSQL para consultar e gerenciar dados.', logo: Database },
        ]
    },
    {
        title: "Mídias Sociais",
        integrations: [
            { id: 'facebook', name: 'Facebook', description: 'Publique postagens diretamente em suas páginas do Facebook.', logo: Facebook },
            { id: 'instagram', name: 'Instagram', description: 'Publique postagens e histórias em suas contas comerciais do Instagram.', logo: Instagram },
            { id: 'linkedin', name: 'LinkedIn', description: 'Usa o LinkedIn para encontrar leads e compartilhar conteúdo nas páginas da empresa.', logo: Linkedin },
            { id: 'twitter', name: 'Twitter/X', description: 'Usa o Twitter/X para encontrar tópicos interessantes e compartilhar conteúdo.', logo: Twitter },
            { id: 'reddit', name: 'Reddit', description: 'Usa o Reddit para encontrar tópicos interessantes e compartilhar conteúdo.', logo: MessageCircle },
            { id: 'whatsapp', name: 'WhatsApp', description: 'Integre com WhatsApp Business para enviar mensagens e automações.', logo: Phone },
            { id: 'telegram', name: 'Telegram', description: 'Envie notificações e mensagens através do Telegram.', logo: Send },
            { id: 'kwai', name: 'Kwai', description: 'Publique vídeos e gerencie campanhas no Kwai.', logo: Video },
            { id: 'linktree', name: 'Linktree', description: 'Centralize seus links e integre com sua bio.', logo: Link },
        ]
    },
    {
        title: "E-commerce & Marketplaces",
        integrations: [
            { id: 'vtex', name: 'VTEX', description: 'Integração completa com a plataforma VTEX de e-commerce.', logo: ShoppingBag },
            { id: 'nuvemshop', name: 'Nuvemshop', description: 'Conecte sua loja Nuvemshop para sincronizar produtos e pedidos.', logo: Store },
            { id: 'shopify', name: 'Shopify', description: 'Integração com Shopify para gerenciar sua loja online.', logo: ShoppingCart },
            { id: 'mercado-livre', name: 'Mercado Livre', description: 'Integre com Mercado Livre para gerenciar anúncios e vendas.', logo: ShoppingBag },
            { id: 'magalu', name: 'Magazine Luiza', description: 'Integração com marketplace da Magazine Luiza.', logo: Store },
            { id: 'loja-integrada', name: 'Loja Integrada', description: 'Conecte sua Loja Integrada para sincronizar produtos.', logo: ShoppingCart },
            { id: 'tray', name: 'Tray', description: 'Integração completa com plataforma Tray E-commerce.', logo: Store },
            { id: 'bling', name: 'Bling', description: 'Sincronize vendas e estoque com Bling ERP.', logo: Package },
            { id: 'bagy', name: 'Bagy', description: 'Integração com plataforma Bagy de e-commerce.', logo: ShoppingBag },
            { id: 'yampi', name: 'Yampi', description: 'Conecte sua loja Yampi para gestão de vendas.', logo: ShoppingCart },
            { id: 'ticto', name: 'Ticto', description: 'Integração com Ticto para eventos e ingressos.', logo: Calendar },
        ]
    },
    {
        title: "Gerenciamento de Conteúdo",
        integrations: [
            { id: 'wordpress', name: 'WordPress', description: 'Usa o WordPress para publicar conteúdo em blogs.', logo: PenSquare, comingSoon: true },
            { id: 'webflow', name: 'Webflow', description: 'Usa o Webflow para publicar conteúdo em blogs.', logo: LayoutTemplate },
            { id: 'hubspot', name: 'HubSpot', description: 'Usa o HubSpot para publicar conteúdo em blogs.', logo: Flame },
        ]
    },
    {
        title: "Pagamentos & Financeiro",
        integrations: [
            { id: 'mercado-pago', name: 'Mercado Pago', description: 'Processe pagamentos com Mercado Pago.', logo: CreditCard },
            { id: 'pagseguro', name: 'PagSeguro', description: 'Integração com PagSeguro para pagamentos online.', logo: CreditCard },
            { id: 'yapay', name: 'Yapay', description: 'Gateway de pagamento Yapay para múltiplas formas de pagamento.', logo: Wallet },
            { id: 'asaas', name: 'Asaas', description: 'Gestão financeira e cobranças com Asaas.', logo: Payment },
            { id: 'hotmart', name: 'Hotmart', description: 'Integração com Hotmart para venda de produtos digitais.', logo: ShoppingCart },
            { id: 'sympla', name: 'Sympla', description: 'Venda e gerencie ingressos de eventos com Sympla.', logo: Calendar },
        ]
    },
    {
        title: "Marketing & Automação",
        integrations: [
            { id: 'rd-station', name: 'RD Station', description: 'Automação de marketing e geração de leads com RD Station.', logo: TrendingUp },
            { id: 'calendly', name: 'Calendly', description: 'Agendamento de reuniões e integração com calendários.', logo: Calendar },
            { id: 'minhas-economias', name: 'Minhas Economias', description: 'Integração com plataforma Minhas Economias.', logo: Wallet },
        ]
    },
    {
        title: "Design",
        integrations: [
            { id: 'canva', name: 'Canva', description: 'Crie e gerencie designs, acesse modelos e automatize a criação de conteúdo.', logo: Palette, comingSoon: true },
        ]
    },
    {
        title: "Comunicação e Produtividade",
        integrations: [
            { id: 'slack', name: 'Slack', description: 'Usa o Slack para notificações e atualizações da equipe.', logo: Slack },
            { id: 'gmail', name: 'Gmail', description: 'Usa o Gmail para redigir e enviar e-mails.', logo: Mail },
            { id: 'github', name: 'GitHub', description: 'Usa o GitHub para gerenciamento de repositórios e colaboração de código.', logo: Github },
            { id: 'webhook', name: 'Webhook', description: 'Configure um webhook para receber dados do SyncAds.', logo: Webhook, comingSoon: true },
            { id: 'mcp-server', name: 'Servidor MCP', description: 'Acesse o SyncAds pelo seu Claude Desktop, Cursor ou outros clientes MCP.', logo: Server },
        ]
    }
];
