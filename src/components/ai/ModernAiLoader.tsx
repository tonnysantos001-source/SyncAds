import React from 'react';
import { motion } from 'framer-motion';
import {
  IconSparkles,
  IconSearch,
  IconCode,
  IconPhoto,
  IconVideo,
  IconDownload,
  IconBrain,
  IconCloudComputing,
  IconRobot,
} from '@tabler/icons-react';

interface ModernAiLoaderProps {
  type?: 'thinking' | 'searching' | 'generating-image' | 'generating-video' | 'coding' | 'downloading' | 'processing';
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const loaderConfigs = {
  thinking: {
    icon: IconBrain,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    message: 'Pensando...',
  },
  searching: {
    icon: IconSearch,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    message: 'Pesquisando na internet...',
  },
  'generating-image': {
    icon: IconPhoto,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    message: 'Gerando imagem...',
  },
  'generating-video': {
    icon: IconVideo,
    color: 'from-red-500 to-orange-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    message: 'Gerando vídeo...',
  },
  coding: {
    icon: IconCode,
    color: 'from-yellow-500 to-amber-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    message: 'Escrevendo código...',
  },
  downloading: {
    icon: IconDownload,
    color: 'from-indigo-500 to-purple-500',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    message: 'Preparando download...',
  },
  processing: {
    icon: IconCloudComputing,
    color: 'from-teal-500 to-cyan-500',
    bgColor: 'bg-teal-50 dark:bg-teal-900/20',
    borderColor: 'border-teal-200 dark:border-teal-800',
    message: 'Processando...',
  },
};

const sizeConfigs = {
  sm: {
    iconSize: 16,
    dotSize: 4,
    spacing: 'gap-2',
    padding: 'p-3',
    textSize: 'text-xs',
  },
  md: {
    iconSize: 20,
    dotSize: 6,
    spacing: 'gap-3',
    padding: 'p-4',
    textSize: 'text-sm',
  },
  lg: {
    iconSize: 24,
    dotSize: 8,
    spacing: 'gap-4',
    padding: 'p-5',
    textSize: 'text-base',
  },
};

export const ModernAiLoader: React.FC<ModernAiLoaderProps> = ({
  type = 'thinking',
  message,
  size = 'md',
}) => {
  const config = loaderConfigs[type];
  const sizeConfig = sizeConfigs[size];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`
        ${config.bgColor}
        ${config.borderColor}
        ${sizeConfig.padding}
        ${sizeConfig.spacing}
        rounded-2xl border-2 shadow-lg
        backdrop-blur-sm
        flex items-center
        max-w-md
      `}
    >
      {/* Icon with gradient and animation */}
      <motion.div
        className="relative flex-shrink-0"
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <div className={`
          bg-gradient-to-br ${config.color}
          rounded-full p-2
          shadow-lg
        `}>
          <Icon
            size={sizeConfig.iconSize}
            className="text-white"
            strokeWidth={2.5}
          />
        </div>

        {/* Pulse effect */}
        <motion.div
          className={`
            absolute inset-0 bg-gradient-to-br ${config.color}
            rounded-full opacity-30
          `}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Text and dots */}
      <div className="flex-1 flex items-center gap-2">
        <span className={`
          ${sizeConfig.textSize}
          font-medium
          bg-gradient-to-r ${config.color}
          bg-clip-text text-transparent
        `}>
          {message || config.message}
        </span>

        {/* Animated dots */}
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={`
                bg-gradient-to-br ${config.color}
                rounded-full
              `}
              style={{
                width: sizeConfig.dotSize,
                height: sizeConfig.dotSize,
              }}
              animate={{
                y: [-3, 3, -3],
                opacity: [1, 0.5, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      </div>

      {/* Robot icon on the right */}
      <motion.div
        animate={{
          y: [-2, 2, -2],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <IconRobot
          size={sizeConfig.iconSize}
          className={`text-gray-400 dark:text-gray-500`}
          strokeWidth={1.5}
        />
      </motion.div>
    </motion.div>
  );
};

// Loading bar component for progress
interface LoadingBarProps {
  progress?: number;
  message?: string;
  type?: 'thinking' | 'searching' | 'generating-image' | 'generating-video' | 'coding' | 'downloading' | 'processing';
}

export const LoadingBar: React.FC<LoadingBarProps> = ({
  progress = 0,
  message,
  type = 'thinking',
}) => {
  const config = loaderConfigs[type];

  return (
    <div className={`
      ${config.bgColor}
      ${config.borderColor}
      rounded-lg border p-4
      space-y-2
    `}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {message || config.message}
        </span>
        <span className="text-xs font-semibold text-gray-500">
          {progress}%
        </span>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${config.color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

// Floating dots loader (minimal)
export const FloatingDotsLoader: React.FC<{ color?: string }> = ({
  color = 'from-blue-500 to-purple-500',
}) => {
  return (
    <div className="flex gap-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`w-2 h-2 rounded-full bg-gradient-to-br ${color}`}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
};

