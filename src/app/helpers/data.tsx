import { IResponseData } from "../types";

export function prepareColumnsToTable(data: IResponseData) {
    return Object.keys(data).map((key) => ({
        key,
        label: key,
    }));
}