import { PaymentMethod, Category, CardOwner } from "./register/types";

export interface IResponseData {
    amount: number;
    fixed?: boolean;
    payment_method: PaymentMethod;
    category: Category;
    installments?: number;
    card_owner: CardOwner;
    description?: string;
}