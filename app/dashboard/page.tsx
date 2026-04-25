"use client";
import ExpensesTable from "@/components/ExpensesTable";
import IncomesTable from "@/components/IncomesTable";
import DisplayValue from "@/components/DisplayValue";
import DatePeriodSelector from "@/components/DatePeriodSelector";
import { getStat } from "@/utils/stats";
import { EntriesProvider, useExpenses, useIncomes, useEntries } from "@/context/EntriesContext";
import { useEffect, useState, useCallback } from "react";
import { getFisrtDayDateString, getLastDayDateString } from "@/utils/dates";
import { colorClasses } from "@/config/colors";
import ExpenseModal from "@/components/ExpenseModal";
import IncomeModal from "@/components/IncomeModal";
import { getValuesFromKey } from "@/utils/filtering";

const DashboardContent = () => {
  const { expenses } = useExpenses();
  const { incomes } = useIncomes();
  const { fetchEntries } = useEntries();
  const [startDate, setStartDate] = useState<string>(getFisrtDayDateString());
  const [endDate, setEndDate] = useState<string>(getLastDayDateString());
  const [activeTab, setActiveTab] = useState<"expenses" | "incomes">("expenses");

  useEffect(() => {
    fetchEntries(startDate, endDate);
  }, [startDate, endDate]);

  const handlePeriodChange = useCallback((startDate: string, endDate: string) => {
    setStartDate(startDate);
    setEndDate(endDate);
  }, []);

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
        <ExpenseModal mode="add" />
        <IncomeModal mode="add" />
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
            onMouseEnter={() => setActiveTab("expenses")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "expenses"
                ? `border-b-2 border-rose-400 ${colorClasses.financial.expense}`
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Expenses ({expenses.length})
          </button>
          <button
            onMouseEnter={() => setActiveTab("incomes")}
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
        {activeTab === "expenses" ? <ExpensesTable /> : <IncomesTable />}
      </div>
    </div>
  );
};

const Dashboard = () => {
  return (
    <EntriesProvider>
      <DashboardContent />
    </EntriesProvider>
  );
};

export default Dashboard;
