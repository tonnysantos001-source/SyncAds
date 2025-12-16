{/* Why SyncAds vs Courses Section */ }
<section className="py-24 bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
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
                Por Que SyncAds vs Cursos de Anúncios?
            </motion.h2>
            <motion.p
                variants={fadeInUp}
                className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
            >
                Economize milhares e tenha ferramentas profissionais que cursos nunca vão te dar
            </motion.p>
        </motion.div>

        {/* Comparison Table */}
        <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
                {/* Courses Column */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="bg-white dark:bg-gray-900 rounded-3xl p-8 border-2 border-gray-200 dark:border-gray-800"
                >
                    <div className="text-center mb-6">
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                            Cursos de Anúncios
                        </h3>
                        <p className="text-gray-500">O jeito antigo</p>
                    </div>
                    <ul className="space-y-4">
                        {[
                            { text: "R$ 2.000 - R$ 10.000", negative: true },
                            { text: "Desatualiza em meses", negative: true },
                            { text: "Você faz tudo manual", negative: true },
                            { text: "Sem ferramentas", negative: true },
                            { text: "Taxas 3-5% checkout", negative: true },
                            { text: "Suporte limitado", negative: true },
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-3">
                                <X className="h-5 w-5 text-red-500 flex-shrink-0" />
                                <span className="text-gray-600 dark:text-gray-400">
                                    {item.text}
                                </span>
                            </li>
                        ))}
                    </ul>
                </motion.div>

                {/* SyncAds Column */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl p-8 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
                    <div className="relative z-10">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-2">
                                <Crown className="h-5 w-5 text-white" />
                                <span className="text-white font-semibold">Melhor Escolha</span>
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2">
                                SyncAds
                            </h3>
                            <p className="text-white/80">O jeito moderno</p>
                        </div>
                        <ul className="space-y-4">
                            {[
                                "A partir de R$ 97/mês",
                                "Sempre atualizado (IA)",
                                "IA faz automaticamente",
                                "Tudo integrado",
                                "Checkout 0% taxa",
                                "IA 24/7 + Suporte",
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                        <Check className="h-4 w-4 text-white" />
                                    </div>
                                    <span className="text-white font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </motion.div>
            </div>

            {/* Savings Calculator */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-12 text-center bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-3xl p-8 border border-green-200 dark:border-green-800"
            >
                <div className="max-w-2xl mx-auto">
                    <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-4">
                        Economia Estimada
                    </h4>
                    <p className="text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                        R$ 8.000+
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                        que você gastaria em cursos + R$ 500/mês em taxas de checkout
                    </p>
                </div>
            </motion.div>
        </div>
    </div>
</section>

{/* Chrome Extension Section */ }
<section className="py-24 bg-gray-900 text-white relative overflow-hidden">
    {/* Background Pattern */}
    <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:24px_24px]" />
    </div>

    <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 mb-6">
                    <Zap className="h-5 w-5 text-blue-400" />
                    <span className="text-blue-400 font-semibold">Exclusivo</span>
                </div>

                <h2 className="text-4xl sm:text-5xl font-black mb-6">
                    Extensão Chrome que Cria Anúncios Automaticamente
                </h2>

                <p className="text-xl text-gray-300 mb-8">
                    A primeira e única extensão que controla seu navegador e cria anúncios
                    diretamente no Meta Ads, Google Ads e TikTok Ads via IA.
                </p>

                <div className="space-y-4 mb-8">
                    {[
                        {
                            icon: "🎯",
                            title: "CLICK - Clique Automático",
                            desc: "IA clica em elementos da página",
                        },
                        {
                            icon: "✍️",
                            title: "FILL - Preenche Formulários",
                            desc: "Digita automaticamente informações",
                        },
                        {
                            icon: "🚀",
                            title: "NAVIGATE - Navega Entre Páginas",
                            desc: "Abre e controla múltiplas abas",
                        },
                        {
                            icon: "📸",
                            title: "SCREENSHOT - Captura Tudo",
                            desc: "Screenshots automáticas para análise",
                        },
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-start gap-4 bg-white/5 rounded-2xl p-4 border border-white/10 hover:border-blue-500/30 transition-colors"
                        >
                            <span className="text-3xl">{feature.icon}</span>
                            <div>
                                <h4 className="font-bold text-white mb-1">{feature.title}</h4>
                                <p className="text-sm text-gray-400">{feature.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <Button
                    size="lg"
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                    <Rocket className="h-5 w-5 mr-2" />
                    Instalar Extensão Grátis
                </Button>
            </motion.div>

            {/* Right Visual */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative"
            >
                {/* Chrome Browser Mockup */}
                <div className="relative bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-gray-700">
                    {/* Browser Header */}
                    <div className="bg-gray-900 px-4 py-3 flex items-center gap-2 border-b border-gray-700">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                        </div>
                        <div className="flex-1 bg-gray-800 rounded-lg px-4 py-1.5 text-sm text-gray-400">
                            facebook.com/adsmanager
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 bg-gradient-to-br from-gray-800 to-gray-900">
                        <div className="space-y-4">
                            <div className="h-12 bg-blue-500/20 rounded-lg border-2 border-blue-500 animate-pulse" />
                            <div className="h-8 bg-gray-700 rounded-lg w-3/4" />
                            <div className="h-8 bg-gray-700 rounded-lg w-1/2" />
                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="h-32 bg-purple-500/20 rounded-lg border border-purple-500/30" />
                                <div className="h-32 bg-pink-500/20 rounded-lg border border-pink-500/30" />
                            </div>
                        </div>
                    </div>

                    {/* IA Badge */}
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, 0],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                        }}
                        className="absolute -top-4 -right-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl px-6 py-3 shadow-2xl border-4 border-gray-900"
                    >
                        <div className="flex items-center gap-2">
                            <Bot className="h-6 w-6 text-white" />
                            <span className="font-black text-white">IA Criando...</span>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    </div>
</section>
