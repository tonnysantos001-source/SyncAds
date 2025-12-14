import React, { useState } from 'react'
import { Download, FileArchive, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ZipService, ZipFile } from '@/lib/api/zipService'

interface ZipDownloadProps {
  files: ZipFile[]
  zipName?: string
  title?: string
  description?: string
  className?: string
}

export const ZipDownload: React.FC<ZipDownloadProps> = ({
  files,
  zipName = 'download.zip',
  title = 'Download de Arquivos',
  description = 'Clique para baixar os arquivos em formato ZIP',
  className = ''
}) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    if (files.length === 0) {
      setError('Nenhum arquivo para download')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const result = await ZipService.generateZip({
        files,
        zipName
      })

      setDownloadUrl(result.downloadUrl)
      
      // Trigger download
      const link = document.createElement('a')
      link.href = result.downloadUrl
      link.download = result.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar arquivo ZIP')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileArchive className="h-5 w-5 text-blue-600" />
          {title}
        </CardTitle>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lista de arquivos */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Arquivos incluídos:</h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {files.map((file, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                <FileArchive className="h-3 w-3" />
                <span className="truncate">{file.name}</span>
                <span className="text-gray-400">({file.type})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status de download */}
        {downloadUrl && (
          <Alert>
            <Download className="h-4 w-4" />
            <AlertDescription>
              Download iniciado! O arquivo expira em 1 hora.
            </AlertDescription>
          </Alert>
        )}

        {/* Erro */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Botão de download */}
        <Button 
          onClick={handleDownload}
          disabled={isGenerating || files.length === 0}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Gerando ZIP...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Baixar ZIP ({files.length} arquivo{files.length !== 1 ? 's' : ''})
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

interface QuickZipDownloadProps {
  onGenerate: () => Promise<ZipFile[]>
  zipName: string
  title?: string
  description?: string
  className?: string
}

export const QuickZipDownload: React.FC<QuickZipDownloadProps> = ({
  onGenerate,
  zipName,
  title = 'Gerar Download',
  description,
  className = ''
}) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [files, setFiles] = useState<ZipFile[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const generatedFiles = await onGenerate()
      setFiles(generatedFiles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar arquivos')
    } finally {
      setIsGenerating(false)
    }
  }

  if (files.length > 0) {
    return (
      <ZipDownload
        files={files}
        zipName={zipName}
        title={title}
        description={description}
        className={className}
      />
    )
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileArchive className="h-5 w-5 text-blue-600" />
          {title}
        </CardTitle>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Gerando arquivos...
            </>
          ) : (
            <>
              <FileArchive className="h-4 w-4 mr-2" />
              Gerar Download
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

