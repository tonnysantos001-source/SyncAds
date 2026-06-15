import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_utils/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

interface TestEmailRequest {
  userId: string;
  event: 'ORDER_CONFIRMATION' | 'PAYMENT_APPROVED' | 'ORDER_CANCELLED' | 'CART_RECOVERY' | 'PIX_RECOVERY';
  emailAddress: string;
}

const defaultTemplates = {
  ORDER_CONFIRMATION: {
    subject: 'Seu pedido #{numero_pedido} foi recebido!',
    templateType: 'clean',
    headerText: 'Pedido Recebido com Sucesso!',
    bodyText: 'Olá, {nome_cliente}!\n\nRecebemos o seu pedido com sucesso. Estamos preparando tudo com muito carinho!\n\nAcompanhe os detalhes da sua compra clicando no botão abaixo.',
    buttonText: 'Acompanhar Pedido',
    footerText: 'Obrigado por comprar conosco!'
  },
  PAYMENT_APPROVED: {
    subject: 'Pagamento aprovado para o pedido #{numero_pedido}!',
    templateType: 'modern',
    headerText: 'Pagamento Confirmado!',
    bodyText: 'Olá, {nome_cliente}!\n\nÓtimas notícias! O pagamento do seu pedido no valor de {valor_total} foi aprovado com sucesso.\n\nEm breve você receberá as informações de envio e código de rastreamento por aqui.',
    buttonText: 'Ver Detalhes do Pedido',
    footerText: 'Se precisar de ajuda, entre em contato com nosso suporte.'
  },
  ORDER_CANCELLED: {
    subject: 'Pedido #{numero_pedido} cancelado',
    templateType: 'clean',
    headerText: 'Pedido Cancelado',
    bodyText: 'Olá, {nome_cliente}.\n\nInformamos que o seu pedido #{numero_pedido} foi cancelado.\n\nSe você acredita que isso foi um engano ou deseja tentar realizar a compra novamente com outro método de pagamento, clique no botão abaixo para voltar à loja.',
    buttonText: 'Ir para a Loja',
    footerText: 'Estamos à disposição para tirar qualquer dúvida.'
  },
  CART_RECOVERY: {
    subject: 'Você esqueceu algo no seu carrinho...',
    templateType: 'premium',
    headerText: 'Seu carrinho está te esperando!',
    bodyText: 'Olá, {nome_cliente}!\n\nPercebemos que você deixou alguns itens incríveis no seu carrinho. Eles ainda estão reservados para você por tempo limitado.\n\nPara te ajudar a garantir seus produtos, clique no botão abaixo para finalizar a sua compra com total segurança e frete rápido.',
    buttonText: 'Concluir Compra',
    footerText: 'Garanta seus itens antes que esgotem de estoque!'
  },
  PIX_RECOVERY: {
    subject: 'Conclua seu pagamento via PIX',
    templateType: 'modern',
    headerText: 'Seu código PIX está pronto!',
    bodyText: 'Olá, {nome_cliente}!\n\nFalta pouco para garantir o seu pedido. Utilize o código Pix Copia e Cola abaixo para realizar o pagamento no valor de {valor_total}:\n\n{codigo_pix}\n\nO pagamento é aprovado na hora e seu pedido será processado imediatamente.',
    buttonText: 'Copiar Chave PIX',
    footerText: 'O PIX expira em breve. Evite cancelamentos pagando agora.'
  }
};

function renderTemplateHtml(
  templateType: 'clean' | 'modern' | 'premium',
  headerText: string,
  headerLogo: string,
  bodyText: string,
  buttonText: string,
  buttonUrl: string,
  footerText: string
): string {
  // Substituir placeholders fictícios para teste
  const formattedBody = bodyText
    .replace(/{nome_cliente}/g, 'Cliente de Teste')
    .replace(/{numero_pedido}/g, '12345')
    .replace(/{valor_total}/g, 'R$ 159,90')
    .replace(/{codigo_pix}/g, '00020101021226870014br.gov.bcb.pix2565pix-qr.com/qr/v2/testebuyersyncads')
    .replace(/{link_pedido}/g, 'https://syncads.com.br');

  const formattedHeader = headerText
    .replace(/{nome_cliente}/g, 'Cliente de Teste')
    .replace(/{numero_pedido}/g, '12345')
    .replace(/{valor_total}/g, 'R$ 159,90');

  const logoHtml = headerLogo 
    ? `<img src="${headerLogo}" alt="Logo" style="max-height: 50px; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto;" />`
    : '';

  const buttonHtml = (buttonText && buttonUrl)
    ? `<div style="text-align: center; margin: 30px 0;">
         <a href="${buttonUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
           ${buttonText}
         </a>
       </div>`
    : '';

  if (templateType === 'premium') {
    // Layout Dark/Premium
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>SyncAds Email</title>
      </head>
      <body style="margin: 0; padding: 40px 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #111827; border-radius: 12px; border: 1px solid #1f2937; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              ${logoHtml}
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; background: linear-gradient(135deg, #a78bfa 0%, #6366f1 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                ${formattedHeader}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; font-size: 16px; line-height: 1.6; color: #d1d5db;">
              <div style="white-space: pre-line;">${formattedBody}</div>
              ${buttonHtml}
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; background-color: #0f172a; border-top: 1px solid #1f2937; text-align: center; font-size: 12px; color: #6b7280; line-height: 1.5;">
              <p style="margin: 0 0 8px 0;">${footerText || 'Este é um e-mail de teste enviado por SyncAds.'}</p>
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} SyncAds. Todos os direitos reservados.</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  if (templateType === 'modern') {
    // Layout Colorido/Gradiente
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>SyncAds Email</title>
      </head>
      <body style="margin: 0; padding: 40px 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #374151;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
          <tr style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);">
            <td style="padding: 40px; text-align: center;">
              ${logoHtml}
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0;">
                ${formattedHeader}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px; font-size: 16px; line-height: 1.6; color: #4b5563;">
              <div style="white-space: pre-line;">${formattedBody}</div>
              ${buttonHtml}
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af; line-height: 1.5;">
              <p style="margin: 0 0 8px 0;">${footerText || 'Este é um e-mail de teste enviado por SyncAds.'}</p>
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} SyncAds. Todos os direitos reservados.</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  // Layout Mínimo/Clean (padrão)
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>SyncAds Email</title>
    </head>
    <body style="margin: 0; padding: 40px 0; background-color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2d3748;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <tr>
          <td style="padding: 40px 40px 20px 40px;">
            ${logoHtml}
            <h1 style="color: #1a202c; font-size: 22px; font-weight: 700; margin: 0; border-bottom: 2px solid #edf2f7; padding-bottom: 15px;">
              ${formattedHeader}
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px 40px 40px 40px; font-size: 16px; line-height: 1.6; color: #4a5568;">
            <div style="white-space: pre-line;">${formattedBody}</div>
            ${buttonHtml}
          </td>
        </tr>
        <tr>
          <td style="padding: 30px 40px; border-top: 1px solid #edf2f7; text-align: center; font-size: 12px; color: #a0aec0; line-height: 1.5;">
            <p style="margin: 0 0 8px 0;">${footerText || 'Este é um e-mail de teste enviado por SyncAds.'}</p>
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} SyncAds. Todos os direitos reservados.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

Deno.serve(async (req) => {
  // Tratar CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error('Chave de API do Resend não cadastrada nas Edge Functions do Supabase.');
    }

    const { userId, event, emailAddress } = await req.json() as TestEmailRequest;

    if (!userId || !event || !emailAddress) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros userId, event e emailAddress são obrigatórios.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar cliente do Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Buscar configuração de e-mail personalizada do banco de dados
    const { data: config, error: fetchError } = await supabase
      .from('EmailConfig')
      .select('*')
      .eq('userId', userId)
      .eq('event', event)
      .maybeSingle();

    if (fetchError) {
      console.warn('Erro ao buscar configuração personalizada, usando padrão:', fetchError.message);
    }

    // Mesclar valores (configuração do BD com templates padrão)
    const defaults = defaultTemplates[event];
    const subject = config?.subject || defaults.subject;
    const templateType = config?.templateType || defaults.templateType;
    const headerText = config?.headerText || defaults.headerText;
    const headerLogo = config?.headerLogo || '';
    const bodyText = config?.bodyText || defaults.bodyText;
    const buttonText = config?.buttonText || defaults.buttonText;
    const buttonUrl = config?.buttonUrl || 'https://syncads.com.br';
    const footerText = config?.footerText || defaults.footerText;

    // Renderizar o layout HTML final
    const emailHtml = renderTemplateHtml(
      templateType,
      headerText,
      headerLogo,
      bodyText,
      buttonText,
      buttonUrl,
      footerText
    );

    console.log(`Enviando e-mail de teste via Resend para ${emailAddress} referente ao evento ${event}...`);

    // Disparar a chamada para a API do Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'SyncAds Teste <onboarding@resend.dev>',
        to: [emailAddress],
        subject: `[TESTE] ${subject}`,
        html: emailHtml
      })
    });

    const resendResult = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Erro retornado pela API do Resend:', resendResult);
      throw new Error(resendResult.message || 'Erro ao enviar e-mail através da API do Resend.');
    }

    console.log('E-mail enviado com sucesso via Resend! ID:', resendResult.id);

    return new Response(
      JSON.stringify({ success: true, message: 'E-mail de teste enviado com sucesso!', resendId: resendResult.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro na execução da Edge Function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno no servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
