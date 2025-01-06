import ExpenseForm from "./components/ExpenseRegisterForm"
import Link from "next/link"

export default function Register() {
    return (
        <div className="flex flex-col justify-center items-center h-screen relative">
          <nav className="flex flex-row text-xl absolute top-0 mb-4 mt-4 gap-10">
            <Link className="text-textLink" href={"/"}>Home</Link>
            <Link className="text-textLink" href={"/dashboard"}>Dashboard</Link>
          </nav>
          <p className="text-3xl text-textGrayLight mb-5">Register</p>
          <ExpenseForm/>
        </div>
    )
}