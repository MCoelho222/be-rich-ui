import { Entry } from "@/types/entryType";

export function calculateFiltered(
  data: Entry[],
  stat: string,
  targetKey: "amount" | "installments",
  mode: "Income" | "Expense"
) {
  const targetData = data
    .filter((entry) => entry.entryType === mode)
    .map((entry) => entry[targetKey]);

  if (stat === "sum") {
    return targetData.reduce((acc, val) => acc + val, 0);
  }
  if (stat === "average") {
    const sum = targetData.reduce((acc, val) => acc + val, 0);
    return sum / targetData.length;
  }
  if (stat === "max") {
    return Math.max(...targetData);
  }
  if (stat === "min") {
    return Math.min(...targetData);
  }

  return 0; // default case
}
