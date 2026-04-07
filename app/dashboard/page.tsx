"use client";
import ExpensesTable from "@/components/ExpensesTable";
import IncomesTable from "@/components/IncomesTable";
import DisplayValue from "@/components/DisplayValue";
import DatePeriodSelector from "@/components/DatePeriodSelector";
import { getStat } from "@/utils/stats";
import { ExpensesProvider, useExpenses } from "@/context/ExpensesContext";
import { IncomesProvider, useIncomes } from "@/context/IncomesContext";
import { useEffect, useState, useCallback } from "react";
import { camelizeKeysIncome, camelizeKeysExpense } from "@/utils/payloads";
import { getFisrtDayDateString, getLastDayDateString, sortEntriesByDate } from "@/utils/dates";
import { colorClasses } from "@/config/colors";
import { fetchAll } from "@/http/requests";
import { addFixedKey } from "@/utils/entriesNormalizer";
import ExpenseModal from "@/components/ExpenseModal";
import IncomeModal from "@/components/IncomeModal";
import { getValuesFromKey } from "@/utils/filtering";

const DashboardContent = () => {
  const { expenses, setExpenses, setLoadingExpense, setErrorExpense } = useExpenses();
  const { incomes, setIncomes, setLoadingIncome, setErrorIncome } = useIncomes();
  const [startDate, setStartDate] = useState<string>(getFisrtDayDateString());
  const [endDate, setEndDate] = useState<string>(getLastDayDateString());
  const [activeTab, setActiveTab] = useState<"expenses" | "incomes">("expenses");

  useEffect(() => {
    const loadEntries = async () => {
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
          incomesFixed:
            camelizedData.incomesFixed?.map((income) => addFixedKey(income, true)) ?? [],
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
    loadEntries();
  }, [startDate, endDate]);

  const handlePeriodChange = useCallback(
    (startDate: string, endDate: string) => {
      setStartDate(startDate);
      setEndDate(endDate);
    },
    [expenses, incomes]
  );

  const handleClearFilter = useCallback(() => {
    setStartDate(getFisrtDayDateString());
    setEndDate(getLastDayDateString());
  }, []);

  const amountsIncome = getValuesFromKey(incomes, "amount");
  const totalIncome = getStat(amountsIncome, "sum");
  const amountsExpense = getValuesFromKey(expenses, "amount");
  const totalExpense = getStat(amountsExpense, "sum");

  return (
    <div className="p-6">
      <div className="absolute bottom-7 right-5">
        <ExpenseModal />
        <IncomeModal />
      </div>
      <div className="flex flex-row justify-center mb-6">
        <DatePeriodSelector
          onPeriodChange={handlePeriodChange}
          onClear={handleClearFilter}
          defaultStartDate={getFisrtDayDateString()}
          defaultEndDate={getLastDayDateString()}
        />
      </div>
      <div className="flex flex-row justify-center gap-10 mb-20 mt-20">
        {(expenses.length > 0 || incomes.length > 0) && (
          <>
            <DisplayValue
              value={totalIncome}
              title="Total Income"
              color={colorClasses.financial.income}
            />
            <DisplayValue
              value={totalExpense}
              title="Total Expense"
              color={colorClasses.financial.expense}
            />
          </>
        )}
      </div>
      <div className="mt-8 flex flex-col items-center gap-4">
        {/* Tabs */}
        <div className="flex gap-2 border-b w-full max-w-4xl">
          <button
            onClick={() => setActiveTab("expenses")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "expenses"
                ? `border-b-2 border-rose-400 ${colorClasses.financial.expense}`
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Expenses ({expenses.length})
          </button>
          <button
            onClick={() => setActiveTab("incomes")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "incomes"
                ? `border-b-2 border-emerald-500 ${colorClasses.financial.income}`
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Incomes ({incomes.length})
          </button>
        </div>

        {/* Table Content */}
        {activeTab === "expenses" ? (
          <ExpensesTable entries={expenses} />
        ) : (
          <IncomesTable entries={incomes} />
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  return (
    <ExpensesProvider>
      <IncomesProvider>
        <DashboardContent />
      </IncomesProvider>
    </ExpensesProvider>
  );
};

export default Dashboard;
