"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { json, z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import CurrencyInput from "react-currency-input-field";

// shadcn/ui components
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

import axios from 'axios';
import { PaymentMethod, Category, Source, EntryType } from "@/helpers/newEntryHelpers";
import { toSnakeCaseKeys } from "@/utils/payloads";

// ---------- Schema ----------
const EntrySchema = z.object({
  entryType: z.enum(EntryType),
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

type FormInput = z.input<typeof EntrySchema>; // Type before parsing
type FormOutput = z.output<typeof EntrySchema>; // Type after parsing

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
      source: Source.MARCELO,
      fixed: false,
      category: Category.SUPERMARKET,
      createdAt: new Date().toISOString().split("T")[0],
      paymentMethod: PaymentMethod.SANTANDER
    },
  });

  async function onSubmit(values: FormInput) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL + "/entries/";
    const parsed: FormOutput = EntrySchema.parse(values);
    const createdAtISO = new Date(parsed.createdAt).toISOString();
    const payload = toSnakeCaseKeys({
      ...parsed,
      createdAt: createdAtISO
    })
    if (!apiUrl) {
      console.error("NEXT_PUBLIC_API_URL is not defined");
      // Skip network call if API URL is missing, but still reset/close the modal or handle as needed
      reset();
      setOpen(false);
      return;
    }
    try {
      const res = await axios.post(apiUrl, payload, {
        headers: {
            'Content-Type': 'application/json'
        }}
      );
      console.log("Server response:", res.data);
    } catch (error) {
      console.error("Failed to submit entry:", error);
    }

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
          {/* Entry type */}
          <div className="flex flex-row gap-4">

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
                    value={
                      typeof field.value === "number" && !isNaN(field.value)
                        ? field.value.toString()
                        : undefined
                    }
                    onValueChange={(val) => {
                      const parsed = val ? parseFloat(val.replace(",", ".")) : 0;
                      field.onChange(parsed);
                    }}
                  />
                )}
              />
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount.message}</p>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="grid gap-2">
            <Label htmlFor="createdAt">Date *</Label>
            <Input id="createdAt" type="date" {...register("createdAt")} />
            {errors.createdAt && (
              <p className="text-sm text-red-500">{errors.createdAt.message as string}</p>
            )}
          </div>

          {/* Category */}
          <div className="flex flex-row gap-4">

            <div className="grid gap-2">
              <Label htmlFor="category">Catgerory *</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(Category).map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
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
                      {Object.values(PaymentMethod).map((method) => (
                        <SelectItem key={method} value={method}>{method}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
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

          <DialogFooter className="gap-2 sm:gap-2">
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
