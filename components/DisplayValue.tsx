import { colorClasses } from "@/config/colors";

interface IDisplayValue {
  value: number;
  title?: string;
  color?: string; // Tailwind color class (e.g., "text-emerald-500")
}

const DisplayValue = ({ value, title, color }: IDisplayValue) => {
  const stringNum = String(value);
  const splitStringNum = stringNum.split(".");
  const intPart = splitStringNum[0];
  const cents = splitStringNum[1] ? splitStringNum[1] : "00";

  return (
    <div className={`flex flex-col font-semibold ${colorClasses.text.secondary}`}>
      {title && <span className="text-xl">{title}</span>}
      <div className="inline-flex items-end">
        <span className={`text-6xl font-medium leading-none ${color || ""}`}>{intPart}</span>
        <span className={`text-base leading-none pb-1 ${color || ""}`}>,{cents}</span>
      </div>
    </div>
  );
};

export default DisplayValue;
