import { CardLoginRegisters } from "@/components/card-login-registers";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <CardLoginRegisters>{children}</CardLoginRegisters>;
}
