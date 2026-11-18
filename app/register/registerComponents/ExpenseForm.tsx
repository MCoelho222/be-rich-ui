import React from "react";
import { colorClasses } from "@/config/colors";
import InputField from "../InputField";
import SelectField from "../SelectField";
import { Source } from "@/helpers/entriesHelper";
import { useState } from "react";

function ExpenseForm() {
  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const amount = formData.get("amount");
          const date = formData.get("date");
          const source = formData.get("source");
          console.log(amount, date, source);
        }}
        className="grid gap-1 py-2"
      >
        <InputField inputId="amount" inputLabel="Amount" inputName="amount" inputType="number" />
        <InputField inputId="date" inputLabel="Date" inputName="date" inputType="date" />
        <SelectField
          selectId="source"
          selectName="source"
          selectLabel="Source"
          optionsArr={Object.values(Source)}
          defaultOption={Source.MARCELO}
        />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default ExpenseForm;
