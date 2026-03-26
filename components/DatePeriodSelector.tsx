"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { colorClasses } from "@/config/colors";
import { getFisrtDayDateString, getLastDayDateString } from "@/utils/dates";

interface DatePeriodSelectorProps {
  onPeriodChange: (startDate: string, endDate: string) => void;
  onClear?: () => void;
  defaultStartDate?: string;
  defaultEndDate?: string;
}

const DatePeriodSelector = ({
  onPeriodChange,
  onClear,
  defaultStartDate = "",
  defaultEndDate = "",
}: DatePeriodSelectorProps) => {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);

  useEffect(() => {
    if (startDate || (startDate && endDate)) {
      onPeriodChange(startDate, endDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const handleClear = () => {
    setStartDate(getFisrtDayDateString());
    setEndDate(getLastDayDateString());
    if (onClear) {
      onClear();
    }
  };

  return (
    <div className="p-4 shadow-sm">
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <Label htmlFor="startDate" className={`text-sm font-medium ${colorClasses.text.label}`}>
            Start Date
          </Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={`mt-1 rounded-sm cursor-pointer ${colorClasses.text.secondary}`}
          />
        </div>

        <div className="flex-1">
          <Label htmlFor="endDate" className={`text-sm font-medium ${colorClasses.text.label}`}>
            End Date
          </Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={`mt-1 rounded-sm cursor-pointer ${colorClasses.text.secondary}`}
          />
        </div>

        <div className="flex items-end">
          <Button onClick={handleClear} variant="outline" className="rounded-sm">
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DatePeriodSelector;
