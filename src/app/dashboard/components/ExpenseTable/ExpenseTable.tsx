// import React from 'react';
// import { DataItemsKeys, ColumnNames, IResponseData } from '../../types';
// import { tableColNames, colNameAsKey } from '@/app/settings';
// import { formatTimestampToDate, isValidTimestamp } from '@/app/helpers/dates';

// interface IExpenseTableProps {
//   data: IResponseData[];
//   isLoading?: boolean;
//   error?: Error;
// }

// const ExpenseTable: React.FC<IExpenseTableProps> = ({ data, isLoading, error }) => {
//   if (isLoading) return <div>Loading...</div>;
//   if (error) return <div>Error: {error.message}</div>;

//   return (
//     <div className="flex justify-center items-center h-screen overflow-x-auto">
//       <table className="w-5/6 bg-gray-900">
//         <thead>
//           <tr className="bg-transparent">
//             {tableColNames.map((colname, idx) => {return (
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider" key={idx}>
//                 {colname}
//               </th>)})
//             }
//           </tr>
//         </thead>
//         <tbody className="bg-transparent divide-y divide-gray-500">
//           {data.map((item) => (
//             <tr key={item.id}>
//               {tableColNames.map((colname, idx) => {
//                 const itemKey = colNameAsKey[colname as ColumnNames] as DataItemsKeys
//                 let value = item[itemKey];
//                 if (typeof item[itemKey] === 'boolean') {
//                   value = item[itemKey] ? 'yes' : 'no';
//                 } else if (isValidTimestamp(value as string)){
//                   value = formatTimestampToDate(value as string)
//                 }
//                 return (<td className="px-6 py-2 whitespace-nowrap text-xs font-medium text-gray-500" key={idx}>
//                   {value}
//                 </td>)
//               })}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default ExpenseTable;

import FilterDropdown from "./FilterDropdown";
import React, { useState, useMemo } from "react";
import { DataItemsKeys, ColumnNames } from "../../../types";
import { tableColNames, colNameAsKey } from "@/app/settings";
import { formatTimestampToDate, isValidTimestamp } from "@/app/helpers/dates";
import { IExpenseTableProps, IFilterState } from "./types";
import FilterStateModal from "./FilterStateModal";

const ExpenseTable: React.FC<IExpenseTableProps> = ({
  data,
  isLoading,
  error,
}) => {
  const [filters, setFilters] = useState<{
    [key in DataItemsKeys]?: IFilterState;
  }>({});

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
    return data.filter((item) => {
      return Object.entries(filters).every(([key, filter]) => {
        if (!filter || !filter.isOpen) return true;

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
  }, [data, filters]);

  const toggleFilter = (colname: ColumnNames) => {
    const key = colNameAsKey[colname] as DataItemsKeys;
    setFilters((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        isOpen: !prev[key]?.isOpen,
      },
    }));
  };

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
    <div className="flex justify-center items-center h-screen overflow-x-auto">
      <table className="w-5/6 bg-gray-900">
        <thead>
          <tr className="bg-transparent">
            {tableColNames.map((colname, idx) => (
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                key={idx}
              >
                <div className="relative">
                  <button
                    className="flex items-center space-x-2"
                    onClick={() => toggleFilter(colname as ColumnNames)}
                  >
                    <span>{colname}</span>
                    <span className="text-xs">▼</span>
                  </button>
                  {filters[
                    colNameAsKey[colname as ColumnNames] as DataItemsKeys
                  ]?.isOpen && (
                    <FilterDropdown
                      colname={colname as ColumnNames}
                      filterState={
                        filters[
                          colNameAsKey[colname as ColumnNames] as DataItemsKeys
                        ] || { isOpen: true }
                      }
                      uniqueValues={getUniqueValues(colname as ColumnNames)}
                      onClose={() => toggleFilter(colname as ColumnNames)}
                      onFilterChange={(value) =>
                        handleFilterChange(colname as ColumnNames, value)
                      }
                    />
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
                    className="px-6 py-2 whitespace-nowrap text-xs font-medium text-gray-500"
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
