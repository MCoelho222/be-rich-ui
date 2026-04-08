"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { ExpenseEntry, ExpenseRead, IncomeEntry, IncomeRead } from "@/types/entryType";
import { toSnakeCaseKeys, camelizeKeysExpense, camelizeKeysIncome } from "@/utils/payloads";
import { post, put, del } from "@/http/apiClient";
import { setFixedQueryParam } from "@/utils/urls";
import { fetchAll } from "@/http/requests";
import { addFixedKey } from "@/utils/entriesNormalizer";
import { sortEntriesByDate } from "@/utils/dates";

interface EntriesContextType {
  // Expenses
  expenses: ExpenseEntry[];
  setExpenses: (expenses: ExpenseEntry[]) => void;
  loadingExpense: boolean;
  setLoadingExpense: (loading: boolean) => void;
  errorExpense: string | null;
  setErrorExpense: (error: string | null) => void;

  // Incomes
  incomes: IncomeEntry[];
  setIncomes: (incomes: IncomeEntry[]) => void;
  loadingIncome: boolean;
  setLoadingIncome: (loading: boolean) => void;
  errorIncome: string | null;
  setErrorIncome: (error: string | null) => void;

  // Fetch all entries with date filtering
  fetchEntries: (startDate: string, endDate: string) => Promise<void>;

  // CRUD operations for expenses
  addExpense: (expenseEntry: ExpenseEntry) => Promise<void>;
  updateExpense: (expenseEntryId: string, expenseEntry: ExpenseEntry) => Promise<void>;
  deleteExpense: (expenseEntryId: string, fixed: boolean) => Promise<void>;

  // CRUD operations for incomes
  addIncome: (incomeEntry: IncomeEntry) => Promise<void>;
  updateIncome: (incomeEntryId: string, incomeEntry: IncomeEntry) => Promise<void>;
  deleteIncome: (incomeEntryId: string, fixed: boolean) => Promise<void>;
}

const EntriesContext = createContext<EntriesContextType | undefined>(undefined);

export const EntriesProvider = ({ children }: { children: ReactNode }) => {
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [loadingExpense, setLoadingExpense] = useState(false);
  const [errorExpense, setErrorExpense] = useState<string | null>(null);

  const [incomes, setIncomes] = useState<IncomeEntry[]>([]);
  const [loadingIncome, setLoadingIncome] = useState(false);
  const [errorIncome, setErrorIncome] = useState<string | null>(null);

  const fetchEntries = async (startDate: string, endDate: string) => {
    try {
      setLoadingExpense(true);
      setLoadingIncome(true);
      setErrorExpense(null);
      setErrorIncome(null);

      const data = await fetchAll(startDate, endDate, { "Content-Type": "application/json" });

      if (data.error) {
        console.log(data);
        console.error(data.error);
      }

      delete data.error;

      const camelizedData = {
        expenses: data.expenses?.map(camelizeKeysExpense),
        expensesFixed: data.expensesFixed?.map(camelizeKeysExpense),
        incomes: data.incomes?.map(camelizeKeysIncome),
        incomesFixed: data.incomesFixed?.map(camelizeKeysIncome),
      };

      const dataWithFixed = {
        expenses: camelizedData.expenses?.map((expense) => addFixedKey(expense, false)) ?? [],
        expensesFixed:
          camelizedData.expensesFixed?.map((expense) => addFixedKey(expense, true)) ?? [],
        incomes: camelizedData.incomes?.map((income) => addFixedKey(income, false)) ?? [],
        incomesFixed: camelizedData.incomesFixed?.map((income) => addFixedKey(income, true)) ?? [],
      };

      const expensesUnified = [...dataWithFixed.expenses, ...dataWithFixed.expensesFixed];
      const incomesUnified = [...dataWithFixed.incomes, ...dataWithFixed.incomesFixed];

      setExpenses(sortEntriesByDate(expensesUnified));
      setIncomes(sortEntriesByDate(incomesUnified));
    } catch (err) {
      console.error("Error loading entries:", err);
      setErrorExpense("Could not load expenses.");
      setErrorIncome("Could not load incomes.");
    } finally {
      setLoadingExpense(false);
      setLoadingIncome(false);
    }
  };

  // Expense CRUD operations
  const addExpense = async (expenseEntry: ExpenseEntry) => {
    let url = process.env.NEXT_PUBLIC_EXPENSE_ENDPOINT;
    if (url) {
      const isFixed = expenseEntry.fixed ? true : false;
      delete expenseEntry.fixed;
      url = setFixedQueryParam(url, isFixed);
      try {
        const createdAtISO = new Date(expenseEntry.createdAt).toISOString();
        const payload = toSnakeCaseKeys({
          ...expenseEntry,
          createdAt: createdAtISO,
        });

        const res = await post(url, payload, {
          "Content-Type": "application/json",
        });

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
    let url = process.env.NEXT_PUBLIC_EXPENSE_ENDPOINT;
    if (url) {
      const isFixed = expenseEntry.fixed ? true : false;
      delete expenseEntry.fixed;
      url = setFixedQueryParam(url, isFixed);
      try {
        const createdAtISO = new Date(expenseEntry.createdAt).toISOString();
        const payload = toSnakeCaseKeys({
          ...expenseEntry,
          createdAt: createdAtISO,
        });

        const res = await put(url, payload, {
          "Content-Type": "application/json",
        });

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
    let url = process.env.NEXT_PUBLIC_EXPENSE_ENDPOINT;
    if (url) {
      url = setFixedQueryParam(url, fixed);
      try {
        await del(url, {
          "Content-Type": "application/json",
        });

        setExpenses((prev) => prev.filter((expenseEntry) => expenseEntry.id !== expenseEntryId));
      } catch (err) {
        console.error("Failed to delete expense:", err);
        throw err;
      }
    } else {
      console.error("Url is not set");
    }
  };

  // Income CRUD operations
  const addIncome = async (incomeEntry: IncomeEntry) => {
    let url = process.env.NEXT_PUBLIC_INCOME_ENDPOINT;
    if (url) {
      const isFixed = incomeEntry.fixed ? true : false;
      delete incomeEntry.fixed;
      url = setFixedQueryParam(url, isFixed);
      try {
        const createdAtISO = new Date(incomeEntry.createdAt).toISOString();
        const payload = toSnakeCaseKeys({
          ...incomeEntry,
          createdAt: createdAtISO,
        });

        const res = await post(url, payload, {
          "Content-Type": "application/json",
        });

        const newIncome = camelizeKeysIncome(res?.data as IncomeRead) as IncomeEntry;
        newIncome.fixed = isFixed;

        setIncomes((prev) => [newIncome, ...prev]);
      } catch (err) {
        console.error("Failed to add income:", err);
        throw err;
      }
    } else {
      console.error("Url is not set");
    }
  };

  const updateIncome = async (incomeEntryId: string, incomeEntry: IncomeEntry) => {
    let url = process.env.NEXT_PUBLIC_INCOME_ENDPOINT;
    if (url) {
      const isFixed = incomeEntry.fixed ? true : false;
      delete incomeEntry.fixed;
      url = setFixedQueryParam(url, isFixed);
      try {
        const createdAtISO = new Date(incomeEntry.createdAt).toISOString();
        const payload = toSnakeCaseKeys({
          ...incomeEntry,
          createdAt: createdAtISO,
        });

        const res = await put(url, payload, {
          "Content-Type": "application/json",
        });

        const updatedIncome = camelizeKeysIncome(res?.data as IncomeRead) as IncomeEntry;
        setIncomes((prev) => prev.map((e) => (e.id === incomeEntryId ? updatedIncome : e)));
      } catch (err) {
        console.error("Failed to update income:", err);
        throw err;
      }
    } else {
      console.error("Url is not set");
    }
  };

  const deleteIncome = async (incomeEntryId: string, fixed: boolean) => {
    let url = process.env.NEXT_PUBLIC_INCOME_ENDPOINT;
    if (url) {
      url = setFixedQueryParam(url, fixed);
      try {
        await del(url, {
          "Content-Type": "application/json",
        });

        setIncomes((prev) => prev.filter((incomeEntry) => incomeEntry.id !== incomeEntryId));
      } catch (err) {
        console.error("Failed to delete income:", err);
        throw err;
      }
    } else {
      console.error("Url is not set");
    }
  };

  return (
    <EntriesContext.Provider
      value={{
        expenses,
        setExpenses,
        loadingExpense,
        setLoadingExpense,
        errorExpense,
        setErrorExpense,
        incomes,
        setIncomes,
        loadingIncome,
        setLoadingIncome,
        errorIncome,
        setErrorIncome,
        fetchEntries,
        addExpense,
        updateExpense,
        deleteExpense,
        addIncome,
        updateIncome,
        deleteIncome,
      }}
    >
      {children}
    </EntriesContext.Provider>
  );
};

export const useEntries = () => {
  const context = useContext(EntriesContext);
  if (context === undefined) {
    throw new Error("useEntries must be used within an EntriesProvider");
  }
  return context;
};

// Convenience hooks for backwards compatibility with existing components
export const useExpenses = () => {
  const context = useEntries();
  return {
    expenses: context.expenses,
    setExpenses: context.setExpenses,
    loadingExpense: context.loadingExpense,
    setLoadingExpense: context.setLoadingExpense,
    errorExpense: context.errorExpense,
    setErrorExpense: context.setErrorExpense,
    addExpense: context.addExpense,
    updateExpense: context.updateExpense,
    deleteExpense: context.deleteExpense,
  };
};

export const useIncomes = () => {
  const context = useEntries();
  return {
    incomes: context.incomes,
    setIncomes: context.setIncomes,
    loadingIncome: context.loadingIncome,
    setLoadingIncome: context.setLoadingIncome,
    errorIncome: context.errorIncome,
    setErrorIncome: context.setErrorIncome,
    addIncome: context.addIncome,
    updateIncome: context.updateIncome,
    deleteIncome: context.deleteIncome,
  };
};
