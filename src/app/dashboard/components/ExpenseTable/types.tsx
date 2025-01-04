import { ColumnNames,IResponseData } from "@/app/types";

export interface IExpenseTableProps {
  data: IResponseData[];
  isLoading?: boolean;
  error?: Error;
}

export interface IFilterState {
  isOpen: boolean;
  selectedValues?: string[];
  dateRange?: { start: string; end: string };
  numberFilter?: {
    type: "gt" | "lt" | "eq";
    value: number;
  };
}

export interface IFilterDropdownProps {
  colname: ColumnNames;
  filterState: IFilterState;
  uniqueValues: any[];
  onClose: () => void;
  onFilterChange: (values: any) => void;
}