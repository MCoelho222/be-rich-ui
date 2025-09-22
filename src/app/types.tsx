import { z } from 'zod';
import expenseSchema from "./register/schema";

export const categoriesArr = [
    "Apps",
    "House",
    "Gas",
    "Internet",
    "Energy",
    "House Installment",
    "Car",
    "Education",
    "Entertainment",
    "Health",
    "Supermarket",
    "Clothes",
    "Pharmacy",
    "Phone",
    "Rent",
    "Gift",
    "Other",
    "Kids"
] as const;

export const paymentMethodArr = ["NU", "Porto", "Santander", "Pix"] as const;
export const source = ["Marcelo", "Marilia", "Other"] as const;

export type Category = typeof categoriesArr[number];
export type PaymentMethod = typeof paymentMethodArr[number];
export type CardOwner = typeof source[number];

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