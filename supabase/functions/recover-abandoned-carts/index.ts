import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

interface AbandonedCart {
  id: string;
  cartId: string;
  customerId?: string;
  email: string;
  abandonedAt: string;
  recoveryAttempts: number;
  lastRecoveryAt?: string;
  items: any;
  total: number;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Buscar carrinhos abandonados que precisam de email
    // - Abandonados há mais de 1 hora
    // - Menos de 3 tentativas de recuperação
    // - Última tentativa há mais de 24h (ou nunca tentou)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: abandonedCarts, error: fetchError } = await supabase
      .from('AbandonedCart')
      .select('*')
      .eq('recovered', false)
      .lt('abandonedAt', oneHourAgo)
      .lt('recoveryAttempts', 3)
      .or(`lastRecoveryAt.is.null,lastRecoveryAt.lt.${oneDayAgo}`)
      .limit(50);

    if (fetchError) {
      throw new Error(`Error fetching carts: ${fetchError.message}`);
    }

    if (!abandonedCarts || abandonedCarts.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No abandoned carts to process',
          processed: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Processar cada carrinho
    for (const cart of abandonedCarts) {
      results.processed++;

      try {
        // Buscar dados do carrinho original
        const { data: cartData, error: cartError } = await supabase
          .from('Cart')
          .select('*, items:CartItem(*)')
          .eq('id', cart.cartId)
          .single();

        if (cartError || !cartData) {
          results.failed++;
          results.errors.push(`Cart ${cart.cartId} not found`);
          continue;
        }

        // Buscar dados do cliente se disponível
        let customerData = null;
        if (cart.customerId) {
          const { data } = await supabase
            .from('Customer')
            .select('*')
            .eq('id', cart.customerId)
            .single();
          customerData = data;
        }

        // Enviar email de recuperação
        const emailSent = await sendRecoveryEmail(cart, cartData, customerData);

        if (emailSent) {
          // Atualizar status do carrinho abandonado
          const { error: updateError } = await supabase
            .from('AbandonedCart')
            .update({
              recoveryAttempts: cart.recoveryAttempts + 1,
              lastRecoveryAt: new Date().toISOString(),
            })
            .eq('id', cart.id);

          if (updateError) {
            console.error('Error updating cart:', updateError);
            results.failed++;
            results.errors.push(`Failed to update cart ${cart.id}`);
          } else {
            results.sent++;
          }
        } else {
          results.failed++;
          results.errors.push(`Failed to send email for cart ${cart.id}`);
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Error processing cart ${cart.id}: ${error.message}`);
        console.error('Error processing cart:', error);
      }

      // Delay para evitar rate limiting (100ms entre emails)
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.processed} abandoned carts`,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in recover-abandoned-carts:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function sendRecoveryEmail(
  cart: AbandonedCart,
  cartData: any,
  customerData: any
): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return false;
  }

  const customerName = customerData?.name || 'Cliente';
  const recoveryLink = `${Deno.env.get('FRONTEND_URL')}/recover-cart/${cart.cartId}`;

  // Calcular desconto de recuperação (5% off)
  const discountPercent = 5;
  const discountAmount = (cart.total * discountPercent) / 100;
  const finalPrice = cart.total - discountAmount;

  // Listar produtos do carrinho
  const itemsList = cartData.items
    .map(
      (item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${item.name}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        R$ ${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `
    )
    .join('');

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🛒 Você Esqueceu Algo!</h1>
      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">
        Seus produtos estão esperando por você
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 20px;">
      <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
        Olá <strong>${customerName}</strong>,
      </p>

      <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
        Notamos que você deixou alguns produtos incríveis no seu carrinho!
        Eles ainda estão disponíveis e esperando por você.
      </p>

      <!-- Cart Items -->
      <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin: 30px 0;">
        <h2 style="font-size: 18px; color: #333; margin: 0 0 20px 0;">
          Seu Carrinho
        </h2>

        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: left; color: #666;">
                Produto
              </th>
              <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: center; color: #666;">
                Qtd
              </th>
              <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: right; color: #666;">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            ${itemsList}
          </tbody>
        </table>

        <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="font-size: 16px; color: #666;">Subtotal:</span>
            <span style="font-size: 16px; color: #333;">R$ ${cart.total.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="font-size: 16px; color: #27ae60;">Desconto de Recuperação (${discountPercent}%):</span>
            <span style="font-size: 16px; color: #27ae60;">- R$ ${discountAmount.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 2px solid #ddd;">
            <span style="font-size: 20px; font-weight: bold; color: #333;">Total:</span>
            <span style="font-size: 20px; font-weight: bold; color: #667eea;">R$ ${finalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <!-- Discount Badge -->
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
        <p style="color: #ffffff; font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">
          🎉 DESCONTO ESPECIAL DE ${discountPercent}%
        </p>
        <p style="color: #ffffff; font-size: 14px; margin: 0;">
          Use o cupom <strong>RECUPERA${discountPercent}</strong> no checkout
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${recoveryLink}"
           style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 30px;
                  font-size: 18px; font-weight: bold;">
          Finalizar Minha Compra
        </a>
      </div>

      <p style="font-size: 14px; color: #666; margin: 30px 0 0 0; text-align: center;">
        Este desconto é válido por 24 horas e os produtos estão sujeitos à disponibilidade.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f9f9f9; padding: 30px 20px; text-align: center; border-top: 1px solid #eee;">
      <p style="font-size: 14px; color: #666; margin: 0 0 10px 0;">
        Precisa de ajuda? Entre em contato conosco!
      </p>
      <p style="font-size: 12px; color: #999; margin: 0;">
        © ${new Date().getFullYear()} SyncAds. Todos os direitos reservados.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'SyncAds <noreply@syncads.com.br>',
        to: [cart.email],
        subject: `🛒 ${customerName}, você esqueceu ${cartData.items.length} produto(s) no carrinho!`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Resend API error:', errorData);
      return false;
    }

    console.log(`Recovery email sent to ${cart.email}`);
    return true;
  } catch (error: any) {
    console.error('Error sending email via Resend:', error);
    return false;
  }
}
