import { z } from "zod";
import { ExpenseSchema, IncomeSchema } from "@/schema/entriesSchema";
import { PaymentMethod, Category, Source } from "@/helpers/entriesHelper";

export type FormInputExpenseType = z.input<typeof ExpenseSchema>; // Type before parsing
export type FormOutputExpenseType = z.output<typeof ExpenseSchema>; // Type after parsing
export type ExpenseEntry = z.infer<typeof ExpenseSchema>; // Type after parsing

export type FormInputIncomeType = z.input<typeof IncomeSchema>; // Type before parsing
export type FormOutputIncomeType = z.output<typeof IncomeSchema>; // Type after parsing
export type IncomeEntry = z.infer<typeof IncomeSchema>; // Type after parsing

export interface ExpenseRead {
  id: string;
  amount: number;
  payment_method: PaymentMethod;
  installment: string;
  category: Category;
  description: string;
  source: Source;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCamel {
  id: string;
  amount: number;
  paymentMethod: PaymentMethod;
  installment: string;
  category: Category;
  description: string;
  source: Source;
  fixed?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface IncomeRead {
  id: string;
  amount: number;
  installment: string;
  description: string;
  source: Source;
  created_at: string;
  updated_at: string;
}

export interface IncomeCamel {
  id: string;
  amount: number;
  installment: string;
  description: string;
  source: Source;
  fixed?: boolean;
  createdAt: string;
  updatedAt?: string;
}
