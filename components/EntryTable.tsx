"use client";
import { Entry } from "@/types/entryType";
import { formatDate } from "@/utils/dates";
import { formatCurrency } from "@/utils/numberFormat";
import { niceLabel } from "@/utils/stringFormat";

interface EntryTableProps {
  entries: Entry[];
}

const EntryTable = ({ entries }: EntryTableProps) => {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="max-h-[420px] overflow-y-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-slate-200">
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
                className="transition-colors hover:bg-slate-100/80"
              >
                <td className="px-4 py-3 text-slate-700">
                  <span className="text-sm">{formatDate(entry.createdAt)}</span>
                </td>

                <td className="max-w-xs px-4 py-3 text-slate-600">
                  <span className="line-clamp-2">{entry.description || "—"}</span>
                </td>

                <td className="px-4 py-3 text-slate-700">
                  {entry.category ? niceLabel(entry.category) : entry.category}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 ${
                      entry.entryType === "Income"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {entry.entryType ? niceLabel(entry.entryType) : entry.entryType}
                  </span>
                </td>

                <td className="px-4 py-3 text-right text-slate-800">
                  {formatCurrency(entry.amount)}
                </td>

                <td className="px-4 py-3 text-slate-600 text-right">
                  {entry.installments}
                </td>
                <td className="px-4 py-3 text-slate- text-center">
                  {entry.fixed ? (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                      Fixed
                    </span>
                  ) : ""}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {entry.source ? niceLabel(entry.source) : entry.source}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  <span className="rounded-full bg-slate-50 px-2 py-0.5">
                    {entry.paymentMethod ? niceLabel(entry.paymentMethod) : entry.paymentMethod}
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
