import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  GradientCard,
  GradientBgCard,
  AnimatedBorderCard,
  GlassmorphismCard,
  GlowGlassCard,
  PatternGlassCard,
  LayeredGlassCard,
  MinimalGlassCard,
  FloatingElement,
  FloatingIcon,
  FloatingBubbles,
  FloatingParticles,
  FloatingCard,
  OrbitingCircles,
  FloatingGradient,
  FloatingText,
  ModernButton,
  ShineButton,
  GlassButton,
  Button3D,
  AnimatedBorderButton,
  FloatingActionButton,
  RippleButton,
  ModernInput,
  FloatingLabelInput,
  SearchInput,
  PasswordInput,
  GlassInput,
  GradientBorderInput,
  ModernTextarea,
  AnimatedInput,
} from '@/components/modern-ui';
import {
  Sparkles,
  Rocket,
  Star,
  Zap,
  Heart,
  Send,
  Plus,
  Download,
  Save,
  Share2,
} from 'lucide-react';

const ModernUIShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cards' | 'buttons' | 'inputs' | 'effects'>('cards');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Floating Background Effects */}
      <FloatingGradient />
      <FloatingBubbles count={8} />
      <FloatingParticles count={30} />

      {/* Header */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <FloatingText
            text="✨ Modern UI Components"
            className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
          />
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Biblioteca completa de componentes modernos com animações, glassmorphism e gradientes
          </p>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex justify-center gap-4 mb-12 flex-wrap">
          {[
            { id: 'cards', label: 'Cards', icon: <Sparkles className="w-4 h-4" /> },
            { id: 'buttons', label: 'Buttons', icon: <Zap className="w-4 h-4" /> },
            { id: 'inputs', label: 'Inputs', icon: <Star className="w-4 h-4" /> },
            { id: 'effects', label: 'Effects', icon: <Rocket className="w-4 h-4" /> },
          ].map((tab) => (
            <ModernButton
              key={tab.id}
              variant={activeTab === tab.id ? 'gradient' : 'glass'}
              onClick={() => setActiveTab(tab.id as any)}
              icon={tab.icon}
              className="min-w-[120px]"
            >
              {tab.label}
            </ModernButton>
          ))}
        </div>

        {/* Content Sections */}
        <div className="space-y-16">
          {/* Cards Section */}
          {activeTab === 'cards' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Gradient Cards */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
                  <Sparkles className="w-8 h-8" />
                  Gradient Cards
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <GradientCard variant="default" glow>
                    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                      Default Gradient
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Card com borda gradiente animada e efeito de brilho.
                    </p>
                  </GradientCard>

                  <GradientCard variant="purple" hover glow>
                    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                      Purple Theme
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Tema roxo com hover effect e animação suave.
                    </p>
                  </GradientCard>

                  <GradientCard variant="rainbow" glow animated>
                    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                      Rainbow Effect
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Gradiente arco-íris com múltiplas cores.
                    </p>
                  </GradientCard>
                </div>
              </section>

              {/* Gradient Background Cards */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold mb-8">Gradient Background Cards</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <GradientBgCard variant="blue">
                    <div className="flex items-center gap-4 mb-4">
                      <Rocket className="w-12 h-12" />
                      <div>
                        <h3 className="text-2xl font-bold">Blue Gradient</h3>
                        <p className="text-white/80">Com fundo gradiente azul</p>
                      </div>
                    </div>
                    <p className="text-white/90">
                      Card com fundo gradiente completo e efeito de brilho animado.
                    </p>
                  </GradientBgCard>

                  <GradientBgCard variant="orange" glow>
                    <div className="flex items-center gap-4 mb-4">
                      <Zap className="w-12 h-12" />
                      <div>
                        <h3 className="text-2xl font-bold">Orange Gradient</h3>
                        <p className="text-white/80">Com efeito de brilho</p>
                      </div>
                    </div>
                    <p className="text-white/90">
                      Gradiente laranja vibrante com glow effect intenso.
                    </p>
                  </GradientBgCard>
                </div>
              </section>

              {/* Glassmorphism Cards */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold mb-8">Glassmorphism Cards</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <GlassmorphismCard variant="default" blur="md">
                    <h3 className="text-xl font-bold mb-2">Default Glass</h3>
                    <p className="text-gray-300">Efeito de vidro fosco padrão.</p>
                  </GlassmorphismCard>

                  <GlassmorphismCard variant="colored" blur="lg" shadow>
                    <h3 className="text-xl font-bold mb-2">Colored Glass</h3>
                    <p className="text-gray-300">Glassmorphism com cores vibrantes.</p>
                  </GlassmorphismCard>

                  <GlassmorphismCard variant="vibrant" blur="xl" shadow>
                    <h3 className="text-xl font-bold mb-2">Vibrant Glass</h3>
                    <p className="text-gray-300">Efeito vibrante com blur intenso.</p>
                  </GlassmorphismCard>
                </div>
              </section>

              {/* Special Glass Cards */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold mb-8">Special Glass Effects</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <GlowGlassCard>
                    <div className="flex items-center gap-4 mb-4">
                      <Star className="w-10 h-10" />
                      <h3 className="text-2xl font-bold">Glow Glass Card</h3>
                    </div>
                    <p className="text-gray-200">
                      Card com borda iluminada e efeito de brilho externo.
                    </p>
                  </GlowGlassCard>

                  <PatternGlassCard>
                    <div className="flex items-center gap-4 mb-4">
                      <Sparkles className="w-10 h-10" />
                      <h3 className="text-2xl font-bold">Pattern Glass Card</h3>
                    </div>
                    <p className="text-gray-200">
                      Com padrão de fundo animado e efeitos de luz flutuantes.
                    </p>
                  </PatternGlassCard>
                </div>
              </section>

              {/* Layered Glass */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold mb-8">Layered Glass Card</h2>
                <LayeredGlassCard className="max-w-2xl mx-auto">
                  <div className="flex items-center gap-4 mb-4">
                    <Heart className="w-12 h-12 text-pink-400" />
                    <h3 className="text-3xl font-bold text-white">Layered Effect</h3>
                  </div>
                  <p className="text-gray-200 text-lg">
                    Card com múltiplas camadas de vidro empilhadas, criando um efeito 3D
                    impressionante.
                  </p>
                </LayeredGlassCard>
              </section>

              {/* Animated Border Card */}
              <section>
                <h2 className="text-3xl font-bold mb-8">Animated Border Card</h2>
                <AnimatedBorderCard variant="rainbow" className="max-w-2xl mx-auto">
                  <div className="text-center">
                    <Rocket className="w-16 h-16 mx-auto mb-4 text-gray-900 dark:text-white" />
                    <h3 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                      Borda Animada
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-lg">
                      Card com borda gradiente que gira continuamente, criando um efeito
                      hipnótico e moderno.
                    </p>
                  </div>
                </AnimatedBorderCard>
              </section>
            </motion.div>
          )}

          {/* Buttons Section */}
          {activeTab === 'buttons' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Modern Buttons */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold mb-8">Modern Buttons</h2>
                <div className="flex flex-wrap gap-4">
                  <ModernButton variant="default" color="blue">
                    Default Button
                  </ModernButton>
                  <ModernButton variant="gradient" color="purple">
                    Gradient Button
                  </ModernButton>
                  <ModernButton variant="outline" color="green">
                    Outline Button
                  </ModernButton>
                  <ModernButton variant="ghost">Ghost Button</ModernButton>
                  <ModernButton color="red" icon={<Heart className="w-4 h-4" />}>
                    With Icon
                  </ModernButton>
                  <ModernButton loading color="orange">
                    Loading...
                  </ModernButton>
                </div>
              </section>

              {/* Button Sizes */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold mb-8">Button Sizes</h2>
                <div className="flex flex-wrap items-center gap-4">
                  <ModernButton size="sm" variant="gradient" color="blue">
                    Small
                  </ModernButton>
                  <ModernButton size="md" variant="gradient" color="purple">
                    Medium
                  </ModernButton>
                  <ModernButton size="lg" variant="gradient" color="pink">
                    Large
                  </ModernButton>
                  <ModernButton size="xl" variant="gradient" color="gradient">
                    Extra Large
                  </ModernButton>
                </div>
              </section>

              {/* Shine Buttons */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold mb-8">Shine Effect Buttons</h2>
                <div className="flex flex-wrap gap-4">
                  <ShineButton color="blue" icon={<Rocket className="w-5 h-5" />}>
                    Launch Now
                  </ShineButton>
                  <ShineButton color="purple" size="lg">
                    Get Started
                  </ShineButton>
                  <ShineButton color="gradient" size="xl">
                    Premium Effect
                  </ShineButton>
                </div>
              </section>

              {/* Glass Buttons */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold mb-8">Glass Buttons</h2>
                <div className="flex flex-wrap gap-4">
                  <GlassButton>Glass Effect</GlassButton>
                  <GlassButton size="lg" icon={<Star className="w-5 h-5" />}>
                    With Icon
                  </GlassButton>
                  <GlassButton loading>Loading...</GlassButton>
                </div>
              </section>

              {/* 3D Buttons */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold mb-8">3D Buttons</h2>
                <div className="flex flex-wrap gap-4">
                  <Button3D color="blue">3D Blue</Button3D>
                  <Button3D color="purple" size="lg">
                    3D Purple
                  </Button3D>
                  <Button3D color="green" icon={<Zap className="w-5 h-5" />}>
                    3D With Icon
                  </Button3D>
                </div>
              </section>

              {/* Animated Border Buttons */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold mb-8">Animated Border Buttons</h2>
                <div className="flex flex-wrap gap-4">
                  <AnimatedBorderButton>Animated Border</AnimatedBorderButton>
                  <AnimatedBorderButton size="lg">Large Size</AnimatedBorderButton>
                  <AnimatedBorderButton loading>Processing...</AnimatedBorderButton>
                </div>
              </section>

              {/* Ripple Buttons */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold mb-8">Ripple Effect Buttons</h2>
                <div className="flex flex-wrap gap-4">
                  <RippleButton color="blue">Click Me!</RippleButton>
                  <RippleButton color="purple" size="lg">
                    Ripple Large
                  </RippleButton>
                  <RippleButton color="pink" icon={<Heart className="w-5 h-5" />}>
                    With Icon
                  </RippleButton>
                </div>
              </section>

              {/* Floating Action Button */}
              <section>
                <h2 className="text-3xl font-bold mb-8">Floating Action Button</h2>
                <div className="relative h-64 bg-gray-800/50 rounded-2xl p-8">
                  <p className="text-gray-300">
                    O FAB aparecerá no canto da tela. Experimente passar o mouse!
                  </p>
                  <FloatingActionButton position="bottom-right">
                    <Plus className="w-6 h-6" />
                  </FloatingActionButton>
                </div>
              </section>
            </motion.div>
          )}

          {/* Inputs Section */}
          {activeTab === 'inputs' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto"
            >
              {/* Modern Inputs */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold mb-8">Modern Inputs</h2>
                <div className="space-y-6 bg-white/5 backdrop-blur-md rounded-2xl p-8">
                  <ModernInput
                    label="Nome Completo"
                    placeholder="Digite seu nome"
                    fullWidth
                  />
                  <ModernInput
                    label="E-mail"
                    type="email"
                    placeholder="seu@email.com"
                    icon={<Send className="w-5 h-5" />}
                    fullWidth
                  />
                  <ModernInput
                    label="Com Erro"
                    placeholder="Campo com erro"
                    error="Este campo é obrigatório"
                    fullWidth
                  />
                  <ModernInput
                    label="Com Sucesso"
                    placeholder="Campo validado"
                    success
                    helperText="Tudo certo!"
                    fullWidth
                  />
                </div>
              </section>

              {/* Floating Label Inputs */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold mb-8">Floating Label Inputs</h2>
                <div className="space-y-6 bg-white/5 backdrop-blur-md rounded-2xl p-8">
                  <FloatingLabelInput label="Nome" fullWidth />
                  <FloatingLabelInput label="E-mail" type="email" fullWidth />
                  <FloatingLabelInput
                    label="Telefone"
                    error="Número inválido"
                    fullWidth
                  />
                </div>
              </section>

              {/* Search Input */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold mb-8">Search Input</h2>
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8">
                  <SearchInput placeholder="Buscar produtos..." fullWidth />
                </div>
              </section>

              {/* Password Input */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold mb-8">Password Input</h2>
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8">
                  <PasswordInput placeholder="Digite sua senha" fullWidth />
                </div>
              </section>

              {/* Glass Inputs */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold mb-8">Glass Inputs</h2>
                <div className="space-y-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md rounded-2xl p-8">
                  <GlassInput label="Nome" placeholder="Digite seu nome" fullWidth />
                  <GlassInput
                    label="E-mail"
                    type="email"
                    placeholder="seu@email.com"
                    fullWidth
                  />
                </div>
              </section>

              {/* Gradient Border Input */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold mb-8">Gradient Border Input</h2>
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8">
                  <GradientBorderInput
                    label="Input Especial"
                    placeholder="Com borda gradiente animada"
                    fullWidth
                  />
                </div>
              </section>

              {/* Textarea */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold mb-8">Modern Textarea</h2>
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8">
                  <ModernTextarea
                    label="Mensagem"
                    placeholder="Digite sua mensagem aqui..."
                    helperText="Mínimo de 10 caracteres"
                    fullWidth
                  />
                </div>
              </section>

              {/* Input Variants */}
              <section>
                <h2 className="text-3xl font-bold mb-8">Input Variants</h2>
                <div className="space-y-6 bg-white/5 backdrop-blur-md rounded-2xl p-8">
                  <ModernInput
                    variant="default"
                    placeholder="Default variant"
                    fullWidth
                  />
                  <ModernInput
                    variant="gradient"
                    placeholder="Gradient variant"
                    fullWidth
                  />
                  <ModernInput
                    variant="minimal"
                    placeholder="Minimal variant"
                    fullWidth
                  />
                </div>
              </section>
            </motion.div>
          )}

          {/* Effects Section */}
          {activeTab === 'effects' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Floating Elements */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold mb-8">Floating Elements</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <FloatingIcon icon={<Rocket className="w-8 h-8" />} />
                  <FloatingIcon
                    icon={<Star className="w-8 h-8" />}
                    rotate
                    duration={6}
                  />
                  <FloatingIcon
                    icon={<Zap className="w-8 h-8" />}
                    pulse={false}
                    duration={5}
                  />
                  <FloatingIcon
                    icon={<Heart className="w-8 h-8" />}
                    rotate
                    pulse
                    duration={4}
                  />
                </div>
              </section>

              {/* Floating Card */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold mb-8">Floating Card</h2>
                <FloatingCard perspective className="max-w-2xl mx-auto">
                  <GlassmorphismCard>
                    <div className="text-center">
                      <Sparkles className="w-16 h-16 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold mb-2">Card Flutuante 3D</h3>
                      <p className="text-gray-300">
                        Este card flutua com perspectiva 3D e animação suave.
                      </p>
                    </div>
                  </GlassmorphismCard>
                </FloatingCard>
              </section>

              {/* Orbiting Circles */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold mb-8 text-center">Orbiting Circles</h2>
                <div className="flex justify-center">
                  <OrbitingCircles
                    radius={120}
                    count={6}
                    duration={15}
                    iconSize={50}
                  >
                    {[
                      <Rocket key="1" className="w-8 h-8 text-blue-400" />,
                      <Star key="2" className="w-8 h-8 text-yellow-400" />,
                      <Zap key="3" className="w-8 h-8 text-purple-400" />,
                      <Heart key="4" className="w-8 h-8 text-pink-400" />,
                      <Sparkles key="5" className="w-8 h-8 text-cyan-400" />,
                      <Send key="6" className="w-8 h-8 text-green-400" />,
                    ].map((icon, i) => (
                      <div
                        key={i}
                        className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center"
                      >
                        {icon}
                      </div>
                    ))}
                  </OrbitingCircles>
                </div>
              </section>

              {/* Floating Text Animation */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold mb-8 text-center">Animated Text</h2>
                <div className="text-center space-y-4">
                  <FloatingText
                    text="Texto com animação de digitação"
                    className="text-2xl font-bold"
                    delay={0}
                  />
                  <FloatingText
                    text="Cada letra aparece uma por vez"
                    className="text-xl text-gray-300"
                    delay={1}
                  />
                  <FloatingText
                    text="Criando um efeito suave e profissional"
                    className="text-lg text-gray-400"
                    delay={2}
                  />
                </div>
              </section>

              {/* Combined Effects */}
              <section>
                <h2 className="text-3xl font-bold mb-8 text-center">
                  Combined Effects Example
                </h2>
                <div className="relative min-h-[500px] rounded-3xl overflow-hidden">
                  <FloatingGradient opacity={0.4} />
                  <FloatingBubbles count={5} color="from-cyan-500/30 to-blue-500/30" />
                  <FloatingParticles count={40} />

                  <div className="relative z-10 p-12">
                    <div className="max-w-3xl mx-auto">
                      <FloatingCard>
                        <PatternGlassCard>
                          <div className="text-center">
                            <FloatingIcon
                              icon={<Sparkles className="w-12 h-12" />}
                              className="mx-auto mb-6"
                            />
                            <h3 className="text-4xl font-bold mb-4">
                              Combinação de Efeitos
                            </h3>
                            <p className="text-xl text-gray-200 mb-8">
                              Todos os efeitos trabalhando juntos para criar uma experiência
                              visual impressionante.
                            </p>
                            <div className="flex gap-4 justify-center flex-wrap">
                              <ShineButton size="lg" icon={<Download className="w-5 h-5" />}>
                                Download
                              </ShineButton>
                              <AnimatedBorderButton size="lg">
                                Learn More
                              </AnimatedBorderButton>
                              <GlassButton size="lg" icon={<Share2 className="w-5 h-5" />}>
                                Share
                              </GlassButton>
                            </div>
                          </div>
                        </PatternGlassCard>
                      </FloatingCard>
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="text-center mt-20 pb-12"
        >
          <MinimalGlassCard className="max-w-2xl mx-auto">
            <p className="text-gray-300 text-lg">
              🎨 <strong>Biblioteca Completa de UI Moderna</strong>
            </p>
            <p className="text-gray-400 mt-2">
              Todos os componentes são totalmente customizáveis e responsivos
            </p>
          </MinimalGlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default ModernUIShowcase;
