import type { User } from "@prisma/client";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import type { Role } from "@/lib/permissions";

export function AppShell({ user, children }: { user: User; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar userRole={user.role as Role} />
      <div className="md:pl-13">
        <Topbar user={{ name: user.name, email: user.email, image: null }} />
        <main className="min-w-0 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
