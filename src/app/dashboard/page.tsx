"use client";
// pages/your-page.tsx
import { useEffect, useState } from "react";
import ExpenseTable from "./components/ExpenseTable/ExpenseTable";
import { IResponseData } from "../types";
import Link from "next/link";

export default function Dashboard() {
  const [data, setData] = useState<IResponseData[]>([]);
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
        console.log(jsonData);
        setData(jsonData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An error occurred"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container mx-auto p-4 flex flex-col justify-center items-center">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <Link href={"/register"}>Back to register</Link>
      <ExpenseTable
        data={data}
        isLoading={isLoading}
        error={error || undefined}
      />
    </div>
  );
}
