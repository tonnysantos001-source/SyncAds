import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Loader2, AlertCircle, Download, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ToolStep, ToolResult } from '@/lib/ai/superAITools'
import ToolStepsIndicator from '@/components/ai/ToolStepsIndicator'

interface SuperAIProgressProps {
  result: ToolResult & { 
    diagnosis?: any
    templateCSV?: string
  }
  onDownload?: (downloadUrl: string, fileName: string) => void
  onRetry?: () => void
  onDownloadTemplate?: (csvContent: string) => void
}

export const SuperAIProgress: React.FC<SuperAIProgressProps> = ({
  result,
  onDownload,
  onRetry,
  onDownloadTemplate
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

        {/* Lista de etapas - Usando novo componente */}
        {result.steps && result.steps.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Etapas de Execução:</h4>
            <ToolStepsIndicator steps={result.steps} showCode={true} />
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

        {/* Diagnóstico de Erro */}
        {result.diagnosis && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <h4 className="text-sm font-semibold text-yellow-900">Diagnóstico:</h4>
                <p className="text-sm text-yellow-800">{result.diagnosis.explanation}</p>
                
                {result.diagnosis.solutions && result.diagnosis.solutions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-yellow-900 mb-1">Soluções sugeridas:</p>
                    <ul className="space-y-1">
                      {result.diagnosis.solutions.map((solution: string, idx: number) => (
                        <li key={idx} className="text-xs text-yellow-700 flex items-start gap-2">
                          <span>•</span>
                          <span>{solution}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Template CSV Fallback */}
        {result.templateCSV && onDownloadTemplate && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <h4 className="text-sm font-semibold text-blue-900">
                  Template CSV Gerado
                </h4>
              </div>
            </div>
            <p className="text-xs text-blue-700 mb-3">
              Como o site não pôde ser acessado, geramos um template CSV com dados de exemplo que você pode usar.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const blob = new Blob([result.templateCSV!], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `produtos-template-${Date.now()}.csv`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(url)
              }}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Template CSV
            </Button>
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
  conversationId: string
  onComplete?: (result: ToolResult) => void
}

export const SuperAIExecution: React.FC<SuperAIExecutionProps> = ({
  toolName,
  parameters,
  userId,
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

