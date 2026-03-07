import { Entry } from "@/types/entryType";

export function getStat(
  data: number[],
  stat: 'sum' | 'avg' | 'max' | 'min',
) {
  if (stat === 'sum') {
    return data.reduce((acc, val) => acc + val, 0);
  }
  if (stat === 'avg') {
    const sum = data.reduce((acc, val) => acc + val, 0);
    return sum / data.length;
  }
  if (stat === 'max') {
    return Math.max(...data);
  }
  if (stat === 'min') {
    return Math.min(...data);
  }

  return 0; // default case
}
