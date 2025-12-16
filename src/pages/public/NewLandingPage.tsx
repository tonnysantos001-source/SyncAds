import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  CreditCard,
  ShoppingCart,
  BarChart3,
  Zap,
  Shield,
  Bot,
  Rocket,
  Star,
  ChevronDown,
  Menu,
  X,
  Check,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { FAQItem, LandingFooter } from "./NewLandingPageFooter";
import { FeatureCard, PricingCard } from "./NewLandingPageComponents";

const NewLandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 100], [0.9, 1]);

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Gradient Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
        />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Header */}
      <motion.header
        style={{ opacity: headerOpacity }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50"
      >
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo />

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Recursos
              </a>
              <a
                href="#pricing"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Planos
              </a>
              <a
                href="#faq"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                FAQ
              </a>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login-v2">Entrar</Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30"
              >
                <Link to="/register">Começar Grátis</Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden pt-4 pb-2 border-t border-gray-200 dark:border-gray-800 mt-4"
            >
              <nav className="flex flex-col gap-3">
                <a
                  href="#features"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 py-2"
                >
                  Recursos
                </a>
                <a
                  href="#pricing"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 py-2"
                >
                  Planos
                </a>
                <a
                  href="#faq"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 py-2"
                >
                  FAQ
                </a>
                <div className="flex flex-col gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <Button variant="outline" asChild>
                    <Link to="/login-v2">Entrar</Link>
                  </Button>
                  <Button
                    asChild
                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                  >
                    <Link to="/register">Começar Grátis</Link>
                  </Button>
                </div>
              </nav>
            </motion.div>
          )}
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="text-center lg:text-left"
            >
              {/* Badge */}
              <motion.div
                variants={fadeInUp}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-blue-500/20 mb-6"
              >
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Checkout 100% Grátis - 0% de Taxa Para Sempre
                </span>
              </motion.div>

              {/* Main Heading */}
              <motion.h1
                variants={fadeInUp}
                className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 leading-tight"
              >
                <span className="text-gray-900 dark:text-white">
                  Pare de Gastar R$5k em Cursos.
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Use IA Profissional que Faz Tudo
                </span>
              </motion.h1>

              {/* Description */}
              <motion.p
                variants={fadeInUp}
                className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto lg:mx-0"
              >
                Gestor de Anúncios Profissional +{" "}
                <strong className="text-gray-900 dark:text-white">
                  Extensão Chrome
                </strong>{" "}
                +{" "}
                <strong className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  IA Sem Censura
                </strong>{" "}
                + Checkout 0% Taxa + Clone Lojas em Minutos.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-12"
              >
                <Button
                  size="lg"
                  asChild
                  className="text-lg px-8 py-6 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 shadow-2xl shadow-purple-500/30 transform hover:scale-105 transition-all"
                >
                  <Link to="/register" className="flex items-center gap-2">
                    <Rocket className="h-5 w-5" />
                    Começar Grátis Agora
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="text-lg px-8 py-6 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 dark:border-blue-800 dark:hover:border-blue-600"
                >
                  <a href="#pricing">Ver Planos</a>
                </Button>
              </motion.div>

              {/* Social Proof */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 text-sm"
              >
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-600 border-2 border-white dark:border-gray-900 flex items-center justify-center text-white text-xs font-bold"
                      >
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    2.847+ profissionais economizando
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                  <span className="ml-2 font-semibold text-gray-700 dark:text-gray-300">
                    4.9/5 avaliação
                  </span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative hidden lg:block"
            >
              {/* Main Illustration SVG */}
              <div className="relative">
                {/* Floating Elements */}
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -top-10 -left-10 w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl shadow-blue-500/50 flex items-center justify-center transform rotate-12"
                >
                  <CreditCard className="h-12 w-12 text-white" />
                </motion.div>

                <motion.div
                  animate={{ y: [0, 20, 0] }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                  className="absolute -bottom-10 -right-10 w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl shadow-2xl shadow-pink-500/50 flex items-center justify-center transform -rotate-12"
                >
                  <Bot className="h-12 w-12 text-white" />
                </motion.div>

                <motion.div
                  animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                  className="absolute top-1/2 -left-16 w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full shadow-2xl shadow-purple-500/50 flex items-center justify-center"
                >
                  <BarChart3 className="h-10 w-10 text-white" />
                </motion.div>

                {/* Main Card */}
                <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-800">
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl -z-10" />

                  {/* Content */}
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                          Dashboard
                        </h3>
                        <p className="text-sm text-gray-500">Tempo Real</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-green-600">
                          Online
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 rounded-2xl p-4 border border-blue-200 dark:border-blue-800"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <ShoppingCart className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Vendas
                          </span>
                        </div>
                        <p className="text-3xl font-black text-blue-600">
                          R$ 45.2k
                        </p>
                        <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                          <ArrowRight className="h-3 w-3 rotate-[-45deg]" />
                          +28% hoje
                        </p>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 rounded-2xl p-4 border border-purple-200 dark:border-purple-800"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Bot className="h-5 w-5 text-purple-600" />
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            IA Ativa
                          </span>
                        </div>
                        <p className="text-3xl font-black text-purple-600">
                          24/7
                        </p>
                        <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                          <Check className="h-3 w-3" />
                          Automático
                        </p>
                      </motion.div>
                    </div>

                    {/* Chart Bars */}
                    <div className="space-y-3">
                      {[
                        {
                          label: "PIX",
                          value: 85,
                          color: "from-blue-500 to-blue-600",
                        },
                        {
                          label: "Cartão",
                          value: 65,
                          color: "from-purple-500 to-purple-600",
                        },
                        {
                          label: "Boleto",
                          value: 45,
                          color: "from-pink-500 to-pink-600",
                        },
                      ].map((item, i) => (
                        <div key={i}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {item.label}
                            </span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              {item.value}%
                            </span>
                          </div>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.value}%` }}
                            transition={{ duration: 1, delay: i * 0.2 }}
                            className={`h-3 rounded-full bg-gradient-to-r ${item.color} shadow-lg`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className="h-8 w-8 text-gray-400 animate-bounce" />
        </motion.div>
      </section>

      {/* Checkout Payment Highlight */}
      <section className="py-16 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-20" />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-4">
                <CreditCard className="h-5 w-5 text-white" />
                <span className="text-white font-semibold">
                  Checkout de Pagamento
                </span>
              </div>

              <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
                Checkout 100% Grátis - 0% de Taxa de Transação
              </h2>

              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Diferente de TODOS os concorrentes (Stripe 2.9%, PagSeguro 4.99%),
                nosso checkout é <strong>100% GRÁTIS</strong>.
                Zero taxa. Zero custo. Economize milhares por mês.
                Aceita PIX, cartão de crédito e boleto.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-6 pt-6">
                <div className="flex items-center gap-2 text-white">
                  <Check className="h-6 w-6" />
                  <span className="font-semibold">PIX Instantâneo</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Check className="h-6 w-6" />
                  <span className="font-semibold">Cartão de Crédito</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Check className="h-6 w-6" />
                  <span className="font-semibold">Boleto Bancário</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Check className="h-6 w-6" />
                  <span className="font-semibold">Sem Taxas de Setup</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4"
            >
              Tudo que Você Precisa em Um Só Lugar
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
            >
              Checkout customizado + IA + Múltiplos gateways + Integrações
              poderosas
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: ShoppingCart,
                title: "Checkout Customizado",
                description:
                  "Crie páginas de checkout personalizadas com sua marca. Sem redirecionamentos, conversão máxima.",
                gradient: "from-blue-500 to-blue-600",
              },
              {
                icon: CreditCard,
                title: "Múltiplos Gateways",
                description:
                  "Integre com + de 55 gateways de pagamento. PIX, cartão, boleto e mais.",
                gradient: "from-purple-500 to-purple-600",
              },
              {
                icon: Bot,
                title: "IA que Gerencia Tudo",
                description:
                  "Assistente de IA 24/7 para gerenciar campanhas, analisar dados e otimizar vendas.",
                gradient: "from-pink-500 to-pink-600",
              },
              {
                icon: Zap,
                title: "Integração Shopify",
                description:
                  "Conecte sua loja Shopify em minutos e comece a vender com checkout personalizado.",
                gradient: "from-blue-500 to-purple-600",
              },
              {
                icon: BarChart3,
                title: "Analytics Avançado",
                description:
                  "Dashboards completos com métricas em tempo real. Tome decisões baseadas em dados.",
                gradient: "from-purple-500 to-pink-600",
              },
              {
                icon: Shield,
                title: "Segurança Total",
                description:
                  "Certificado SSL, PCI Compliance e criptografia de ponta a ponta.",
                gradient: "from-pink-500 to-blue-600",
              },
            ].map((feature, index) => (
              <FeatureCard key={index} {...feature} delay={index * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="py-24 bg-gray-50 dark:bg-gray-900 relative"
      >
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4"
            >
              Checkout Grátis + IAs Pagas nos Planos
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
            >
              Checkout 0% taxa em TODOS os planos. Você só paga pela IA. Cancele quando quiser.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            <PricingCard
              name="Gratuito"
              price="R$ 0"
              description="Experimente todas as funcionalidades"
              features={[
                "✅ Checkout 0% Taxa - Para Sempre",
                "✅ 10 mensagens IA/dia",
                "✅ 5 imagens IA/dia",
                "✅ 2 vídeos IA/dia",
                "✅ Extensão Chrome (50 comandos/dia)",
                "✅ 1 loja + 50 produtos",
                "✅ 1 clonagem de loja/mês",
                "✅ Gestor de anúncios básico",
                "✅ Suporte via email",
              ]}
              buttonText="Começar Grátis"
              buttonLink="/register"
              delay={0}
            />

            {/* Starter Plan */}
            <PricingCard
              name="Starter"
              price="R$ 97"
              period="/mês"
              description="Ideal para começar a vender"
              features={[
                "✅ Checkout 0% Taxa - Para Sempre",
                "✅ 100 mensagens IA/dia",
                "✅ 30 imagens IA/dia",
                "✅ 10 vídeos IA/dia",
                "✅ 20 áudios IA/dia",
                "✅ Extensão Chrome (300 comandos/dia)",
                "✅ 3 lojas + 200 produtos cada",
                "✅ 5 clonagens de loja/mês",
                "✅ Todos os 10 modais (vídeo, áudio, código)",
                "✅ Gestor de anúncios completo",
                "✅ Criação sem censura",
                "✅ Suporte prioritário 24h",
              ]}
              buttonText="Escolher Starter"
              buttonLink="/register"
              delay={0.1}
            />

            {/* Pro Plan - Popular */}
            <PricingCard
              name="Pro"
              price="R$ 297"
              period="/mês"
              description="Para profissionais que vendem sério"
              features={[
                "✅ Checkout 0% Taxa - Para Sempre",
                "✅ 500 mensagens IA/dia",
                "✅ 150 imagens IA/dia",
                "✅ 50 vídeos IA/dia",
                "✅ 100 áudios IA/dia",
                "✅ Código ilimitado",
                "✅ Extensão Chrome ilimitada",
                "✅ 10 lojas + produtos ilimitados",
                "✅ 20 clonagens de loja/mês",
                "✅ Domínio customizado",
                "✅ A/B Testing automático",
                "✅ Analytics com predições IA",
                "✅ Webhooks customizados",
                "✅ White label parcial",
                "✅ Suporte 24/7 + WhatsApp",
              ]}
              buttonText="Escolher Pro"
              buttonLink="/register"
              popular
              delay={0.2}
            />

            {/* Enterprise Plan */}
            <PricingCard
              name="Enterprise"
              price="R$ 997"
              period="/mês"
              description="Para grandes volumes e agências"
              features={[
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
              ]}
              buttonText="Falar com Vendas"
              buttonLink="/contact"
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4"
            >
              Perguntas Frequentes
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-xl text-gray-600 dark:text-gray-300"
            >
              Tire suas dúvidas sobre a plataforma
            </motion.p>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                question:
                  "Como funciona o período de teste grátis do checkout?",
                answer:
                  "Você tem 7 dias grátis para testar nosso sistema de checkout de pagamentos. Durante esse período, não cobramos nada. Após os 7 dias, cobramos apenas 1,5% sobre transações aprovadas.",
              },
              {
                question: "Posso mudar de plano a qualquer momento?",
                answer:
                  "Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As mudanças são aplicadas imediatamente e o valor é proporcional.",
              },
              {
                question: "Como funciona o limite de mensagens de IA?",
                answer:
                  "Cada plano tem um limite diário de mensagens que você pode enviar para a IA. Os contadores são resetados à meia-noite (00:00). Se atingir o limite, você pode fazer upgrade para continuar usando.",
              },
              {
                question: "Quais gateways de pagamento são suportados?",
                answer:
                  "Suportamos mais de 55 gateways incluindo Mercado Pago, Paggue-x, Stripe, PayPal, PagSeguro e muitos outros. Você pode integrar múltiplos gateways simultaneamente.",
              },
              {
                question: "Preciso de conhecimento técnico para usar?",
                answer:
                  "Não! Nossa plataforma é super intuitiva e nossa IA pode te ajudar com tudo. Além disso, oferecemos suporte completo e onboarding personalizado no plano Enterprise.",
              },
              {
                question: "Os dados estão seguros?",
                answer:
                  "Absolutamente! Usamos criptografia de ponta a ponta, certificado SSL, somos PCI Compliant e seguimos todas as melhores práticas de segurança.",
              },
            ].map((faq, index) => (
              <FAQItem key={index} {...faq} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-20" />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6">
              Pronto para Vender Mais?
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Junte-se a milhares de empresas que já estão economizando e
              vendendo mais com SyncAds
            </p>
            <Button
              size="lg"
              asChild
              className="text-lg px-10 py-7 bg-white hover:bg-gray-50 text-gray-900 hover:scale-105 shadow-2xl transform transition-all font-black"
            >
              <Link to="/register" className="flex items-center gap-2">
                <Rocket className="h-6 w-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />
                Criar Minha Conta Grátis
                <ArrowRight className="h-6 w-6 text-purple-600" />
              </Link>
            </Button>
            <p className="text-white/80 mt-6 text-sm">
              💳 Não precisa cartão de crédito • ✨ 7 dias grátis • 🚀 Cancele
              quando quiser
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
};

export default NewLandingPage;

