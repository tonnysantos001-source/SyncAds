import { motion } from "framer-motion";
import {
    Lightbulb,
    Palette,
    Store,
    Rocket,
    MessageCircle,
    Puzzle,
    Globe,
    Award,
    Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const JornadaSection = () => {
    const steps = [
        {
            icon: Lightbulb,
            title: "1. Ideia & Validação",
            desc: "Você tem uma ideia. A IA valida o mercado, sugere nichos e cria o plano de negócios completo.",
            color: "blue",
        },
        {
            icon: Palette,
            title: "2. Criação Visual",
            desc: "IA gera logotipos, imagens de produtos e vídeos virais para seus anúncios. Sem designers.",
            color: "purple",
        },
        {
            icon: Store,
            title: "3. Loja & Checkout",
            desc: "Conecte sua loja ou clone uma existente. Ative o checkout transparente com 0% de taxa.",
            color: "pink",
        },
        {
            icon: Rocket,
            title: "4. Tráfego Automático (Ads)",
            desc: "Nossa extensão Chrome cria, publica e otimiza anúncios no Facebook, Google e TikTok sozinha.",
            color: "orange",
        },
        {
            icon: MessageCircle,
            title: "5. CRM & Escala",
            desc: "IA responde clientes no WhatsApp e E-mail Marketing, recupera boletos e escala suas vendas.",
            color: "green",
        },
    ];

    return (
        <section className="py-24 bg-white dark:bg-gray-950 relative overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-20"
                >
                    <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-6">
                        Sua Ideia vira Realidade em Minutos
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                        A única plataforma que cobre TODA a jornada: da criação à escala.
                        Você foca na estratégia, a IA executa o trabalho duro.
                    </p>
                </motion.div>

                <div className="relative max-w-4xl mx-auto">
                    {/* Connecting Line */}
                    <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 opacity-20 md:-translate-x-1/2" />

                    <div className="space-y-12">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className={`relative flex flex-col md:flex-row gap-8 items-start md:items-center ${index % 2 === 0 ? "md:flex-row-reverse" : ""
                                    }`}
                            >
                                {/* Content */}
                                <div className="flex-1 pl-16 md:pl-0 md:text-right">
                                    <div className={index % 2 === 0 ? "md:text-left" : "md:text-right"}>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                            {step.title}
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400 text-lg">
                                            {step.desc}
                                        </p>
                                    </div>
                                </div>

                                {/* Icon Marker */}
                                <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 flex items-center justify-center w-14 h-14 rounded-full bg-white dark:bg-gray-900 border-4 border-gray-100 dark:border-gray-800 z-10 shadow-xl">
                                    <step.icon
                                        className={`h-6 w-6 text-${step.color}-500`}
                                    />
                                </div>

                                {/* Empty Space for Grid */}
                                <div className="flex-1 hidden md:block" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export const ApiSection = () => {
    return (
        <section className="py-24 bg-gray-50 dark:bg-gray-900 relative">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 font-semibold mb-6">
                            <Puzzle className="h-5 w-5" />
                            Biblioteca de APIs
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-6">
                            "IA, conecta meu Gateway favorito..."
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                            Não se limite. Nossa IA possui uma biblioteca vasta de APIs e pode
                            adicionar novas integrações sob demanda. Se existe uma API, nós
                            conectamos.
                        </p>
                        <ul className="space-y-4 mb-8">
                            {[
                                "Gateways de Pagamento (55+ opções)",
                                "Ferramentas de Email Marketing",
                                "CRMs e ERPs",
                                "Plataformas de Logística",
                                "Tracker e Analytics",
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <Zap className="h-4 w-4 text-green-600" />
                                    </div>
                                    <span className="text-gray-700 dark:text-gray-200 font-medium">
                                        {item}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                            Ver Todas Integrações
                        </Button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="grid grid-cols-3 gap-4"
                    >
                        {/* Logos Grid Mockup - Using placeholders/icons for layout */}
                        {Array.from({ length: 9 }).map((_, i) => (
                            <div
                                key={i}
                                className="aspect-square bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:scale-105 transition-transform"
                            >
                                <Globe className="h-10 w-10 text-gray-400" />
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export const PioneerSection = () => {
    return (
        <section className="py-24 bg-gradient-to-br from-blue-900 to-indigo-900 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-400/20 backdrop-blur-md border border-yellow-400/50 mb-8">
                        <Award className="h-10 w-10 text-yellow-400" />
                    </div>
                    <h2 className="text-4xl sm:text-6xl font-black mb-6">
                        O Primeiro Gestor Pessoal com IA do Brasil 🇧🇷
                    </h2>
                    <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-10">
                        Esqueça agências caras e ferramentas complexas. SyncAds é a primeira
                        plataforma que coloca um Gestor de Tráfego Senior IA,
                        Designer Sênior IA e Copywriter Sênior IA trabalhando EXCLUSIVAMENTE
                        para você, 24/7.
                    </p>
                    <div className="flex flex-wrap justify-center gap-6">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl px-6 py-4 border border-white/20">
                            <p className="text-3xl font-bold">100%</p>
                            <p className="text-blue-200 text-sm">Automático</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl px-6 py-4 border border-white/20">
                            <p className="text-3xl font-bold">Sem Censura</p>
                            <p className="text-blue-200 text-sm">Liberdade Total</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl px-6 py-4 border border-white/20">
                            <p className="text-3xl font-bold">Pioneiro</p>
                            <p className="text-blue-200 text-sm">Brasil</p>
                        </div>
                    </div>

                    <div className="mt-12">
                        <Button size="lg" asChild className="bg-white text-blue-900 hover:bg-gray-100 text-lg px-8 py-6 rounded-full font-bold shadow-xl">
                            <Link to="/register">
                                Quero Ter Vantagem Competitiva Agora
                            </Link>
                        </Button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
