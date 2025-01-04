import { z } from 'zod';
import { categoriesArr, cardOwnerArr, paymentMethodArr } from '../types';

const expenseSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Amount is required' })
    .positive({ message: 'Amount must be positive' }),
  fixed: z.boolean().optional(),
  payment_method: z.enum(paymentMethodArr),
  category: z.enum(categoriesArr),
  installments: z.number().min(1, { message: 'At least 1 installment' }).optional(),
  card_owner: z.enum(cardOwnerArr).optional(),
  description: z.string().optional()
});

export default expenseSchema;