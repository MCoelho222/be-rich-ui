import { IResponseData } from "../types";

export function calculateTotalExpense (data: IResponseData[]) {
    const totalAmount = data.reduce((acc, item: IResponseData) => item.amount + acc, 0);
    return totalAmount;
}