import { AppShell } from "@/components/app-shell";
import { TRPCProvider } from "@/lib/trpc/provider";
import { requireUser } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <TRPCProvider>
      <AppShell user={user}>{children}</AppShell>
    </TRPCProvider>
  );
}
