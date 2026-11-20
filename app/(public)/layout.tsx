import { AuthLayout } from "@/components/auth/AuthCard";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>;
}
