import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/use-toast';

export type PaymentJobType =
  | 'PAYMENT_PROCESS'
  | 'SUBSCRIPTION_RENEWAL'
  | 'PAYMENT_REFUND'
  | 'PAYMENT_RETRY'
  | 'WEBHOOK_PROCESS'
  | 'PIX_VERIFICATION'
  | 'CHECKOUT_VALIDATION';

export type PaymentJobStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'RETRYING';

export type PaymentJobPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface PaymentJob {
  id: string;
  jobType: PaymentJobType;
  status: PaymentJobStatus;
  priority: PaymentJobPriority;
  payload: any;
  result?: any;
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: string;
  lastAttemptAt?: string;
  userId?: string;
  orderId?: string;
  transactionId?: string;
  error?: string;
  errorDetails?: any;
  processingStartedAt?: string;
  processingCompletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnqueueJobParams {
  jobType: PaymentJobType;
  payload: any;
  priority?: PaymentJobPriority;
  orderId?: string;
  maxAttempts?: number;
}

export interface UsePaymentQueueReturn {
  // Mutations
  enqueueJob: (params: EnqueueJobParams) => Promise<string>;
  cancelJob: (jobId: string, reason?: string) => Promise<boolean>;

  // Queries
  jobs: PaymentJob[];
  isLoading: boolean;
  error: Error | null;

  // Status helpers
  getPendingCount: () => number;
  getFailedCount: () => number;
  getCompletedCount: () => number;

  // Refetch
  refetch: () => void;
}

export const usePaymentQueue = (): UsePaymentQueueReturn => {
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar jobs do usuário
  const {
    data: jobs = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['payment-queue', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error: queryError } = await supabase
        .from('PaymentQueue')
        .select('*')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false })
        .limit(50);

      if (queryError) {
        console.error('Error fetching payment queue:', queryError);
        throw queryError;
      }

      return (data || []) as PaymentJob[];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 60 * 1000, // Refetch a cada 1 minuto
  });

  // Mutation para enfileirar job
  const enqueueMutation = useMutation({
    mutationFn: async (params: EnqueueJobParams) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error: rpcError } = await supabase.rpc(
        'enqueue_payment_job',
        {
          p_job_type: params.jobType,
          p_payload: params.payload,
          p_priority: params.priority || 'MEDIUM',
          p_user_id: user.id,
          p_order_id: params.orderId || null,
          p_max_attempts: params.maxAttempts || 3,
        }
      );

      if (rpcError) {
        console.error('Error enqueuing job:', rpcError);
        throw rpcError;
      }

      return data as string; // Job ID
    },
    onSuccess: (jobId) => {
      // Invalidar cache para atualizar lista
      queryClient.invalidateQueries({ queryKey: ['payment-queue', user?.id] });

      toast({
        title: 'Job enfileirado',
        description: `Job ${jobId.substring(0, 8)}... adicionado à fila`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao enfileirar job',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation para cancelar job
  const cancelMutation = useMutation({
    mutationFn: async ({ jobId, reason }: { jobId: string; reason?: string }) => {
      const { data, error: rpcError } = await supabase.rpc('cancel_payment_job', {
        p_job_id: jobId,
        p_reason: reason || null,
      });

      if (rpcError) {
        console.error('Error cancelling job:', rpcError);
        throw rpcError;
      }

      return data as boolean;
    },
    onSuccess: (_, variables) => {
      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ['payment-queue', user?.id] });

      toast({
        title: 'Job cancelado',
        description: `Job ${variables.jobId.substring(0, 8)}... foi cancelado`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao cancelar job',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Helpers para contar jobs por status
  const getPendingCount = () =>
    jobs.filter((j) => j.status === 'PENDING' || j.status === 'RETRYING').length;

  const getFailedCount = () => jobs.filter((j) => j.status === 'FAILED').length;

  const getCompletedCount = () =>
    jobs.filter((j) => j.status === 'COMPLETED').length;

  return {
    // Mutations
    enqueueJob: (params) => enqueueMutation.mutateAsync(params),
    cancelJob: (jobId, reason) =>
      cancelMutation.mutateAsync({ jobId, reason }),

    // Queries
    jobs,
    isLoading,
    error: error as Error | null,

    // Status helpers
    getPendingCount,
    getFailedCount,
    getCompletedCount,

    // Refetch
    refetch,
  };
};

// Hook para monitorar um job específico
export const usePaymentJob = (jobId: string) => {
  return useQuery({
    queryKey: ['payment-job', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('PaymentQueue')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        console.error('Error fetching payment job:', error);
        throw error;
      }

      return data as PaymentJob;
    },
    enabled: !!jobId,
    staleTime: 10 * 1000, // 10 segundos
    refetchInterval: (data) => {
      // Parar de refetch se o job estiver completo
      if (
        data?.status === 'COMPLETED' ||
        data?.status === 'FAILED' ||
        data?.status === 'CANCELLED'
      ) {
        return false;
      }
      return 5 * 1000; // Refetch a cada 5 segundos se ainda estiver pendente/processando
    },
  });
};

// Hook helper para enfileirar pagamento de pedido
export const useEnqueuePayment = () => {
  const { enqueueJob } = usePaymentQueue();

  return {
    enqueuePayment: async (orderId: string, amount: number, method: string) => {
      return await enqueueJob({
        jobType: 'PAYMENT_PROCESS',
        payload: {
          orderId,
          amount,
          method,
        },
        priority: 'HIGH',
        orderId,
      });
    },
  };
};

// Hook helper para enfileirar renovação de assinatura
export const useEnqueueSubscriptionRenewal = () => {
  const { enqueueJob } = usePaymentQueue();

  return {
    enqueueRenewal: async (subscriptionId: string) => {
      return await enqueueJob({
        jobType: 'SUBSCRIPTION_RENEWAL',
        payload: {
          subscriptionId,
        },
        priority: 'MEDIUM',
      });
    },
  };
};

// Hook helper para enfileirar verificação de PIX
export const useEnqueuePixVerification = () => {
  const { enqueueJob } = usePaymentQueue();

  return {
    enqueuePixVerification: async (orderId: string, pixCode: string) => {
      return await enqueueJob({
        jobType: 'PIX_VERIFICATION',
        payload: {
          orderId,
          pixCode,
        },
        priority: 'MEDIUM',
        orderId,
        maxAttempts: 10, // Verificar PIX várias vezes
      });
    },
  };
};

export default usePaymentQueue;
