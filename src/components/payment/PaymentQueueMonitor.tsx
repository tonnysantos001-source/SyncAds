import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  RefreshCw,
  Ban,
  Activity,
} from 'lucide-react';
import { usePaymentQueue, PaymentJob, PaymentJobStatus } from '@/hooks/usePaymentQueue';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PaymentQueueMonitorProps {
  compact?: boolean;
  showActions?: boolean;
  limit?: number;
}

const statusConfig: Record<
  PaymentJobStatus,
  {
    label: string;
    icon: any;
    color: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  }
> = {
  PENDING: {
    label: 'Pendente',
    icon: Clock,
    color: 'text-yellow-600',
    variant: 'secondary',
  },
  PROCESSING: {
    label: 'Processando',
    icon: Loader2,
    color: 'text-blue-600',
    variant: 'default',
  },
  COMPLETED: {
    label: 'Concluído',
    icon: CheckCircle2,
    color: 'text-green-600',
    variant: 'outline',
  },
  FAILED: {
    label: 'Falhou',
    icon: XCircle,
    color: 'text-red-600',
    variant: 'destructive',
  },
  CANCELLED: {
    label: 'Cancelado',
    icon: Ban,
    color: 'text-gray-600',
    variant: 'outline',
  },
  RETRYING: {
    label: 'Tentando Novamente',
    icon: RefreshCw,
    color: 'text-orange-600',
    variant: 'secondary',
  },
};

export const PaymentQueueMonitor = ({
  compact = false,
  showActions = true,
  limit,
}: PaymentQueueMonitorProps) => {
  const {
    jobs,
    isLoading,
    cancelJob,
    getPendingCount,
    getFailedCount,
    getCompletedCount,
    refetch,
  } = usePaymentQueue();

  const [cancellingJobId, setCancellingJobId] = useState<string | null>(null);

  const displayedJobs = limit ? jobs.slice(0, limit) : jobs;
  const processingCount = jobs.filter((j) => j.status === 'PROCESSING').length;

  const handleCancelJob = async (jobId: string) => {
    setCancellingJobId(jobId);
    try {
      await cancelJob(jobId, 'Cancelado pelo usuário');
    } finally {
      setCancellingJobId(null);
    }
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), "dd/MMM 'às' HH:mm", { locale: ptBR });
    } catch {
      return date;
    }
  };

  if (compact) {
    return (
      <Card className="border-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Fila de Pagamentos</p>
                <p className="text-xs text-muted-foreground">
                  {getPendingCount()} pendentes · {processingCount} processando
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-0 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Pendentes
                  </p>
                  <p className="text-3xl font-bold">{getPendingCount()}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Processando
                  </p>
                  <p className="text-3xl font-bold">{processingCount}</p>
                </div>
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Concluídos
                  </p>
                  <p className="text-3xl font-bold">{getCompletedCount()}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="border-0 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Falhos
                  </p>
                  <p className="text-3xl font-bold">{getFailedCount()}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabela de Jobs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Jobs Recentes</CardTitle>
              <CardDescription>
                Histórico de processamento de pagamentos
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
              />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : displayedJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum job na fila</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tentativas</TableHead>
                    <TableHead>Criado</TableHead>
                    {showActions && <TableHead>Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedJobs.map((job, index) => {
                    const config = statusConfig[job.status];
                    const StatusIcon = config.icon;

                    return (
                      <motion.tr
                        key={job.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-muted/50"
                      >
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {job.id.substring(0, 8)}...
                          </code>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">
                            {job.jobType.replace(/_/g, ' ')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={config.variant} className="gap-1">
                            <StatusIcon
                              className={`h-3 w-3 ${
                                job.status === 'PROCESSING'
                                  ? 'animate-spin'
                                  : ''
                              }`}
                            />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {job.attempts}/{job.maxAttempts}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(job.createdAt)}
                          </span>
                        </TableCell>
                        {showActions && (
                          <TableCell>
                            {(job.status === 'PENDING' ||
                              job.status === 'RETRYING' ||
                              job.status === 'FAILED') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelJob(job.id)}
                                disabled={cancellingJobId === job.id}
                              >
                                {cancellingJobId === job.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Ban className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentQueueMonitor;

