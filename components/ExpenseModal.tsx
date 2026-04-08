"use client";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { colorClasses } from "@/config/colors";

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

import { ExpenseSchema } from "@/schema/entriesSchema";
import { FormInputExpenseType, FormOutputExpenseType, ExpenseEntry } from "@/types/entryType";
import { PaymentMethod, Category, Source } from "@/helpers/entriesHelper";
import { useExpenses } from "@/context/EntriesContext";
import { put } from "@/http/apiClient";
import { toSnakeCaseKeys } from "@/utils/payloads";

interface ExpenseModalProps {
  expenseToEdit?: ExpenseEntry;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  mode?: "add" | "edit";
}

export default function ExpenseModal({
  expenseToEdit,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  mode = "add",
}: ExpenseModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const { addExpense, setExpenses, expenses } = useExpenses();

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<FormInputExpenseType>({
    resolver: zodResolver(ExpenseSchema),
    defaultValues: {
      installments: 1,
      fixed: false,
      createdAt: new Date().toISOString().split("T")[0],
    },
  });

  // When editing, populate form with entry data
  useEffect(() => {
    if (mode === "edit" && expenseToEdit) {
      setValue("amount", expenseToEdit.amount);
      setValue("createdAt", new Date(expenseToEdit.createdAt).toISOString().split("T")[0]);
      setValue("category", expenseToEdit.category);
      setValue("paymentMethod", expenseToEdit.paymentMethod);
      setValue("installments", expenseToEdit.installments);
      setValue("source", expenseToEdit.source);
      setValue("fixed", expenseToEdit.fixed);
      setValue("description", expenseToEdit.description || "");
    }
  }, [mode, expenseToEdit, setValue]);

  async function onSubmit(values: FormInputExpenseType) {
    try {
      let parsed: FormOutputExpenseType = ExpenseSchema.parse(values);

      if (mode === "edit" && expenseToEdit?.id) {
        // Update existing entry
        const createdAtISO = new Date(parsed.createdAt).toISOString();
        const payload = toSnakeCaseKeys({
          ...parsed,
          createdAt: createdAtISO,
        });

        let url = process.env.NEXT_PUBLIC_EXPENSE_ENDPOINT;

        if (payload.fixed) {
          url = process.env.NEXT_PUBLIC_EXPENSE_FIXED_ENDPOINT;
          delete payload.fixed;
        }

        await put(`${url}/${expenseToEdit.id}`, payload);

        // Update context
        const updatedExpense = { ...parsed, id: expenseToEdit.id };
        setExpenses(expenses.map((e) => (e.id === expenseToEdit.id ? updatedExpense : e)));
      } else {
        // Update context and make a POST request
        await addExpense(parsed);
      }

      reset();
      setOpen(false);
    } catch (error) {
      console.error("Failed to submit entry:", error);
    }
  }

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      // Closing: reset everything
      reset();
    }
    setOpen(value);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {mode === "add" && (
        <DialogTrigger asChild>
          <Button className="rounded-xl shadow-sm bg-slate-600">New Expense</Button>
        </DialogTrigger>
      )}

      {/* Custom overlay to blur the page */}
      <DialogOverlay className="fixed inset-0 bg-slate-300/20 backdrop-blur-sm" />

      <DialogContent
        className={`sm:max-w-lg rounded-2xl border shadow-2xl ${colorClasses.text.muted}`}
      >
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit expense" : "Add expense"}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the expense details below."
              : "Record a new expense. All fields with * are required."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-2">
          {/* Amount */}
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className={`text-sm ${colorClasses.state.error}`}>{errors.amount.message}</p>
            )}
          </div>
          <div className="flex gap-4">
            {/* Date */}
            <div className="grid gap-2">
              <Label htmlFor="createdAt">Date *</Label>
              <Input id="createdAt" type="date" {...register("createdAt")} />
              {errors.createdAt && (
                <p className={`text-sm ${colorClasses.state.error}`}>
                  {errors.createdAt.message as string}
                </p>
              )}
            </div>

            {/* Source */}
            <div className="grid gap-2">
              <Label htmlFor="source">Source *</Label>
              <Controller
                name="source"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="source">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(Source).map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.source && (
                <p className={`text-sm ${colorClasses.state.error}`}>{errors.source.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-row gap-4">
            {/* Category */}
            <div className="grid gap-2 flex-1">
              <Label htmlFor="category">Category *</Label>
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
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && (
                <p className={`text-sm ${colorClasses.state.error}`}>{errors.category.message}</p>
              )}
            </div>

            {/* Payment method */}
            <div className="grid gap-2 flex-1">
              <Label htmlFor="paymentMethod">Payment method *</Label>
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
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.paymentMethod && (
                <p className={`text-sm ${colorClasses.state.error}`}>
                  {errors.paymentMethod.message}
                </p>
              )}
            </div>
          </div>

          {/* Installments */}
          <div className="grid gap-2">
            <Label htmlFor="installments">Installments *</Label>
            <Input
              id="installments"
              type="number"
              min={1}
              {...register("installments", { valueAsNumber: true })}
            />
            {errors.installments && (
              <p className={`text-sm ${colorClasses.state.error}`}>{errors.installments.message}</p>
            )}
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

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="description">Notes</Label>
            <Textarea
              id="description"
              placeholder="Optional details"
              {...register("description")}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : mode === "edit" ? "Update entry" : "Save entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
