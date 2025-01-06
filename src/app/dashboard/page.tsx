"use client";
// pages/your-page.tsx
import { useEffect, useState } from "react";
import ExpenseTable from "./components/ExpenseTable/ExpenseTable";
import { IResponseData } from "../types";
import Link from "next/link";
import StatisticDisplay from "./components/StatisticDisplay";
import { useExpense } from "../contexts/ExpenseContext";
import { calculateTotalExpense } from "../helpers/statistics";
export default function Dashboard() {
  const { originalData, filteredData, setOriginalData } = useExpense();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(baseUrl + "/expenses/");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const jsonData = await response.json();
        setOriginalData(jsonData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An error occurred"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);
   const totalExpense = calculateTotalExpense(filteredData);

  return (
    <div className="container mx-auto p-4 flex flex-col justify-center items-center">
      <div className="flex flex-row mb-4 mt-4">
        <StatisticDisplay title="Total Expense" value={totalExpense}></StatisticDisplay>
      </div>
      <Link className="text-textLink" href={"/register"}>Back to register</Link>
      <ExpenseTable
        data={originalData}
        isLoading={isLoading}
        error={error || undefined}
      />
    </div>
  );
}
