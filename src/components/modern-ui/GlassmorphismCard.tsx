import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassmorphismCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  variant?: 'default' | 'light' | 'dark' | 'colored' | 'vibrant';
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  border?: boolean;
  shadow?: boolean;
  hover?: boolean;
  animated?: boolean;
  className?: string;
}

const blurVariants = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
  xl: 'backdrop-blur-xl',
};

const variantStyles = {
  default: 'bg-white/10 border-white/20',
  light: 'bg-white/20 border-white/30',
  dark: 'bg-black/20 border-black/30',
  colored: 'bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 border-white/20',
  vibrant: 'bg-gradient-to-br from-cyan-500/30 via-purple-500/30 to-pink-500/30 border-white/30',
};

const shadowVariants = {
  default: 'shadow-lg shadow-black/10',
  light: 'shadow-xl shadow-black/5',
  dark: 'shadow-2xl shadow-black/20',
  colored: 'shadow-xl shadow-purple-500/20',
  vibrant: 'shadow-2xl shadow-pink-500/30',
};

export const GlassmorphismCard: React.FC<GlassmorphismCardProps> = ({
  children,
  variant = 'default',
  blur = 'md',
  border = true,
  shadow = true,
  hover = true,
  animated = true,
  className,
  ...props
}) => {
  return (
    <motion.div
      initial={animated ? { opacity: 0, y: 20 } : false}
      animate={animated ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      whileHover={hover ? { scale: 1.02, y: -5 } : undefined}
      className={cn(
        'relative rounded-2xl p-6',
        blurVariants[blur],
        variantStyles[variant],
        border && 'border',
        shadow && shadowVariants[variant],
        'transition-all duration-300',
        className
      )}
      {...props}
    >
      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Highlight Effect on Hover */}
      {hover && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 pointer-events-none"
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  );
};

// Glassmorphism Card com efeito de borda iluminada
export const GlowGlassCard: React.FC<GlassmorphismCardProps> = ({
  children,
  variant = 'colored',
  blur = 'lg',
  animated = true,
  className,
  ...props
}) => {
  return (
    <motion.div
      initial={animated ? { opacity: 0, scale: 0.9 } : false}
      animate={animated ? { opacity: 1, scale: 1 } : false}
      transition={{ duration: 0.5 }}
      className={cn('relative group', className)}
      {...props}
    >
      {/* Glowing Border */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl opacity-75 group-hover:opacity-100 blur-sm transition duration-500" />

      {/* Glass Card */}
      <div className={cn(
        'relative rounded-2xl p-6',
        blurVariants[blur],
        variantStyles[variant],
        'border border-white/20'
      )}>
        {children}
      </div>
    </motion.div>
  );
};

// Glassmorphism Card com padrão de fundo animado
export const PatternGlassCard: React.FC<GlassmorphismCardProps> = ({
  children,
  variant = 'vibrant',
  blur = 'md',
  animated = true,
  className,
  ...props
}) => {
  return (
    <motion.div
      initial={animated ? { opacity: 0 } : false}
      animate={animated ? { opacity: 1 } : false}
      transition={{ duration: 0.8 }}
      className={cn(
        'relative rounded-2xl p-6 overflow-hidden',
        blurVariants[blur],
        variantStyles[variant],
        'border border-white/20',
        'shadow-2xl',
        className
      )}
      {...props}
    >
      {/* Animated Background Pattern */}
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)
          `,
          backgroundSize: '200% 200%',
        }}
      />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Floating Light Effect */}
      <motion.div
        className="absolute top-0 left-0 w-64 h-64 bg-gradient-radial from-white/20 to-transparent rounded-full blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      />
    </motion.div>
  );
};

// Glassmorphism Card com efeito de layers
export const LayeredGlassCard: React.FC<GlassmorphismCardProps> = ({
  children,
  variant = 'light',
  blur = 'lg',
  animated = true,
  className,
  ...props
}) => {
  return (
    <div className={cn('relative', className)} {...props}>
      {/* Background Layers */}
      <motion.div
        initial={animated ? { opacity: 0, x: -20 } : false}
        animate={animated ? { opacity: 1, x: 0 } : false}
        transition={{ duration: 0.5 }}
        className={cn(
          'absolute -inset-4 rounded-3xl',
          blurVariants[blur],
          'bg-white/5 border border-white/10',
          'transform rotate-3'
        )}
      />

      <motion.div
        initial={animated ? { opacity: 0, x: -10 } : false}
        animate={animated ? { opacity: 1, x: 0 } : false}
        transition={{ duration: 0.5, delay: 0.1 }}
        className={cn(
          'absolute -inset-2 rounded-2xl',
          blurVariants[blur],
          'bg-white/5 border border-white/10',
          'transform -rotate-2'
        )}
      />

      {/* Main Card */}
      <motion.div
        initial={animated ? { opacity: 0, scale: 0.95 } : false}
        animate={animated ? { opacity: 1, scale: 1 } : false}
        transition={{ duration: 0.5, delay: 0.2 }}
        whileHover={{ scale: 1.02, rotate: 0 }}
        className={cn(
          'relative rounded-2xl p-6',
          blurVariants[blur],
          variantStyles[variant],
          'border border-white/20',
          'shadow-2xl',
          'transition-all duration-300'
        )}
      >
        {children}
      </motion.div>
    </div>
  );
};

// Glassmorphism Card minimalista
export const MinimalGlassCard: React.FC<GlassmorphismCardProps> = ({
  children,
  blur = 'md',
  hover = true,
  className,
  ...props
}) => {
  return (
    <motion.div
      whileHover={hover ? { y: -2 } : undefined}
      className={cn(
        'rounded-xl p-5',
        blurVariants[blur],
        'bg-white/10 dark:bg-white/5',
        'border border-white/20 dark:border-white/10',
        'shadow-lg hover:shadow-xl',
        'transition-all duration-300',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default GlassmorphismCard;

