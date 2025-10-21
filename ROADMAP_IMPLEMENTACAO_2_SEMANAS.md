# 🗓️ ROADMAP DE IMPLEMENTAÇÃO - 2 SEMANAS

**Objetivo:** Transformar sistema de 95% para 100% operacional  
**Período:** 14 dias úteis  
**Foco:** OAuth, Dados Reais, Pagamentos, Emails, Analytics

---

## 📅 SEMANA 1: INTEGRAÇÕES & DADOS REAIS

### **DIA 1: Segunda-feira - Google Ads OAuth (4h)**

**Manhã (2h):**
1. Criar projeto Google Cloud Console
2. Habilitar Google Ads API
3. Configurar OAuth Consent Screen (External)
4. Adicionar scopes: `https://www.googleapis.com/auth/adwords`

**Tarde (2h):**
5. Criar credenciais OAuth (Web application)
6. Adicionar redirect URI: `http://localhost:5173/integrations/callback`
7. Copiar Client ID + Secret para `.env`
8. Obter Customer ID do Google Ads
9. Reiniciar servidor e testar

**Checklist:**
- [ ] Projeto criado
- [ ] API habilitada
- [ ] OAuth configurado
- [ ] Credenciais no .env
- [ ] Teste: "Conecte o Google Ads" no chat

---

### **DIA 2: Terça-feira - LinkedIn + TikTok OAuth (4h)**

**Manhã - LinkedIn (2h):**
1. Criar app em linkedin.com/developers/apps
2. Solicitar Advertising API
3. Configurar redirect URLs
4. Copiar Client ID + Secret

**Tarde - TikTok (2h):**
5. Criar conta TikTok for Business
6. Acessar ads.tiktok.com/marketing_api/apps
7. Criar app e solicitar permissões
8. Copiar App ID + Secret

**Nota:** LinkedIn leva 1-3 dias, TikTok 3-7 dias para aprovação

**Checklist:**
- [ ] LinkedIn app criado e pendente
- [ ] TikTok app criado e pendente
- [ ] Credenciais salvas (aguardando aprovação)

---

### **DIA 3: Quarta-feira - Twitter OAuth + Testes (4h)**

**Manhã - Twitter (2h):**
1. Criar app em developer.twitter.com
2. Solicitar Elevated access
3. Configurar OAuth 2.0
4. Copiar API Key + Secret + Bearer Token

**Tarde - Testes (2h):**
5. Testar Google Ads OAuth (deve funcionar)
6. Conectar Meta Ads (já configurado)
7. Documentar erros encontrados
8. Atualizar troubleshooting

**Checklist:**
- [ ] Twitter app criado
- [ ] Google Ads conectado ✅
- [ ] Meta Ads conectado ✅
- [ ] 2/5 plataformas funcionando

---

### **DIA 4: Quinta-feira - Dados Reais: Reports (4h)**

**Objetivo:** Substituir mocks em páginas de relatórios

**Manhã (2h):**
1. Reports Overview: Integrar com Campaign table
   - Buscar campaigns reais
   - Calcular métricas (impressions, clicks, conversions)
   - Gráficos com dados reais

**Tarde (2h):**
2. Audience Page: Buscar de Customer + Lead
   - Demographics reais
   - Comportamento de compra
   - Segmentação

**Código necessário:**
```typescript
// src/pages/app/reports/ReportsOverviewPage.tsx
const { data: campaigns } = await supabase
  .from('Campaign')
  .select('*')
  .eq('organizationId', user.organizationId);

const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
const ctr = (totalClicks / totalImpressions) * 100;
```

**Checklist:**
- [ ] Reports Overview: dados reais
- [ ] Audience: dados reais
- [ ] Gráficos funcionando
- [ ] 0 erros no console

---

### **DIA 5: Sexta-feira - Dados Reais: E-commerce (4h)**

**Manhã (2h):**
1. Collections: Implementar CRUD real
   - Criar Collection table data
   - Listar coleções
   - Adicionar produtos em coleções

2. Kits: Implementar CRUD real
   - Criar Kit + KitItem
   - Produtos bundle
   - Desconto de kit

**Tarde (2h):**
3. Abandoned Carts: AbandonedCart table
   - Buscar carrinhos abandonados reais
   - Tempo de abandono
   - Valor total abandonado
   - Link de recuperação

4. Order Items: Relacionar Order ↔ OrderItem
   - Criar OrderItem para cada Order
   - Produtos do pedido
   - Subtotais corretos

**Checklist:**
- [ ] Collections CRUD
- [ ] Kits CRUD
- [ ] Abandoned Carts real
- [ ] Order Items relacionados

---

## 📅 SEMANA 2: PAGAMENTOS, EMAILS & ANALYTICS

### **DIA 6: Segunda-feira - Mercado Pago Setup (4h)**

**Manhã (2h):**
1. Criar conta desenvolvedor Mercado Pago
2. Obter Access Token (sandbox)
3. Instalar SDK: `npm install mercadopago`
4. Criar GatewayConfig no banco

**Tarde (2h):**
5. Implementar Edge Function: `payment-mercadopago`
6. Endpoints: /create-payment, /webhook
7. Testar PIX no sandbox
8. Testar Cartão no sandbox

**Código Edge Function:**
```typescript
// supabase/functions/payment-mercadopago/index.ts
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ 
  accessToken: Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')! 
});

Deno.serve(async (req) => {
  const { orderId, amount, paymentMethod } = await req.json();
  
  const payment = new Payment(client);
  const result = await payment.create({
    body: {
      transaction_amount: amount,
      description: `Pedido #${orderId}`,
      payment_method_id: paymentMethod,
      payer: { email: customer.email }
    }
  });
  
  return Response.json(result);
});
```

**Checklist:**
- [ ] Conta criada
- [ ] Access Token obtido
- [ ] Edge Function criada
- [ ] PIX testado (sandbox)
- [ ] Cartão testado (sandbox)

---

### **DIA 7: Terça-feira - Mercado Pago Webhooks (4h)**

**Manhã (2h):**
1. Configurar webhook URL no painel MP
2. Implementar `/webhook` endpoint
3. Validar assinatura do webhook
4. Atualizar Order status no banco

**Tarde (2h):**
5. Testar fluxo completo:
   - Criar pedido
   - Processar pagamento
   - Receber webhook
   - Atualizar status
6. Logs de transação
7. Tratamento de erros

**Checklist:**
- [ ] Webhook configurado
- [ ] Order status atualiza automático
- [ ] Transaction log criado
- [ ] Fluxo completo OK

---

### **DIA 8: Quarta-feira - Resend Email Setup (4h)**

**Manhã (2h):**
1. Criar conta Resend.com (100 emails/dia grátis)
2. Obter API Key
3. Instalar: `npm install resend @react-email/components`
4. Configurar domínio (ou usar onboarding@resend.dev)

**Tarde (2h):**
5. Criar Edge Function: `send-email`
6. Templates: Bem-vindo, Pedido Confirmado, Carrinho Abandonado
7. Testar envio
8. Integrar com eventos do sistema

**Código:**
```typescript
// supabase/functions/send-email/index.ts
import { Resend } from 'resend';

const resend = new Resend(Deno.env.get('RESEND_API_KEY')!);

Deno.serve(async (req) => {
  const { to, template, data } = await req.json();
  
  const templates = {
    'order-confirmed': OrderConfirmedEmail,
    'welcome': WelcomeEmail,
    'abandoned-cart': AbandonedCartEmail
  };
  
  const EmailComponent = templates[template];
  
  const { data: result, error } = await resend.emails.send({
    from: 'SyncAds <noreply@syncads.com>',
    to,
    subject: getSubject(template),
    react: EmailComponent(data)
  });
  
  return Response.json({ result, error });
});
```

**Checklist:**
- [ ] Conta Resend criada
- [ ] API Key configurada
- [ ] 3 templates criados
- [ ] Email teste enviado

---

### **DIA 9: Quinta-feira - Email Templates React (4h)**

**Manhã (2h):**
1. Criar `emails/` folder
2. OrderConfirmedEmail.tsx
3. WelcomeEmail.tsx
4. AbandonedCartEmail.tsx

**Tarde (2h):**
5. Preview local com `npm run email`
6. Testar cada template
7. Responsivo mobile
8. Links de tracking

**Exemplo Template:**
```tsx
// emails/OrderConfirmedEmail.tsx
import { Html, Head, Button, Container, Text } from '@react-email/components';

export default function OrderConfirmedEmail({ order }) {
  return (
    <Html>
      <Head />
      <Container>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
          Pedido #{order.number} Confirmado! 🎉
        </Text>
        
        <Text>Olá {order.customerName},</Text>
        <Text>Seu pedido foi confirmado e está sendo preparado.</Text>
        
        <Button 
          href={`https://syncads.com/orders/${order.id}`}
          style={{ background: '#10b981', color: 'white', padding: '12px 24px' }}
        >
          Rastrear Pedido
        </Button>
        
        <Text style={{ marginTop: 32, color: '#666' }}>
          Total: R$ {order.total}
        </Text>
      </Container>
    </Html>
  );
}
```

**Checklist:**
- [ ] 3 templates criados
- [ ] Preview funcionando
- [ ] Design responsivo
- [ ] Links corretos

---

### **DIA 10: Sexta-feira - Google Analytics 4 (4h)**

**Manhã (2h):**
1. Criar propriedade GA4
2. Obter Measurement ID (G-XXXXXXXXXX)
3. Instalar gtag.js no frontend
4. Configurar eventos: page_view, add_to_cart, purchase

**Tarde (2h):**
5. Criar custom events: campaign_created, integration_connected
6. Conversões configuradas
7. Testar com GA4 DebugView
8. Verificar dados chegando

**Código:**
```typescript
// src/lib/analytics.ts
export const gtag = {
  pageview: (url: string) => {
    window.gtag('config', 'G-XXXXXXXXXX', { page_path: url });
  },
  
  event: (action: string, params: any) => {
    window.gtag('event', action, params);
  },
  
  purchase: (order: Order) => {
    window.gtag('event', 'purchase', {
      transaction_id: order.id,
      value: order.total,
      currency: 'BRL',
      items: order.items
    });
  }
};
```

**Checklist:**
- [ ] GA4 propriedade criada
- [ ] gtag.js instalado
- [ ] Eventos funcionando
- [ ] DebugView mostrando dados

---

### **DIA 11: Segunda-feira - Facebook Pixel Events (4h)**

**Manhã (2h):**
1. Pixel já criado (ID: 3 pixels no banco)
2. Implementar eventos: PageView, ViewContent, AddToCart
3. InitiateCheckout, Purchase
4. Testar com Pixel Helper

**Tarde (2h):**
5. Server-side events (Conversions API)
6. Edge Function: `facebook-capi`
7. Enviar eventos críticos server-side
8. Validar no Events Manager

**Código:**
```typescript
// src/lib/facebookPixel.ts
export const fbq = {
  init: (pixelId: string) => {
    window.fbq('init', pixelId);
  },
  
  track: (event: string, data?: any) => {
    window.fbq('track', event, data);
  },
  
  purchase: (order: Order) => {
    window.fbq('track', 'Purchase', {
      value: order.total,
      currency: 'BRL',
      content_ids: order.items.map(i => i.productId),
      content_type: 'product'
    });
  }
};
```

**Checklist:**
- [ ] Eventos client-side OK
- [ ] Pixel Helper validando
- [ ] Server-side events (CAPI)
- [ ] Events Manager mostrando

---

### **DIA 12: Terça-feira - Dashboards com Dados Reais (4h)**

**Manhã (2h):**
1. UnifiedDashboardPage: Buscar métricas reais
   - Total vendas: SUM(Order.total)
   - Produtos: COUNT(Product)
   - Clientes: COUNT(Customer)
   - Pedidos: COUNT(Order)

2. Gráficos com dados reais:
   - Vendas por dia (últimos 30 dias)
   - Produtos mais vendidos
   - Conversão por fonte

**Tarde (2h):**
3. SuperAdminDashboard: Stats reais
   - COUNT(Organization)
   - COUNT(User)
   - SUM(Subscription.amount) MRR
   - COUNT(AiUsage) tokens usados

4. Gráficos admin:
   - Crescimento de orgs
   - Uso de IA por org
   - Revenue por plano

**Checklist:**
- [ ] Dashboard usuário: dados reais
- [ ] Dashboard admin: dados reais
- [ ] Gráficos atualizados
- [ ] Performance OK (<2s load)

---

### **DIA 13: Quarta-feira - Testes Integração (4h)**

**Manhã (2h):**
1. Testar fluxo completo de compra:
   - Adicionar produto ao carrinho
   - Aplicar cupom
   - Checkout
   - Pagamento (Mercado Pago sandbox)
   - Email de confirmação
   - Tracking GA4 + Pixel

2. Testar OAuth:
   - Conectar Google Ads
   - Conectar Meta Ads
   - IA criar campanha
   - Métricas aparecendo

**Tarde (2h):**
3. Testar chat IA:
   - Comandos básicos
   - Web search
   - Auditar integrações
   - Criar campanha (se OAuth OK)

4. Testar admin:
   - Criar organização
   - Configurar IA global
   - Ver uso de recursos

**Checklist:**
- [ ] Fluxo e-commerce OK
- [ ] OAuth funcionando (pelo menos 2 plataformas)
- [ ] Chat IA funcional
- [ ] Admin panel OK

---

### **DIA 14: Quinta-feira - Documentação & Deploy (4h)**

**Manhã (2h):**
1. Atualizar README.md com:
   - Setup completo
   - Variáveis de ambiente
   - Como configurar OAuth
   - Como testar pagamentos

2. Criar CHANGELOG.md:
   - v1.0: OAuth completo, Pagamentos, Emails

3. Documentar APIs:
   - Edge Functions
   - Webhooks
   - Respostas de erro

**Tarde (2h):**
4. Build de produção:
   - `npm run build`
   - Verificar tamanho
   - Testar preview

5. Deploy:
   - Netlify ou Vercel
   - Variáveis de ambiente
   - Domínio customizado
   - SSL configurado

6. Checklist pré-launch:
   - [ ] OAuth produção configurado
   - [ ] Gateways produção configurados
   - [ ] Emails produção configurados
   - [ ] Analytics produção configurado

**Checklist:**
- [ ] Documentação completa
- [ ] Build OK
- [ ] Deploy em produção
- [ ] Sistema 100% funcional

---

## ✅ RESULTADO ESPERADO APÓS 2 SEMANAS

### **Funcionalidades 100% Operacionais:**
- ✅ OAuth: 5/5 plataformas configuradas
- ✅ Pagamentos: Mercado Pago funcionando
- ✅ Emails: Templates profissionais automáticos
- ✅ Analytics: GA4 + Pixel tracking real
- ✅ IA: Controla todas integrações
- ✅ Dashboards: Dados 100% reais
- ✅ E-commerce: Checkout completo

### **Métricas de Sucesso:**
- 0 páginas com dados mockados
- 100% funcionalidades testadas
- Deploy em produção
- Pronto para primeiros clientes

---

## 🚨 CONTINGÊNCIAS

### **Se OAuth levar mais que estimado:**
- Focar em Meta + Google (principais)
- LinkedIn/TikTok/Twitter: fazer depois

### **Se Mercado Pago der problema:**
- Usar Stripe como alternativo
- Mais simples internacionalmente

### **Se aprovaçõ es OAuth atrasarem:**
- Continuar com dados reais
- OAuth em paralelo
- Não bloqueia outras tarefas

---

**Pronto para começar? Posso ajudar a implementar qualquer dia específico! 🚀**
