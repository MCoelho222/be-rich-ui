'use client'

import FilterDropdown from "./FilterDropdown";
import React, { useState, useMemo } from "react";
import { DataItemsKeys, ColumnNames } from "../../../types";
import { tableColNames, colNameAsKey } from "@/app/settings";
import { formatTimestampToDate, isValidTimestamp } from "@/app/helpers/dates";
import { IExpenseTableProps, IFilterState } from "./types";
import { useExpense } from "@/app/contexts/ExpenseContext";

const ExpenseTable: React.FC<IExpenseTableProps> = ({
  data,
  isLoading,
  error,
}) => {
  const { setFilteredData } = useExpense();
  const [filters, setFilters] = useState<{
    [key in DataItemsKeys]?: IFilterState;
  }>({});

  const [hoveredColumn, setHoveredColumn] = useState<ColumnNames | null>(null);

  const getUniqueValues = (colname: ColumnNames) => {
    const key = colNameAsKey[colname] as DataItemsKeys;
    const values = new Set(
      data.map((item) => {
        const value = item[key];
        if (typeof value === "boolean") return value ? "yes" : "no";
        return String(value);
      })
    );
    return Array.from(values).sort();
  };

  const filteredData = useMemo(() => {
    let filteredDataArr = data.filter((item) => {
      console.log(filters);
      console.log(Object.entries(filters));
      return Object.entries(filters).every(([key, filter]) => {
        if (!filter) return true;

        const itemValue = item[key as DataItemsKeys];

        if (key === "amount" || key === "installments") {
          if (!filter.numberFilter) return true;
          const value = Number(itemValue);
          switch (filter.numberFilter.type) {
            case "gt":
              return value > filter.numberFilter.value;
            case "lt":
              return value < filter.numberFilter.value;
            case "eq":
              return value === filter.numberFilter.value;
            default:
              return true;
          }
        }

        if (key === "created_at") {
          if (!filter.dateRange?.start && !filter.dateRange?.end) return true;
          const date = new Date(itemValue as string);
          const start = filter.dateRange.start
            ? new Date(filter.dateRange.start)
            : null;
          const end = filter.dateRange.end
            ? new Date(filter.dateRange.end)
            : null;

          if (start && end) return date >= start && date <= end;
          if (start) return date >= start;
          if (end) return date <= end;
          return true;
        }

        if (filter.selectedValues?.length) {
          const compareValue =
            typeof itemValue === "boolean"
              ? itemValue
                ? "yes"
                : "no"
              : String(itemValue);
          return filter.selectedValues.includes(compareValue);
        }

        return true;
      });
    });
    setFilteredData(filteredDataArr);
    return filteredDataArr;
  }, [data, filters]);

  // const toggleFilter = (colname: ColumnNames) => {
  //   const key = colNameAsKey[colname] as DataItemsKeys;
  //   setFilters((prev) => ({
  //     ...prev,
  //     [key]: {
  //       ...prev[key],
  //       isOpen: !prev[key]?.isOpen,
  //     },
  //   }));
  // };

  const handleFilterChange = (colname: ColumnNames, filterValue: any) => {
    const key = colNameAsKey[colname] as DataItemsKeys;
    setFilters((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        ...(key === "amount" || key === "installments"
          ? { numberFilter: filterValue }
          : key === "created_at"
          ? { dateRange: filterValue }
          : { selectedValues: filterValue }),
      },
    }));
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="flex flex-col h-screen items-center overflow-x-auto mt-4">
      <table className="w-5/6 bg-gray-900">
        <thead>
          <tr className="bg-transparent">
            {tableColNames.map((colname, idx) => (
              <th
                className="px-6 py-3 text-left text-xs font-medium text-textGrayLight uppercase tracking-wider"
                key={idx}
                onMouseEnter={() => setHoveredColumn(colname as ColumnNames)}
                onMouseLeave={() => setHoveredColumn(null)}
              >
                <div className="relative">
                  <div className="flex items-center space-x-2">
                    <span>{colname}</span>
                    <span className="text-xs">▼</span>
                  </div>
                  {hoveredColumn === colname && (
                    <div
                      className="absolute z-10 top-full left-0 mt-1"
                      onMouseEnter={() => setHoveredColumn(colname as ColumnNames)}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{ transition: 'opacity 0.2s ease-in-out' }}
                    >
                      <FilterDropdown
                        colname={colname as ColumnNames}
                        filterState={{
                          isOpen: true,
                          ...(filters[
                            colNameAsKey[colname as ColumnNames] as DataItemsKeys
                          ] || {})
                        }}
                        uniqueValues={getUniqueValues(colname as ColumnNames)}
                        onClose={() => setHoveredColumn(null)}
                        onFilterChange={(value) =>
                          handleFilterChange(colname as ColumnNames, value)
                        }
                      />
                    </div>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-transparent divide-y divide-gray-500">
          {filteredData.map((item) => (
            <tr key={item.id}>
              {tableColNames.map((colname, idx) => {
                const itemKey = colNameAsKey[
                  colname as ColumnNames
                ] as DataItemsKeys;
                let value = item[itemKey];
                if (typeof item[itemKey] === "boolean") {
                  value = item[itemKey] ? "yes" : "no";
                } else if (isValidTimestamp(value as string)) {
                  value = formatTimestampToDate(value as string);
                }
                return (
                  <td
                    className="px-6 py-2 whitespace-nowrap text-xs font-medium text-textGrayDark"
                    key={idx}
                  >
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ExpenseTable;
