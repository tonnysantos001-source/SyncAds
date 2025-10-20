# Configurar Serviço de Email para Convites

O sistema de convites está pronto, mas precisa de um serviço de email para enviar convites reais. Recomendamos o **Resend** por ser simples, moderno e ter tier gratuito.

## Opção 1: Resend (Recomendado)

### Por que Resend?
- ✅ Tier gratuito: 3.000 emails/mês
- ✅ API simples e moderna
- ✅ Templates HTML
- ✅ Analytics embutido
- ✅ Domínio próprio fácil de configurar

### Passo 1: Criar Conta no Resend

1. Acesse: https://resend.com/signup
2. Crie sua conta
3. Verifique seu email

### Passo 2: Obter API Key

1. No dashboard do Resend, vá em **API Keys**
2. Clique em **Create API Key**
3. Dê um nome: `SyncAds Production`
4. Copie a API key (guarde em local seguro!)

### Passo 3: Verificar Domínio (Opcional mas Recomendado)

**Opção A: Usar domínio próprio**
1. No Resend, vá em **Domains**
2. Clique em **Add Domain**
3. Digite seu domínio: `syncads.com.br` (ou seu domínio)
4. Adicione os registros DNS fornecidos:
   - SPF
   - DKIM
   - DMARC
5. Aguarde verificação (pode levar até 48h)

**Opção B: Usar domínio do Resend (para testes)**
- Você pode enviar de `onboarding@resend.dev` sem verificar domínio
- Limite: 100 emails/dia
- Emails podem cair no spam

### Passo 4: Configurar no Supabase

1. Acesse: https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr
2. Vá em **Edge Functions** → **Settings**
3. Adicione variável de ambiente:
   - **Key:** `RESEND_API_KEY`
   - **Value:** Sua API key do Resend

4. Adicione variável de ambiente:
   - **Key:** `APP_URL`
   - **Value:** `https://seudominio.com` ou `http://localhost:5173` (dev)

### Passo 5: Atualizar Edge Function

Edite `supabase/functions/invite-user/index.ts`:

```typescript
// Descomente e configure o bloco de envio de email
const resendApiKey = Deno.env.get('RESEND_API_KEY');

if (!resendApiKey) {
  console.warn('RESEND_API_KEY not configured - invite link will only be logged');
} else {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'SyncAds <noreply@seudominio.com>', // Ou onboarding@resend.dev para testes
        to: email,
        subject: `Você foi convidado para ${orgData.name} no SyncAds`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
                .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 Você foi convidado!</h1>
                </div>
                <div class="content">
                  <p>Olá!</p>
                  <p>Você foi convidado para fazer parte da equipe <strong>${orgData.name}</strong> no SyncAds.</p>
                  <p>Sua função será: <strong>${role === 'ADMIN' ? 'Administrador' : role === 'MEMBER' ? 'Membro' : 'Visualizador'}</strong></p>
                  <p>Para aceitar o convite e criar sua conta, clique no botão abaixo:</p>
                  <div style="text-align: center;">
                    <a href="${inviteUrl}" class="button">Aceitar Convite</a>
                  </div>
                  <p style="color: #666; font-size: 14px;">
                    Ou copie e cole este link no seu navegador:<br>
                    <code>${inviteUrl}</code>
                  </p>
                  <p style="color: #999; font-size: 12px;">
                    Este convite expira em 7 dias.
                  </p>
                </div>
                <div class="footer">
                  <p>SyncAds - Gestão de Campanhas de Marketing</p>
                  <p>Se você não solicitou este convite, ignore este email.</p>
                </div>
              </div>
            </body>
          </html>
        `
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend error:', error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const emailResult = await response.json();
    console.log('Email sent:', emailResult.id);
  } catch (emailError) {
    console.error('Error sending email:', emailError);
    // Não falhar a request se email falhar - convite ainda foi criado
  }
}
```

### Passo 6: Criar Página de Aceite de Convite

Crie `src/pages/public/AcceptInvitePage.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { invitesApi } from '@/lib/api/invites';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
  });

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter no mínimo 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await invitesApi.acceptInvite(token!, formData.password, formData.name);
      
      toast({
        title: 'Convite aceito!',
        description: 'Sua conta foi criada com sucesso. Faça login para continuar.',
      });

      navigate('/login');
    } catch (error: any) {
      toast({
        title: 'Erro ao aceitar convite',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Link Inválido</CardTitle>
            <CardDescription>Este link de convite é inválido ou expirou.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Aceitar Convite</CardTitle>
          <CardDescription>Complete seu cadastro para começar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAccept} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Criando conta...' : 'Aceitar Convite'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

Adicione a rota em `App.tsx`:

```typescript
<Route path="/accept-invite" element={<AcceptInvitePage />} />
```

### Passo 7: Testar

1. **Deploy da Edge Function:**
```bash
supabase functions deploy invite-user
```

2. **Enviar convite de teste:**
   - Acesse `/team`
   - Clique em "Convidar Membro"
   - Digite um email
   - Verifique se o email chegou

3. **Aceitar convite:**
   - Clique no link do email
   - Complete o cadastro
   - Faça login

---

## Opção 2: SendGrid

Se preferir usar SendGrid:

### Setup SendGrid

1. Crie conta: https://signup.sendgrid.com/
2. Verifique email
3. Crie API Key em **Settings → API Keys**
4. Adicione no Supabase como `SENDGRID_API_KEY`

### Código para SendGrid

```typescript
const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    personalizations: [{
      to: [{ email: email }],
      subject: `Você foi convidado para ${orgData.name}`
    }],
    from: { email: 'noreply@seudominio.com', name: 'SyncAds' },
    content: [{
      type: 'text/html',
      value: htmlTemplate
    }]
  })
});
```

---

## Opção 3: Amazon SES (Produção em escala)

Para grandes volumes:

1. Crie conta AWS
2. Configure Amazon SES
3. Verifique domínio
4. Use SDK da AWS no Edge Function

**Custo:** $0.10 por 1.000 emails

---

## Checklist Final

✅ **Antes de ir para produção:**
- [ ] Serviço de email configurado (Resend/SendGrid/SES)
- [ ] Domínio próprio verificado
- [ ] Templates de email personalizados
- [ ] Página `/accept-invite` funcionando
- [ ] Testes de envio concluídos
- [ ] Monitoramento de deliverability configurado
- [ ] Tratamento de bounces implementado

## Monitoramento

### Resend Dashboard
- Taxa de entrega
- Bounces
- Opens (se habilitado)
- Clicks

### Logs no Supabase
```sql
SELECT * FROM "PendingInvite" 
WHERE status = 'PENDING' 
  AND "expiresAt" < NOW();
```

## Troubleshooting

**Emails caindo no spam:**
- Verifique SPF, DKIM, DMARC
- Use domínio próprio verificado
- Evite palavras spam-trigger no assunto
- Adicione link de unsubscribe

**Convites não enviando:**
- Verifique `RESEND_API_KEY` nas Edge Functions
- Check logs: `supabase functions logs invite-user`
- Verifique quota no Resend Dashboard

**Link expirado:**
- Convites expiram em 7 dias
- Reenvie o convite pela TeamPage
