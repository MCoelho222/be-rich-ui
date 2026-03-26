"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { Entry } from "@/types/entryType";
import { toSnakeCaseKeys, camelizeKeysShallow } from "@/utils/payloads";
import axios from "axios";

interface EntriesContextType {
  entries: Entry[];
  setEntries: (entries: Entry[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  addEntry: (entry: Entry) => Promise<void>;
  updateEntry: (entryId: string, entry: Entry) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
}

const EntriesContext = createContext<EntriesContextType | undefined>(undefined);

export const EntriesProvider = ({ children }: { children: ReactNode }) => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL + "/entries/";

  const addEntry = async (entry: Entry) => {
    if (!apiUrl || apiUrl.includes("undefined")) {
      console.error("API URL is not configured");
      throw new Error("API URL is not configured");
    }

    try {
      const createdAtISO = new Date(entry.createdAt).toISOString();
      const payload = toSnakeCaseKeys({
        ...entry,
        createdAt: createdAtISO,
      });
      console.log(payload)
      const res = await axios.post(apiUrl, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(res.data)

      // Add the newly created entry to state
      const newEntry = camelizeKeysShallow(res.data) as Entry;
      setEntries((prev) => [newEntry, ...prev]);
    } catch (err) {
      console.error("Failed to add entry:", err);
      throw err;
    }
  };

  const updateEntry = async (entryId: string, entry: Entry) => {
    if (!apiUrl || apiUrl.includes("undefined")) {
      console.error("API URL is not configured");
      throw new Error("API URL is not configured");
    }

    try {
      const createdAtISO = new Date(entry.createdAt).toISOString();
      const payload = toSnakeCaseKeys({
        ...entry,
        createdAt: createdAtISO,
      });

      const res = await axios.put(`${apiUrl}${entryId}`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Update the entry in state
      const updatedEntry = camelizeKeysShallow(res.data) as Entry;
      setEntries((prev) => prev.map((e) => (e.id === entryId ? updatedEntry : e)));
    } catch (err) {
      console.error("Failed to update entry:", err);
      throw err;
    }
  };

  const deleteEntry = async (entryId: string) => {
    if (!apiUrl || apiUrl.includes("undefined")) {
      console.error("API URL is not configured");
      throw new Error("API URL is not configured");
    }

    try {
      await axios.delete(`${apiUrl}${entryId}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Remove the deleted entry from state
      setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
    } catch (err) {
      console.error("Failed to delete entry:", err);
      throw err;
    }
  };

  return (
    <EntriesContext.Provider
      value={{
        entries,
        setEntries,
        loading,
        setLoading,
        error,
        setError,
        addEntry,
        updateEntry,
        deleteEntry,
      }}
    >
      {children}
    </EntriesContext.Provider>
  );
};

export const useEntries = () => {
  const context = useContext(EntriesContext);
  if (context === undefined) {
    throw new Error("useEntries must be used within an EntriesProvider");
  }
  return context;
};
