import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Loader2, AlertCircle, Download, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ToolStep, ToolResult } from '@/lib/ai/superAITools'

interface SuperAIProgressProps {
  result: ToolResult
  onDownload?: (downloadUrl: string, fileName: string) => void
  onRetry?: () => void
}

export const SuperAIProgress: React.FC<SuperAIProgressProps> = ({
  result,
  onDownload,
  onRetry
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(true)

  useEffect(() => {
    if (result.steps && result.steps.length > 0) {
      // Simular progresso das etapas
      const interval = setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev < result.steps!.length - 1) {
            return prev + 1
          } else {
            setIsAnimating(false)
            clearInterval(interval)
            return prev
          }
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [result.steps])

  const getStepIcon = (step: ToolStep, index: number) => {
    if (index < currentStepIndex) {
      return step.status === 'completed' ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-red-600" />
      )
    } else if (index === currentStepIndex) {
      return step.status === 'running' ? (
        <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      ) : step.status === 'completed' ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-red-600" />
      )
    } else {
      return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
    }
  }

  const getStepStatus = (step: ToolStep, index: number) => {
    if (index < currentStepIndex) {
      return step.status === 'completed' ? 'completed' : 'failed'
    } else if (index === currentStepIndex) {
      return step.status
    } else {
      return 'pending'
    }
  }

  const progressPercentage = result.steps 
    ? Math.round((currentStepIndex / result.steps.length) * 100)
    : 100

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {result.success ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <span className={result.success ? 'text-green-600' : 'text-red-600'}>
            {result.success ? 'Execução Concluída' : 'Execução Falhou'}
          </span>
        </CardTitle>
        <p className="text-sm text-gray-600">{result.message}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Barra de progresso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso</span>
            <span>{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Lista de etapas */}
        {result.steps && result.steps.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Etapas de Execução:</h4>
            <div className="space-y-2">
              {result.steps.map((step, index) => {
                const status = getStepStatus(step, index)
                const isActive = index === currentStepIndex
                
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                      isActive ? 'bg-blue-50 border border-blue-200' : ''
                    } ${
                      status === 'completed' ? 'bg-green-50' : ''
                    } ${
                      status === 'failed' ? 'bg-red-50' : ''
                    }`}
                  >
                    {getStepIcon(step, index)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          status === 'completed' ? 'text-green-700' :
                          status === 'failed' ? 'text-red-700' :
                          status === 'running' ? 'text-blue-700' :
                          'text-gray-700'
                        }`}>
                          {step.step}
                        </span>
                        
                        <Badge 
                          variant={
                            status === 'completed' ? 'default' :
                            status === 'failed' ? 'destructive' :
                            status === 'running' ? 'secondary' :
                            'outline'
                          }
                          className="text-xs"
                        >
                          {status === 'completed' ? 'Concluído' :
                           status === 'failed' ? 'Falhou' :
                           status === 'running' ? 'Executando' :
                           'Pendente'}
                        </Badge>
                      </div>
                      
                      {step.details && (
                        <p className="text-xs text-gray-600 mt-1">{step.details}</p>
                      )}
                      
                      {step.error && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3 text-red-500" />
                          <p className="text-xs text-red-600">{step.error}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Próximas ações */}
        {result.nextActions && result.nextActions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Sugestões:</h4>
            <ul className="space-y-1">
              {result.nextActions.map((action, index) => (
                <li key={index} className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="h-1 w-1 bg-gray-400 rounded-full" />
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Dados de resultado */}
        {result.data && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Resultado:</h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-2 pt-4">
          {result.data?.downloadUrl && onDownload && (
            <Button
              onClick={() => onDownload(result.data.downloadUrl, result.data.fileName)}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Arquivo
            </Button>
          )}
          
          {result.data?.url && (
            <Button
              variant="outline"
              onClick={() => window.open(result.data.url, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver Site
            </Button>
          )}
          
          {!result.success && onRetry && (
            <Button
              variant="outline"
              onClick={onRetry}
            >
              Tentar Novamente
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface SuperAIExecutionProps {
  toolName: string
  parameters: any
  userId: string
  organizationId: string
  conversationId: string
  onComplete?: (result: ToolResult) => void
}

export const SuperAIExecution: React.FC<SuperAIExecutionProps> = ({
  toolName,
  parameters,
  userId,
  organizationId,
  conversationId,
  onComplete
}) => {
  const [result, setResult] = useState<ToolResult | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeTool = async () => {
    setIsExecuting(true)
    setError(null)
    setResult(null)

    try {
      const { data, error } = await supabase.functions.invoke('super-ai-tools', {
        body: {
          toolName,
          parameters,
          userId,
          organizationId,
          conversationId
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      const toolResult = data as ToolResult
      setResult(toolResult)
      
      if (onComplete) {
        onComplete(toolResult)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsExecuting(false)
    }
  }

  useEffect(() => {
    executeTool()
  }, [])

  if (isExecuting) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <div>
              <h3 className="font-medium">Executando {toolName}</h3>
              <p className="text-sm text-gray-600">Processando solicitação...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="font-medium text-red-600">Erro na Execução</h3>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          </div>
          <Button onClick={executeTool} className="mt-4">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (result) {
    return (
      <SuperAIProgress
        result={result}
        onDownload={(url, filename) => {
          const link = document.createElement('a')
          link.href = url
          link.download = filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }}
        onRetry={executeTool}
      />
    )
  }

  return null
}
