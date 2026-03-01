interface IDisplayValue {
  value: number;
  asCurrency: boolean;
  title: string;
}

const DisplayValue = ({ value, asCurrency, title }: IDisplayValue) => {
  const stringNum = String(value);
  const splitStringNum = stringNum.split(".");
  const intPart = splitStringNum[0];
  const cents = splitStringNum[1] ? splitStringNum[1] : "00";
  if (splitStringNum.length > 1) {
  }
  return (
    <div className="flex flex-col">
      <span className="text-xl">{title}</span>
      <div className="inline-flex items-end">
        <span className="text-7xl font-semibold leading-none">{intPart}</span>
        {asCurrency && <span className="text-base leading-none pb-1">,{cents}</span>}
      </div>
    </div>
  );
};

export default DisplayValue;
