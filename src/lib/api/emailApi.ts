import { supabase } from '../supabase';

export type EmailEvent = 'ORDER_CONFIRMATION' | 'PAYMENT_APPROVED' | 'ORDER_CANCELLED' | 'CART_RECOVERY' | 'PIX_RECOVERY';
export type EmailTemplateType = 'clean' | 'modern' | 'premium';

export interface EmailConfig {
  id?: string;
  userId: string;
  event: EmailEvent;
  isActive: boolean;
  subject: string;
  templateType: EmailTemplateType;
  headerText?: string;
  headerLogo?: string;
  bodyText: string;
  buttonText?: string;
  buttonUrl?: string;
  footerText?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const defaultTemplates: Record<EmailEvent, Omit<EmailConfig, 'userId'>> = {
  ORDER_CONFIRMATION: {
    event: 'ORDER_CONFIRMATION',
    isActive: true,
    subject: 'Seu pedido #{numero_pedido} foi recebido!',
    templateType: 'clean',
    headerText: 'Pedido Recebido com Sucesso!',
    bodyText: 'Olá, {nome_cliente}!\n\nRecebemos o seu pedido com sucesso. Estamos preparando tudo com muito carinho!\n\nAcompanhe os detalhes da sua compra clicando no botão abaixo.',
    buttonText: 'Acompanhar Pedido',
    footerText: 'Obrigado por comprar conosco!'
  },
  PAYMENT_APPROVED: {
    event: 'PAYMENT_APPROVED',
    isActive: true,
    subject: 'Pagamento aprovado para o pedido #{numero_pedido}!',
    templateType: 'modern',
    headerText: 'Pagamento Confirmado!',
    bodyText: 'Olá, {nome_cliente}!\n\nÓtimas notícias! O pagamento do seu pedido no valor de {valor_total} foi aprovado com sucesso.\n\nEm breve você receberá as informações de envio e código de rastreamento por aqui.',
    buttonText: 'Ver Detalhes do Pedido',
    footerText: 'Se precisar de ajuda, entre em contato com nosso suporte.'
  },
  ORDER_CANCELLED: {
    event: 'ORDER_CANCELLED',
    isActive: true,
    subject: 'Pedido #{numero_pedido} cancelado',
    templateType: 'clean',
    headerText: 'Pedido Cancelado',
    bodyText: 'Olá, {nome_cliente}.\n\nInformamos que o seu pedido #{numero_pedido} foi cancelado.\n\nSe você acredita que isso foi um engano ou deseja tentar realizar a compra novamente com outro método de pagamento, clique no botão abaixo para voltar à loja.',
    buttonText: 'Ir para a Loja',
    footerText: 'Estamos à disposição para tirar qualquer dúvida.'
  },
  CART_RECOVERY: {
    event: 'CART_RECOVERY',
    isActive: true,
    subject: 'Você esqueceu algo no seu carrinho...',
    templateType: 'premium',
    headerText: 'Seu carrinho está te esperando!',
    bodyText: 'Olá, {nome_cliente}!\n\nPercebemos que você deixou alguns itens incríveis no seu carrinho. Eles ainda estão reservados para você por tempo limitado.\n\nPara te ajudar a garantir seus produtos, clique no botão abaixo para finalizar a sua compra com total segurança e frete rápido.',
    buttonText: 'Concluir Compra',
    footerText: 'Garanta seus itens antes que esgotem de estoque!'
  },
  PIX_RECOVERY: {
    event: 'PIX_RECOVERY',
    isActive: true,
    subject: 'Conclua seu pagamento via PIX',
    templateType: 'modern',
    headerText: 'Seu código PIX está pronto!',
    bodyText: 'Olá, {nome_cliente}!\n\nFalta pouco para garantir o seu pedido. Utilize o código Pix Copia e Cola abaixo para realizar o pagamento no valor de {valor_total}:\n\n{codigo_pix}\n\nO pagamento é aprovado na hora e seu pedido será processado imediatamente.',
    buttonText: 'Copiar Chave PIX',
    footerText: 'O PIX expira em breve. Evite cancelamentos pagando agora.'
  }
};

export const emailApi = {
  /**
   * Buscar todas as configurações de e-mail do usuário
   */
  async getConfigs(userId: string): Promise<EmailConfig[]> {
    try {
      const { data, error } = await supabase
        .from('EmailConfig')
        .select('*')
        .eq('userId', userId);

      if (error) throw error;

      // Garantir que todos os 5 eventos tenham uma configuração, mesmo que padrão
      const configsMap = new Map<EmailEvent, EmailConfig>();
      if (data) {
        data.forEach((config: EmailConfig) => {
          configsMap.set(config.event, config);
        });
      }

      const events: EmailEvent[] = ['ORDER_CONFIRMATION', 'PAYMENT_APPROVED', 'ORDER_CANCELLED', 'CART_RECOVERY', 'PIX_RECOVERY'];
      
      const fullConfigs = events.map(event => {
        const existing = configsMap.get(event);
        if (existing) return existing;
        
        // Retornar template padrão temporário
        return {
          ...defaultTemplates[event],
          userId
        } as EmailConfig;
      });

      return fullConfigs;
    } catch (error) {
      console.error('Error fetching email configs:', error);
      throw error;
    }
  },

  /**
   * Salvar uma configuração de e-mail (criar ou atualizar)
   */
  async saveConfig(config: EmailConfig): Promise<EmailConfig> {
    try {
      const { id, createdAt, updatedAt, ...upsertData } = config;
      
      const { data, error } = await supabase
        .from('EmailConfig')
        .upsert(
          {
            ...upsertData,
            updatedAt: new Date().toISOString()
          },
          { onConflict: 'userId,event' }
        )
        .select()
        .single();

      if (error) throw error;
      return data as EmailConfig;
    } catch (error) {
      console.error('Error saving email config:', error);
      throw error;
    }
  },

  async sendTestEmail(userId: string, event: EmailEvent, emailAddress: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('send-test-email', {
        body: { userId, event, emailAddress }
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return true;
    } catch (error) {
      console.error('Error sending test email:', error);
      throw error;
    }
  }
};

export default emailApi;
