import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Globe, Link2, Database, Sparkles, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export type AIProgressStep = {
  id: string;
  type: 'search' | 'scrape' | 'api_call' | 'analysis' | 'tool_execution';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  title: string;
  details?: string;
  url?: string;
  timestamp: number;
  duration?: number;
};

type AIProgressIndicatorProps = {
  steps: AIProgressStep[];
  isActive: boolean;
};

const STEP_ICONS = {
  search: Search,
  scrape: Globe,
  api_call: Link2,
  analysis: Sparkles,
  tool_execution: Database,
};

const STATUS_COLORS = {
  pending: 'text-gray-400',
  in_progress: 'text-blue-500',
  completed: 'text-green-500',
  failed: 'text-red-500',
};

export const AIProgressIndicator: React.FC<AIProgressIndicatorProps> = ({ steps, isActive }) => {
  if (steps.length === 0 && !isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="my-2"
    >
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800 p-3">
        <div className="flex items-center gap-2 mb-3">
          <motion.div
            animate={{ rotate: isActive ? 360 : 0 }}
            transition={{ duration: 2, repeat: isActive ? Infinity : 0, ease: 'linear' }}
          >
            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </motion.div>
          <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">
            IA trabalhando...
          </span>
          {isActive && (
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Loader2 className="h-3 w-3 text-purple-600 animate-spin" />
            </motion.div>
          )}
        </div>

        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {steps.map((step, index) => {
              const Icon = STEP_ICONS[step.type];
              const isLast = index === steps.length - 1;
              
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-start gap-3 ${!isLast ? 'pb-2 border-b border-purple-200/50 dark:border-purple-800/50' : ''}`}
                >
                  {/* Status Icon */}
                  <div className="mt-0.5">
                    {step.status === 'in_progress' && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Icon className={`h-4 w-4 ${STATUS_COLORS[step.status]}`} />
                      </motion.div>
                    )}
                    {step.status === 'completed' && (
                      <CheckCircle2 className={`h-4 w-4 ${STATUS_COLORS[step.status]}`} />
                    )}
                    {step.status === 'failed' && (
                      <XCircle className={`h-4 w-4 ${STATUS_COLORS[step.status]}`} />
                    )}
                    {step.status === 'pending' && (
                      <Icon className={`h-4 w-4 ${STATUS_COLORS[step.status]}`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {step.title}
                      </p>
                      {step.status === 'in_progress' && (
                        <Badge variant="outline" className="text-xs">
                          Em andamento
                        </Badge>
                      )}
                    </div>
                    
                    {step.details && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {step.details}
                      </p>
                    )}
                    
                    {step.url && (
                      <a
                        href={step.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-flex items-center gap-1"
                      >
                        <Link2 className="h-3 w-3" />
                        {step.url.length > 50 ? step.url.substring(0, 50) + '...' : step.url}
                      </a>
                    )}

                    {step.duration && step.status === 'completed' && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {step.duration}ms
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Progress Bar */}
        {isActive && (
          <motion.div
            className="mt-3 h-1 bg-purple-200 dark:bg-purple-900 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
};
