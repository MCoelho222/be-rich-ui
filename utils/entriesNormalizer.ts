import { ExpenseRead, IncomeRead } from "@/types/entryType";

interface IFetchAllPayload {
  expenses: ExpenseRead[];
  expensesFixed: ExpenseRead[];
  incomes: IncomeRead[];
  incomesFixed: IncomeRead[];
}

const normalizeIncomeToExpenseRead = (income: IncomeRead): ExpenseRead => {
  return {
    ...income,
    // Income payloads do not have these fields; we pad them to keep one display shape.
    payment_method: "" as ExpenseRead["payment_method"],
    category: "" as ExpenseRead["category"],
  };
};

export const buildUnifiedExpenseReadEntries = ({
  expenses,
  expensesFixed,
  incomes,
  incomesFixed,
}: IFetchAllPayload): ExpenseRead[] => {
  return [
    ...expenses,
    ...expensesFixed,
    ...incomes.map(normalizeIncomeToExpenseRead),
    ...incomesFixed.map(normalizeIncomeToExpenseRead),
  ];
};
