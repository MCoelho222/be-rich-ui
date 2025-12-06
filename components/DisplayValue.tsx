const DisplayValue = ({ value }: { value: number }) => {
  const numAsString = String(value);
  const splitNum = numAsString.split(".");
  const intNum = splitNum[0];
  const decimalNum = splitNum[1];
  return (
    <>
      <span className="text-xl">{intNum}</span>
      {decimalNum && <span className="text-sm">,{decimalNum}</span>}
    </>
  )
}

export default DisplayValue
