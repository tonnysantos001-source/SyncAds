import { CheckCircle2, Loader2, XCircle, Code2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Step {
  step: string;
  status: 'running' | 'completed' | 'failed';
  details?: string;
  error?: string;
  current_step?: string;
  strategy?: string;
  code_to_execute?: string;
}

interface ToolStepsIndicatorProps {
  steps: Step[];
  showCode?: boolean;
}

export default function ToolStepsIndicator({ steps, showCode = true }: ToolStepsIndicatorProps) {
  if (!steps || steps.length === 0) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isLastCompleted = (index: number) => {
    const currentStep = steps[index];
    const nextStep = steps[index + 1];
    return currentStep.status === 'completed' && 
           (!nextStep || nextStep.status === 'running' || nextStep.status === 'failed');
  };

  return (
    <div className="mb-4 space-y-2">
      {steps.map((step, index) => (
        <Card 
          key={index} 
          className={cn(
            "border transition-all",
            isLastCompleted(index) && "ring-2 ring-blue-500 ring-opacity-50"
          )}
        >
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              {/* Ícone de Status */}
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon(step.status)}
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0 space-y-2">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-gray-900">
                        {step.step}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", getStatusBadge(step.status))}
                      >
                        {step.status === 'completed' && '✓ Concluído'}
                        {step.status === 'running' && '⏳ Em execução'}
                        {step.status === 'failed' && '✗ Falhou'}
                      </Badge>
                      {step.current_step && (
                        <Badge variant="secondary" className="text-xs">
                          {step.current_step}
                        </Badge>
                      )}
                    </div>

                    {/* Details */}
                    {step.details && (
                      <p className="text-xs text-gray-600 mt-1">
                        {step.details}
                      </p>
                    )}
                  </div>
                </div>

                {/* Código Executado */}
                {showCode && step.code_to_execute && (
                  <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Code2 className="h-3 w-3 text-gray-500" />
                      <span className="text-xs font-medium text-gray-600">Código:</span>
                    </div>
                    <code className="text-xs text-gray-700 break-all">
                      {step.code_to_execute.length > 100 
                        ? `${step.code_to_execute.substring(0, 100)}...`
                        : step.code_to_execute
                      }
                    </code>
                  </div>
                )}

                {/* Strategy */}
                {step.strategy && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      Estratégia: {step.strategy}
                    </Badge>
                  </div>
                )}

                {/* Error */}
                {step.error && step.status === 'failed' && (
                  <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                    <p className="text-xs text-red-700 font-medium">Erro:</p>
                    <p className="text-xs text-red-600 mt-1">{step.error}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Progress Bar */}
      <div className="flex items-center gap-2 px-2">
        <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ 
              width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%` 
            }}
          />
        </div>
        <span className="text-xs text-gray-500">
          {steps.filter(s => s.status === 'completed').length}/{steps.length} concluídos
        </span>
      </div>
    </div>
  );
}

