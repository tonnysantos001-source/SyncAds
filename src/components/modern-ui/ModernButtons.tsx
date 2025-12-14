import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: 'default' | 'gradient' | 'glass' | 'outline' | 'ghost' | 'shine' | '3d';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'purple' | 'green' | 'red' | 'orange' | 'pink' | 'gradient';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

const sizeVariants = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
};

const colorVariants = {
  blue: {
    default: 'bg-blue-500 hover:bg-blue-600 text-white',
    gradient: 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white',
    outline: 'border-2 border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950',
  },
  purple: {
    default: 'bg-purple-500 hover:bg-purple-600 text-white',
    gradient: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white',
    outline: 'border-2 border-purple-500 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950',
  },
  green: {
    default: 'bg-green-500 hover:bg-green-600 text-white',
    gradient: 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white',
    outline: 'border-2 border-green-500 text-green-500 hover:bg-green-50 dark:hover:bg-green-950',
  },
  red: {
    default: 'bg-red-500 hover:bg-red-600 text-white',
    gradient: 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white',
    outline: 'border-2 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950',
  },
  orange: {
    default: 'bg-orange-500 hover:bg-orange-600 text-white',
    gradient: 'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white',
    outline: 'border-2 border-orange-500 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950',
  },
  pink: {
    default: 'bg-pink-500 hover:bg-pink-600 text-white',
    gradient: 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white',
    outline: 'border-2 border-pink-500 text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-950',
  },
  gradient: {
    default: 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white',
    gradient: 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white',
    outline: 'border-2 border-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent hover:bg-clip-border hover:text-white',
  },
};

const roundedVariants = {
  sm: 'rounded',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  full: 'rounded-full',
};

// Botão padrão moderno
export const ModernButton: React.FC<ButtonProps> = ({
  children,
  variant = 'default',
  size = 'md',
  color = 'blue',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  rounded = 'lg',
  className,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.02 } : undefined}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      className={cn(
        'relative inline-flex items-center justify-center gap-2',
        'font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeVariants[size],
        roundedVariants[rounded],
        variant === 'gradient' ? colorVariants[color].gradient : colorVariants[color].default,
        variant === 'outline' && colorVariants[color].outline,
        variant === 'ghost' && 'hover:bg-gray-100 dark:hover:bg-gray-800',
        fullWidth && 'w-full',
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <Loader2 className="w-4 h-4 animate-spin" />
      )}
      {!loading && icon && iconPosition === 'left' && icon}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </motion.button>
  );
};

// Botão com efeito de brilho (shine)
export const ShineButton: React.FC<ButtonProps> = ({
  children,
  size = 'md',
  color = 'gradient',
  loading = false,
  disabled = false,
  fullWidth = false,
  rounded = 'lg',
  className,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.02 } : undefined}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 overflow-hidden',
        'font-semibold transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeVariants[size],
        roundedVariants[rounded],
        colorVariants[color].gradient,
        fullWidth && 'w-full',
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {/* Shine Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{
          repeat: Infinity,
          duration: 2,
          ease: 'linear',
        }}
      />

      <span className="relative z-10 flex items-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </span>
    </motion.button>
  );
};

// Botão Glassmorphism
export const GlassButton: React.FC<ButtonProps> = ({
  children,
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  rounded = 'lg',
  className,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.02, y: -2 } : undefined}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      className={cn(
        'relative inline-flex items-center justify-center gap-2',
        'backdrop-blur-md bg-white/10 border border-white/20',
        'font-medium text-white transition-all duration-200',
        'shadow-lg hover:bg-white/20 hover:shadow-xl',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeVariants[size],
        roundedVariants[rounded],
        fullWidth && 'w-full',
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </motion.button>
  );
};

// Botão 3D
export const Button3D: React.FC<ButtonProps> = ({
  children,
  size = 'md',
  color = 'blue',
  loading = false,
  disabled = false,
  fullWidth = false,
  rounded = 'lg',
  className,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={!isDisabled ? { y: -2 } : undefined}
      whileTap={!isDisabled ? { y: 0 } : undefined}
      className={cn(
        'relative inline-flex items-center justify-center gap-2',
        'font-bold text-white transition-all duration-200',
        'focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
        sizeVariants[size],
        roundedVariants[rounded],
        fullWidth && 'w-full',
        className
      )}
      style={{
        transform: 'translateY(-4px)',
        boxShadow: `0 4px 0 ${color === 'blue' ? '#1e40af' : color === 'purple' ? '#6b21a8' : '#047857'}`,
      }}
      disabled={isDisabled}
      {...props}
    >
      <div className={cn(
        'absolute inset-0',
        roundedVariants[rounded],
        color === 'blue' && 'bg-blue-500',
        color === 'purple' && 'bg-purple-500',
        color === 'green' && 'bg-green-500',
      )} />
      <span className="relative z-10 flex items-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </span>
    </motion.button>
  );
};

// Botão com borda animada
export const AnimatedBorderButton: React.FC<ButtonProps> = ({
  children,
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  rounded = 'lg',
  className,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.02 } : undefined}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 group',
        'font-semibold transition-all duration-200',
        'focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
        sizeVariants[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {/* Animated Border */}
      <div className={cn(
        'absolute -inset-0.5 rounded-lg opacity-75 group-hover:opacity-100 transition duration-500 overflow-hidden',
        roundedVariants[rounded]
      )}>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          style={{
            width: '200%',
            height: '200%',
            left: '-50%',
            top: '-50%',
          }}
        />
      </div>

      {/* Button Content */}
      <span className={cn(
        'relative z-10 inline-flex items-center justify-center gap-2',
        'bg-white dark:bg-gray-900 text-gray-900 dark:text-white',
        'w-full h-full',
        roundedVariants[rounded],
        sizeVariants[size]
      )}>
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </span>
    </motion.button>
  );
};

// Botão flutuante (FAB)
interface FABProps extends Omit<ButtonProps, 'size' | 'fullWidth'> {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'md' | 'lg';
}

const fabPositions = {
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'top-right': 'top-6 right-6',
  'top-left': 'top-6 left-6',
};

const fabSizes = {
  md: 'w-14 h-14',
  lg: 'w-16 h-16',
};

export const FloatingActionButton: React.FC<FABProps> = ({
  children,
  position = 'bottom-right',
  size = 'md',
  color = 'gradient',
  loading = false,
  disabled = false,
  className,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={!isDisabled ? { scale: 1.1, rotate: 90 } : undefined}
      whileTap={!isDisabled ? { scale: 0.9 } : undefined}
      className={cn(
        'fixed z-50',
        'rounded-full shadow-2xl',
        'inline-flex items-center justify-center',
        'font-semibold transition-all duration-200',
        'focus:outline-none focus:ring-4 focus:ring-purple-500/50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        fabPositions[position],
        fabSizes[size],
        colorVariants[color].gradient,
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : children}
    </motion.button>
  );
};

// Botão com efeito de ripple
export const RippleButton: React.FC<ButtonProps> = ({
  children,
  size = 'md',
  color = 'blue',
  loading = false,
  disabled = false,
  fullWidth = false,
  rounded = 'lg',
  className,
  ...props
}) => {
  const [ripples, setRipples] = React.useState<Array<{ x: number; y: number; id: number }>>([]);
  const isDisabled = disabled || loading;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    }, 600);

    if (props.onClick) {
      props.onClick(e);
    }
  };

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.02 } : undefined}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 overflow-hidden',
        'font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeVariants[size],
        roundedVariants[rounded],
        colorVariants[color].default,
        fullWidth && 'w-full',
        className
      )}
      disabled={isDisabled}
      {...props}
      onClick={handleClick}
    >
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full"
          initial={{
            width: 0,
            height: 0,
            x: ripple.x,
            y: ripple.y,
            opacity: 1,
          }}
          animate={{
            width: 500,
            height: 500,
            x: ripple.x - 250,
            y: ripple.y - 250,
            opacity: 0,
          }}
          transition={{ duration: 0.6 }}
        />
      ))}
      <span className="relative z-10 flex items-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </span>
    </motion.button>
  );
};

export default {
  ModernButton,
  ShineButton,
  GlassButton,
  Button3D,
  AnimatedBorderButton,
  FloatingActionButton,
  RippleButton,
};

