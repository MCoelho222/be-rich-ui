"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import CurrencyInput from "react-currency-input-field";

// shadcn/ui components (ensure you've generated these)
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PaymentMethod, Category, Source, EntryType } from "@/helpers/newEntryHelpers";

// ---------- Schema ----------
const EntrySchema = z.object({
  entryType: z.enum(EntryType, { error: "Pick an entry type" }),
  amount: z
    .coerce
    .number({ error: "Enter a valid amount" })
    .positive({error: "Must be greater than zero"}),
  installments: z
    .coerce
    .number({error: "Enter a valid integer"})
    .int()
    .min(1, {error: "Must be at least 1"})
    .default(1),
  createdAt: z.coerce.date({ error: "Pick a date" }),
  category: z.enum(Category, { error: "Pick a category" }),
  source: z.enum(Source, { error: "Pick a source" }),
  description: z.string().max(200, { error: "Max 200 characters" }).optional(),
  fixed: z.boolean({ error: "Invalid boolean" }).default(false),
  paymentMethod: z.enum(PaymentMethod, {error: "Pick a method"})
});

type FormInput = z.input<typeof EntrySchema>;
type FormOutput = z.output<typeof EntrySchema>;

export default function FinanceEntryModal() {
  const [open, setOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormInput>({
    resolver: zodResolver(EntrySchema),
    defaultValues: {
      entryType: EntryType.EXPENSE,
      installments: 1,
      category: Category.OTHER,
      source: Source.MARCELO,
      description: "",
      fixed: false,
      createdAt: new Date(),
      paymentMethod: PaymentMethod.SANTANDER
    },
  });

  async function onSubmit(values: FormInput) {
    // Replace with your mutation / server action
    // Example payload you might send to your API
    const payload: FormOutput = EntrySchema.parse(values);
    console.log("Submitting:", payload);

    // Simulate success
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-2xl shadow-sm">New entry</Button>
      </DialogTrigger>

      {/* Custom overlay to blur the page */}
      <DialogOverlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

      <DialogContent className="sm:max-w-lg rounded-2xl border shadow-2xl">
        <DialogHeader>
          <DialogTitle>Add income/expense</DialogTitle>
          <DialogDescription>
            Record a new financial entry. All fields with * are required.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-4 py-2"
        >
          {/* Kind */}
          <div className="grid gap-2">
            <Label htmlFor="entryType">Type *</Label>
            <Controller
              name="entryType"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger id="entryType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EntryType.INCOME}>Income</SelectItem>
                    <SelectItem value={EntryType.EXPENSE}>Expense</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.entryType && (
              <p className="text-sm text-red-500">{errors.entryType.message}</p>
            )}
          </div>

          {/* Amount */}
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount *</Label>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  id="amount"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  prefix="R$ "
                  decimalScale={2}
                  decimalsLimit={2}
                  intlConfig={{ locale: "pt-BR", currency: "BRL" }}
                  value={Number.isFinite(field.value) ? field.value as number : undefined}
                  onValueChange={(val) => field.onChange(Number(val || 0))}
                />
              )}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
          </div>

          {/* Date */}
          <div className="grid gap-2">
            <Label htmlFor="createdAt">Date *</Label>
            <Input id="createdAt" type="createdAt" {...register("createdAt")} />
            {errors.createdAt && (
              <p className="text-sm text-red-500">{errors.createdAt.message as string}</p>
            )}
          </div>

          {/* Category */}
          <div className="grid gap-2">
            <Label htmlFor="category">Category *</Label>
            <Input id="category" placeholder="e.g. Groceries, Salary" {...register("category")} />
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category.message}</p>
            )}
          </div>

          {/* Payment method */}
          <div className="grid gap-2">
            <Label htmlFor="paymentMethod">Payment method</Label>
            <Controller
              name="paymentMethod"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder="Select a method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank">Bank transfer</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Recurring */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-1">
              <Label htmlFor="recurring">Recurring</Label>
              <p className="text-xs text-muted-foreground">
                Apply this entry monthly until you cancel it.
              </p>
            </div>
            <Controller
              name="fixed"
              control={control}
              render={({ field }) => (
                <Switch id="fixed" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Notes</Label>
            <Textarea id="description" placeholder="Optional details" {...register("description")} />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
