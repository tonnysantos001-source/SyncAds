/**
 * BACKGROUNDS COMPONENTS
 *
 * Biblioteca completa de backgrounds animados e modernos para o SyncAds.
 *
 * COMPONENTES DISPONÍVEIS:
 *
 * 1. PARTICLES:
 *    - ParticlesBackground: Partículas interativas conectadas
 *    - MinimalParticles: Versão minimalista
 *    - IntenseParticles: Versão intensa
 *    - SubtleParticles: Versão sutil para cards
 *
 * 2. GRADIENTS:
 *    - AnimatedGradient: Gradiente fluido animado
 *    - StaticGradient: Gradiente estático
 *    - MeshGradient: Estilo mesh moderno
 *    - WaveGradient: Ondas animadas
 *    - GlowGradient: Efeito neon
 *
 * 3. GLASS (Glassmorphism):
 *    - GlassBackground: Background com efeito vidro
 *    - GlassCard: Card com vidro
 *    - GlassPanel: Painel lateral
 *    - GlassModalOverlay: Modal overlay
 *    - GlassButton: Botão com vidro
 *    - GlassNavbar: Navbar com vidro
 *    - GlassContainer: Container com vidro
 *    - FrostedGlass: Vidro fosco
 *
 * EXEMPLOS DE USO:
 *
 * ```tsx
 * // Background completo com partículas
 * <ParticlesBackground theme="purple" density={80} />
 *
 * // Gradiente animado
 * <AnimatedGradient variant="aurora" speed={1} />
 *
 * // Card com efeito de vidro
 * <GlassCard variant="purple">
 *   <h1>Conteúdo</h1>
 * </GlassCard>
 *
 * // Combinação (partículas + gradiente + vidro)
 * <div className="relative">
 *   <AnimatedGradient variant="aurora" />
 *   <ParticlesBackground theme="purple" density={40} />
 *   <GlassCard>Conteúdo aqui</GlassCard>
 * </div>
 * ```
 */

// ============================================
// PARTICLES
// ============================================
export {
  ParticlesBackground,
  MinimalParticles,
  IntenseParticles,
  SubtleParticles,
} from "./ParticlesBackground";

// ============================================
// GRADIENTS
// ============================================
export {
  AnimatedGradient,
  StaticGradient,
  MeshGradient,
  WaveGradient,
  GlowGradient,
} from "./AnimatedGradient";

// ============================================
// GLASS (Glassmorphism)
// ============================================
export {
  GlassBackground,
  GlassCard,
  GlassPanel,
  GlassModalOverlay,
  GlassButton,
  GlassNavbar,
  GlassContainer,
  FrostedGlass,
} from "./GlassBackground";

// ============================================
// SYNCADS CUSTOM BACKGROUND
// ============================================
export {
  SyncAdsWatermarkBg,
  CentralWatermark,
  SubtleWatermark,
  AnimatedWatermark,
  GradientOnly,
  MobileWatermark,
  RepeatedWatermark,
} from "./SyncAdsWatermarkBg";

// ============================================
// PRESETS PRONTOS
// ============================================

/**
 * Background completo para Login/Register
 * Gradiente + Partículas
 */
export { LoginBackground } from "./presets/LoginBackground";

/**
 * Background para Dashboard
 * Gradiente sutil + Partículas minimalistas
 */
export { DashboardBackground } from "./presets/DashboardBackground";

/**
 * Background para Chat IA
 * Dark + Partículas sutis
 */
export { ChatBackground } from "./presets/ChatBackground";

/**
 * Background para Landing Page
 * Gradiente animado intenso + Partículas
 */
export { LandingBackground } from "./presets/LandingBackground";

/**
 * Background para Admin Panel
 * Dark + Glass effect
 */
export { AdminBackground } from "./presets/AdminBackground";
