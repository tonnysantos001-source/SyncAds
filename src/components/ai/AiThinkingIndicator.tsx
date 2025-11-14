import {
  Sparkles,
  Globe,
  Download,
  Code2,
  Wifi,
  WifiOff,
  Image,
  Video,
  FileText,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SonicIcon from "./SonicIcon";
import { ModernAiLoader, FloatingDotsLoader } from "./ModernAiLoader";
import { motion, AnimatePresence } from "framer-motion";

interface AiThinkingIndicatorProps {
  isThinking: boolean;
  currentTool?:
    | "web_search"
    | "web_scraping"
    | "python_exec"
    | "generate_image"
    | "generate_video"
    | "create_file"
    | null;
  reasoning?: string;
  sources?: string[];
  status?: "thinking" | "success" | "error" | "processing";
  connectionStatus?: {
    platform: string;
    isConnected: boolean;
  };
  progress?: number;
  modernStyle?: boolean;
}

export default function AiThinkingIndicator({
  isThinking,
  currentTool,
  reasoning,
  sources,
  status = "thinking",
  connectionStatus,
  progress,
  modernStyle = true,
}: AiThinkingIndicatorProps) {
  if (!isThinking) return null;

  // Determinar emoção do Sonic baseado no status
  const getEmotion = () => {
    switch (status) {
      case "success":
        return "happy";
      case "error":
        return "angry";
      default:
        return "thinking";
    }
  };

  const getToolIcon = () => {
    switch (currentTool) {
      case "web_search":
        return <Search className="h-4 w-4" />;
      case "web_scraping":
        return <Download className="h-4 w-4" />;
      case "python_exec":
        return <Code2 className="h-4 w-4" />;
      case "generate_image":
        return <Image className="h-4 w-4" />;
      case "generate_video":
        return <Video className="h-4 w-4" />;
      case "create_file":
        return <FileText className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getToolName = () => {
    switch (currentTool) {
      case "web_search":
        return "Pesquisando na internet";
      case "web_scraping":
        return "Coletando dados";
      case "python_exec":
        return "Executando código";
      case "generate_image":
        return "Gerando imagem";
      case "generate_video":
        return "Gerando vídeo";
      case "create_file":
        return "Criando arquivo";
      default:
        return "Pensando";
    }
  };

  const getLoaderType = () => {
    switch (currentTool) {
      case "web_search":
        return "searching";
      case "generate_image":
        return "generating-image";
      case "generate_video":
        return "generating-video";
      case "python_exec":
        return "coding";
      case "create_file":
        return "downloading";
      case "web_scraping":
        return "processing";
      default:
        return "thinking";
    }
  };

  const getGradientColors = () => {
    switch (status) {
      case "success":
        return "from-green-50 to-emerald-50 border-green-200";
      case "error":
        return "from-red-50 to-pink-50 border-red-200";
      default:
        return "from-blue-50 to-purple-50 border-blue-200";
    }
  };

  // Se modernStyle estiver ativo, usar novo loader
  if (modernStyle) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`mb-4 p-5 bg-gradient-to-br ${getGradientColors()} rounded-2xl border-2 shadow-xl backdrop-blur-sm`}
        >
          {/* Header com Sonic e Loader Moderno */}
          <div className="flex items-start gap-4 mb-4">
            {/* Sonic Icon 3D */}
            <motion.div
              animate={{
                y: [0, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <SonicIcon emotion={getEmotion()} size={56} />
            </motion.div>

            {/* Modern Loader */}
            <div className="flex-1">
              <ModernAiLoader
                type={getLoaderType() as any}
                message={getToolName()}
                size="md"
              />
            </div>
          </div>

          {/* Progress Bar */}
          {progress !== undefined && progress > 0 && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              className="mb-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">
                  Progresso
                </span>
                <span className="text-xs font-bold text-blue-600">
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          )}

          {/* Raciocínio da IA */}
          {reasoning && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-3 p-4 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-blue-100 dark:border-blue-800 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {reasoning}
                </p>
              </div>
            </motion.div>
          )}

          {/* Fontes sendo consultadas */}
          {sources && sources.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-blue-500" />
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Fontes consultadas:
                </p>
              </div>
              <div className="grid gap-2">
                {sources.map((source, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60 rounded-lg px-3 py-2 backdrop-blur-sm"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="truncate flex-1">{source}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Status de Conexão */}
          {connectionStatus && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-center gap-2">
                {connectionStatus.isConnected ? (
                  <>
                    <Wifi className="h-4 w-4 text-green-500 animate-pulse" />
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                      {connectionStatus.platform} conectado
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-red-500" />
                    <span className="text-xs font-medium text-red-600 dark:text-red-400">
                      {connectionStatus.platform} não conectado
                    </span>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  // Estilo clássico (fallback)
  return (
    <div
      className={`mb-4 p-4 bg-gradient-to-r ${getGradientColors()} rounded-lg border`}
    >
      <div className="flex items-start gap-3">
        {/* Ícone Sonic 3D */}
        <div className="relative flex-shrink-0 flex items-center justify-center">
          <SonicIcon emotion={getEmotion()} size={48} />
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="gap-2">
              {getToolIcon()}
              {getToolName()}
              <FloatingDotsLoader />
            </Badge>
          </div>

          {/* Raciocínio */}
          {reasoning && (
            <div className="mb-3 p-3 bg-white/60 rounded-lg border border-blue-100">
              <p className="text-sm text-gray-700">{reasoning}</p>
            </div>
          )}

          {/* Fontes */}
          {sources && sources.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-600 mb-1">
                Fontes consultadas:
              </p>
              {sources.map((source, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-xs text-gray-600"
                >
                  <Globe className="h-3 w-3" />
                  <span className="truncate">{source}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status de Conexão */}
      {connectionStatus && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <div className="flex items-center gap-2">
            {connectionStatus.isConnected ? (
              <>
                <Wifi className="h-3 w-3 text-green-500" />
                <span className="text-xs text-gray-600">
                  {connectionStatus.platform} conectado
                </span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-red-500" />
                <span className="text-xs text-gray-600">
                  {connectionStatus.platform} não conectado
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
