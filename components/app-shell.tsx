import Link from "next/link";
import { CalendarDays, ClipboardList, FileText, LogOut, Pill, Settings, Stethoscope, Users } from "lucide-react";
import type { User } from "@/app/generated/prisma/client";
import { logoutAction } from "@/app/(auth)/login/actions";
import { canAccessResource } from "@/lib/permissions";

const nav = [
  { href: "/agenda", label: "Agenda", icon: CalendarDays, resource: "appointments" },
  { href: "/pacientes", label: "Pacientes", icon: Users, resource: "patients" },
  { href: "/orcamentos", label: "Orçamentos", icon: ClipboardList, resource: "quotes" },
  { href: "/receitas", label: "Receitas", icon: Pill, resource: "prescriptions" },
  { href: "/atestados", label: "Atestados", icon: FileText, resource: "certificates" },
  { href: "/catalogo", label: "Catálogo", icon: Stethoscope, resource: "catalog" },
  { href: "/usuarios", label: "Usuários", icon: Settings, resource: "users" },
] as const;

export function AppShell({ user, children }: { user: User; children: React.ReactNode }) {
  const visibleNav = nav.filter((item) => canAccessResource(user.role, item.resource, "read"));

  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr] bg-zinc-50">
      <aside className="border-r border-zinc-200 bg-white px-4 py-5">
        <div className="mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-700 text-lg font-bold text-white">
            L
          </div>
          <p className="mt-3 text-sm font-medium text-zinc-500">Lia</p>
          <h1 className="text-lg font-semibold text-zinc-950">Dr. Darcy</h1>
        </div>

        <nav className="space-y-1">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <form action={logoutAction} className="mt-8">
          <button className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100">
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </form>
      </aside>

      <main className="min-w-0 px-8 py-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-700">
              Painel
            </p>
            <p className="text-sm text-zinc-500">{user.name}</p>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
