"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import {
  ExpenseEntry,
  ExpenseCamel,
  ExpenseRead,
  IncomeEntry,
  IncomeCamel,
  IncomeRead,
} from "@/types/entryType";
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

  // Fetching dates
  startDate: string | undefined;
  endDate: string | undefined;
  setStartDate: (startDate: string | undefined) => void;
  setEndDate: (EndDate: string | undefined) => void;
  // Fetch all entries with date filtering
  fetchEntries: () => Promise<void>;

  // CRUD operations for expenses
  addExpense: (expenseEntry: ExpenseEntry) => Promise<void>;
  updateExpense: (
    expenseCamel: ExpenseCamel,
    isFixed?: boolean,
    installments?: number
  ) => Promise<void>;
  deleteExpense: (expenseCamelId: string, fixed?: boolean, installments?: number) => Promise<void>;

  // CRUD operations for incomes
  addIncome: (incomeEntry: IncomeEntry) => Promise<void>;
  updateIncome: (
    incomeCamel: IncomeCamel,
    isFixed?: boolean,
    installments?: number
  ) => Promise<void>;
  deleteIncome: (incomeCamelId: string, fixed?: boolean, installments?: number) => Promise<void>;
}

const EntriesContext = createContext<EntriesContextType | undefined>(undefined);

export const EntriesProvider = ({ children }: { children: ReactNode }) => {
  const [expenses, setExpenses] = useState<ExpenseCamel[]>([]);
  const [loadingExpense, setLoadingExpense] = useState(false);
  const [errorExpense, setErrorExpense] = useState<string | null>(null);

  const [incomes, setIncomes] = useState<IncomeCamel[]>([]);
  const [loadingIncome, setLoadingIncome] = useState(false);
  const [errorIncome, setErrorIncome] = useState<string | null>(null);

  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    fetchEntries();
  }, [startDate, endDate]);
  
  const fetchEntries = async () => {
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
      const installments = expenseEntry.installments;

      delete expenseEntry.fixed;
      delete expenseEntry.installments;

      url = setQueryParams(url, isFixed, installments);

      try {
        const createdAtISO = new Date(expenseEntry.createdAt).toISOString();
        const payload = toSnakeCaseKeys({
          ...expenseEntry,
          createdAt: createdAtISO,
          installment: null,
        });

        await post(url, payload);
        await fetchEntries();

      } catch (err) {
        console.error("Failed to add expense:", err);
        throw err;
      }
    } else {
      console.error("Url is not set");
    }
  };

  const updateExpense = async (
    expenseCamel: ExpenseCamel,
    isFixed?: boolean,
    installments?: number
  ) => {
    let endpoint = process.env.NEXT_PUBLIC_EXPENSE_ENDPOINT;
    if (endpoint) {
      const endpointWithId = `${endpoint}/${expenseCamel.id}`;
      const finalEndpoint = setQueryParams(endpointWithId, isFixed, installments);
      try {
        const createdAtISO = new Date(expenseCamel.createdAt).toISOString();
        const payload = toSnakeCaseKeys({
          amount: expenseCamel.amount,
          description: expenseCamel.description,
          category: expenseCamel.category,
          source: expenseCamel.source,
          paymentMethod: expenseCamel.paymentMethod,
          installment: expenseCamel.installment,
          createdAt: createdAtISO,
        });

        await put(finalEndpoint, payload, undefined);
        await fetchEntries();

      } catch (err) {
        console.error("Failed to update expense:", err);
        throw err;
      }
    } else {
      console.error("Url is not set");
    }
  };

  const deleteExpense = async (expenseCamelId: string, fixed?: boolean, installments?: number) => {
    let endpoint = process.env.NEXT_PUBLIC_EXPENSE_ENDPOINT;
    if (endpoint) {
      const finalEndpoint = setQueryParams(`${endpoint}/${expenseCamelId}`, fixed, installments);

      try {
        await del(finalEndpoint);
        await fetchEntries();
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
      const installments = incomeEntry.installments;

      delete incomeEntry.fixed;
      delete incomeEntry.installments;

      url = setQueryParams(url, isFixed, installments);
      try {
        const createdAtISO = new Date(incomeEntry.createdAt).toISOString();
        const payload = toSnakeCaseKeys({
          ...incomeEntry,
          createdAt: createdAtISO,
        });

        await post(url, payload);
        await fetchEntries();

      } catch (err) {
        console.error("Failed to add income:", err);
        throw err;
      }
    } else {
      console.error("Url is not set");
    }
  };

  const updateIncome = async (
    incomeCamel: IncomeCamel,
    isFixed?: boolean,
    installments?: number
  ) => {
    let endpoint = process.env.NEXT_PUBLIC_INCOME_ENDPOINT;
    if (endpoint) {
      const endpointWithId = `${endpoint}/${incomeCamel.id}`;
      const finalEndpoint = setQueryParams(endpointWithId, isFixed, installments);
      try {
        const createdAtISO = new Date(incomeCamel.createdAt).toISOString();
        const payload = toSnakeCaseKeys({
          amount: incomeCamel.amount,
          description: incomeCamel.description,
          source: incomeCamel.source,
          createdAt: createdAtISO,
        });

        await put(finalEndpoint, payload, undefined);
        await fetchEntries();

      } catch (err) {
        console.error("Failed to update income:", err);
        throw err;
      }
    } else {
      console.error("Url is not set");
    }
  };

  const deleteIncome = async (incomeCamelId: string, fixed?: boolean, installments?: number) => {
    let endpoint = process.env.NEXT_PUBLIC_INCOME_ENDPOINT;
    if (endpoint) {
      const endpointWithId = `${endpoint}/${incomeCamelId}`;
      const finalEndpoint = setQueryParams(endpointWithId, fixed, installments);
      try {
        await del(finalEndpoint);
        await fetchEntries();
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
        startDate,
        endDate,
        setStartDate,
        setEndDate
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
