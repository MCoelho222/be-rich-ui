'use client'

import React, { createContext, useContext, useState } from 'react';
import { IResponseData } from '../types';

interface ExpenseContextType {
    originalData: IResponseData[];
    filteredData: IResponseData[];
    setOriginalData: (data: IResponseData[]) => void;
    setFilteredData: (data: IResponseData[]) => void;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>({
    originalData: [],
    filteredData: [],
    setOriginalData: () => {},
    setFilteredData: () => {},
});

export function ExpenseProvider({ children } : { children: React.ReactNode }) {
    const [ originalData, setOriginalData ] = useState<IResponseData[]>([]);
    const [ filteredData, setFilteredData ] = useState<IResponseData[]>([]);

    return (
        <ExpenseContext.Provider
            value={{
                originalData,
                filteredData,
                setOriginalData,
                setFilteredData
            }}
        >
            {children}
        </ExpenseContext.Provider>
    );
}

export function useExpense() {
    const context = useContext(ExpenseContext);
    if (context === undefined) {
        throw new Error('useExpense must be used within an ExpenseProvider')
    }
    return context;
}