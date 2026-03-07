import { colorClasses } from "@/config/colors";

interface IDisplayValue {
  value: number;
  asCurrency: boolean;
  title?: string;
  color?: string; // Tailwind color class (e.g., "text-emerald-500")
}

const DisplayValue = ({ value, asCurrency, title, color }: IDisplayValue) => {
  const stringNum = String(value);
  const splitStringNum = stringNum.split(".");
  const intPart = splitStringNum[0];
  const cents = splitStringNum[1] ? splitStringNum[1] : "00";
  if (splitStringNum.length > 1) {
  }
  return (
    <div className={`flex flex-col font-semibold ${colorClasses.text.secondary}`}>
      {title && <span className="text-xl">{title}</span>}
      <div className="inline-flex items-end">
        <span className={`text-7xl font-medium leading-none ${color || ""}`}>{intPart}</span>
        {asCurrency && (
          <span className={`text-base leading-none pb-1 ${color || ""}`}>,{cents}</span>
        )}
      </div>
    </div>
  );
};

export default DisplayValue;
