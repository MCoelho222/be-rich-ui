"use client";
import { IncomeEntry } from "@/types/entryType";
import { formatDate } from "@/utils/dates";
import { formatCurrency } from "@/utils/numberFormat";
import { useIncomes } from "@/context/IncomesContext";
import { colorClasses } from "@/config/colors";
import { EditIcon } from "./ui/edit-icon";
import { DeleteIcon } from "./ui/delete-icon";
import IncomeModal from "./IncomeModal";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { del } from "@/http/apiClient";

interface IncomesTableProps {
  entries?: IncomeEntry[];
}

const IncomesTable = ({ entries: propEntries }: IncomesTableProps) => {
  const { incomes: contextIncomes, loadingIncome, errorIncome, setIncomes } = useIncomes();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [incomeToEdit, setIncomeToEdit] = useState<IncomeEntry | null>(null);

  // Use prop entries if provided, otherwise use context entries
  const entries = propEntries !== undefined ? propEntries : contextIncomes;

  const handleEditClick = (entry: IncomeEntry) => {
    setIncomeToEdit(entry);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (entryId: string) => {
    setIncomeToDelete(entryId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!incomeToDelete) return;

    try {
      setIsDeleting(true);
      // Make DELETE request to API
      await del(`${process.env.NEXT_PUBLIC_INCOME_ENDPOINT}/${incomeToDelete}`);

      // Remove the deleted entry from context
      const updatedIncomes = contextIncomes.filter((entry) => entry.id !== incomeToDelete);
      setIncomes(updatedIncomes);

      setDeleteDialogOpen(false);
      setIncomeToDelete(null);
    } catch (err) {
      console.error("Failed to delete income:", err);
      // You could add toast notification here
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setIncomeToDelete(null);
  };
  if (loadingIncome) {
    return (
      <div
        className={`overflow-hidden rounded-xl border shadow-sm ${colorClasses.surface.border} ${colorClasses.surface.background}`}
      >
        <div className={`px-4 py-10 text-center text-sm ${colorClasses.text.secondary}`}>
          Loading entries...
        </div>
      </div>
    );
  }

  if (errorIncome) {
    return (
      <div
        className={`overflow-hidden rounded-xl border shadow-sm ${colorClasses.surface.border} ${colorClasses.surface.background}`}
      >
        <div className={`px-4 py-10 text-center text-sm ${colorClasses.state.error}`}>
          {errorIncome}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Edit Dialog */}
      {incomeToEdit && (
        <IncomeModal
          mode="edit"
          incomeToEdit={incomeToEdit}
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setIncomeToEdit(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this income? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteCancel} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="overflow-hidden rounded-xl shadow-sm">
        <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
          <table className="min-w-full border-collapse text-sm">
            <thead className={`sticky top-0 ${colorClasses.surface.header}`}>
              <tr
                className={`text-left text-xs font-semibold uppercase tracking-wide ${colorClasses.text.primary}`}
              >
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py- text-right">Installments</th>
                <th className="px-4 py-3 text-center">Cycle</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>

            <tbody className="">
              {contextIncomes.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className={`px-4 py-10 text-center text-sm ${colorClasses.text.secondary}`}
                  >
                    No Incomes yet. Add one to see it here.
                  </td>
                </tr>
              )}

              {contextIncomes.map((entry, index) => (
                <tr
                  key={entry.id}
                  className={`transition-colors ${colorClasses.interactive.hover} ${colorClasses.text.primary}`}
                >
                  <td className="px-4 py-3">
                    <span className="text-sm">{formatDate(entry.createdAt)}</span>
                  </td>

                  <td className="max-w-xs px-4 py-3">
                    <span className="line-clamp-2">{entry.description || "—"}</span>
                  </td>

                  <td className="px-4 py-3 text-right">{formatCurrency(entry.amount)}</td>

                  <td className="px-4 py-3 text-right">{entry.installments}</td>
                  <td className="px-4 py-3 text-center">
                    {entry.fixed ? (
                      <span className={`px-2 py-0.5 ${colorClasses.financial.fixed}`}>Fixed</span>
                    ) : (
                      ""
                    )}
                  </td>
                  <td className="px-4 py-3">{entry.source}</td>

                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5">
                      <EditIcon onClick={() => handleEditClick(entry)} />
                      <DeleteIcon onClick={() => entry.id && handleDeleteClick(entry.id)} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default IncomesTable;
