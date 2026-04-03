"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { ExpenseEntry, ExpenseRead } from "@/types/entryType";
import { toSnakeCaseKeys, camelizeKeysExpense } from "@/utils/payloads";
import { post, put, del } from "@/http/apiClient";

interface ExpensesContextType {
  expenses: ExpenseEntry[];
  setExpenses: (expenses: ExpenseEntry[]) => void;
  loadingExpense: boolean;
  setLoadingExpense: (loadingExpense: boolean) => void;
  errorExpense: string | null;
  setErrorExpense: (errorExpense: string | null) => void;
  addExpense: (expenseEntry: ExpenseEntry) => Promise<void>;
  updateExpense: (expenseEntryId: string, expenseEntry: ExpenseEntry) => Promise<void>;
  deleteExpense: (expenseEntryId: string, fixed: boolean) => Promise<void>;
}

const ExpensesContext = createContext<ExpensesContextType | undefined>(undefined);

export const ExpensesProvider = ({ children }: { children: ReactNode }) => {
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [loadingExpense, setLoadingExpense] = useState(false);
  const [errorExpense, setErrorExpense] = useState<string | null>(null);

  const addExpense = async (expenseEntry: ExpenseEntry) => {
    const url = expenseEntry.fixed
      ? process.env.NEXT_PUBLIC_EXPENSE_FIXED_ENDPOINT
      : process.env.NEXT_PUBLIC_EXPENSE_ENDPOINT;
    if (url) {
      try {
        delete expenseEntry.fixed;

        const createdAtISO = new Date(expenseEntry.createdAt).toISOString();
        const payload = toSnakeCaseKeys({
          ...expenseEntry,
          createdAt: createdAtISO,
        });

        const res = await post(url, payload, {
          "Content-Type": "application/json",
        });

        // Add the newly created expense to state
        const newEntry = camelizeKeysExpense(res?.data as ExpenseRead) as ExpenseEntry;
        setExpenses((prev) => [newEntry, ...prev]);
      } catch (err) {
        console.error("Failed to add expense:", err);
        throw err;
      }
    } else {
      console.error("Url is not set");
    }
  };

  const updateExpense = async (expenseEntryId: string, expenseEntry: ExpenseEntry) => {
    const url = expenseEntry.fixed
      ? process.env.NEXT_PUBLIC_EXPENSE_FIXED_ENDPOINT
      : process.env.NEXT_PUBLIC_EXPENSE_ENDPOINT;
    if (url) {
      delete expenseEntry.fixed;
      try {
        const createdAtISO = new Date(expenseEntry.createdAt).toISOString();
        const payload = toSnakeCaseKeys({
          ...expenseEntry,
          createdAt: createdAtISO,
        });

        const res = await put(url, payload, {
          "Content-Type": "application/json",
        });

        // Update the expense in state
        const updatedExpense = camelizeKeysExpense(res.data as ExpenseRead) as ExpenseEntry;
        setExpenses((prev) => prev.map((e) => (e.id === expenseEntryId ? updatedExpense : e)));
      } catch (err) {
        console.error("Failed to update expense:", err);
        throw err;
      }
    } else {
      console.error("Url is not set");
    }
  };

  const deleteExpense = async (expenseEntryId: string, fixed: boolean) => {
    const url = fixed
      ? process.env.NEXT_PUBLIC_EXPENSE_FIXED_ENDPOINT
      : process.env.NEXT_PUBLIC_EXPENSE_ENDPOINT;
    if (url) {
      try {
        await del(url, {
          "Content-Type": "application/json",
        });

        // Remove the deleted expense from state
        setExpenses((prev) => prev.filter((expenseEntry) => expenseEntry.id !== expenseEntryId));
      } catch (err) {
        console.error("Failed to delete expense:", err);
        throw err;
      }
    } else {
      console.error("Url is not set");
    }
  };

  return (
    <ExpensesContext.Provider
      value={{
        expenses,
        setExpenses,
        loadingExpense,
        setLoadingExpense,
        errorExpense,
        setErrorExpense,
        addExpense,
        updateExpense,
        deleteExpense,
      }}
    >
      {children}
    </ExpensesContext.Provider>
  );
};

export const useExpenses = () => {
  const context = useContext(ExpensesContext);
  if (context === undefined) {
    throw new Error("useExpenses must be used within an ExpensesProvider");
  }
  return context;
};
