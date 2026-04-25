"use client";
import { IncomeEntry, IncomeCamel } from "@/types/entryType";
import { formatDate } from "@/utils/dates";
import { formatCurrency } from "@/utils/numberFormat";
import { useIncomes } from "@/context/EntriesContext";
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
import { setQueryParams } from "@/utils/urls";

const IncomesTable = () => {
  const { incomes: contextIncomes, loadingIncome, errorIncome, setIncomes } = useIncomes();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState<[string, boolean | undefined] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [incomeToEdit, setIncomeToEdit] = useState<IncomeCamel | null>(null);

  const handleEditClick = (entry: IncomeCamel) => {
    setIncomeToEdit(entry);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (entryId: string, isFixed?: boolean) => {
    setIncomeToDelete([entryId, isFixed]);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!incomeToDelete) return;

    try {
      setIsDeleting(true);

      let endpoint = process.env.NEXT_PUBLIC_INCOME_ENDPOINT;
      if (endpoint) {
        endpoint = incomeToDelete[1] != undefined
          ? setQueryParams(`${endpoint}/${incomeToDelete[0]}`, incomeToDelete[1])
          : `${endpoint}/${incomeToDelete[0]}`;
        
        // Make DELETE request to API
        await del(endpoint);
      }

      // Remove the deleted entry from context
      const updatedIncomes = contextIncomes.filter((entry) => entry.id !== incomeToDelete[0]);
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
          Loading incomes...
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
                <th className="px-4 py- text-right">Installment</th>
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
                    <span className="px-2 py-0.5">
                      <EditIcon onClick={() => handleEditClick(entry)} />
                      <DeleteIcon
                        onClick={() => entry.id && handleDeleteClick(entry.id, entry.fixed)}
                      />
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
