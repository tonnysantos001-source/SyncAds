import { z } from 'zod';

const shippingAddressSchema = z.object({
  street: z
    .string()
    .min(1, 'Endereço é obrigatório')
    .min(3, 'Endereço muito curto'),
  
  number: z.string().min(1, 'Número é obrigatório'),
  
  complement: z.string().optional(),
  
  neighborhood: z
    .string()
    .min(1, 'Bairro é obrigatório'),
  
  city: z
    .string()
    .min(1, 'Cidade é obrigatória'),
  
  state: z
    .string()
    .min(1, 'Estado é obrigatório')
    .length(2, 'Estado deve ter 2 caracteres')
    .toUpperCase(),
  
  zipCode: z
    .string()
    .min(1, 'CEP é obrigatório')
    .regex(/^\d{5}-?\d{3}$/, 'CEP inválido (formato: 12345-678)'),
});

export const checkoutSchema = z.object({
  customerEmail: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  
  customerName: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(2, 'Nome muito curto'),
  
  customerPhone: z
    .string()
    .regex(/^\(\d{2}\)\s?\d{4,5}-?\d{4}$/, 'Telefone inválido (formato: (11) 98888-8888)')
    .optional(),
  
  shippingAddress: shippingAddressSchema,
  
  paymentMethod: z.enum(['CREDIT_CARD', 'PIX', 'BOLETO'], {
    errorMap: () => ({ message: 'Método de pagamento inválido' }),
  }),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
export type ShippingAddressData = z.infer<typeof shippingAddressSchema>;
