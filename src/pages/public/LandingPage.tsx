import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
  X
} from 'lucide-react';
import Logo from '@/components/Logo';

const LandingPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Background gradients */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950 -z-10" />
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-purple-400/20 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-2xl border-b border-gray-200/50">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <Logo />
            <nav className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                <Link to="/login">Entrar</Link>
              </Button>
              <Button size="sm" asChild className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/30">
                <Link to="/register">Começar Grátis</Link>
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 mb-8 animate-pulse">
                <Sparkles className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                  ⚠️ Pare de Jogar Dinheiro Fora em "Gurus"!
                </span>
              </div>

              {/* Headline com gatilho mental */}
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <span className="block text-gray-900 dark:text-white">
                  Chega de Pagar
                </span>
                <span className="block bg-gradient-to-r from-red-600 via-orange-500 to-red-600 bg-clip-text text-transparent animate-gradient">
                  R$ 3.000+ em Mentorias
                </span>
                <span className="block text-gray-900 dark:text-white mt-2">
                  que <span className="relative inline-block">
                    <span>Não Funcionam</span>
                    <X className="absolute -right-8 top-0 h-12 w-12 text-red-500 animate-bounce" />
                  </span>
                </span>
              </h1>

              <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Nossa <span className="font-bold text-blue-600">Inteligência Artificial</span> faz <span className="underline decoration-purple-500 decoration-wavy">TODO o trabalho</span> que os "gurus" cobram R$ 5.000+ para ensinar... 
                <span className="block mt-2 text-2xl font-bold text-green-600">Mas por uma fração do preço!</span>
              </p>

              {/* CTA Principal */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <Button size="lg" asChild className="text-lg px-8 py-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-2xl shadow-green-500/50 transform hover:scale-105 transition-all">
                  <Link to="/register" className="flex items-center gap-2">
                    ✅ TESTAR GRÁTIS POR 14 DIAS
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <p className="text-sm text-gray-500">
                  ⚡ Sem cartão de crédito | Cancele quando quiser
                </p>
              </div>

              {/* Social Proof */}
              <div className="flex items-center justify-center gap-8 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1,2,3,4,5].map((i) => (
                      <div key={i} className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 border-2 border-white dark:border-gray-900 flex items-center justify-center text-white font-bold text-sm">
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map((i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">2.847+ profissionais economizando</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section - Problema (DOR) */}
        <section className="py-20 bg-gradient-to-b from-red-50 to-white dark:from-red-950/20 dark:to-gray-900">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl sm:text-5xl font-black text-center mb-12" style={{ fontFamily: 'Poppins, sans-serif' }}>
                ❌ Você Já Passou Por Isso?
              </h2>
              
              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { text: '💸 Gastou R$ 3.000+ em curso de "guru" que só ensina o básico do Google Ads', highlight: true },
                  { text: '😰 Perdeu HORAS tentando entender métricas confusas (CTR, CPA, ROAS...)', highlight: true },
                  { text: '🤯 Criou 10 campanhas diferentes e NENHUMA deu resultado', highlight: true },
                  { text: '⏰ Trabalha até de madrugada ajustando lances e segmentações manualmente', highlight: true },
                  { text: '📉 Vê seu dinheiro sendo queimado em anúncios que não convertem', highlight: true },
                  { text: '🙏 Reza para a campanha melhorar "magicamente" amanhã', highlight: true },
                ].map((item, i) => (
                  <div key={i} className={`p-6 rounded-2xl border-2 ${
                    item.highlight 
                      ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800' 
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  } shadow-lg transform hover:scale-105 transition-all`}>
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-12 p-8 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-3xl border-2 border-yellow-400 dark:border-yellow-600">
                <p className="text-2xl font-bold text-center text-gray-900 dark:text-white">
                  🔥 Se você se identificou com 3+ situações acima...
                  <span className="block mt-2 text-3xl text-orange-600">É HORA DE MUDAR!</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section - Solução (TRANSFORMAÇÃO) */}
        <section className="py-20 bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-blue-950/20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-5xl font-black mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  ✨ Imagine Ter uma <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">IA Especialista</span> Trabalhando 24/7 Pra Você
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  Enquanto os "gurus" cobram R$ 5.000+ para te ensinar... <span className="font-bold text-green-600">Nossa IA FAZ tudo por você!</span>
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: Bot,
                    title: 'Cria Campanhas Profissionais',
                    description: 'IA analisa seu negócio e cria campanhas otimizadas em segundos. Sem precisar estudar por meses!',
                    color: 'blue'
                  },
                  {
                    icon: BarChart3,
                    title: 'Analisa Tudo Automaticamente',
                    description: 'Esqueça planilhas complicadas! IA mostra EXATAMENTE o que está funcionando (ou não).',
                    color: 'purple'
                  },
                  {
                    icon: Zap,
                    title: 'Otimiza Sozinha',
                    description: 'IA ajusta lances, pausaanúncios ruins e aumenta budget nos que convertem. Você só acompanha os resultados!',
                    color: 'green'
                  }
                ].map((feature, i) => (
                  <div key={i} className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all" />
                    <div className="relative p-8 bg-white dark:bg-gray-900 rounded-3xl border-2 border-gray-200 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2">
                      <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br from-${feature.color}-500 to-${feature.color}-600 flex items-center justify-center mb-6 shadow-lg shadow-${feature.color}-500/50`}>
                        <feature.icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{feature.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section - Comparação (GATILHO DE CONTRASTE) */}
        <section className="py-20 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-900">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl sm:text-5xl font-black text-center mb-16" style={{ fontFamily: 'Poppins, sans-serif' }}>
                ⚖️ Você Decide: Guru ou IA?
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Coluna Guru */}
                <div className="p-8 bg-red-50 dark:bg-red-950/30 rounded-3xl border-2 border-red-300 dark:border-red-800">
                  <h3 className="text-3xl font-black text-red-600 mb-6 text-center">❌ Mentoria de "Guru"</h3>
                  <ul className="space-y-4">
                    {[
                      '💸 R$ 3.000 a R$ 10.000 (só pra começar)',
                      '⏰ 6+ meses para dominar (se dominar)',
                      '😰 Você faz TUDO manualmente',
                      '📚 Horas de vídeo-aulas chatas',
                      '🤷 Suporte? Boa sorte no grupo lotado',
                      '📉 Resultado? Depende MUITO de você',
                      '🔄 Precisa pagar de novo para atualizar'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-lg">
                        <X className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
                        <span className="text-gray-800 dark:text-gray-200">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Coluna SyncAds */}
                <div className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-3xl border-2 border-green-400 dark:border-green-600 shadow-2xl shadow-green-500/20 relative">
                  <div className="absolute -top-4 -right-4 px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg animate-pulse">
                    <span className="font-black text-white">MELHOR ESCOLHA! 🏆</span>
                  </div>
                  <h3 className="text-3xl font-black text-green-600 mb-6 text-center">✅ SyncAds com IA</h3>
                  <ul className="space-y-4">
                    {[
                      '💰 A partir de R$ 97/mês (100% automático)',
                      '⚡ Resultados em MINUTOS (não meses)',
                      '🤖 IA trabalha 24/7 pra você',
                      '🎯 Zero curva de aprendizado',
                      '💬 Suporte personalizado via chat IA',
                      '📈 Resultados garantidos ou devolv seu dinheiro',
                      '🆓 Atualizações grátis para sempre'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-lg">
                        <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{item}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-8 p-6 bg-white dark:bg-gray-900 rounded-2xl border-2 border-green-400">
                    <p className="text-center text-xl font-bold text-gray-900 dark:text-white">
                      💡 ECONOMIA: <span className="text-green-600 text-3xl">R$ 2.903/mês</span>
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
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-2xl shadow-green-500/50 mb-8">
                <Shield className="h-12 w-12 text-white" />
              </div>
              
              <h2 className="text-3xl sm:text-5xl font-black mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
                🛡️ Garantia <span className="text-green-600">100%</span> Sem Riscos
              </h2>
              
              <p className="text-2xl text-gray-700 dark:text-gray-200 mb-8 leading-relaxed">
                Teste o SyncAds por <span className="font-black text-blue-600">14 dias GRÁTIS</span>.<br/>
                Se não economizar pelo menos <span className="font-black text-green-600">R$ 1.000</span> em anúncios...<br/>
                <span className="text-3xl font-black block mt-4 text-purple-600">Devolvemos 100% + R$ 500 de bônus!</span>
              </p>

              <div className="p-8 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-3xl border-2 border-yellow-400 mb-12">
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  🔥 Isso mesmo! Se você não lucrar... <span className="text-green-600">NÓS PAGAMOS VOCÊ!</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  (Porque temos CERTEZA que nossa IA vai transformar seus resultados)
                </p>
              </div>

              <Button size="lg" asChild className="text-xl px-12 py-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-2xl shadow-green-500/50 transform hover:scale-110 transition-all">
                <Link to="/register" className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6" />
                  QUERO COMEÇAR AGORA!
                  <ArrowRight className="h-6 w-6" />
                </Link>
              </Button>
              
              <p className="mt-6 text-gray-500 text-sm">
                ✅ Sem cartão | ✅ Sem pegadinhas | ✅ Cancele quando quiser
              </p>
            </div>
          </div>
        </section>

        {/* Section - Urgência (GATILHO DE ESCASSEZ) */}
        <section className="py-20 bg-gradient-to-b from-purple-50 to-red-50 dark:from-purple-950/20 dark:to-red-950/20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="p-12 bg-gradient-to-r from-red-600 to-orange-600 rounded-3xl shadow-2xl text-center text-white">
                <h2 className="text-4xl sm:text-5xl font-black mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  ⚠️ ATENÇÃO: Vagas Limitadas!
                </h2>
                <p className="text-2xl mb-8 leading-relaxed">
                  Por questões de infraestrutura de IA, estamos aceitando apenas <span className="font-black underline">50 novos usuários</span> esta semana.
                </p>
                
                <div className="flex items-center justify-center gap-4 mb-8">
                  <div className="px-6 py-4 bg-white/20 rounded-xl backdrop-blur">
                    <p className="text-sm opacity-90">Vagas Restantes</p>
                    <p className="text-5xl font-black">7</p>
                  </div>
                </div>

                <Button size="lg" asChild className="text-xl px-12 py-8 bg-white text-red-600 hover:bg-gray-100 shadow-2xl transform hover:scale-110 transition-all">
                  <Link to="/register" className="flex items-center gap-3 font-black">
                    <DollarSign className="h-6 w-6" />
                    GARANTIR MINHA VAGA AGORA!
                    <TrendingUp className="h-6 w-6" />
                  </Link>
                </Button>

                <p className="mt-6 text-lg">
                  ⏰ Oferta expira em: <span className="font-black text-2xl">23h 45min</span>
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
          <p className="mt-6 text-gray-400">&copy; 2025 SyncAds. Todos os direitos reservados.</p>
          <p className="mt-2 text-sm text-gray-500">
            Transformando "gurus" caros em resultados reais com IA 🚀
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
