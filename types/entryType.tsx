import { z } from "zod";
import { EntrySchema } from "@/schema/entriesSchema";
import { EntryMode, PaymentMethod, Category, Source } from "@/helpers/entriesHelper";

export type FormInputType = z.input<typeof EntrySchema>; // Type before parsing
export type FormOutputType = z.output<typeof EntrySchema>; // Type after parsing
export type Entry = z.infer<typeof EntrySchema>; // Type after parsing

export interface EntryRead {
    id: string;
    amount: number;
    entry_type: EntryMode;
    fixed: boolean;
    installments: number;
    payment_method: PaymentMethod;
    category: Category;
    description: string;
    source: Source;
    created_at: string;
}