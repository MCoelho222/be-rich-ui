import { z } from 'zod';
import expenseSchema from "./schema";

export const categoriesArr = [
    'APPS',
    'BILLS',
    'CAR_REVIEW',
    'CAR_TAX',
    'CONECTCAR',
    'EDUCATION',
    'ENTERTAINMENT',
    'FUEL',
    'HEALTH',
    'MARKET',
    'PHARMACY',
    'PHONE',
    'OTHER',
    'RENT',
    'SHOPPING'
] as const;

export const paymentMethodArr = ['NU', 'PORTO', 'PIX'] as const;
export const cardOwnerArr = ['MARCELO', 'MARILIA'] as const;

export type Category = typeof categoriesArr[number];
export type PaymentMethod = typeof paymentMethodArr[number];
export type CardOwner = typeof cardOwnerArr[number];

export type ExpenseFormInput = z.infer<typeof expenseSchema>;