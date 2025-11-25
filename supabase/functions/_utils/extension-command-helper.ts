// ============================================================================
// EXTENSION COMMAND HELPER - Gerencia comandos para a extensão
// ============================================================================
// Cria e gerencia comandos DOM na tabela extension_commands
// ============================================================================

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DomCommand } from './dom-command-detector.ts';

export interface ExtensionCommand {
  id?: string;
  device_id: string;
  user_id: string;
  command_type: string;
  params: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  created_at?: string;
  executed_at?: string;
}

/**
 * Cria um comando na tabela extension_commands
 */
export async function createExtensionCommand(
  supabase: SupabaseClient,
  userId: string,
  deviceId: string,
  command: DomCommand
): Promise<{ success: boolean; commandId?: string; error?: string }> {
  try {
    console.log('📝 Criando comando para extensão:', {
      userId,
      deviceId,
      type: command.type,
      params: command.params,
    });

    // Validar device_id
    if (!deviceId) {
      throw new Error('device_id é obrigatório');
    }

    // Validar e sanitizar params
    const sanitizedParams = sanitizeParams(command.params);

    // Inserir comando
    const { data, error } = await supabase
      .from('extension_commands')
      .insert({
        device_id: deviceId,
        user_id: userId,
        command_type: command.type,
        params: sanitizedParams,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('❌ Erro ao criar comando:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('✅ Comando criado com sucesso:', data.id);

    return {
      success: true,
      commandId: data.id,
    };
  } catch (error) {
    console.error('❌ Erro ao criar comando:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Cria múltiplos comandos em sequência
 */
export async function createExtensionCommands(
  supabase: SupabaseClient,
  userId: string,
  deviceId: string,
  commands: DomCommand[]
): Promise<{ success: boolean; commandIds: string[]; errors: string[] }> {
  const commandIds: string[] = [];
  const errors: string[] = [];

  for (const command of commands) {
    const result = await createExtensionCommand(supabase, userId, deviceId, command);

    if (result.success && result.commandId) {
      commandIds.push(result.commandId);
    } else if (result.error) {
      errors.push(result.error);
    }
  }

  return {
    success: commandIds.length > 0,
    commandIds,
    errors,
  };
}

/**
 * Busca device_id ativo do usuário
 */
export async function getUserActiveDevice(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  try {
    console.log('🔍 Buscando device ativo para usuário:', userId);

    // Buscar device mais recente que está online
    const { data, error } = await supabase
      .from('extension_devices')
      .select('device_id, last_seen, status')
      .eq('user_id', userId)
      .eq('status', 'online')
      .order('last_seen', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('❌ Erro ao buscar device:', error);
      return null;
    }

    if (!data) {
      console.warn('⚠️ Nenhum device ativo encontrado para usuário:', userId);
      return null;
    }

    // Verificar se o device está realmente ativo (último ping < 5 minutos)
    const lastSeen = new Date(data.last_seen);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);

    if (diffMinutes > 5) {
      console.warn('⚠️ Device está offline (último ping há', diffMinutes.toFixed(1), 'minutos)');
      return null;
    }

    console.log('✅ Device ativo encontrado:', data.device_id);
    return data.device_id;
  } catch (error) {
    console.error('❌ Erro ao buscar device:', error);
    return null;
  }
}

/**
 * Verifica status de um comando
 */
export async function getCommandStatus(
  supabase: SupabaseClient,
  commandId: string
): Promise<ExtensionCommand | null> {
  try {
    const { data, error } = await supabase
      .from('extension_commands')
      .select('*')
      .eq('id', commandId)
      .single();

    if (error) {
      console.error('❌ Erro ao buscar status do comando:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar comando:', error);
    return null;
  }
}

/**
 * Aguarda execução do comando (com timeout)
 */
export async function waitForCommandExecution(
  supabase: SupabaseClient,
  commandId: string,
  timeoutMs: number = 30000
): Promise<{ success: boolean; result?: any; error?: string }> {
  const startTime = Date.now();
  const pollInterval = 1000; // 1 segundo

  while (Date.now() - startTime < timeoutMs) {
    const command = await getCommandStatus(supabase, commandId);

    if (!command) {
      return { success: false, error: 'Comando não encontrado' };
    }

    if (command.status === 'completed') {
      return {
        success: true,
        result: command.result,
      };
    }

    if (command.status === 'failed') {
      return {
        success: false,
        error: command.error || 'Comando falhou',
      };
    }

    // Aguardar antes de verificar novamente
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  return {
    success: false,
    error: 'Timeout: comando não foi executado a tempo',
  };
}

/**
 * Sanitiza params do comando
 */
function sanitizeParams(params: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(params)) {
    // Remover funções
    if (typeof value === 'function') {
      continue;
    }

    // Limitar tamanho de strings
    if (typeof value === 'string') {
      sanitized[key] = value.substring(0, 10000);
    }
    // Sanitizar objetos recursivamente
    else if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        sanitized[key] = value.slice(0, 100); // Limitar arrays
      } else {
        sanitized[key] = sanitizeParams(value);
      }
    }
    // Manter outros tipos primitivos
    else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Limpa comandos antigos (maintenance)
 */
export async function cleanupOldCommands(
  supabase: SupabaseClient,
  daysOld: number = 7
): Promise<{ deleted: number }> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await supabase
      .from('extension_commands')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('❌ Erro ao limpar comandos antigos:', error);
      return { deleted: 0 };
    }

    console.log(`🧹 Limpeza: ${data?.length || 0} comandos antigos removidos`);
    return { deleted: data?.length || 0 };
  } catch (error) {
    console.error('❌ Erro na limpeza de comandos:', error);
    return { deleted: 0 };
  }
}

/**
 * Cancela comandos pendentes
 */
export async function cancelPendingCommands(
  supabase: SupabaseClient,
  deviceId: string
): Promise<{ cancelled: number }> {
  try {
    const { data, error } = await supabase
      .from('extension_commands')
      .update({ status: 'failed', error: 'Cancelado pelo usuário' })
      .eq('device_id', deviceId)
      .eq('status', 'pending')
      .select('id');

    if (error) {
      console.error('❌ Erro ao cancelar comandos:', error);
      return { cancelled: 0 };
    }

    console.log(`🚫 ${data?.length || 0} comandos cancelados`);
    return { cancelled: data?.length || 0 };
  } catch (error) {
    console.error('❌ Erro ao cancelar comandos:', error);
    return { cancelled: 0 };
  }
}

/**
 * Obtém estatísticas de comandos
 */
export async function getCommandStats(
  supabase: SupabaseClient,
  deviceId: string,
  hoursBack: number = 24
): Promise<{
  total: number;
  pending: number;
  completed: number;
  failed: number;
  avgExecutionTime?: number;
}> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hoursBack);

    const { data, error } = await supabase
      .from('extension_commands')
      .select('status, created_at, executed_at')
      .eq('device_id', deviceId)
      .gte('created_at', cutoffDate.toISOString());

    if (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      return { total: 0, pending: 0, completed: 0, failed: 0 };
    }

    const stats = {
      total: data.length,
      pending: data.filter((c) => c.status === 'pending').length,
      completed: data.filter((c) => c.status === 'completed').length,
      failed: data.filter((c) => c.status === 'failed').length,
      avgExecutionTime: 0,
    };

    // Calcular tempo médio de execução
    const completedWithTime = data.filter(
      (c) => c.status === 'completed' && c.created_at && c.executed_at
    );

    if (completedWithTime.length > 0) {
      const totalTime = completedWithTime.reduce((sum, c) => {
        const created = new Date(c.created_at!).getTime();
        const executed = new Date(c.executed_at!).getTime();
        return sum + (executed - created);
      }, 0);

      stats.avgExecutionTime = Math.round(totalTime / completedWithTime.length);
    }

    return stats;
  } catch (error) {
    console.error('❌ Erro ao calcular estatísticas:', error);
    return { total: 0, pending: 0, completed: 0, failed: 0 };
  }
}
