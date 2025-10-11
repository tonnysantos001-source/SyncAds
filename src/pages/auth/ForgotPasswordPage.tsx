import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { LoaderCircle } from 'lucide-react';

import { supabase } from '@/lib/supabaseClient';
import AuthLayout from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

const forgotPasswordSchema = z.object({
  email: z.string().email('Por favor, insira um e-mail válido.'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error(error.message || 'Falha ao enviar e-mail de recuperação.');
    } else {
      toast.success('E-mail de recuperação enviado!');
      setIsSubmitted(true);
    }
    setIsLoading(false);
  };

  if (isSubmitted) {
    return (
      <AuthLayout
        title="Verifique seu E-mail"
        description="Enviámos um link para o seu e-mail para redefinir a sua senha."
      >
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Se não o encontrar, verifique a sua pasta de spam.</p>
          <Button asChild className="mt-6 w-full">
            <Link to="/login">Voltar para Login</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Recuperar Senha"
      description="Insira o seu e-mail para receber um link de redefinição."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" placeholder="seu@email.com" {...register('email')} />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <LoaderCircle className="animate-spin" /> : 'Enviar Link de Recuperação'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Lembrou-se da senha?{' '}
        <Link to="/login" className="font-semibold text-brand-primary hover:underline">
          Faça login
        </Link>
      </p>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
