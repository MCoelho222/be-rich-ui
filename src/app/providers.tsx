"use client"
import { ExpenseProvider } from "./contexts/ExpenseContext";
import { HeroUIProvider } from "@heroui/react";
const Providers = ({ children } : { children: React.ReactNode }) => {
    return (
        <HeroUIProvider>
            <ExpenseProvider>
                {children}
            </ExpenseProvider>
        </HeroUIProvider>
    );
}

export default Providers;