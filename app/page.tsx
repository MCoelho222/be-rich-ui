"use client";
import Link from "next/link";


const Home = () => {
  
  return (
    <div className="text-xl text-center flex flex-row justify-center items-center h-screen">
      <Link href="/dashboard">Go to Dashboard</Link>
    </div>
  );
}

export default Home;
