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

import { IncomeSchema } from "@/schema/entriesSchema";
import {
  FormInputIncomeType,
  FormOutputIncomeType,
  ExpenseEntry,
  IncomeEntry,
} from "@/types/entryType";
import { Source } from "@/helpers/entriesHelper";
import { useIncomes } from "@/context/EntriesContext";
import { put } from "@/http/apiClient";
import { toSnakeCaseKeys } from "@/utils/payloads";

interface IncomeModalProps {
  incomeToEdit?: ExpenseEntry | IncomeEntry;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  mode?: "add" | "edit";
}

export default function IncomeModal({
  incomeToEdit,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  mode = "add",
}: IncomeModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const { addIncome, setIncomes, incomes } = useIncomes();

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<FormInputIncomeType>({
    resolver: zodResolver(IncomeSchema),
    defaultValues: {
      installments: 1,
      fixed: false,
      createdAt: new Date().toISOString().split("T")[0],
    },
  });

  // When editing, populate form with income data
  useEffect(() => {
    if (mode === "edit" && incomeToEdit) {
      setValue("amount", incomeToEdit.amount);
      setValue("createdAt", new Date(incomeToEdit.createdAt).toISOString().split("T")[0]);
      setValue("installments", incomeToEdit.installments);
      setValue("source", incomeToEdit.source);
      setValue("fixed", incomeToEdit.fixed);
      setValue("description", incomeToEdit.description || "");
    }
  }, [mode, incomeToEdit, setValue]);

  async function onSubmit(values: FormInputIncomeType) {
    try {
      let parsed: FormOutputIncomeType = IncomeSchema.parse(values);

      if (mode === "edit" && incomeToEdit?.id) {
        // Update existing entry
        const createdAtISO = new Date(parsed.createdAt).toISOString();
        const payload = toSnakeCaseKeys({
          ...parsed,
          createdAt: createdAtISO,
        });

        let url = process.env.NEXT_PUBLIC_INCOME_ENDPOINT;

        if (payload.fixed) {
          url = process.env.NEXT_PUBLIC_INCOME_FIXED_ENDPOINT;
          delete payload.fixed;
        }

        await put(`${url}/${incomeToEdit.id}`, payload);

        // Update context
        const updatedIncome = { ...parsed, id: incomeToEdit.id };
        setIncomes(incomes.map((e) => (e.id === incomeToEdit.id ? updatedIncome : e)));
      } else {
        // Update context and make a POST request
        await addIncome(parsed);
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
          <Button className="rounded-xl shadow-sm bg-slate-600">New Income</Button>
        </DialogTrigger>
      )}

      {/* Custom overlay to blur the page */}
      <DialogOverlay className="fixed inset-0 bg-slate-300/20 backdrop-blur-sm" />

      <DialogContent
        className={`sm:max-w-lg rounded-2xl border shadow-2xl ${colorClasses.text.muted}`}
      >
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit income" : "Add income"}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the income details below."
              : "Record a new income. All fields with * are required."}
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

          {/* Recurring (both Income and Expense) */}
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
