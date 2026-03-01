"use client";
import EntryModal from "@/components/EntryModal";
import EntryTable from "@/components/EntryTable";
import { useEffect, useState } from "react";
import { Entry, EntryRead } from "@/types/entryType";
import DisplayValue from "@/components/DisplayValue";
import { calculateFiltered } from "@/utils/calculus";
import { camelizeKeysShallow } from "@/utils/payloads";
import axios from "axios";

const Dashboard = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEntries = async () => {
      try {
        setLoading(true);
        setError(null);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL + "/entries/";
        const res = await axios.get(apiUrl, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (res.status < 200 || res.status >= 300) {
          throw new Error("Failed to load entries");
        }
        const data = res.data as EntryRead[];
        const dataCamelized = data.map((entry) => camelizeKeysShallow(entry))
        setEntries(dataCamelized);
      } catch (err) {
        console.error("Error loading entries:", err);
        setError("Could not load entries.");
      } finally {
        setLoading(false);
      }
    };
    loadEntries();
  }, []);
  const totalExpense = calculateFiltered(entries, "sum", "amount", "Income");
  return (
    <div className="p-6">
      <div className="absolute bottom-7 right-5">
        <EntryModal />
      </div>
      <div className="flex flex-row justify-center">
        {entries.length > 0 && <DisplayValue value={totalExpense} title="Total Income" asCurrency/>}
      </div>
      <div className="mt-8 flex flex-row justify-center">
        <EntryTable entries={entries} />
      </div>
    </div>
  );
};

export default Dashboard;
