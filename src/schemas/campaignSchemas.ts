import { z } from 'zod';

export const campaignSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome da campanha é obrigatório')
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome muito longo'),
  
  platform: z.enum(['Google Ads', 'Meta', 'LinkedIn'], {
    errorMap: () => ({ message: 'Plataforma inválida' }),
  }),
  
  objective: z
    .string()
    .min(1, 'Objetivo é obrigatório')
    .max(200, 'Objetivo muito longo'),
  
  budgetTotal: z
    .number({
      required_error: 'Orçamento total é obrigatório',
      invalid_type_error: 'Orçamento deve ser um número',
    })
    .positive('Orçamento deve ser maior que zero')
    .max(1000000, 'Orçamento muito alto'),
  
  budgetDaily: z
    .number({
      invalid_type_error: 'Orçamento diário deve ser um número',
    })
    .positive('Orçamento diário deve ser maior que zero')
    .optional(),
  
  startDate: z
    .string()
    .min(1, 'Data de início é obrigatória')
    .refine((val) => !isNaN(Date.parse(val)), 'Data de início inválida'),
  
  endDate: z
    .string()
    .optional()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      'Data de término inválida'
    ),
  
  targeting: z.record(z.any()).optional(),
}).refine(
  (data) => {
    if (data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end > start;
    }
    return true;
  },
  {
    message: 'Data de término deve ser posterior à data de início',
    path: ['endDate'],
  }
).refine(
  (data) => {
    if (data.budgetDaily) {
      return data.budgetDaily <= data.budgetTotal;
    }
    return true;
  },
  {
    message: 'Orçamento diário não pode exceder o orçamento total',
    path: ['budgetDaily'],
  }
);

export type CampaignFormData = z.infer<typeof campaignSchema>;
