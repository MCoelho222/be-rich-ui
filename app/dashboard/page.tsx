"use client";
import EntryModal from "@/components/EntryModal";
import EntryTable from "@/components/EntryTable";
import DisplayValue from "@/components/DisplayValue";
import DatePeriodSelector from "@/components/DatePeriodSelector";
import { getStat } from "@/utils/stats";
import { EntriesProvider, useEntries } from "@/context/EntriesContext";
import { useEffect, useState, useCallback } from "react";
import { Entry, EntryRead } from "@/types/entryType";
import { camelizeKeysShallow } from "@/utils/payloads";
import axios from "axios";
import { sortEntriesByDate } from "@/utils/dates";
import { colorClasses } from "@/config/colors";
import { filterByDateRange, filterEntries, getValuesFromKey } from "@/utils/filtering";
import { EntryMode } from "@/helpers/entriesHelper";

const DashboardContent = () => {
  const { entries, setEntries, setLoading, setError } = useEntries();
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>([]);
  const [isFiltered, setIsFiltered] = useState(false);

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
        const dataCamelized = data.map((entry) => camelizeKeysShallow(entry));
        const sortedByCreatedAt = sortEntriesByDate(dataCamelized);
        setEntries(sortedByCreatedAt);
      } catch (err) {
        console.error("Error loading entries:", err);
        setError("Could not load entries.");
      } finally {
        setLoading(false);
      }
    };
    loadEntries();
  }, [setEntries, setLoading, setError]);

  const handlePeriodChange = useCallback(
    (startDate: string, endDate: string) => {
      const filtered = filterByDateRange(entries, { startDate, endDate });
      setFilteredEntries(filtered);
      setIsFiltered(true);
    },
    [entries]
  );

  const handleClearFilter = useCallback(() => {
    setFilteredEntries([]);
    setIsFiltered(false);
  }, []);

  const displayedEntries = isFiltered ? filteredEntries : entries;
  const incomes = filterEntries(displayedEntries, { entryType: EntryMode.INCOME }) as Entry[];
  const amountsIncome = getValuesFromKey(incomes, "amount");
  const totalIncome = getStat(amountsIncome, "sum");
  const expenses = filterEntries(displayedEntries, { entryType: EntryMode.EXPENSE }) as Entry[];
  const amountsExpense = getValuesFromKey(expenses, "amount");
  const totalExpense = getStat(amountsExpense, "sum");

  return (
    <div className="p-6">
      <div className="absolute bottom-7 right-5">
        <EntryModal />
      </div>
      <div className="flex flex-row justify-center mb-6">
        <DatePeriodSelector onPeriodChange={handlePeriodChange} onClear={handleClearFilter} />
      </div>
      <div className="flex flex-row justify-center gap-10 mb-20 mt-20">
        {displayedEntries.length > 0 && (
          <>
            <DisplayValue
              value={totalIncome}
              title="Total Income"
              color={colorClasses.text.primary}
              asCurrency
            />
            <DisplayValue
              value={totalExpense}
              title="Total Expense"
              color={colorClasses.text.primary}
              asCurrency
            />
          </>
        )}
      </div>
      <div className="mt-8 flex flex-col items-center gap-4">
        <EntryTable entries={displayedEntries} />
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
