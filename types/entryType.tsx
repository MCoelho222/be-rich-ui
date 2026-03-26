import { z } from "zod";
import { ExpenseEntrySchema, IncomeEntrySchema } from "@/schema/entriesSchema";
import { PaymentMethod, Category, Source } from "@/helpers/entriesHelper";

export type FormInputExpenseType = z.input<typeof ExpenseEntrySchema>; // Type before parsing
export type FormOutputExpenseType = z.output<typeof ExpenseEntrySchema>; // Type after parsing
export type ExpenseEntry = z.infer<typeof ExpenseEntrySchema>; // Type after parsing

export type FormInputIncomeType = z.input<typeof IncomeEntrySchema>; // Type before parsing
export type FormOutputIncomeType = z.output<typeof IncomeEntrySchema>; // Type after parsing
export type IncomeEntry = z.infer<typeof IncomeEntrySchema>; // Type after parsing

export interface ExpenseRead {
    id: string;
    amount: number;
    payment_method: PaymentMethod;
    installments: number;
    category: Category;
    description: string;
    source: Source;
    created_at: string;
    updated_at: string;
}

export interface IncomeRead {
    id: string;
    amount: number;
    installments: number;
    description: string;
    source: Source;
    created_at: string;
    updated_at: string;
}