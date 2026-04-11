"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { ExpenseEntry, ExpenseCamel, ExpenseRead, IncomeEntry, IncomeCamel, IncomeRead } from "@/types/entryType";
import { toSnakeCaseKeys, camelizeKeysExpense, camelizeKeysIncome } from "@/utils/payloads";
import { post, put, del } from "@/http/apiClient";
import { setQueryParams } from "@/utils/urls";
import { fetchAll } from "@/http/requests";
import { addFixedKey } from "@/utils/entriesNormalizer";
import { sortEntriesByDate } from "@/utils/dates";

interface EntriesContextType {
  // Expenses
  expenses: ExpenseCamel[];
  setExpenses: (expenses: ExpenseCamel[]) => void;
  loadingExpense: boolean;
  setLoadingExpense: (loading: boolean) => void;
  errorExpense: string | null;
  setErrorExpense: (error: string | null) => void;

  // Incomes
  incomes: IncomeCamel[];
  setIncomes: (incomes: IncomeCamel[]) => void;
  loadingIncome: boolean;
  setLoadingIncome: (loading: boolean) => void;
  errorIncome: string | null;
  setErrorIncome: (error: string | null) => void;

  // Fetch all entries with date filtering
  fetchEntries: (startDate: string, endDate: string) => Promise<void>;

  // CRUD operations for expenses
  addExpense: (expenseEntry: ExpenseEntry) => Promise<void>;
  updateExpense: (expenseCamelId: string, expenseCamel: ExpenseCamel) => Promise<void>;
  deleteExpense: (expenseCamelId: string, fixed: boolean) => Promise<void>;

  // CRUD operations for incomes
  addIncome: (incomeEntry: IncomeEntry) => Promise<void>;
  updateIncome: (incomeCamelId: string, incomeCamel: IncomeCamel) => Promise<void>;
  deleteIncome: (incomeCamelId: string, fixed: boolean) => Promise<void>;
}

const EntriesContext = createContext<EntriesContextType | undefined>(undefined);

export const EntriesProvider = ({ children }: { children: ReactNode }) => {
  const [expenses, setExpenses] = useState<ExpenseCamel[]>([]);
  const [loadingExpense, setLoadingExpense] = useState(false);
  const [errorExpense, setErrorExpense] = useState<string | null>(null);

  const [incomes, setIncomes] = useState<IncomeCamel[]>([]);
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

      setExpenses(sortEntriesByDate(expensesUnified) as ExpenseCamel[]);
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
      const installments = expenseEntry.installments

      delete expenseEntry.fixed;
      delete expenseEntry.installments
  
      url = setQueryParams(url, isFixed, installments);

      try {
        const createdAtISO = new Date(expenseEntry.createdAt).toISOString();
        const payload = toSnakeCaseKeys({
          ...expenseEntry,
          createdAt: createdAtISO,
          installment: null
        });

        const res = await post(url, payload, {
          "Content-Type": "application/json",
        });
        console.log(res.data);
        const newEntry = camelizeKeysExpense(res?.data as ExpenseRead) as ExpenseCamel;
        setExpenses((prev) => [newEntry, ...prev]);
      } catch (err) {
        console.error("Failed to add expense:", err);
        throw err;
      }
    } else {
      console.error("Url is not set");
    }
  };

  const updateExpense = async (expenseCamelId: string, expenseCamel: ExpenseCamel) => {
    let url = process.env.NEXT_PUBLIC_EXPENSE_ENDPOINT;
    if (url) {
      const isFixed = expenseCamel.fixed ? true : false;
      delete expenseCamel.fixed;
      url = setQueryParams(url, isFixed);
      try {
        const createdAtISO = new Date(expenseCamel.createdAt).toISOString();
        const payload = toSnakeCaseKeys({
          ...expenseCamel,
          createdAt: createdAtISO,
        });

        const res = await put(url, payload, {
          "Content-Type": "application/json",
        });

        const updatedExpense = camelizeKeysExpense(res.data as ExpenseRead) as ExpenseCamel;
        setExpenses((prev) => prev.map((e) => (e.id === expenseCamelId ? updatedExpense : e)));
      } catch (err) {
        console.error("Failed to update expense:", err);
        throw err;
      }
    } else {
      console.error("Url is not set");
    }
  };

  const deleteExpense = async (expenseCamelId: string, fixed: boolean) => {
    let url = process.env.NEXT_PUBLIC_EXPENSE_ENDPOINT;
    if (url) {
      url = setQueryParams(url, fixed);
      try {
        await del(url, {
          "Content-Type": "application/json",
        });

        setExpenses((prev) => prev.filter((expenseCamel) => expenseCamel.id !== expenseCamelId));
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
      const installments = incomeEntry.installments

      delete incomeEntry.fixed;
      delete incomeEntry.installments
  
      url = setQueryParams(url, isFixed, installments);
      try {
        const createdAtISO = new Date(incomeEntry.createdAt).toISOString();
        const payload = toSnakeCaseKeys({
          ...incomeEntry,
          createdAt: createdAtISO,
        });

        const res = await post(url, payload, {
          "Content-Type": "application/json",
        });

        const newIncome = camelizeKeysIncome(res?.data as IncomeRead) as IncomeCamel;
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

  const updateIncome = async (incomeCamelId: string, incomeCamel: IncomeCamel) => {
    let url = process.env.NEXT_PUBLIC_INCOME_ENDPOINT;
    if (url) {
      const isFixed = incomeCamel.fixed ? true : false;
      delete incomeCamel.fixed;
      url = setQueryParams(url, isFixed);
      try {
        const createdAtISO = new Date(incomeCamel.createdAt).toISOString();
        const payload = toSnakeCaseKeys({
          ...incomeCamel,
          createdAt: createdAtISO,
        });

        const res = await put(url, payload, {
          "Content-Type": "application/json",
        });

        const updatedIncome = camelizeKeysIncome(res?.data as IncomeRead) as IncomeCamel;
        setIncomes((prev) => prev.map((e) => (e.id === incomeCamelId ? updatedIncome : e)));
      } catch (err) {
        console.error("Failed to update income:", err);
        throw err;
      }
    } else {
      console.error("Url is not set");
    }
  };

  const deleteIncome = async (incomeCamelId: string, fixed: boolean) => {
    let url = process.env.NEXT_PUBLIC_INCOME_ENDPOINT;
    if (url) {
      url = setQueryParams(url, fixed);
      try {
        await del(url, {
          "Content-Type": "application/json",
        });

        setIncomes((prev) => prev.filter((incomeCamel) => incomeCamel.id !== incomeCamelId));
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
