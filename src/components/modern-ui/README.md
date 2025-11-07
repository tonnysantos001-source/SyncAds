# 🎨 Modern UI Components Library

Biblioteca completa de componentes modernos e animados para React, usando Framer Motion, TailwindCSS e design patterns contemporâneos.

## ✨ Características

- 🌈 **Gradientes Modernos** - Cards e botões com gradientes vibrantes
- 🪟 **Glassmorphism** - Efeitos de vidro fosco profissionais
- 🎭 **Animações Suaves** - Transições e animações com Framer Motion
- 🎯 **TypeScript** - Totalmente tipado para melhor DX
- 📱 **Responsivo** - Funciona perfeitamente em todos os tamanhos de tela
- 🎨 **Customizável** - Múltiplas variantes e opções de estilo
- ♿ **Acessível** - Seguindo boas práticas de acessibilidade
- 🌙 **Dark Mode** - Suporte nativo para tema escuro

## 📦 Componentes Disponíveis

### 🎴 Cards

#### GradientCard
Card com borda gradiente animada e efeitos de brilho.

```tsx
import { GradientCard } from '@/components/modern-ui';

<GradientCard variant="purple" glow hover>
  <h3>Título</h3>
  <p>Conteúdo do card</p>
</GradientCard>
```

**Props:**
- `variant`: `'default' | 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'rainbow'`
- `hover`: `boolean` - Habilita efeito hover
- `glow`: `boolean` - Adiciona efeito de brilho
- `animated`: `boolean` - Habilita animação de entrada

#### GradientBgCard
Card com fundo gradiente completo.

```tsx
<GradientBgCard variant="blue" glow>
  <div>Conteúdo com fundo gradiente</div>
</GradientBgCard>
```

#### AnimatedBorderCard
Card com borda gradiente que gira continuamente.

```tsx
<AnimatedBorderCard variant="rainbow">
  <div>Borda animada hipnótica</div>
</AnimatedBorderCard>
```

#### GlassmorphismCard
Card com efeito de vidro fosco.

```tsx
<GlassmorphismCard variant="colored" blur="lg" shadow>
  <h3>Glass Effect</h3>
  <p>Efeito glassmorphism moderno</p>
</GlassmorphismCard>
```

**Props:**
- `variant`: `'default' | 'light' | 'dark' | 'colored' | 'vibrant'`
- `blur`: `'sm' | 'md' | 'lg' | 'xl'`
- `border`: `boolean`
- `shadow`: `boolean`

#### GlowGlassCard
Glass card com borda iluminada.

```tsx
<GlowGlassCard>
  <div>Card com brilho externo</div>
</GlowGlassCard>
```

#### PatternGlassCard
Glass card com padrão de fundo animado.

```tsx
<PatternGlassCard>
  <div>Com padrão animado</div>
</PatternGlassCard>
```

#### LayeredGlassCard
Card com múltiplas camadas de vidro empilhadas.

```tsx
<LayeredGlassCard>
  <div>Efeito 3D de camadas</div>
</LayeredGlassCard>
```

#### MinimalGlassCard
Versão minimalista do glass card.

```tsx
<MinimalGlassCard hover>
  <div>Design minimalista</div>
</MinimalGlassCard>
```

### 🔘 Botões

#### ModernButton
Botão moderno com múltiplas variantes.

```tsx
import { ModernButton } from '@/components/modern-ui';

<ModernButton 
  variant="gradient" 
  color="purple" 
  size="lg"
  icon={<Icon />}
  loading={false}
>
  Clique Aqui
</ModernButton>
```

**Props:**
- `variant`: `'default' | 'gradient' | 'glass' | 'outline' | 'ghost' | 'shine' | '3d'`
- `color`: `'blue' | 'purple' | 'green' | 'red' | 'orange' | 'pink' | 'gradient'`
- `size`: `'sm' | 'md' | 'lg' | 'xl'`
- `loading`: `boolean`
- `icon`: `React.ReactNode`
- `iconPosition`: `'left' | 'right'`
- `fullWidth`: `boolean`
- `rounded`: `'sm' | 'md' | 'lg' | 'full'`

#### ShineButton
Botão com efeito de brilho deslizante.

```tsx
<ShineButton color="gradient" size="lg">
  Launch Now
</ShineButton>
```

#### GlassButton
Botão com efeito glassmorphism.

```tsx
<GlassButton size="md">
  Glass Effect
</GlassButton>
```

#### Button3D
Botão com efeito 3D e sombra.

```tsx
<Button3D color="blue" size="lg">
  3D Button
</Button3D>
```

#### AnimatedBorderButton
Botão com borda gradiente animada.

```tsx
<AnimatedBorderButton>
  Animated Border
</AnimatedBorderButton>
```

#### FloatingActionButton
Botão flutuante (FAB) para ações principais.

```tsx
<FloatingActionButton position="bottom-right">
  <PlusIcon />
</FloatingActionButton>
```

**Props:**
- `position`: `'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'`
- `size`: `'md' | 'lg'`

#### RippleButton
Botão com efeito ripple ao clicar.

```tsx
<RippleButton color="blue">
  Click Me!
</RippleButton>
```

### 📝 Inputs

#### ModernInput
Input moderno com múltiplas variantes.

```tsx
import { ModernInput } from '@/components/modern-ui';

<ModernInput
  label="Nome"
  placeholder="Digite seu nome"
  error="Campo obrigatório"
  success={false}
  icon={<Icon />}
  variant="default"
  inputSize="md"
  fullWidth
/>
```

**Props:**
- `variant`: `'default' | 'glass' | 'gradient' | 'minimal' | 'floating'`
- `inputSize`: `'sm' | 'md' | 'lg'`
- `error`: `string`
- `success`: `boolean`
- `helperText`: `string`
- `icon`: `React.ReactNode`
- `iconPosition`: `'left' | 'right'`

#### FloatingLabelInput
Input com label flutuante animada.

```tsx
<FloatingLabelInput
  label="E-mail"
  type="email"
  fullWidth
/>
```

#### SearchInput
Input de busca com botão de limpar.

```tsx
<SearchInput
  placeholder="Buscar..."
  onClear={() => console.log('cleared')}
  showClearButton
  fullWidth
/>
```

#### PasswordInput
Input de senha com botão para mostrar/ocultar.

```tsx
<PasswordInput
  placeholder="Digite sua senha"
  fullWidth
/>
```

#### GlassInput
Input com efeito glassmorphism.

```tsx
<GlassInput
  label="Nome"
  placeholder="Digite seu nome"
  fullWidth
/>
```

#### GradientBorderInput
Input com borda gradiente animada.

```tsx
<GradientBorderInput
  label="Input Especial"
  placeholder="Com borda animada"
  fullWidth
/>
```

#### ModernTextarea
Textarea moderna com variantes.

```tsx
<ModernTextarea
  label="Mensagem"
  placeholder="Digite sua mensagem"
  helperText="Mínimo 10 caracteres"
  variant="default"
  fullWidth
/>
```

#### AnimatedInput
Input com animação de placeholder digitando.

```tsx
<AnimatedInput
  label="Nome"
  placeholder="Digite seu nome..."
  fullWidth
/>
```

### 🎭 Efeitos e Animações

#### FloatingElement
Elemento com animação flutuante vertical.

```tsx
import { FloatingElement } from '@/components/modern-ui';

<FloatingElement duration={3} distance={20}>
  <div>Conteúdo flutuante</div>
</FloatingElement>
```

#### FloatingIcon
Ícone flutuante com rotação e pulse.

```tsx
<FloatingIcon
  icon={<RocketIcon />}
  rotate
  pulse
  duration={4}
/>
```

#### FloatingBubbles
Bolhas animadas de fundo.

```tsx
<FloatingBubbles
  count={10}
  color="from-blue-500/20 to-purple-500/20"
/>
```

#### FloatingParticles
Partículas flutuantes animadas.

```tsx
<FloatingParticles count={30} />
```

#### FloatingCard
Card com animação 3D flutuante.

```tsx
<FloatingCard perspective duration={5}>
  <div>Card 3D</div>
</FloatingCard>
```

#### OrbitingCircles
Círculos orbitando em torno de um centro.

```tsx
<OrbitingCircles
  radius={100}
  count={6}
  duration={20}
  reverse={false}
>
  {items.map(item => <div key={item}>{item}</div>)}
</OrbitingCircles>
```

#### FloatingGradient
Gradientes animados de fundo.

```tsx
<FloatingGradient
  colors={['from-blue-500', 'via-purple-500', 'to-pink-500']}
  blur="3xl"
  opacity={0.3}
/>
```

#### FloatingText
Texto com animação de digitação.

```tsx
<FloatingText
  text="Texto animado"
  delay={0}
/>
```

## 🎨 Exemplos de Uso Completos

### Dashboard Card com Glassmorphism

```tsx
import { GlowGlassCard, ModernButton } from '@/components/modern-ui';

function DashboardCard() {
  return (
    <GlowGlassCard>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold">Vendas Hoje</h3>
        <TrendingUpIcon className="w-8 h-8 text-green-400" />
      </div>
      <p className="text-4xl font-bold mb-2">R$ 12.450</p>
      <p className="text-gray-300 mb-4">+15% em relação a ontem</p>
      <ModernButton variant="gradient" color="green" fullWidth>
        Ver Detalhes
      </ModernButton>
    </GlowGlassCard>
  );
}
```

### Formulário Moderno

```tsx
import { 
  FloatingLabelInput, 
  PasswordInput, 
  ShineButton,
  GradientCard 
} from '@/components/modern-ui';

function LoginForm() {
  return (
    <GradientCard variant="purple" glow>
      <h2 className="text-3xl font-bold mb-6 text-center">Login</h2>
      <form className="space-y-6">
        <FloatingLabelInput
          label="E-mail"
          type="email"
          fullWidth
        />
        <PasswordInput
          placeholder="Senha"
          fullWidth
        />
        <ShineButton 
          color="gradient" 
          size="lg" 
          fullWidth
          type="submit"
        >
          Entrar
        </ShineButton>
      </form>
    </GradientCard>
  );
}
```

### Landing Page Hero Section

```tsx
import {
  FloatingGradient,
  FloatingBubbles,
  FloatingText,
  PatternGlassCard,
  ShineButton,
  AnimatedBorderButton
} from '@/components/modern-ui';

function HeroSection() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <FloatingGradient opacity={0.4} />
      <FloatingBubbles count={8} />
      
      <div className="relative z-10 text-center px-4">
        <FloatingText
          text="Bem-vindo ao Futuro"
          className="text-6xl font-bold mb-4"
        />
        <PatternGlassCard className="max-w-2xl mx-auto">
          <p className="text-xl mb-8">
            Transforme sua experiência com componentes modernos
          </p>
          <div className="flex gap-4 justify-center">
            <ShineButton size="xl">
              Começar Agora
            </ShineButton>
            <AnimatedBorderButton size="xl">
              Saiba Mais
            </AnimatedBorderButton>
          </div>
        </PatternGlassCard>
      </div>
    </div>
  );
}
```

## 🎯 Dicas de Uso

### Combinando Efeitos

Você pode combinar múltiplos componentes para criar experiências visuais ricas:

```tsx
<div className="relative">
  <FloatingGradient />
  <FloatingBubbles count={5} />
  
  <FloatingCard>
    <GlowGlassCard>
      <FloatingIcon icon={<StarIcon />} />
      <h3>Título Impactante</h3>
      <ShineButton>Ação Principal</ShineButton>
    </GlowGlassCard>
  </FloatingCard>
</div>
```

### Dark Mode

Todos os componentes suportam dark mode automaticamente:

```tsx
// No seu ThemeProvider ou App.tsx
<div className="dark"> {/* ou use um state */}
  <ModernButton>Funciona no escuro!</ModernButton>
</div>
```

### Customização com className

Todos os componentes aceitam className para customização adicional:

```tsx
<GradientCard className="max-w-md mx-auto mt-8">
  Conteúdo customizado
</GradientCard>
```

### Performance

Para melhor performance em páginas com muitas animações:

1. Use `animated={false}` quando não precisar de animações de entrada
2. Limite o número de `FloatingBubbles` e `FloatingParticles`
3. Use `lazy loading` para componentes pesados

```tsx
// Desabilitar animações desnecessárias
<GradientCard animated={false}>
  Conteúdo estático
</GradientCard>
```

## 🎨 Paleta de Cores

As cores disponíveis nos componentes:

- **blue**: Azul moderno e profissional
- **purple**: Roxo criativo e elegante
- **green**: Verde vibrante e natural
- **red**: Vermelho para ações críticas
- **orange**: Laranja energético
- **pink**: Rosa moderno e suave
- **gradient**: Gradiente multicolorido

## 🚀 Página de Demonstração

Acesse `/showcase` (ou onde você montar o `ModernUIShowcase`) para ver todos os componentes em ação com exemplos interativos.

## 📝 Notas

- Todos os componentes são baseados em **Framer Motion** para animações
- Usa **TailwindCSS** para estilização
- Compatível com **TypeScript**
- Suporta **React 18+**

## 🤝 Contribuindo

Para adicionar novos componentes:

1. Crie o arquivo na pasta `modern-ui/`
2. Exporte no `index.ts`
3. Adicione documentação neste README
4. Adicione exemplo no `ModernUIShowcase.tsx`

## 📄 Licença

Componentes de uso livre no projeto SyncAds.

---

**Desenvolvido com ❤️ para o SyncAds**