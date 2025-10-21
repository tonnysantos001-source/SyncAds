import { z } from 'zod';

export const productSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome do produto é obrigatório')
    .min(2, 'Nome muito curto')
    .max(200, 'Nome muito longo'),
  
  slug: z
    .string()
    .min(1, 'Slug é obrigatório')
    .min(2, 'Slug muito curto')
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  
  price: z
    .number({
      required_error: 'Preço é obrigatório',
      invalid_type_error: 'Preço deve ser um número',
    })
    .min(0, 'Preço deve ser positivo')
    .max(1000000, 'Preço muito alto'),
  
  comparePrice: z
    .number({
      invalid_type_error: 'Preço de comparação deve ser um número',
    })
    .positive('Preço de comparação deve ser positivo')
    .optional(),
  
  stock: z
    .number({
      required_error: 'Estoque é obrigatório',
      invalid_type_error: 'Estoque deve ser um número',
    })
    .int('Estoque deve ser um número inteiro')
    .min(0, 'Estoque não pode ser negativo'),
  
  categoryId: z
    .string()
    .uuid('ID de categoria inválido')
    .optional(),
  
  description: z
    .string()
    .max(5000, 'Descrição muito longa')
    .optional(),
  
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED'], {
    errorMap: () => ({ message: 'Status inválido' }),
  }),
}).refine(
  (data) => {
    if (data.comparePrice) {
      return data.comparePrice > data.price;
    }
    return true;
  },
  {
    message: 'Preço de comparação deve ser maior que o preço normal',
    path: ['comparePrice'],
  }
);

export type ProductFormData = z.infer<typeof productSchema>;
