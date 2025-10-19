// Serviço de gerenciamento de integrações
import { supabase } from '../supabase';
import { 
  IntegrationSlug, 
  IntegrationCredentials, 
  DirectAuthRequest,
  OAuthAuthUrlResponse,
  INTEGRATIONS_CONFIG 
} from './types';

class IntegrationsService {
  private readonly REDIRECT_URI = `${window.location.origin}/integrations/callback`;

  /**
   * Lista todas as integrações do usuário
   */
  async listIntegrations(userId: string): Promise<IntegrationCredentials[]> {
    const { data, error } = await supabase
      .from('Integration')
      .select('*')
      .eq('userId', userId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Verifica status de uma integração específica
   */
  async getIntegrationStatus(userId: string, slug: IntegrationSlug): Promise<IntegrationCredentials | null> {
    const { data, error } = await supabase
      .from('Integration')
      .select('*')
      .eq('userId', userId)
      .eq('platform', slug.toUpperCase())
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Gera URL de autorização OAuth
   */
  async generateOAuthUrl(slug: IntegrationSlug, userId: string): Promise<OAuthAuthUrlResponse> {
    const config = INTEGRATIONS_CONFIG[slug];
    
    if (!config || config.authType !== 'oauth') {
      throw new Error('Integração não suporta OAuth');
    }

    if (!config.clientId) {
      throw new Error(`Client ID não configurado para ${config.name}`);
    }

    // Gerar state único
    const state = btoa(JSON.stringify({
      userId,
      slug,
      timestamp: Date.now(),
      random: Math.random().toString(36).substring(7)
    }));

    // Armazenar state temporariamente (10 minutos)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error: stateInsertError } = await supabase
      .from('OAuthState')
      .insert({
        id: crypto.randomUUID(),
        state,
        userId,
        integrationSlug: slug,
        expiresAt,
        createdAt: new Date().toISOString()
      });

    if (stateInsertError) {
      throw new Error(`Erro ao armazenar state OAuth: ${stateInsertError.message}`);
    }

    // Construir URL de autorização
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: this.REDIRECT_URI,
      response_type: 'code',
      scope: config.scopes?.join(' ') || '',
      state,
      access_type: 'offline', // Para refresh token
      prompt: 'consent'
    });

    const authUrl = `${config.authUrl}?${params.toString()}`;

    return { authUrl, state };
  }

  /**
   * Processa callback OAuth
   */
  async handleOAuthCallback(code: string, state: string): Promise<{ success: boolean; slug: IntegrationSlug }> {
    // Validar state
    const { data: stateData, error: stateError } = await supabase
      .from('OAuthState')
      .select('*')
      .eq('state', state)
      .single();

    if (stateError || !stateData) {
      throw new Error('State inválido ou expirado');
    }

    const { userId, integrationSlug } = JSON.parse(atob(state));
    const config = INTEGRATIONS_CONFIG[integrationSlug as IntegrationSlug];

    if (!config) {
      throw new Error('Integração não encontrada');
    }

    // Trocar code por tokens
    const tokenResponse = await fetch(config.tokenUrl!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId!,
        client_secret: process.env.VITE_OAUTH_CLIENT_SECRET || '',
        code,
        redirect_uri: this.REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Falha ao obter tokens');
    }

    const tokens = await tokenResponse.json();

    // Salvar integração
    const expiresAt = tokens.expires_in 
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    // Verificar se já existe
    const { data: existing } = await supabase
      .from('Integration')
      .select('id')
      .eq('userId', userId)
      .eq('platform', integrationSlug.toUpperCase())
      .single();

    if (existing) {
      // Atualizar existente
      await supabase
        .from('Integration')
        .update({
          credentials: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
          },
          isConnected: true,
          lastSyncAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      // Criar novo com ID
      const { error: insertError } = await supabase
        .from('Integration')
        .insert({
          id: crypto.randomUUID(),
          userId,
          platform: integrationSlug.toUpperCase(),
          credentials: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
          },
          isConnected: true,
          lastSyncAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

      if (insertError) throw insertError;
    }

    // Remover state usado
    await supabase
      .from('OAuthState')
      .delete()
      .eq('state', state);

    return { success: true, slug: integrationSlug as IntegrationSlug };
  }

  /**
   * Conectar com credenciais diretas (não implementado - requer backend)
   */
  async connectDirect(slug: IntegrationSlug, userId: string, credentials: DirectAuthRequest): Promise<void> {
    throw new Error('Autenticação direta requer implementação no backend');
    // TODO: Implementar quando tivermos backend
  }

  /**
   * Desconectar integração
   */
  async disconnect(userId: string, slug: IntegrationSlug): Promise<void> {
    const { error } = await supabase
      .from('Integration')
      .delete()
      .eq('userId', userId)
      .eq('platform', slug.toUpperCase());

    if (error) throw error;
  }

  /**
   * Refresh token OAuth (automático)
   */
  async refreshToken(integrationId: string): Promise<void> {
    // TODO: Implementar refresh automático
    console.log('Refresh token não implementado ainda');
  }
}

export const integrationsService = new IntegrationsService();
