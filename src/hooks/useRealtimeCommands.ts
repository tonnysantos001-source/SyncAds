import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface Command {
  id: string;
  device_id: string;
  user_id: string;
  type: string;
  data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

interface UseRealtimeCommandsProps {
  userId?: string;
  onCommandUpdate?: (command: Command) => void;
  onCommandCompleted?: (command: Command) => void;
  onCommandFailed?: (command: Command) => void;
  enabled?: boolean;
}

interface UseRealtimeCommandsReturn {
  isConnected: boolean;
  lastCommand: Command | null;
  error: string | null;
  subscribe: () => void;
  unsubscribe: () => void;
}

/**
 * Hook customizado para escutar atualizações de comandos via Realtime
 * Substitui o polling manual por event-driven approach
 */
export function useRealtimeCommands({
  userId,
  onCommandUpdate,
  onCommandCompleted,
  onCommandFailed,
  enabled = true,
}: UseRealtimeCommandsProps): UseRealtimeCommandsReturn {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastCommand, setLastCommand] = useState<Command | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Callback para processar UPDATE de comandos
  const handleCommandUpdate = useCallback(
    (payload: any) => {
      console.log('📡 Realtime - Command updated:', payload);

      const command = payload.new as Command;
      setLastCommand(command);

      // Chamar callback genérico
      if (onCommandUpdate) {
        onCommandUpdate(command);
      }

      // Callbacks específicos por status
      if (command.status === 'completed' && onCommandCompleted) {
        onCommandCompleted(command);
      }

      if (command.status === 'failed' && onCommandFailed) {
        onCommandFailed(command);
      }
    },
    [onCommandUpdate, onCommandCompleted, onCommandFailed]
  );

  // Função para subscrever no canal
  const subscribe = useCallback(() => {
    if (!userId || !enabled) {
      console.log('⏭️ Realtime - Skipping subscription (no userId or disabled)');
      return;
    }

    if (channel) {
      console.log('⚠️ Realtime - Already subscribed');
      return;
    }

    console.log('🔌 Realtime - Subscribing to extension_commands channel...');

    try {
      const newChannel = supabase
        .channel(`extension-commands-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'extension_commands',
            filter: `user_id=eq.${userId}`,
          },
          handleCommandUpdate
        )
        .subscribe((status) => {
          console.log('📡 Realtime - Subscription status:', status);

          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            setError(null);
            console.log('✅ Realtime - Successfully subscribed!');
          } else if (status === 'CHANNEL_ERROR') {
            setIsConnected(false);
            setError('Failed to subscribe to realtime channel');
            console.error('❌ Realtime - Subscription error');
          } else if (status === 'TIMED_OUT') {
            setIsConnected(false);
            setError('Realtime subscription timed out');
            console.error('⏱️ Realtime - Subscription timeout');
          }
        });

      setChannel(newChannel);
    } catch (err) {
      console.error('❌ Realtime - Error subscribing:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsConnected(false);
    }
  }, [userId, enabled, channel, handleCommandUpdate]);

  // Função para desinscrever do canal
  const unsubscribe = useCallback(() => {
    if (!channel) {
      console.log('⏭️ Realtime - No channel to unsubscribe');
      return;
    }

    console.log('🔌 Realtime - Unsubscribing from channel...');

    supabase.removeChannel(channel).then(() => {
      setChannel(null);
      setIsConnected(false);
      console.log('✅ Realtime - Successfully unsubscribed');
    });
  }, [channel]);

  // Auto-subscribe quando o hook é montado
  useEffect(() => {
    if (enabled && userId) {
      subscribe();
    }

    // Cleanup ao desmontar
    return () => {
      if (channel) {
        unsubscribe();
      }
    };
  }, [enabled, userId]); // Não incluir subscribe/unsubscribe para evitar loops

  return {
    isConnected,
    lastCommand,
    error,
    subscribe,
    unsubscribe,
  };
}

/**
 * Hook simplificado para escutar apenas comandos completados
 */
export function useRealtimeCommandsCompleted(
  userId?: string,
  onCompleted?: (command: Command) => void
) {
  return useRealtimeCommands({
    userId,
    onCommandCompleted: onCompleted,
    enabled: !!userId,
  });
}

/**
 * Hook para escutar comandos de um device específico
 */
export function useRealtimeDeviceCommands(
  deviceId?: string,
  onCommandUpdate?: (command: Command) => void
) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!deviceId) return;

    const newChannel = supabase
      .channel(`device-commands-${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'extension_commands',
          filter: `device_id=eq.${deviceId},status=eq.pending`,
        },
        (payload) => {
          console.log('📡 Realtime - New command for device:', payload);
          if (onCommandUpdate) {
            onCommandUpdate(payload.new as Command);
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    setChannel(newChannel);

    return () => {
      if (newChannel) {
        supabase.removeChannel(newChannel);
      }
    };
  }, [deviceId, onCommandUpdate]);

  return { isConnected };
}
