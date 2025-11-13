import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  DollarSign,
  Zap,
  Shield,
  CheckCircle2,
  ArrowRight,
  Star,
  Sparkles,
  Target,
  BarChart3,
  Bot,
  X,
  Check,
  CreditCard,
  Crown,
  Rocket,
} from "lucide-react";
import Logo from "@/components/Logo";

const LandingPage = () => {
  // Força modo escuro permanentemente
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-950">
      {/* Background gradients - Modo escuro permanente */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-purple-900/40 -z-10" />
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl -z-10 animate-pulse" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-2xl border-b border-gray-800/50 shadow-2xl">
        {/* Barra Superior - Destaque Checkout Grátis */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 py-2.5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          <div className="container mx-auto px-4 sm:px-6 relative">
            <p className="text-center text-white text-sm sm:text-base font-bold flex items-center justify-center gap-2 animate-pulse">
              <CreditCard className="h-4 w-4" />
              <span>🎉 CHECKOUT DE PAGAMENTO 100% GRÁTIS - SEM TAXAS!</span>
              <Sparkles className="h-4 w-4" />
            </p>
          </div>
        </div>

        {/* Menu Principal */}
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <Logo />
            <nav className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-gray-700 bg-gray-800/50 text-white hover:bg-gray-700 hover:border-gray-600"
              >
                <Link to="/login">Entrar</Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/50 transform hover:scale-105 transition-all"
              >
                <Link to="/register" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Criar Cadastro
                </Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section - GATILHO MENTAL: Dor + Solução */}
        <section className="relative overflow-hidden py-20 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge de urgência */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 mb-8 animate-pulse backdrop-blur-xl">
                <Sparkles className="h-4 w-4 text-orange-400" />
                <span className="text-sm font-semibold text-orange-300">
                  ⚠️ Pare de Jogar Dinheiro Fora em "Gurus"!
                </span>
              </div>

              {/* Headline com gatilho mental */}
              <h1
                className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-6"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                <span className="block text-white drop-shadow-lg">
                  Chega de Pagar
                </span>
                <span className="block bg-gradient-to-r from-red-500 via-orange-400 to-red-500 bg-clip-text text-transparent animate-gradient drop-shadow-2xl">
                  R$ 3.000+ em Mentorias
                </span>
                <span className="block text-white mt-2 drop-shadow-lg">
                  que{" "}
                  <span className="relative inline-block">
                    <span>Não Funcionam</span>
                    <X className="absolute -right-8 top-0 h-12 w-12 text-red-400 animate-bounce drop-shadow-xl" />
                  </span>
                </span>
              </h1>

              <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Nossa{" "}
                <span className="font-bold text-blue-400">
                  Inteligência Artificial
                </span>{" "}
                faz{" "}
                <span className="underline decoration-purple-400 decoration-wavy decoration-2">
                  TODO o trabalho
                </span>{" "}
                que os "gurus" cobram R$ 5.000+ para ensinar...
                <span className="block mt-2 text-2xl font-bold text-green-400 animate-pulse">
                  Mas por uma fração do preço!
                </span>
              </p>

              {/* CTA Principal */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <Button
                  size="lg"
                  asChild
                  className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl shadow-blue-500/80 transform hover:scale-110 transition-all relative overflow-hidden group"
                >
                  <Link
                    to="/register"
                    className="flex items-center gap-2 relative z-10"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    🚀 CRIAR MINHA CONTA AGORA
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>

              {/* Social Proof */}
              <div className="flex items-center justify-center gap-8 flex-wrap">
                <div className="flex items-center gap-2 bg-gray-800/50 backdrop-blur-xl rounded-2xl p-4 border border-gray-700/50">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-gray-800 flex items-center justify-center text-white font-bold text-sm shadow-lg"
                      >
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-300 font-medium">
                      2.847+ profissionais economizando
                    </p>
                  </div>
                </div>
              </div>

              {/* Empresas que Confiam */}
              <div className="mt-16">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-8 uppercase tracking-wider">
                  Empresas que confiam no SyncAds
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 items-center opacity-60 grayscale hover:grayscale-0 transition-all">
                  {[
                    { name: "Magazine Luiza", abbr: "MAGALU" },
                    { name: "Nubank", abbr: "NU" },
                    { name: "Natura", abbr: "NATURA" },
                    { name: "Ambev", abbr: "AMBEV" },
                    { name: "Itaú", abbr: "ITAÚ" },
                    { name: "Bradesco", abbr: "BRADESCO" },
                    { name: "Petrobras", abbr: "PETROBRAS" },
                    { name: "Vale", abbr: "VALE" },
                    { name: "B3", abbr: "B3" },
                    { name: "Embraer", abbr: "EMBRAER" },
                    { name: "Globo", abbr: "GLOBO" },
                    { name: "Record", abbr: "RECORD" },
                    { name: "Casas Bahia", abbr: "C.BAHIA" },
                    { name: "Renner", abbr: "RENNER" },
                    { name: "Localiza", abbr: "LOCALIZA" },
                  ].map((company, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-center p-4 bg-gray-800/50 backdrop-blur-xl rounded-lg border border-gray-700/50 hover:border-blue-500 hover:bg-gray-700/50 transition-all transform hover:scale-105"
                    >
                      <span className="text-lg font-black text-gray-200">
                        {company.abbr}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section - Problema (DOR) */}
        <section className="py-20 bg-gradient-to-b from-red-950/20 to-gray-900/50 relative">
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="max-w-4xl mx-auto">
              <h2
                className="text-3xl sm:text-5xl font-black text-center mb-12 text-white drop-shadow-2xl"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                ❌ Você Já Passou Por Isso?
              </h2>

              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  {
                    text: '💸 Gastou R$ 3.000+ em curso de "guru" que só ensina o básico do Google Ads',
                    highlight: true,
                  },
                  {
                    text: "😰 Perdeu HORAS tentando entender métricas confusas (CTR, CPA, ROAS...)",
                    highlight: true,
                  },
                  {
                    text: "🤯 Criou 10 campanhas diferentes e NENHUMA deu resultado",
                    highlight: true,
                  },
                  {
                    text: "⏰ Trabalha até de madrugada ajustando lances e segmentações manualmente",
                    highlight: true,
                  },
                  {
                    text: "📉 Vê seu dinheiro sendo queimado em anúncios que não convertem",
                    highlight: true,
                  },
                  {
                    text: '🙏 Reza para a campanha melhorar "magicamente" amanhã',
                    highlight: true,
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`p-6 rounded-2xl border-2 ${
                      item.highlight
                        ? "bg-red-950/30 backdrop-blur-xl border-red-800/50"
                        : "bg-gray-800/50 backdrop-blur-xl border-gray-700/50"
                    } shadow-2xl transform hover:scale-105 transition-all hover:shadow-red-500/20`}
                  >
                    <p className="text-lg font-semibold text-gray-100">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-12 p-8 bg-gradient-to-r from-yellow-950/30 to-orange-950/30 backdrop-blur-xl rounded-3xl border-2 border-yellow-600/50 shadow-2xl shadow-yellow-500/20">
                <p className="text-2xl font-bold text-center text-white">
                  🔥 Se você se identificou com 3+ situações acima...
                  <span className="block mt-2 text-3xl text-orange-400 animate-pulse">
                    É HORA DE MUDAR!
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section - Solução (TRANSFORMAÇÃO) */}
        <section className="py-20 bg-gradient-to-b from-gray-900/50 to-blue-950/20 relative">
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <h2
                  className="text-3xl sm:text-5xl font-black mb-6 text-white drop-shadow-2xl"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  ✨ Imagine Ter uma{" "}
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    IA Especialista
                  </span>{" "}
                  Trabalhando 24/7 Pra Você
                </h2>
                <p className="text-xl text-gray-300">
                  Enquanto os "gurus" cobram R$ 5.000+ para te ensinar...{" "}
                  <span className="font-bold text-green-400">
                    Nossa IA FAZ tudo por você!
                  </span>
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: Bot,
                    title: "Cria Campanhas Profissionais",
                    description:
                      "IA analisa seu negócio e cria campanhas otimizadas em segundos. Sem precisar estudar por meses!",
                    color: "blue",
                  },
                  {
                    icon: BarChart3,
                    title: "Analisa Tudo Automaticamente",
                    description:
                      "Esqueça planilhas complicadas! IA mostra EXATAMENTE o que está funcionando (ou não).",
                    color: "purple",
                  },
                  {
                    icon: Zap,
                    title: "Otimiza Sozinha",
                    description:
                      "IA ajusta lances, pausaanúncios ruins e aumenta budget nos que convertem. Você só acompanha os resultados!",
                    color: "green",
                  },
                ].map((feature, i) => (
                  <div key={i} className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all" />
                    <div className="relative p-8 bg-gray-800/50 backdrop-blur-xl rounded-3xl border-2 border-gray-700/50 shadow-2xl hover:shadow-blue-500/20 transition-all transform hover:-translate-y-2 hover:border-blue-500/50">
                      <div
                        className={`h-16 w-16 rounded-2xl bg-gradient-to-br from-${feature.color}-500 to-${feature.color}-600 flex items-center justify-center mb-6 shadow-lg shadow-${feature.color}-500/50 group-hover:scale-110 transition-transform`}
                      >
                        <feature.icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4 text-white">
                        {feature.title}
                      </h3>
                      <p className="text-gray-300 text-lg leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section - Planos e Preços */}
        <section className="py-20 bg-gradient-to-b from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 relative overflow-hidden">
          {/* Destaque Checkout Grátis - Floating Banner */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10">
            <div className="px-8 py-4 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 rounded-full shadow-2xl shadow-green-500/50 animate-pulse">
              <div className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-white" />
                <span className="text-white font-black text-lg">
                  🎉 CHECKOUT DE PAGAMENTO GRÁTIS EM TODOS OS PLANOS!
                </span>
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 pt-24">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="text-center mb-16">
                <h2
                  className="text-4xl sm:text-6xl font-black mb-6"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  💎 Escolha Seu{" "}
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Plano Perfeito
                  </span>
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  Todos os planos incluem{" "}
                  <span className="font-bold text-green-600">
                    Checkout Grátis
                  </span>{" "}
                  - economize mais de R$ 200/mês em taxas!
                </p>
              </div>

              {/* Cards de Planos */}
              <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
                {/* Plano Free */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-all">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                      Grátis
                    </h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-5xl font-black text-gray-900 dark:text-white">
                        R$ 0
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      por mês
                    </p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>5 campanhas/mês</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>1 conta ativa</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Relatórios básicos</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="font-bold text-green-600">
                        ✅ Checkout Grátis
                      </span>
                    </li>
                  </ul>

                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/register">Começar Grátis</Link>
                  </Button>
                </div>

                {/* Plano Pro */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-blue-500 dark:border-blue-600 p-6 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1">
                  <div className="text-center mb-6">
                    <div className="inline-block px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full mb-2">
                      POPULAR
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                      Pro
                    </h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-5xl font-black text-gray-900 dark:text-white">
                        R$ 100
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      por mês
                    </p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="font-semibold">20 campanhas/mês</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Campanhas ilimitadas</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Análises avançadas</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Suporte por email</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="font-bold text-green-600">
                        ✅ Checkout Grátis
                      </span>
                    </li>
                  </ul>

                  <Button
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    asChild
                  >
                    <Link to="/register">Começar Agora</Link>
                  </Button>
                </div>

                {/* Plano Business */}
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50 rounded-2xl border-2 border-purple-500 dark:border-purple-600 p-6 shadow-2xl hover:shadow-3xl transition-all transform hover:-translate-y-2 relative">
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 rounded-full text-xs font-black shadow-lg animate-bounce">
                    🔥 RECOMENDADO
                  </div>
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                      Business
                    </h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-5xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        R$ 250
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      por mês
                    </p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span className="font-semibold">52 campanhas/mês</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>Tudo ilimitado</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>IA Avançada</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>Suporte prioritário</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>1 membro de equipe</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="font-bold text-green-600">
                        ✅ Checkout Grátis
                      </span>
                    </li>
                  </ul>

                  <Button
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 shadow-lg"
                    asChild
                  >
                    <Link to="/register">Começar Agora</Link>
                  </Button>
                </div>

                {/* Plano Scale */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-orange-500 dark:border-orange-600 p-6 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                      Scale
                    </h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-black text-gray-900 dark:text-white">
                        R$ 1.000
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      por mês
                    </p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                      <span className="font-semibold">240 campanhas/mês</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                      <span>Recursos ilimitados</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                      <span>IA Premium</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                      <span>Suporte Slack</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                      <span>Até 3 membros</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                      <span>2 sub-contas</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="font-bold text-green-600">
                        ✅ Checkout Grátis
                      </span>
                    </li>
                  </ul>

                  <Button
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                    asChild
                  >
                    <Link to="/register">Começar Agora</Link>
                  </Button>
                </div>

                {/* Plano Growth */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-emerald-500 dark:border-emerald-600 p-6 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full mb-2">
                      <Rocket className="h-3 w-3" />
                      AGÊNCIAS
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                      Growth
                    </h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-black text-gray-900 dark:text-white">
                        R$ 2.500
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      por mês
                    </p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="font-semibold">800 campanhas/mês</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Tudo ilimitado</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>IA Ultra Premium</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Suporte dedicado</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Até 5 membros</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>5 sub-contas</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="font-bold text-green-600">
                        ✅ Checkout Grátis
                      </span>
                    </li>
                  </ul>

                  <Button
                    className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                    asChild
                  >
                    <Link to="/register">Começar Agora</Link>
                  </Button>
                </div>

                {/* Plano Enterprise */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-yellow-500 p-6 shadow-2xl hover:shadow-3xl transition-all relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full blur-2xl" />

                  <div className="relative text-center mb-6">
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 text-xs font-black rounded-full mb-2">
                      <Crown className="h-3 w-3" />
                      VIP
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">
                      Enterprise
                    </h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                        Personalizado
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      contato com vendas
                    </p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2 text-sm text-white">
                      <Check className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <span className="font-semibold">
                        Créditos customizados
                      </span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-white">
                      <Check className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <span>Recursos ilimitados</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-white">
                      <Check className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <span>IA Exclusiva</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-white">
                      <Check className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <span>Suporte on-call</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-white">
                      <Check className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <span>Membros ilimitados</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-white">
                      <Check className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <span>Sub-contas ilimitadas</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-white">
                      <Check className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="font-bold text-green-400">
                        ✅ Checkout Grátis
                      </span>
                    </li>
                  </ul>

                  <Button
                    className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 hover:from-yellow-500 hover:to-orange-600 font-bold shadow-lg shadow-yellow-500/50"
                    asChild
                  >
                    <Link to="/register">Falar com Vendas</Link>
                  </Button>
                </div>
              </div>

              {/* Destaque Checkout Grátis - Card Informativo */}
              <div className="max-w-4xl mx-auto">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 rounded-3xl blur-xl group-hover:blur-2xl transition-all opacity-75" />
                  <div className="relative p-8 sm:p-12 bg-white dark:bg-gray-900 rounded-3xl border-2 border-green-500 shadow-2xl">
                    <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/50">
                          <CreditCard className="h-10 w-10 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-3">
                          🎉 Nosso Diferencial:{" "}
                          <span className="text-green-600">
                            Checkout 100% Grátis!
                          </span>
                        </h3>
                        <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                          Enquanto outras plataformas cobram{" "}
                          <span className="font-bold text-red-600">
                            R$ 200+/mês
                          </span>{" "}
                          só pelo gateway de pagamento,
                          <span className="font-bold text-green-600">
                            {" "}
                            nós oferecemos GRÁTIS em todos os planos!
                          </span>
                        </p>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                          <div className="px-4 py-2 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-500">
                            <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                              💰 Economize R$ 200+/mês
                            </p>
                          </div>
                          <div className="px-4 py-2 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-500">
                            <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                              🚀 Setup instantâneo
                            </p>
                          </div>
                          <div className="px-4 py-2 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-500">
                            <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                              ✅ Sem taxas ocultas
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparação de Economia */}
              <div className="mt-16 max-w-3xl mx-auto">
                <div className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-2xl border-2 border-blue-300 dark:border-blue-700">
                  <h4 className="text-2xl font-black text-center text-gray-900 dark:text-white mb-6">
                    💡 Comparação Anual: SyncAds vs Concorrentes
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="p-6 bg-red-50 dark:bg-red-950/30 rounded-xl border-2 border-red-300">
                      <p className="text-lg font-bold text-red-600 mb-2">
                        ❌ Outras Plataformas
                      </p>
                      <p className="text-3xl font-black text-gray-900 dark:text-white mb-1">
                        R$ 3.400/ano
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        R$ 100 plano + R$ 200 checkout
                      </p>
                    </div>
                    <div className="p-6 bg-green-50 dark:bg-green-950/30 rounded-xl border-2 border-green-500">
                      <p className="text-lg font-bold text-green-600 mb-2">
                        ✅ SyncAds (Plano Pro)
                      </p>
                      <p className="text-3xl font-black text-gray-900 dark:text-white mb-1">
                        R$ 1.200/ano
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400 font-bold">
                        Economia de R$ 2.200/ano! 🎉
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section - Comparação (GATILHO DE CONTRASTE) */}
        <section className="py-20 bg-gradient-to-b from-purple-50 to-white dark:from-purple-950/20 dark:to-gray-900">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
              <h2
                className="text-3xl sm:text-5xl font-black text-center mb-16"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                ⚖️ Você Decide: Guru ou IA?
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Coluna Guru */}
                <div className="p-8 bg-red-50 dark:bg-red-950/30 rounded-3xl border-2 border-red-300 dark:border-red-800">
                  <h3 className="text-3xl font-black text-red-600 mb-6 text-center">
                    ❌ Mentoria de "Guru"
                  </h3>
                  <ul className="space-y-4">
                    {[
                      "💸 R$ 3.000 a R$ 10.000 (só pra começar)",
                      "⏰ 6+ meses para dominar (se dominar)",
                      "😰 Você faz TUDO manualmente",
                      "📚 Horas de vídeo-aulas chatas",
                      "🤷 Suporte? Boa sorte no grupo lotado",
                      "📉 Resultado? Depende MUITO de você",
                      "🔄 Precisa pagar de novo para atualizar",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-lg">
                        <X className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
                        <span className="text-gray-800 dark:text-gray-200">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Coluna SyncAds */}
                <div className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-3xl border-2 border-green-400 dark:border-green-600 shadow-2xl shadow-green-500/20 relative">
                  <div className="absolute -top-4 -right-4 px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg animate-pulse">
                    <span className="font-black text-white">
                      MELHOR ESCOLHA! 🏆
                    </span>
                  </div>
                  <h3 className="text-3xl font-black text-green-600 mb-6 text-center">
                    ✅ SyncAds com IA
                  </h3>
                  <ul className="space-y-4">
                    {[
                      "💰 A partir de R$ 97/mês (100% automático)",
                      "⚡ Resultados em MINUTOS (não meses)",
                      "🤖 IA trabalha 24/7 pra você",
                      "🎯 Zero curva de aprendizado",
                      "💬 Suporte personalizado via chat IA",
                      "📈 Resultados garantidos ou devolv seu dinheiro",
                      "🆓 Atualizações grátis para sempre",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-lg">
                        <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 p-6 bg-white dark:bg-gray-900 rounded-2xl border-2 border-green-400">
                    <p className="text-center text-xl font-bold text-gray-900 dark:text-white">
                      💡 ECONOMIA:{" "}
                      <span className="text-green-600 text-3xl">
                        R$ 2.903/mês
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section - Garantia (GATILHO DE SEGURANÇA) */}
        <section className="py-20 bg-gradient-to-b from-white to-purple-50 dark:from-gray-900 dark:to-purple-950/20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-2xl shadow-green-500/80 mb-8 animate-pulse">
                <Shield className="h-12 w-12 text-white" />
              </div>

              <h2
                className="text-3xl sm:text-5xl font-black mb-6 text-white drop-shadow-2xl"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                🛡️ Garantia <span className="text-green-400">100%</span> Sem
                Riscos
              </h2>

              <p className="text-2xl text-gray-200 mb-8 leading-relaxed">
                Teste o SyncAds por{" "}
                <span className="font-black text-blue-400">14 dias GRÁTIS</span>
                .<br />
                Se não economizar pelo menos{" "}
                <span className="font-black text-green-400">R$ 1.000</span> em
                anúncios...
                <br />
                <span className="text-3xl font-black block mt-4 text-purple-400 animate-pulse">
                  Devolvemos 100% + R$ 500 de bônus!
                </span>
              </p>

              <div className="p-8 bg-gradient-to-r from-yellow-950/30 to-orange-950/30 backdrop-blur-xl rounded-3xl border-2 border-yellow-600/50 mb-12 shadow-2xl shadow-yellow-500/20">
                <p className="text-xl font-bold text-white">
                  🔥 Isso mesmo! Se você não lucrar...{" "}
                  <span className="text-green-400">NÓS PAGAMOS VOCÊ!</span>
                </p>
                <p className="text-sm text-gray-300 mt-2">
                  (Porque temos CERTEZA que nossa IA vai transformar seus
                  resultados)
                </p>
              </div>

              <Button
                size="lg"
                asChild
                className="text-xl px-12 py-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-2xl shadow-green-500/80 transform hover:scale-110 transition-all animate-pulse hover:animate-none"
              >
                <Link to="/register" className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6" />
                  QUERO COMEÇAR AGORA!
                  <ArrowRight className="h-6 w-6" />
                </Link>
              </Button>

              <p className="mt-6 text-gray-400 text-sm font-medium">
                ✅ Sem cartão | ✅ Sem pegadinhas | ✅ Cancele quando quiser
              </p>
            </div>
          </div>
        </section>

        {/* Section - Urgência (GATILHO DE ESCASSEZ) */}
        <section className="py-20 bg-gradient-to-b from-purple-50 to-red-50 dark:from-purple-950/20 dark:to-red-950/20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-4xl mx-auto relative z-10">
              <div className="p-12 bg-gradient-to-r from-red-700/50 to-orange-700/50 backdrop-blur-xl rounded-3xl border-2 border-red-600/50 shadow-2xl shadow-red-500/20 text-center text-white">
                <h2
                  className="text-4xl sm:text-5xl font-black mb-6"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  ⚠️ ATENÇÃO: Vagas Limitadas!
                </h2>
                <p className="text-2xl mb-8 leading-relaxed">
                  Por questões de infraestrutura de IA, estamos aceitando apenas{" "}
                  <span className="font-black underline">
                    50 novos usuários
                  </span>{" "}
                  esta semana.
                </p>

                <div className="flex items-center justify-center gap-4 mb-8">
                  <div className="px-6 py-4 bg-white/20 rounded-xl backdrop-blur">
                    <p className="text-sm opacity-90">Vagas Restantes</p>
                    <p className="text-5xl font-black">7</p>
                  </div>
                </div>

                <Button
                  size="default"
                  asChild
                  className="text-base px-8 py-6 bg-white text-red-600 hover:bg-gray-100 shadow-xl transform hover:scale-105 transition-all"
                >
                  <Link
                    to="/register"
                    className="flex items-center gap-2 font-bold"
                  >
                    CRIAR CONTA AGORA
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>

                <p className="mt-6 text-lg">
                  ⏰ Oferta expira em:{" "}
                  <span className="font-black text-2xl">23h 45min</span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <Logo />
          <p className="mt-6 text-gray-400">
            &copy; 2025 SyncAds. Todos os direitos reservados.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Transformando "gurus" caros em resultados reais com IA 🚀
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
