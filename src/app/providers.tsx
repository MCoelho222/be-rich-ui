import { ExpenseProvider } from "./contexts/ExpenseContext";

const Providers = ({ children } : { children: React.ReactNode }) => {
    return (
        <ExpenseProvider>
            {children}
        </ExpenseProvider>
    );
}

export default Providers;