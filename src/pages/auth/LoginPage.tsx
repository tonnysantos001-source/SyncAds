import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/store/authStore';
import React from 'react';
import { useToast } from '@/components/ui/use-toast';
import Logo from '@/components/Logo';
import { loginSchema, type LoginFormData } from '@/schemas/authSchemas';

// Mock Google Icon
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    <path d="M1 1h22v22H1z" fill="none"/>
  </svg>
);


export default function LoginPage() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      // Fazer login
      await login(data.email, data.password);
      
      // Aguardar um pouco para garantir que o estado foi atualizado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Pegar dados atualizados do usuário
      const user = useAuthStore.getState().user;
      
      toast({
        title: 'Login realizado com sucesso!',
        description: 'Bem-vindo de volta.',
      });
      
      // Redirecionar para dashboard correto
      const redirectPath = user?.isSuperAdmin ? '/super-admin' : '/dashboard';
      
      // Usar window.location para garantir reload completo
      window.location.href = redirectPath;
    } catch (error: any) {
      toast({
        title: 'Erro ao fazer login',
        description: error.message || 'Verifique suas credenciais e tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      {/* Background gradients - mesmo da landing */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950 -z-10" />
      <div className="fixed top-0 left-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl -z-10" />

      {/* Botão Voltar */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="text-sm font-medium">Voltar</span>
      </Link>

      <Card className="w-full max-w-md relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-2 border-gray-200/50 dark:border-gray-800/50 shadow-2xl">
        {/* Gradient top border */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />
        
        <CardHeader className="text-center pt-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-50" />
              <div className="relative h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <span className="text-white font-black text-3xl">S</span>
                <div className="absolute -top-2 -right-2 h-3 w-3 bg-yellow-400 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
          <div className="mb-6">
            <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
              SyncAds
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 tracking-wider font-semibold">MARKETING AI</p>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Bem-vindo de volta!</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">Acesse sua conta para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="nome@exemplo.com" 
                  {...register('email')}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Senha</Label>
                  <Link to="/forgot-password" className="ml-auto inline-block text-sm underline">
                    Esqueceu sua senha?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  {...register('password')}
                  disabled={isSubmitting}
                />
                {errors.password && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02]" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 animate-spin" />
                    Entrando...
                  </span>
                ) : 'Entrar'}
              </Button>
            </div>
          </form>
          <Separator className="my-6" />
          <Button variant="outline" className="w-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
            <GoogleIcon className="mr-2 h-4 w-4" /> Continuar com Google
          </Button>
          <div className="mt-6 text-center text-sm">
            Não tem uma conta?{' '}
            <Link to="/register" className="font-semibold text-blue-600 hover:text-purple-600 transition-colors">
              Criar cadastro
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
