import { z } from "zod";
import { PaymentMethod, Category, Source, EntryMode } from "@/helpers/entriesHelper";

export const ExpenseEntrySchema = z.object({
  id: z.string().optional(),
  amount: z.coerce.number({ error: "Enter a valid amount" }).positive({ error: "Must be greater than zero" }),
  installments: z.coerce.number({ error: "Enter a valid integer" }).int().min(1, { error: "Must be at least 1" }).default(1).optional(),
  createdAt: z.coerce.date({ error: "Pick a date" }),
  category: z.enum(Category, { error: "Pick a category" }).optional(),
  source: z.enum(Source, { error: "Pick a source" }),
  description: z.string().max(200, { error: "Max 200 characters" }).optional(),
  fixed: z.boolean({ error: "Invalid boolean" }).default(false).optional(),
  paymentMethod: z.enum(PaymentMethod, { error: "Pick a method" }).optional(),
});

export const IncomeEntrySchema = z.object({
  id: z.string().optional(),
  amount: z.coerce.number({ error: "Enter a valid amount" }).positive({ error: "Must be greater than zero" }),
  installments: z.coerce.number({ error: "Enter a valid integer" }).int().min(1, { error: "Must be at least 1" }).default(1).optional(),
  description: z.string().max(200, { error: "Max 200 characters" }).optional(),
  source: z.enum(Source, { error: "Pick a source" }),
  fixed: z.boolean({ error: "Invalid boolean" }).default(false).optional(),
  createdAt: z.coerce.date({ error: "Pick a date" }),
});


