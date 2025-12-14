import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FloatingElementProps {
  children?: React.ReactNode;
  duration?: number;
  delay?: number;
  className?: string;
  distance?: number;
}

// Elemento flutuante básico com movimento vertical
export const FloatingElement: React.FC<FloatingElementProps> = ({
  children,
  duration = 3,
  delay = 0,
  distance = 20,
  className,
}) => {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -distance, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
};

// Ícone flutuante com rotação suave
interface FloatingIconProps extends FloatingElementProps {
  icon: React.ReactNode;
  rotate?: boolean;
  pulse?: boolean;
}

export const FloatingIcon: React.FC<FloatingIconProps> = ({
  icon,
  duration = 4,
  delay = 0,
  distance = 15,
  rotate = false,
  pulse = true,
  className,
}) => {
  return (
    <motion.div
      className={cn(
        'inline-flex items-center justify-center',
        'rounded-full p-4',
        'bg-white/10 backdrop-blur-md',
        'border border-white/20',
        'shadow-lg',
        className
      )}
      animate={{
        y: [0, -distance, 0],
        rotate: rotate ? [0, 360] : 0,
        scale: pulse ? [1, 1.1, 1] : 1,
      }}
      transition={{
        y: {
          duration,
          delay,
          repeat: Infinity,
          ease: 'easeInOut',
        },
        rotate: rotate ? {
          duration: duration * 2,
          repeat: Infinity,
          ease: 'linear',
        } : {},
        scale: pulse ? {
          duration: duration / 2,
          repeat: Infinity,
          ease: 'easeInOut',
        } : {},
      }}
    >
      {icon}
    </motion.div>
  );
};

// Bolhas flutuantes de fundo
interface FloatingBubbleProps {
  count?: number;
  className?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeVariants = {
  sm: 'w-16 h-16',
  md: 'w-32 h-32',
  lg: 'w-48 h-48',
  xl: 'w-64 h-64',
};

export const FloatingBubbles: React.FC<FloatingBubbleProps> = ({
  count = 5,
  className,
  color = 'from-blue-500/20 to-purple-500/20',
}) => {
  const bubbles = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: ['sm', 'md', 'lg', 'xl'][Math.floor(Math.random() * 4)] as 'sm' | 'md' | 'lg' | 'xl',
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 5,
    duration: 10 + Math.random() * 10,
  }));

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {bubbles.map((bubble) => (
        <motion.div
          key={bubble.id}
          className={cn(
            'absolute rounded-full blur-3xl',
            'bg-gradient-to-br',
            color,
            sizeVariants[bubble.size]
          )}
          style={{
            left: bubble.left,
            top: '100%',
          }}
          animate={{
            y: [0, -window.innerHeight - 200],
            x: [0, Math.random() * 100 - 50],
            scale: [1, 1.2, 1],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: bubble.duration,
            delay: bubble.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
};

// Partículas flutuantes
interface FloatingParticlesProps {
  count?: number;
  className?: string;
}

export const FloatingParticles: React.FC<FloatingParticlesProps> = ({
  count = 20,
  className,
}) => {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: 2 + Math.random() * 4,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    duration: 5 + Math.random() * 10,
    delay: Math.random() * 5,
  }));

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-white/40"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -50, 0],
            x: [0, Math.random() * 30 - 15, 0],
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// Card flutuante com animação 3D
interface FloatingCardProps extends FloatingElementProps {
  children: React.ReactNode;
  perspective?: boolean;
}

export const FloatingCard: React.FC<FloatingCardProps> = ({
  children,
  duration = 5,
  delay = 0,
  perspective = true,
  className,
}) => {
  return (
    <motion.div
      className={cn(
        'relative',
        perspective && 'perspective-1000',
        className
      )}
      animate={{
        y: [0, -20, 0],
        rotateX: perspective ? [0, 5, 0] : 0,
        rotateY: perspective ? [0, 5, 0] : 0,
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      whileHover={{
        scale: 1.05,
        rotateX: 0,
        rotateY: 0,
      }}
    >
      {children}
    </motion.div>
  );
};

// Círculos orbitando
interface OrbitingCirclesProps {
  radius?: number;
  count?: number;
  duration?: number;
  reverse?: boolean;
  className?: string;
  iconSize?: number;
  children?: React.ReactNode[];
}

export const OrbitingCircles: React.FC<OrbitingCirclesProps> = ({
  radius = 100,
  count = 6,
  duration = 20,
  reverse = false,
  iconSize = 40,
  children,
  className,
}) => {
  const items = children || Array.from({ length: count }, (_, i) => (
    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
  ));

  return (
    <div className={cn('relative', className)} style={{ width: radius * 2, height: radius * 2 }}>
      {items.map((item, index) => {
        const angle = (360 / items.length) * index;
        return (
          <motion.div
            key={index}
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
              marginLeft: -iconSize / 2,
              marginTop: -iconSize / 2,
            }}
            animate={{
              rotate: reverse ? -360 : 360,
            }}
            transition={{
              duration,
              repeat: Infinity,
              ease: 'linear',
              delay: (duration / items.length) * index,
            }}
          >
            <motion.div
              style={{
                transform: `rotate(${angle}deg) translateX(${radius}px) rotate(${-angle}deg)`,
              }}
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: index * 0.2,
              }}
            >
              {item}
            </motion.div>
          </motion.div>
        );
      })}

      {/* Centro */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 shadow-2xl"
          animate={{
            scale: [1, 1.1, 1],
            rotate: reverse ? 360 : -360,
          }}
          transition={{
            scale: {
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            },
            rotate: {
              duration: duration / 2,
              repeat: Infinity,
              ease: 'linear',
            },
          }}
        />
      </div>
    </div>
  );
};

// Gradiente flutuante de fundo
interface FloatingGradientProps {
  colors?: string[];
  blur?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  opacity?: number;
  className?: string;
}

const blurSizes = {
  sm: 'blur-sm',
  md: 'blur-md',
  lg: 'blur-lg',
  xl: 'blur-xl',
  '2xl': 'blur-2xl',
  '3xl': 'blur-3xl',
};

export const FloatingGradient: React.FC<FloatingGradientProps> = ({
  colors = ['from-blue-500', 'via-purple-500', 'to-pink-500'],
  blur = '3xl',
  opacity = 0.3,
  className,
}) => {
  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      <motion.div
        className={cn(
          'absolute w-96 h-96 rounded-full',
          'bg-gradient-to-br',
          ...colors,
          blurSizes[blur]
        )}
        style={{ opacity }}
        animate={{
          x: ['-25%', '125%'],
          y: ['-25%', '125%'],
          scale: [1, 1.5, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className={cn(
          'absolute w-96 h-96 rounded-full',
          'bg-gradient-to-br',
          'from-cyan-500 via-teal-500 to-green-500',
          blurSizes[blur]
        )}
        style={{ opacity }}
        animate={{
          x: ['125%', '-25%'],
          y: ['125%', '-25%'],
          scale: [1.5, 1, 1.5],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className={cn(
          'absolute w-96 h-96 rounded-full',
          'bg-gradient-to-br',
          'from-orange-500 via-red-500 to-pink-500',
          blurSizes[blur]
        )}
        style={{ opacity }}
        animate={{
          x: ['50%', '50%'],
          y: ['-25%', '125%'],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        }}
      />
    </div>
  );
};

// Texto flutuante com efeito de digitação
interface FloatingTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export const FloatingText: React.FC<FloatingTextProps> = ({
  text,
  className,
  delay = 0,
}) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
    >
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: delay + index * 0.03,
          }}
        >
          {char}
        </motion.span>
      ))}
    </motion.div>
  );
};

export default {
  FloatingElement,
  FloatingIcon,
  FloatingBubbles,
  FloatingParticles,
  FloatingCard,
  OrbitingCircles,
  FloatingGradient,
  FloatingText,
};

