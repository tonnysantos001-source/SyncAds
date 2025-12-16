// Planos SyncAds - Estrutura Detalhada para Landing Page

export const PLANS = {
    FREE: {
        name: "Gratuito",
        price: "R$ 0",
        period: "/mês",
        description: "Experimente todas as funcionalidades",
        badge: null,
        limits: {
            // Checkout - SEMPRE GRÁTIS
            checkout: {
                taxa: "0%",
                transacoes: "Ilimitadas",
                metodos: ["PIX", "Cartão", "Boleto"],
            },

            // IA - Limitado
            ia: {
                mensagensChat: "10/dia",
                imagensGeradas: "5/dia",
                videosGerados: "2/dia",
                audiosGerados: "5/dia",
                codigoGerado: "10/dia",
            },

            // Extensão Chrome
            extensao: {
                disponivel: true,
                comandosDOM: "50/dia",
                anunciosCriados: "3/dia",
            },

            // Gestão
            lojas: "1 loja",
            produtos: "Até 50 produtos",
            paginasCheckout: "1 página",
            clonagemLojas: "1/mês",

            // Recursos
            modais: ["Chat", "Imagem Básica"],
            gestorAnuncios: "Básico",
            analytics: "Básico",
            integrações: "Limitadas",
            suporte: "Email (48h)",
        },
        features: [
            "✅ Checkout 0% Taxa - Para Sempre",
            "✅ 10 mensagens IA/dia",
            "✅ 5 imagens IA/dia",
            "✅ 2 vídeos IA/dia",
            "✅ Extensão Chrome (50 comandos/dia)",
            "✅ 1 loja + 50 produtos",
            "✅ 1 clonagem de loja/mês",
            "✅ Gestor de anúncios básico",
            "✅ Suporte via email",
        ],
        cta: "Começar Grátis",
        link: "/register",
    },

    STARTER: {
        name: "Starter",
        price: "R$ 97",
        period: "/mês",
        description: "Ideal para começar a vender",
        badge: null,
        limits: {
            // Checkout - SEMPRE GRÁTIS
            checkout: {
                taxa: "0%",
                transacoes: "Ilimitadas",
                metodos: ["PIX", "Cartão", "Boleto"],
            },

            // IA - Moderado
            ia: {
                mensagensChat: "100/dia",
                imagensGeradas: "30/dia",
                videosGerados: "10/dia",
                audiosGerados: "20/dia",
                codigoGerado: "50/dia",
            },

            // Extensão Chrome
            extensao: {
                disponivel: true,
                comandosDOM: "300/dia",
                anunciosCriados: "20/dia",
            },

            // Gestão
            lojas: "3 lojas",
            produtos: "Até 200 produtos/loja",
            paginasCheckout: "5 páginas",
            clonagemLojas: "5/mês",

            // Recursos
            modais: ["Todos os 10 modais"],
            gestorAnuncios: "Completo",
            analytics: "Avançado",
            integrações: "Todas",
            suporte: "Email + Chat (24h)",
        },
        features: [
            "✅ Checkout 0% Taxa - Para Sempre",
            "✅ 100 mensagens IA/dia",
            "✅ 30 imagens IA/dia",
            "✅ 10 vídeos IA/dia",
            "✅ 20 áudios IA/dia",
            "✅ Extensão Chrome (300 comandos/dia)",
            "✅ 3 lojas + 200 produtos cada",
            "✅ 5 clonagens de loja/mês",
            "✅ Todos os 10 modais (vídeo, áudio, código, etc)",
            "✅ Gestor de anúncios completo",
            "✅ Analytics avançado",
            "✅ Criação sem censura",
            "✅ Suporte prioritário 24h",
        ],
        cta: "Escolher Starter",
        link: "/register",
    },

    PRO: {
        name: "Pro",
        price: "R$ 297",
        period: "/mês",
        description: "Para profissionais que vendem sério",
        badge: "Mais Popular",
        limits: {
            // Checkout - SEMPRE GRÁTIS
            checkout: {
                taxa: "0%",
                transacoes: "Ilimitadas",
                metodos: ["PIX", "Cartão", "Boleto", "Customizados"],
            },

            // IA - Alto
            ia: {
                mensagensChat: "500/dia",
                imagensGeradas: "150/dia",
                videosGerados: "50/dia",
                audiosGerados: "100/dia",
                codigoGerado: "Ilimitado",
            },

            // Extensão Chrome
            extensao: {
                disponivel: true,
                comandosDOM: "Ilimitado",
                anunciosCriados: "Ilimitado",
            },

            // Gestão
            lojas: "10 lojas",
            produtos: "Ilimitados",
            paginasCheckout: "Ilimitadas",
            clonagemLojas: "20/mês",

            // Recursos
            modais: ["Todos + Personalizados"],
            gestorAnuncios: "Pro + A/B Testing",
            analytics: "Pro + Predições IA",
            integrações: "Todas + Webhooks",
            suporte: "Prioritário 24/7 + WhatsApp",
            extras: ["Domínio customizado", "White label parcial"],
        },
        features: [
            "✅ Checkout 0% Taxa - Para Sempre",
            "✅ 500 mensagens IA/dia",
            "✅ 150 imagens IA/dia",
            "✅ 50 vídeos IA/dia",
            "✅ 100 áudios IA/dia",
            "✅ Código ilimitado",
            "✅ Extensão Chrome ilimitada",
            "✅ 10 lojas + produtos ilimitados",
            "✅ 20 clonagens de loja/mês",
            "✅ Páginas checkout ilimitadas",
            "✅ Domínio customizado",
            "✅ A/B Testing automático",
            "✅ Analytics com predições IA",
            "✅ Webhooks customizados",
            "✅ White label parcial",
            "✅ Suporte 24/7 + WhatsApp",
            "✅ Automações de marketing",
        ],
        cta: "Escolher Pro",
        link: "/register",
        popular: true,
    },

    ENTERPRISE: {
        name: "Enterprise",
        price: "R$ 997",
        period: "/mês",
        description: "Para grandes volumes e agências",
        badge: "Mais Completo",
        limits: {
            // Checkout - SEMPRE GRÁTIS
            checkout: {
                taxa: "0%",
                transacoes: "Ilimitadas",
                metodos: "Todos + Customizados",
            },

            // IA - Ilimitado
            ia: {
                mensagensChat: "Ilimitado",
                imagensGeradas: "Ilimitado",
                videosGerados: "Ilimitado",
                audiosGerados: "Ilimitado",
                codigoGerado: "Ilimitado",
            },

            // Extensão Chrome
            extensao: {
                disponivel: true,
                comandosDOM: "Ilimitado",
                anunciosCriados: "Ilimitado",
                multiUsuarios: "Até 10 usuários",
            },

            // Gestão
            lojas: "Ilimitadas",
            produtos: "Ilimitados",
            paginasCheckout: "Ilimitadas",
            clonagemLojas: "Ilimitadas",

            // Recursos
            modais: "Todos + Personalizados",
            gestorAnuncios: "Enterprise + Multi-contas",
            analytics: "Enterprise + BI Customizado",
            integraç ões: "Todas + API Completa",
            suporte: "Dedicado 24/7 + Manager",
            extras: [
                "White label completo",
                "Infraestrutura dedicada",
                "SLA 99.9%",
                "Onboarding personalizado",
                "Treinamento de equipe",
                "Desenvolvimento customizado",
            ],
        },
        features: [
            "✅ Checkout 0% Taxa - Para Sempre",
            "✅ IA 100% ILIMITADA",
            "✅ Mensagens ilimitadas",
            "✅ Imagens ilimitadas",
            "✅ Vídeos ilimitados",
            "✅ Áudios ilimitados",
            "✅ Extensão Chrome ilimitada",
            "✅ Multi-usuários (10 contas)",
            "✅ Lojas e produtos ilimitados",
            "✅ Clonagem ilimitada",
            "✅ White label completo",
            "✅ API Access completo",
            "✅ Infraestrutura dedicada",
            "✅ SLA 99.9%",
            "✅ Manager dedicado",
            "✅ Onboarding personalizado",
            "✅ Treinamento de equipe",
            "✅ Desenvolvimento customizado",
        ],
        cta: "Falar com Vendas",
        link: "/contact",
        enterprise: true,
    },
};

// Comparativo de limite diário
export const DAILY_LIMITS_COMPARISON = {
    mensagensIA: {
        free: 10,
        starter: 100,
        pro: 500,
        enterprise: "∞"
    },
    imagens: {
        free: 5,
        starter: 30,
        pro: 150,
        enterprise: "∞"
    },
    videos: {
        free: 2,
        starter: 10,
        pro: 50,
        enterprise: "∞"
    },
    audios: {
        free: 5,
        starter: 20,
        pro: 100,
        enterprise: "∞"
    },
    comandosDOM: {
        free: 50,
        starter: 300,
        pro: "∞",
        enterprise: "∞"
    },
    clonagemLojas: {
        free: "1/mês",
        starter: "5/mês",
        pro: "20/mês",
        enterprise: "∞"
    }
};

// Economia estimada (vs concorrentes com taxa)
export const SAVINGS_CALCULATOR = {
    // Economia mensal baseada em volume de vendas
    calculateSavings: (monthlyRevenue) => {
        const stripe = monthlyRevenue * 0.029; // 2.9%
        const pagseguro = monthlyRevenue * 0.0499; // 4.99%
        const mercadopago = monthlyRevenue * 0.0499; // 4.99%
        const syncads = 0; // 0%

        return {
            vs_stripe: stripe,
            vs_pagseguro: pagseguro,
            vs_mercadopago: mercadopago,
            total_saved: (stripe + pagseguro + mercadopago) / 3, // Média
        };
    },

    // Economia anual
    yearlyComparison: {
        revenue_10k: {
            stripe: "R$ 3.480/ano",
            pagseguro: "R$ 5.988/ano",
            mercadopago: "R$ 5.988/ano",
            syncads: "R$ 0/ano",
        },
        revenue_50k: {
            stripe: "R$ 17.400/ano",
            pagseguro: "R$ 29.940/ano",
            mercadopago: "R$ 29.940/ano",
            syncads: "R$ 0/ano",
        },
        revenue_100k: {
            stripe: "R$ 34.800/ano",
            pagseguro: "R$ 59.880/ano",
            mercadopago: "R$ 59.880/ano",
            syncads: "R$ 0/ano",
        },
    },
};
