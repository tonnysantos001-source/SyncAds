import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { Mail, Shield, CheckCircle2, AlertCircle, Key, Lock } from 'lucide-react';

export default function AccountSecurityTab() {
  const { toast } = useToast();
  const { user } = useStore();
  
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    loadUserSecurityData();
  }, [user]);

  const loadUserSecurityData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('User')
        .select('emailVerified, twoFactorEnabled')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      setEmailVerified(data?.emailVerified || false);
      setTwoFactorEnabled(data?.twoFactorEnabled || false);
    } catch (error) {
      console.error('Error loading security data:', error);
    }
  };

  const handleSendEmailVerification = async () => {
    setSendingVerification(true);
    
    try {
      // Envia email de verificação via Supabase Auth
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user?.email || '',
      });

      if (error) throw error;

      toast({
        title: 'Email de verificação enviado!',
        description: 'Verifique sua caixa de entrada e spam.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar email',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSendingVerification(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter no mínimo 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    setChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: 'Senha alterada!',
        description: 'Sua senha foi atualizada com sucesso.',
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: 'Erro ao alterar senha',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail) {
      toast({
        title: 'Erro',
        description: 'Digite o novo email.',
        variant: 'destructive',
      });
      return;
    }

    setChangingEmail(true);

    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;

      toast({
        title: 'Confirmação enviada!',
        description: 'Verifique seu novo email para confirmar a mudança.',
      });

      setNewEmail('');
    } catch (error: any) {
      toast({
        title: 'Erro ao trocar email',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setChangingEmail(false);
    }
  };

  const handleToggle2FA = async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('User')
        .update({ twoFactorEnabled: enabled })
        .eq('id', user?.id || '');

      if (error) throw error;

      setTwoFactorEnabled(enabled);

      toast({
        title: enabled ? '2FA Habilitado!' : '2FA Desabilitado',
        description: enabled 
          ? 'Autenticação de dois fatores foi ativada.' 
          : 'Autenticação de dois fatores foi desativada.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Email Verification Banner */}
      {!emailVerified && (
        <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-200">
                  Email não verificado
                </h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                  Verifique seu email para desbloquear todos os recursos da plataforma.
                </p>
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={handleSendEmailVerification}
                  disabled={sendingVerification}
                >
                  {sendingVerification ? 'Enviando...' : 'Enviar Email de Verificação'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Verification Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-gray-500" />
              <CardTitle>Verificação de Email</CardTitle>
            </div>
            {emailVerified ? (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Verificado
              </Badge>
            ) : (
              <Badge variant="secondary">Não verificado</Badge>
            )}
          </div>
          <CardDescription>
            {emailVerified 
              ? 'Seu email está verificado e seguro.'
              : 'Verifique seu email para aumentar a segurança da sua conta.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Email Atual</Label>
              <Input value={user?.email || ''} disabled className="mt-2" />
            </div>

            {!emailVerified && (
              <Button
                onClick={handleSendEmailVerification}
                disabled={sendingVerification}
                className="w-full"
              >
                <Mail className="h-4 w-4 mr-2" />
                {sendingVerification ? 'Enviando...' : 'Verificar Email'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Change Email Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-gray-500" />
            <CardTitle>Trocar Email</CardTitle>
          </div>
          <CardDescription>
            Altere o email associado à sua conta. Você precisará confirmar o novo email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-email">Novo Email</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="novo@email.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="mt-2"
              />
            </div>
            <Button
              onClick={handleChangeEmail}
              disabled={changingEmail || !newEmail}
              className="w-full"
            >
              <Mail className="h-4 w-4 mr-2" />
              {changingEmail ? 'Enviando confirmação...' : 'Trocar Email'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-gray-500" />
            <CardTitle>Trocar Senha</CardTitle>
          </div>
          <CardDescription>
            Altere sua senha para manter sua conta segura.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="current-password">Senha Atual</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Digite a senha novamente"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-2"
              />
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword || !newPassword || !confirmPassword}
              className="w-full"
            >
              <Key className="h-4 w-4 mr-2" />
              {changingPassword ? 'Alterando...' : 'Alterar Senha'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Two-Factor Authentication Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-gray-500" />
            <CardTitle>Autenticação de Dois Fatores (2FA)</CardTitle>
          </div>
          <CardDescription>
            Adicione uma camada extra de segurança à sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <h4 className="font-medium">
                {twoFactorEnabled ? '2FA Ativo' : '2FA Inativo'}
              </h4>
              <p className="text-sm text-gray-500">
                {twoFactorEnabled 
                  ? 'Sua conta está protegida com autenticação de dois fatores.'
                  : 'Ative para aumentar a segurança da sua conta.'}
              </p>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={handleToggle2FA}
            />
          </div>

          {twoFactorEnabled && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                    2FA está ativo
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Você precisará confirmar sua identidade ao fazer login em novos dispositivos.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

