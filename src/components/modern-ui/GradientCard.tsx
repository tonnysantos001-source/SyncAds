import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GradientCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  variant?: 'default' | 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'rainbow';
  hover?: boolean;
  glow?: boolean;
  animated?: boolean;
  className?: string;
}

const gradientVariants = {
  default: 'from-blue-500 via-purple-500 to-pink-500',
  purple: 'from-purple-500 via-pink-500 to-purple-600',
  blue: 'from-blue-400 via-cyan-500 to-blue-600',
  green: 'from-green-400 via-emerald-500 to-teal-600',
  orange: 'from-orange-400 via-red-500 to-pink-600',
  pink: 'from-pink-400 via-rose-500 to-purple-600',
  rainbow: 'from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500',
};

const glowVariants = {
  default: 'shadow-[0_0_50px_rgba(59,130,246,0.5)]',
  purple: 'shadow-[0_0_50px_rgba(168,85,247,0.5)]',
  blue: 'shadow-[0_0_50px_rgba(96,165,250,0.5)]',
  green: 'shadow-[0_0_50px_rgba(52,211,153,0.5)]',
  orange: 'shadow-[0_0_50px_rgba(251,146,60,0.5)]',
  pink: 'shadow-[0_0_50px_rgba(244,114,182,0.5)]',
  rainbow: 'shadow-[0_0_50px_rgba(139,92,246,0.6)]',
};

export const GradientCard: React.FC<GradientCardProps> = ({
  children,
  variant = 'default',
  hover = true,
  glow = false,
  animated = true,
  className,
  ...props
}) => {
  return (
    <motion.div
      initial={animated ? { opacity: 0, y: 20 } : false}
      animate={animated ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.5 }}
      whileHover={hover ? { scale: 1.02, y: -5 } : undefined}
      className={cn('relative group', className)}
      {...props}
    >
      {/* Gradient Border Effect */}
      <div className={cn(
        'absolute -inset-0.5 rounded-2xl opacity-75 group-hover:opacity-100 transition duration-500',
        'bg-gradient-to-r',
        gradientVariants[variant],
        glow && glowVariants[variant],
        animated && 'animate-pulse group-hover:animate-none'
      )} />

      {/* Card Content */}
      <div className={cn(
        'relative bg-white dark:bg-gray-900 rounded-2xl p-6',
        'border border-gray-200 dark:border-gray-800',
        'transition-all duration-300'
      )}>
        {children}
      </div>
    </motion.div>
  );
};

// Variante com gradiente de fundo
export const GradientBgCard: React.FC<GradientCardProps> = ({
  children,
  variant = 'default',
  hover = true,
  glow = false,
  animated = true,
  className,
  ...props
}) => {
  return (
    <motion.div
      initial={animated ? { opacity: 0, scale: 0.95 } : false}
      animate={animated ? { opacity: 1, scale: 1 } : false}
      transition={{ duration: 0.5 }}
      whileHover={hover ? { scale: 1.03 } : undefined}
      className={cn(
        'relative overflow-hidden rounded-2xl p-6',
        'bg-gradient-to-br',
        gradientVariants[variant],
        glow && glowVariants[variant],
        'transition-all duration-300',
        className
      )}
      {...props}
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-white">
        {children}
      </div>

      {/* Shine Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{
          repeat: Infinity,
          duration: 3,
          ease: 'linear',
        }}
      />
    </motion.div>
  );
};

// Card com borda animada
export const AnimatedBorderCard: React.FC<GradientCardProps> = ({
  children,
  variant = 'default',
  className,
  ...props
}) => {
  return (
    <div className={cn('relative group', className)} {...props}>
      {/* Animated Border */}
      <div className="absolute -inset-0.5 rounded-2xl overflow-hidden">
        <motion.div
          className={cn(
            'absolute inset-0 bg-gradient-to-r',
            gradientVariants[variant]
          )}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            width: '200%',
            height: '200%',
            left: '-50%',
            top: '-50%',
          }}
        />
      </div>

      {/* Card Content */}
      <div className={cn(
        'relative bg-white dark:bg-gray-900 rounded-2xl p-6',
        'transition-all duration-300'
      )}>
        {children}
      </div>
    </div>
  );
};

export default GradientCard;

