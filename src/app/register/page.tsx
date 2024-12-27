import ExpenseForm from "./components/ExpenseRegisterForm"
import Link from "next/link"

export default function Register() {
    return (
        <div style={{width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent:'center', alignItems: 'center', gap: '3rem'}}>
            <p style={{fontSize: '2.5rem', color: 'GrayText'}}>Register</p>
            <ExpenseForm/>
            <Link href={"/"} style={{fontSize: '1.5rem', color: 'GrayText'}}>Home</Link>
        </div>
    )
}