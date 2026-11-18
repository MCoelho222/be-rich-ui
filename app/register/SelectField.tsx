"use client";
import { useState } from "react";
import { colorClasses } from "@/config/colors";

interface SelectFieldProps<T extends string> {
  selectId: string;
  selectName: string;
  selectLabel: string;
  optionsArr: readonly T[];
  defaultOption: T;
  onChange?: (value: T) => void;
}

function SelectField<T extends string>({ selectId, selectName, selectLabel, optionsArr, defaultOption, onChange }: SelectFieldProps<T>) {
  const [option, setOption] = useState(defaultOption);
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as T;
    setOption(value);
    onChange?.(value);
  }
  return (
    <div className="flex flex-row gap-5">
      <label htmlFor={selectId}>{selectLabel}</label>
      <select className={`${colorClasses.surface.background}`} id={selectId} name={selectName} value={option} onChange={handleChange}>
        {optionsArr.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectField;
