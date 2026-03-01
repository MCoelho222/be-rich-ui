"use client";
import { Entry } from "@/types/entryType";
import { formatDate } from "@/utils/dates";
import { formatCurrency } from "@/utils/numberFormat";
import { niceLabel } from "@/utils/stringFormat";
import { useEntries } from "@/context/EntriesContext";

interface EntryTableProps {
  entries?: Entry[];
}

const EntryTable = ({ entries: propEntries }: EntryTableProps) => {
  const { entries: contextEntries, loading, error } = useEntries();

  // Use prop entries if provided, otherwise use context entries
  const entries = propEntries !== undefined ? propEntries : contextEntries;

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="px-4 py-10 text-center text-sm text-slate-400">Loading entries...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="px-4 py-10 text-center text-sm text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl shadow-sm">
      <div className="max-h-[420px] overflow-y-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-slate-700">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py- text-right">Installments</th>
              <th className="px-4 py-3 text-center">Cycle</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Payment Method</th>
            </tr>
          </thead>

          <tbody className="">
            {entries.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                  No entries yet. Add one to see it here.
                </td>
              </tr>
            )}

            {entries.map((entry, index) => (
              <tr
                key={entry.id} // later you can switch to entry.id from backend
                className="transition-colors hover:bg-slate-100/80 text-slate-500"
              >
                <td className="px-4 py-3">
                  <span className="text-sm">{formatDate(entry.createdAt)}</span>
                </td>

                <td className="max-w-xs px-4 py-3">
                  <span className="line-clamp-2">{entry.description || "—"}</span>
                </td>

                <td className="px-4 py-3">
                  {entry.category ? niceLabel(entry.category) : entry.category}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 ${
                      entry.entryType === "Income"
                        ? "text-emerald-500"
                        : "text-rose-400"
                    }`}
                  >
                    {entry.entryType}
                  </span>
                </td>

                <td className="px-4 py-3 text-right">
                  {formatCurrency(entry.amount)}
                </td>

                <td className="px-4 py-3 text-right">{entry.installments}</td>
                <td className="px-4 py-3 text-center">
                  {entry.fixed ? (
                    <span className="px-2 py-0.5 text-blue-700">Fixed</span>
                  ) : (
                    ""
                  )}
                </td>
                <td className="px-4 py-3">
                  {entry.source}
                </td>

                <td className="px-4 py-3">
                  <span className="px-2 py-0.5">
                    {entry.paymentMethod}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EntryTable;
