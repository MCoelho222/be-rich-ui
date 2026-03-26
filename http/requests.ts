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
    const expenseEndpoint = process.env.NEXT_EXPENSE_ENDPOINT;
    const expenseFixedEndpoint = process.env.NEXT_EXPENSE_FIXED_ENDPOINT;
    const incomeEndpoint = process.env.NEXT_INCOME_ENDPOINT;
    const incomeFixedEndpoint = process.env.NEXT_INCOME_FIXED_ENDPOINT;

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

    const [expensesRes, expensesFixedRes, incomesRes, incomesFixedRes] = await Promise.all([
      apiRequest<ExpenseRead[]>("GET", `${expenseEndpoint}${query}`, undefined, headers),
      apiRequest<ExpenseRead[]>("GET", `${expenseFixedEndpoint}${query}`, undefined, headers),
      apiRequest<IncomeRead[]>("GET", `${incomeEndpoint}${query}`, undefined, headers),
      apiRequest<IncomeRead[]>("GET", `${incomeFixedEndpoint}${query}`, undefined, headers),
    ]);

    return {
      expenses: expensesRes.data,
      expensesFixed: expensesFixedRes.data,
      incomes: incomesRes.data,
      incomesFixed: incomesFixedRes.data,
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
