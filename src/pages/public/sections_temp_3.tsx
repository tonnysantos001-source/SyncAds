// Seção 3: IA Multimodal - 10 Modais

{/* AI Multimodal Section */ }
<section className="py-24 relative overflow-hidden">
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
                Crie Qualquer Conteúdo. Sem Censura.
            </motion.h2>
            <motion.p
                variants={fadeInUp}
                className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
            >
                10 modais profissionais integrados para criar imagens, vídeos, áudio e código sem limites
            </motion.p>
        </motion.div>

        {/* Modals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
                {
                    title: "Imagens IA",
                    icon: "🎨",
                    desc: "Geração via IA, edição profissional, remoção de fundo",
                    gradient: "from-pink-500 to-rose-500",
                    badge: "Sem Censura"
                },
                {
                    title: "Vídeos",
                    icon: "🎬",
                    desc: "Criação e edição, legendas automáticas, cortes inteligentes",
                    gradient: "from-purple-500 to-indigo-500",
                    badge: "Sem Limites"
                },
                {
                    title: "Áudio",
                    icon: "🎵",
                    desc: "Processamento profissional, narração via IA, conversão",
                    gradient: "from-blue-500 to-cyan-500",
                    badge: "100% Livre"
                },
                {
                    title: "Código",
                    icon: "💻",
                    desc: "Editor integrado, syntax highlighting, auto-complete",
                    gradient: "from-green-500 to-emerald-500",
                },
                {
                    title: "Editor Visual",
                    icon: "🎯",
                    desc: "Drag-and-drop, templates prontos, preview em tempo real",
                    gradient: "from-orange-500 to-amber-500",
                },
                {
                    title: "Chat IA",
                    icon: "💬",
                    desc: "Assistente 24/7, contexto inteligente, multi-turn",
                    gradient: "from-violet-500 to-purple-500",
                },
            ].map((modal, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="relative group"
                >
                    <div className={`absolute inset-0 bg-gradient-to-br ${modal.gradient} rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity`} />
                    <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-6 border-2 border-gray-200 dark:border-gray-800 hover:border-blue-500/50 transition-colors">
                        {modal.badge && (
                            <div className="absolute -top-3 -right-3">
                                <div className="px-3 py-1 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold">
                                    {modal.badge}
                                </div>
                            </div>
                        )}
                        <div className="text-5xl mb-4">{modal.icon}</div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                            {modal.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            {modal.desc}
                        </p>
                    </div>
                </motion.div>
            ))}
        </div>

        {/* CTA */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
        >
            <Button
                size="lg"
                asChild
                className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white shadow-2xl"
            >
                <Link to="/register">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Começar a Criar Agora
                </Link>
            </Button>
        </motion.div>
    </div>
</section>
