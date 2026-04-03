"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { IncomeEntry, IncomeRead } from "@/types/entryType";
import { toSnakeCaseKeys, camelizeKeysIncome } from "@/utils/payloads";
import { post, put, del } from "@/http/apiClient";

interface IncomesContextType {
  incomes: IncomeEntry[];
  setIncomes: (expenses: IncomeEntry[]) => void;
  loadingIncome: boolean;
  setLoadingIncome: (loadingIncome: boolean) => void;
  errorIncome: string | null;
  setErrorIncome: (errorIncome: string | null) => void;
  addIncome: (incomeEntry: IncomeEntry) => Promise<void>;
  updateIncome: (incomeEntryId: string, incomeEntry: IncomeEntry) => Promise<void>;
  deleteIncome: (incomeEntryId: string, fixed: boolean) => Promise<void>;
}

const IncomesContext = createContext<IncomesContextType | undefined>(undefined);

export const IncomesProvider = ({ children }: { children: ReactNode }) => {
  const [incomes, setIncomes] = useState<IncomeEntry[]>([]);
  const [loadingIncome, setLoadingIncome] = useState(false);
  const [errorIncome, setErrorIncome] = useState<string | null>(null);

  const addIncome = async (incomeEntry: IncomeEntry) => {
    const url = incomeEntry.fixed ? process.env.NEXT_PUBLIC_INCOME_FIXED_ENDPOINT : process.env.NEXT_PUBLIC_INCOME_ENDPOINT
    if (url) {
      try {
        const isFixed = incomeEntry.fixed
        delete incomeEntry.fixed
  
        const createdAtISO = new Date(incomeEntry.createdAt).toISOString();
        const payload = toSnakeCaseKeys({
          ...incomeEntry,
          createdAt: createdAtISO,
        });
  
        const res = await post(
          url,
          payload, {
            "Content-Type": "application/json",
          })

        // Add the newly created income to state
        const newIncome = camelizeKeysIncome(res?.data as IncomeRead) as IncomeEntry;
        newIncome.fixed = isFixed
        setIncomes((prev) => [newIncome, ...prev]);
      } catch (err) {
        console.error("Failed to add income:", err);
        throw err;
      }
    } else {
      console.error("Url is not set")
    }
  };

  const updateIncome = async (incomeEntryId: string, incomeEntry: IncomeEntry) => {
    const url = incomeEntry.fixed ? process.env.NEXT_PUBLIC_INCOME_FIXED_ENDPOINT : process.env.NEXT_PUBLIC_INCOME_ENDPOINT
    if (url) {
      delete incomeEntry.fixed
      try {
        const createdAtISO = new Date(incomeEntry.createdAt).toISOString();
        const payload = toSnakeCaseKeys({
          ...incomeEntry,
          createdAt: createdAtISO,
        });
  
        const res = await put(
          url,
          payload, {
            "Content-Type": "application/json",
          }
        );
  
        // Update the income in state
        const updatedIncome = camelizeKeysIncome(res?.data as IncomeRead) as IncomeEntry;
        setIncomes((prev) => prev.map((e) => (e.id === incomeEntryId ? updatedIncome : e)));
      } catch (err) {
        console.error("Failed to update income:", err);
        throw err;
      }
    } else {
      console.error("Url is not set")
    }
  };

  const deleteIncome = async (incomeEntryId: string, fixed: boolean) => {
    const url = fixed ? process.env.NEXT_PUBLIC_INCOME_FIXED_ENDPOINT : process.env.NEXT_PUBLIC_INCOME_ENDPOINT
    if (url) {
      try {
        await del(url, {
            "Content-Type": "application/json",
          },
        );
  
        // Remove the deleted income from state
        setIncomes((prev) => prev.filter((incomeEntry) => incomeEntry.id !== incomeEntryId));
      } catch (err) {
        console.error("Failed to delete expense:", err);
        throw err;
      }
    } else {
      console.error("Url is not set")
    }
  };

  return (
    <IncomesContext.Provider
      value={{
        incomes,
        setIncomes,
        loadingIncome,
        setLoadingIncome,
        errorIncome,
        setErrorIncome,
        addIncome,
        updateIncome,
        deleteIncome
      }}
    >
      {children}
    </IncomesContext.Provider>
  );
};

export const useIncomes = () => {
  const context = useContext(IncomesContext);
  if (context === undefined) {
    throw new Error("useIncomes must be used within an IncomesProvider");
  }
  return context;
};
