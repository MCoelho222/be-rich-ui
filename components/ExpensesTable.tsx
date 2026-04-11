"use client";
import { ExpenseCamel } from "@/types/entryType";
import { formatDate } from "@/utils/dates";
import { formatCurrency } from "@/utils/numberFormat";
import { niceLabel } from "@/utils/stringFormat";
import { useExpenses } from "@/context/EntriesContext";
import { colorClasses } from "@/config/colors";
import { EditIcon } from "./ui/edit-icon";
import { DeleteIcon } from "./ui/delete-icon";
import ExpenseModal from "./ExpenseModal";
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


const ExpensesTable = () => {
  const { expenses: contextExpenses, loadingExpense, errorExpense, setExpenses } = useExpenses();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<ExpenseCamel | null>(null);

  const handleEditClick = (entry: ExpenseCamel) => {
    setExpenseToEdit(entry);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (entryId: string) => {
    setExpenseToDelete(entryId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return;

    try {
      setIsDeleting(true);
      // Make DELETE request to API
      await del(`${process.env.NEXT_PUBLIC_EXPENSE_ENDPOINT}/${expenseToDelete}`);

      // Remove the deleted expense from context
      const updatedExpenses = contextExpenses.filter((entry) => entry.id !== expenseToDelete);
      setExpenses(updatedExpenses);

      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    } catch (err) {
      console.error("Failed to delete expense:", err);
      // You could add toast notification here
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setExpenseToDelete(null);
  };
  if (loadingExpense) {
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

  if (errorExpense) {
    return (
      <div
        className={`overflow-hidden rounded-xl border shadow-sm ${colorClasses.surface.border} ${colorClasses.surface.background}`}
      >
        <div className={`px-4 py-10 text-center text-sm ${colorClasses.state.error}`}>
          {errorExpense}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Edit Dialog */}
      {expenseToEdit && (
        <ExpenseModal
          mode="edit"
          expenseToEdit={expenseToEdit}
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setExpenseToEdit(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this entry? This action cannot be undone.
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
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py- text-right">Installment</th>
                <th className="px-4 py-3 text-center">Cycle</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Payment Method</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>

            <tbody className="">
              {contextExpenses.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className={`px-4 py-10 text-center text-sm ${colorClasses.text.secondary}`}
                  >
                    No expenses yet. Add one to see it here.
                  </td>
                </tr>
              )}

              {contextExpenses.map((entry, index) => (
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

                  <td className="px-4 py-3">
                    {entry.category ? niceLabel(entry.category) : entry.category}
                  </td>

                  <td className="px-4 py-3 text-right">{formatCurrency(entry.amount)}</td>

                  <td className="px-4 py-3 text-right">{entry.installment}</td>
                  <td className="px-4 py-3 text-center">
                    {entry.fixed ? (
                      <span className={`px-2 py-0.5 ${colorClasses.financial.fixed}`}>Fixed</span>
                    ) : (
                      ""
                    )}
                  </td>
                  <td className="px-4 py-3">{entry.source}</td>

                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5">{entry.paymentMethod}</span>
                  </td>
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

export default ExpensesTable;
