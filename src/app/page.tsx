import Link from "next/link";

export default function Home() {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100%',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
      }}>
      <main style={{display: 'flex', gap: '1rem'}}>
        <Link href={"/register"} style={{fontSize: '2rem'}}>Register</Link>
        <Link href={"/dashboard"} style={{fontSize: '2rem'}}>Dashboard</Link>
      </main>
      <footer>
        <p style={{color: 'GrayText'}}>Be rich before you get poor</p>
      </footer>
    </div>
  );
}
