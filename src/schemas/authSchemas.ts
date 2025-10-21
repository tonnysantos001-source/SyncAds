import { z } from 'zod';

// Login Schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Register Schema
export const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome muito longo'),
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
  confirmPassword: z.string().min(1, 'Confirme sua senha'),
  cpf: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/.test(val),
      'CPF inválido'
    ),
  birthDate: z
    .string()
    .optional()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      'Data inválida'
    ),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// Forgot Password Schema
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
