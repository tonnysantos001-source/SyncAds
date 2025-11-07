import React, { useState, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Search, X, Check, AlertCircle } from 'lucide-react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  variant?: 'default' | 'glass' | 'gradient' | 'minimal' | 'floating';
  inputSize?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

const sizeVariants = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-5 py-3 text-lg',
};

const roundedVariants = {
  sm: 'rounded',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  full: 'rounded-full',
};

// Input Moderno Padrão
export const ModernInput = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      success,
      helperText,
      icon,
      iconPosition = 'left',
      variant = 'default',
      inputSize = 'md',
      fullWidth = false,
      rounded = 'lg',
      className,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const inputClasses = cn(
      'w-full transition-all duration-200',
      'focus:outline-none',
      sizeVariants[inputSize],
      roundedVariants[rounded],
      icon && iconPosition === 'left' && 'pl-10',
      icon && iconPosition === 'right' && 'pr-10',
      // Variant styles
      variant === 'default' &&
        'bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400',
      variant === 'glass' &&
        'bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:bg-white/20',
      variant === 'gradient' &&
        'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-2 border-transparent focus:border-blue-500',
      variant === 'minimal' &&
        'bg-transparent border-b-2 border-gray-300 dark:border-gray-700 rounded-none focus:border-blue-500',
      // Error/Success states
      error && 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200',
      success && 'border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-200',
      className
    );

    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        {label && variant !== 'floating' && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div
              className={cn(
                'absolute top-1/2 -translate-y-1/2 text-gray-400',
                iconPosition === 'left' ? 'left-3' : 'right-3'
              )}
            >
              {icon}
            </div>
          )}

          <motion.input
            ref={ref}
            className={inputClasses}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            whileFocus={{ scale: 1.01 }}
            {...props}
          />

          {/* Status Icons */}
          {error && !icon && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
          )}
          {success && !icon && !error && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
          )}

          {/* Focus Border Animation */}
          {isFocused && variant !== 'minimal' && (
            <motion.div
              className="absolute inset-0 rounded-lg border-2 border-blue-500 pointer-events-none"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </div>

        {/* Helper Text / Error Message */}
        {(helperText || error) && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'mt-1 text-sm',
              error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {error || helperText}
          </motion.p>
        )}
      </div>
    );
  }
);

ModernInput.displayName = 'ModernInput';

// Floating Label Input
export const FloatingLabelInput = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      success,
      inputSize = 'md',
      fullWidth = false,
      rounded = 'lg',
      className,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

    const isLabelFloating = isFocused || hasValue;

    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        <motion.input
          ref={ref}
          className={cn(
            'peer w-full bg-transparent pt-6 pb-2 px-4',
            'border-2 border-gray-300 dark:border-gray-700',
            'focus:border-blue-500 dark:focus:border-blue-400',
            'focus:outline-none transition-all duration-200',
            roundedVariants[rounded],
            error && 'border-red-500 focus:border-red-500',
            success && 'border-green-500 focus:border-green-500',
            className
          )}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          onChange={(e) => {
            setHasValue(!!e.target.value);
            props.onChange?.(e);
          }}
          {...props}
        />

        {label && (
          <motion.label
            className={cn(
              'absolute left-4 transition-all duration-200 pointer-events-none',
              isLabelFloating
                ? 'top-2 text-xs font-medium text-blue-500'
                : 'top-1/2 -translate-y-1/2 text-base text-gray-500'
            )}
            animate={{
              y: isLabelFloating ? 0 : 0,
              fontSize: isLabelFloating ? '0.75rem' : '1rem',
            }}
          >
            {label}
          </motion.label>
        )}

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-sm text-red-500"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

FloatingLabelInput.displayName = 'FloatingLabelInput';

// Search Input
interface SearchInputProps extends Omit<InputProps, 'icon' | 'iconPosition'> {
  onClear?: () => void;
  showClearButton?: boolean;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      onClear,
      showClearButton = true,
      inputSize = 'md',
      fullWidth = false,
      rounded = 'full',
      className,
      ...props
    },
    ref
  ) => {
    const [value, setValue] = useState('');

    const handleClear = () => {
      setValue('');
      onClear?.();
    };

    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

        <motion.input
          ref={ref}
          type="search"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            props.onChange?.(e);
          }}
          className={cn(
            'w-full pl-12 pr-12',
            'bg-gray-100 dark:bg-gray-800',
            'border-2 border-transparent',
            'focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900',
            'focus:outline-none transition-all duration-200',
            sizeVariants[inputSize],
            roundedVariants[rounded],
            className
          )}
          whileFocus={{ scale: 1.02 }}
          {...props}
        />

        {showClearButton && value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            type="button"
          >
            <X className="w-5 h-5" />
          </motion.button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

// Password Input
export const PasswordInput = forwardRef<HTMLInputElement, InputProps>(
  ({ inputSize = 'md', fullWidth = false, rounded = 'lg', className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        <motion.input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          className={cn(
            'w-full pr-12',
            'bg-white dark:bg-gray-900',
            'border-2 border-gray-300 dark:border-gray-700',
            'focus:border-blue-500 dark:focus:border-blue-400',
            'focus:outline-none transition-all duration-200',
            sizeVariants[inputSize],
            roundedVariants[rounded],
            className
          )}
          whileFocus={{ scale: 1.01 }}
          {...props}
        />

        <motion.button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </motion.button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

// Glass Input
export const GlassInput = forwardRef<HTMLInputElement, InputProps>(
  ({ label, inputSize = 'md', fullWidth = false, rounded = 'lg', className, ...props }, ref) => {
    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        {label && (
          <label className="block text-sm font-medium text-white/80 mb-2">{label}</label>
        )}

        <motion.div
          className="relative"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <input
            ref={ref}
            className={cn(
              'w-full',
              'bg-white/10 backdrop-blur-md',
              'border border-white/20',
              'text-white placeholder:text-white/60',
              'focus:bg-white/20 focus:border-white/40',
              'focus:outline-none focus:ring-2 focus:ring-white/30',
              'transition-all duration-200',
              sizeVariants[inputSize],
              roundedVariants[rounded],
              className
            )}
            {...props}
          />

          {/* Shine Effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none rounded-lg"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: 'linear',
            }}
          />
        </motion.div>
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';

// Gradient Border Input
export const GradientBorderInput = forwardRef<HTMLInputElement, InputProps>(
  ({ label, inputSize = 'md', fullWidth = false, rounded = 'lg', className, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
          </label>
        )}

        <div className="relative group">
          {/* Gradient Border */}
          <div
            className={cn(
              'absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500',
              'opacity-50 group-hover:opacity-100 transition duration-300',
              isFocused && 'opacity-100 animate-pulse'
            )}
          />

          {/* Input */}
          <input
            ref={ref}
            className={cn(
              'relative w-full',
              'bg-white dark:bg-gray-900',
              'focus:outline-none transition-all duration-200',
              sizeVariants[inputSize],
              roundedVariants[rounded],
              className
            )}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
        </div>
      </div>
    );
  }
);

GradientBorderInput.displayName = 'GradientBorderInput';

// Modern Textarea
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  rounded?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glass' | 'gradient';
}

export const ModernTextarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      rounded = 'lg',
      variant = 'default',
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
          </label>
        )}

        <motion.textarea
          ref={ref}
          className={cn(
            'w-full px-4 py-3 min-h-[100px] resize-y',
            'focus:outline-none transition-all duration-200',
            roundedVariants[rounded],
            variant === 'default' &&
              'bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 focus:border-blue-500',
            variant === 'glass' &&
              'bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:bg-white/20',
            variant === 'gradient' &&
              'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-2 border-transparent focus:border-blue-500',
            error && 'border-red-500 focus:border-red-500',
            className
          )}
          whileFocus={{ scale: 1.01 }}
          {...props}
        />

        {(helperText || error) && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'mt-1 text-sm',
              error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {error || helperText}
          </motion.p>
        )}
      </div>
    );
  }
);

ModernTextarea.displayName = 'ModernTextarea';

// Animated Input (with typing effect)
export const AnimatedInput = forwardRef<HTMLInputElement, InputProps>(
  ({ label, placeholder, inputSize = 'md', fullWidth = false, className, ...props }, ref) => {
    const [displayPlaceholder, setDisplayPlaceholder] = useState('');
    const [index, setIndex] = useState(0);

    React.useEffect(() => {
      if (placeholder && index < placeholder.length) {
        const timeout = setTimeout(() => {
          setDisplayPlaceholder((prev) => prev + placeholder[index]);
          setIndex((prev) => prev + 1);
        }, 100);
        return () => clearTimeout(timeout);
      }
    }, [index, placeholder]);

    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
          </label>
        )}

        <motion.input
          ref={ref}
          placeholder={displayPlaceholder}
          className={cn(
            'w-full',
            'bg-white dark:bg-gray-900',
            'border-2 border-gray-300 dark:border-gray-700',
            'focus:border-blue-500 focus:outline-none',
            'transition-all duration-200',
            sizeVariants[inputSize],
            'rounded-lg',
            className
          )}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          whileFocus={{ scale: 1.02 }}
          {...props}
        />
      </div>
    );
  }
);

AnimatedInput.displayName = 'AnimatedInput';

export default {
  ModernInput,
  FloatingLabelInput,
  SearchInput,
  PasswordInput,
  GlassInput,
  GradientBorderInput,
  ModernTextarea,
  AnimatedInput,
};
