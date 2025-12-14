/**
 * ============================================
 * ACTIVE AI INDICATOR
 * ============================================
 * Mostra qual IA está ativa, provider, modelo e tokens usados
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  IconBrandOpenai,
  IconBrain,
  IconSparkles,
  IconFlame,
  IconCircleDotFilled,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ActiveAIIndicatorProps {
  aiName?: string;
  provider?: string;
  model?: string;
  tokensUsed?: number;
  isOnline?: boolean;
  className?: string;
}

const providerIcons: Record<string, React.ReactNode> = {
  OPENAI: <IconBrandOpenai className="w-4 h-4" />,
  ANTHROPIC: <IconBrain className="w-4 h-4" />,
  GOOGLE: <IconSparkles className="w-4 h-4" />,
  GROQ: <IconFlame className="w-4 h-4" />,
  COHERE: <IconSparkles className="w-4 h-4" />,
  MISTRAL: <IconFlame className="w-4 h-4" />,
  OPENROUTER: <IconBrain className="w-4 h-4" />,
  PERPLEXITY: <IconSparkles className="w-4 h-4" />,
  TOGETHER: <IconBrain className="w-4 h-4" />,
  FIREWORKS: <IconFlame className="w-4 h-4" />,
};

const providerColors: Record<string, string> = {
  OPENAI: "from-green-500 to-emerald-600",
  ANTHROPIC: "from-orange-500 to-red-600",
  GOOGLE: "from-blue-500 to-cyan-600",
  GROQ: "from-purple-500 to-pink-600",
  COHERE: "from-indigo-500 to-purple-600",
  MISTRAL: "from-yellow-500 to-orange-600",
  OPENROUTER: "from-pink-500 to-rose-600",
  PERPLEXITY: "from-teal-500 to-cyan-600",
  TOGETHER: "from-violet-500 to-purple-600",
  FIREWORKS: "from-red-500 to-pink-600",
};

export const ActiveAIIndicator: React.FC<ActiveAIIndicatorProps> = ({
  aiName = "IA",
  provider = "OPENAI",
  model,
  tokensUsed = 0,
  isOnline = true,
  className,
}) => {
  const icon = providerIcons[provider.toUpperCase()] || (
    <IconBrain className="w-4 h-4" />
  );
  const colorGradient =
    providerColors[provider.toUpperCase()] || "from-blue-500 to-purple-600";

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {/* Badge Principal - Nome da IA */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Badge
          className={cn(
            "bg-gradient-to-r text-white border-0 shadow-lg px-3 py-1.5 gap-2 font-medium",
            colorGradient,
          )}
        >
          {icon}
          <span className="text-sm">{aiName}</span>
          {isOnline && (
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <IconCircleDotFilled className="w-3 h-3 text-green-300" />
            </motion.div>
          )}
        </Badge>
      </motion.div>

      {/* Badge Modelo */}
      {model && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Badge
            variant="outline"
            className="bg-gray-800/50 border-gray-700 text-gray-300 text-xs px-2.5 py-1"
          >
            {model}
          </Badge>
        </motion.div>
      )}

      {/* Badge Tokens */}
      {tokensUsed > 0 && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Badge
            variant="outline"
            className="bg-blue-500/10 border-blue-500/30 text-blue-400 text-xs px-2.5 py-1 gap-1"
          >
            <IconSparkles className="w-3 h-3" />
            {tokensUsed.toLocaleString()} tokens
          </Badge>
        </motion.div>
      )}

      {/* Badge Status Offline */}
      {!isOnline && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Badge
            variant="outline"
            className="bg-red-500/10 border-red-500/30 text-red-400 text-xs px-2.5 py-1 gap-1"
          >
            <IconCircleDotFilled className="w-3 h-3" />
            Offline
          </Badge>
        </motion.div>
      )}
    </div>
  );
};

export default ActiveAIIndicator;

