export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'paypal';
export type Category = 'food' | 'transport' | 'utilities' | 'entertainment' | 'other';
export type CardOwner = 'personal' | 'business';
  
export interface Expense {
    amount: number;
    fixed?: boolean;
    payment_method: PaymentMethod;
    category: Category;
    installments?: number;
    card_owner: CardOwner;
}