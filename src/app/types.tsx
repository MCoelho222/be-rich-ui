import { z } from 'zod';
import expenseSchema from "./register/schema";

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

export interface IResponseData {
    id: number;
    amount: number;
    fixed?: boolean;
    payment_method: PaymentMethod;
    category: Category;
    installments?: number;
    card_owner: CardOwner;
    description?: string;
    created_at: string;
}

export type DataItemsKeys = 'amount' | 'payment_method' | 'category' | 'card_owner' | 'description' | 'installments' | 'fixed' | 'created_at'
export type ColumnNames = 'Amount' | 'Payment Method' | 'Category' | 'Card Owner' | 'Description' | 'Installments' | 'Fixed' | 'Date'