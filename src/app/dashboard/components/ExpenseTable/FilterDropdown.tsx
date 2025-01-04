'use client'
import { IFilterDropdownProps } from "./types";
import { DataItemsKeys } from "@/app/types";
import { useRef, useEffect } from "react";
import { colNameAsKey } from "@/app/settings";
import { IFilterState } from "./types";

const FilterDropdown: React.FC<IFilterDropdownProps> = ({
  colname,
  filterState,
  uniqueValues,
  onClose,
  onFilterChange,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const key = colNameAsKey[colname] as DataItemsKeys;

  // Ensure default values
  const normalizedFilterState: IFilterState = {
    selectedValues: [],
    numberFilter: { type: 'eq', value: 0 },
    dateRange: { start: '', end: '' },
    ...filterState
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const renderNumberFilter = () => (
    <div className="p-4">
      <select
        className="mb-2 w-full p-2 bg-gray-800 rounded"
        value={normalizedFilterState.numberFilter?.type || "eq"}
        onChange={(e) =>
          onFilterChange({
            type: e.target.value as "gt" | "lt" | "eq",
            value: normalizedFilterState.numberFilter?.value || 0,
          })
        }
      >
        <option value="gt">Greater than</option>
        <option value="lt">Less than</option>
        <option value="eq">Equal to</option>
      </select>
      <input
        type="number"
        className="w-full p-2 bg-gray-800 rounded"
        value={normalizedFilterState.numberFilter?.value || ""}
        onChange={(e) =>
          onFilterChange({
            type: normalizedFilterState.numberFilter?.type || "eq",
            value: Number(e.target.value),
          })
        }
      />
    </div>
  );

  const renderDateFilter = () => (
    <div className="p-4">
      <div className="mb-2">
        <label className="block text-sm mb-1">Start Date</label>
        <input
          type="date"
          className="w-full p-2 bg-gray-800 rounded"
          value={normalizedFilterState.dateRange?.start || ""}
          onChange={(e) =>
            onFilterChange({
              start: e.target.value,
              end: normalizedFilterState.dateRange?.end || "",
            })
          }
        />
      </div>
      <div>
        <label className="block text-sm mb-1">End Date</label>
        <input
          type="date"
          className="w-full p-2 bg-gray-800 rounded"
          value={normalizedFilterState.dateRange?.end || ""}
          onChange={(e) =>
            onFilterChange({
              start: normalizedFilterState.dateRange?.start || "",
              end: e.target.value,
            })
          }
        />
      </div>
    </div>
  );

  const renderCheckboxFilter = () => (
    <div className="p-4 max-h-60 overflow-y-auto">
      {uniqueValues.map((value, idx) => (
        <div key={idx} className="flex items-center mb-2">
          <input
            type="checkbox"
            id={`${key}-${value}`}
            checked={normalizedFilterState.selectedValues?.includes(String(value))}
            onChange={(e) => {
              const newValues = e.target.checked
                ? [...(normalizedFilterState.selectedValues || []), String(value)]
                : (normalizedFilterState.selectedValues || []).filter(
                    (v) => v !== String(value)
                  );
              onFilterChange(newValues);
            }}
            className="mr-2"
          />
          <label htmlFor={`${key}-${value}`} className="text-sm">
            {value}
          </label>
        </div>
      ))}
    </div>
  );

  return (
    <div
      ref={dropdownRef}
      className="absolute z-10 mt-2 w-48 rounded-md shadow-lg bg-gray-900 ring-1 ring-black ring-opacity-5"
    >
      {key === "amount" || key === "installments"
        ? renderNumberFilter()
        : key === "created_at"
        ? renderDateFilter()
        : renderCheckboxFilter()}
    </div>
  );
};

export default FilterDropdown;