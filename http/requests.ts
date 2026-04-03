import { apiRequest } from "./apiClient";
import { ExpenseRead, IncomeRead } from "@/types/entryType";

interface IFetchAll {
  startDate?: string;
  endDate?: string;
}
interface IFetchAllResult {
  expenses: ExpenseRead[];
  expensesFixed: ExpenseRead[];
  incomes: IncomeRead[];
  incomesFixed: IncomeRead[];
  error?: string;
}

const buildQuery = ({ startDate, endDate }: IFetchAll): string => {
  const params = new URLSearchParams();

  if (startDate) {
    params.set("start_date", startDate);
  }

  if (endDate) {
    params.set("end_date", endDate);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

export async function fetchAll(
  startDate?: string,
  endDate?: string,
  headers?: Record<string, string>
): Promise<IFetchAllResult> {
  try {
    const expenseEndpoint = process.env.NEXT_PUBLIC_EXPENSE_ENDPOINT;
    const expenseFixedEndpoint = process.env.NEXT_PUBLIC_EXPENSE_FIXED_ENDPOINT;
    const incomeEndpoint = process.env.NEXT_PUBLIC_INCOME_ENDPOINT;
    const incomeFixedEndpoint = process.env.NEXT_PUBLIC_INCOME_FIXED_ENDPOINT;

    if (!expenseEndpoint || !expenseFixedEndpoint || !incomeEndpoint || !incomeFixedEndpoint) {
      return {
        expenses: [],
        expensesFixed: [],
        incomes: [],
        incomesFixed: [],
        error: "Missing API endpoint configuration.",
      };
    }

    const query = buildQuery({ startDate, endDate });
    const [expensesRes, expensesFixedRes, incomesRes, incomesFixedRes] = await Promise.allSettled([
      apiRequest<ExpenseRead[]>("GET", `${expenseEndpoint}${query}`, undefined, headers),
      apiRequest<ExpenseRead[]>("GET", `${expenseFixedEndpoint}${query}`, undefined, headers),
      apiRequest<IncomeRead[]>("GET", `${incomeEndpoint}${query}`, undefined, headers),
      apiRequest<IncomeRead[]>("GET", `${incomeFixedEndpoint}${query}`, undefined, headers),
    ]);

    const errors: string[] = [];

    const getErrorMessage = (reason: unknown): string => {
      if (reason instanceof Error) {
        return reason.message;
      }

      return "Unknown error";
    };

    if (expensesRes.status === "rejected") {
      errors.push(`Expenses: ${getErrorMessage(expensesRes.reason)}`);
    }

    if (expensesFixedRes.status === "rejected") {
      errors.push(`Fixed expenses: ${getErrorMessage(expensesFixedRes.reason)}`);
    }

    if (incomesRes.status === "rejected") {
      errors.push(`Incomes: ${getErrorMessage(incomesRes.reason)}`);
    }

    if (incomesFixedRes.status === "rejected") {
      errors.push(`Fixed incomes: ${getErrorMessage(incomesFixedRes.reason)}`);
    }

    return {
      expenses: expensesRes.status === "fulfilled" ? expensesRes.value.data : [],
      expensesFixed: expensesFixedRes.status === "fulfilled" ? expensesFixedRes.value.data : [],
      incomes: incomesRes.status === "fulfilled" ? incomesRes.value.data : [],
      incomesFixed: incomesFixedRes.status === "fulfilled" ? incomesFixedRes.value.data : [],
      error: errors.length ? errors.join(" | ") : undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to load entries";

    return {
      expenses: [],
      expensesFixed: [],
      incomes: [],
      incomesFixed: [],
      error: errorMessage,
    };
  }
}
