import React from 'react'
import { Download, FileArchive, ExternalLink, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ZipDownloadCardProps {
  downloadUrl: string
  fileName: string
  expiresAt: string
  fileCount: number
  campaignName?: string
  platform?: string
  period?: string
}

export const ZipDownloadCard: React.FC<ZipDownloadCardProps> = ({
  downloadUrl,
  fileName,
  expiresAt,
  fileCount,
  campaignName,
  platform,
  period
}) => {
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatExpiryTime = (expiresAt: string) => {
    const expiry = new Date(expiresAt)
    const now = new Date()
    const diffMs = expiry.getTime() - now.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}min`
    }
    return `${diffMinutes}min`
  }

  return (
    <Card className="w-full max-w-md bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <FileArchive className="h-8 w-8 text-blue-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium text-gray-900 truncate">
                {fileName}
              </h4>
              <Badge variant="secondary" className="text-xs">
                {fileCount} arquivo{fileCount !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            {/* Informações contextuais */}
            <div className="space-y-1 mb-3">
              {campaignName && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Campanha:</span> {campaignName}
                </p>
              )}
              {platform && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Plataforma:</span> {platform}
                </p>
              )}
              {period && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Período:</span> {period}
                </p>
              )}
            </div>
            
            {/* Tempo de expiração */}
            <div className="flex items-center gap-1 text-xs text-orange-600 mb-3">
              <Clock className="h-3 w-3" />
              <span>Expira em {formatExpiryTime(expiresAt)}</span>
            </div>
            
            {/* Botões de ação */}
            <div className="flex gap-2">
              <Button 
                onClick={handleDownload}
                size="sm"
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
              
              <Button 
                variant="outline"
                size="sm"
                onClick={() => window.open(downloadUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface ZipDownloadListProps {
  downloads: ZipDownloadCardProps[]
}

export const ZipDownloadList: React.FC<ZipDownloadListProps> = ({ downloads }) => {
  if (downloads.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <FileArchive className="h-4 w-4" />
        Downloads Disponíveis ({downloads.length})
      </h3>
      <div className="space-y-2">
        {downloads.map((download, index) => (
          <ZipDownloadCard key={index} {...download} />
        ))}
      </div>
    </div>
  )
}

