"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/dates";
import { calculateAge } from "@/lib/patients/derive";
import type { PatientDirectoryEntry } from "@/lib/modules/patients/service";
import { PatientSheet } from "@/components/patients/patient-sheet";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function PatientList({ patients }: { patients: PatientDirectoryEntry[] }) {
  const activeId = useSelectedLayoutSegment(); // el [id] activo, o null en /pacientes
  const [query, setQuery] = useState("");
  const [newOpen, setNewOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) =>
      [p.name, p.phone, p.email ?? "", p.cpf ?? ""].some((f) => f.toLowerCase().includes(q))
    );
  }, [patients, query]);

  return (
    <aside className="sticky top-6 flex max-h-[calc(100vh-6rem)] w-72 shrink-0 flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            <HugeiconsIcon icon={Search01Icon} size={16} strokeWidth={1.75} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar paciente"
            className="h-9 w-full rounded-md border bg-card pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="button"
          onClick={() => setNewOpen(true)}
          aria-label="Novo paciente"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground transition-opacity hover:opacity-90"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border bg-card">
        {filtered.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Nenhum paciente.</p>
        ) : (
          filtered.map((p) => {
            const next = p.appointments[0];
            const active = p.id === activeId;
            return (
              <Link
                key={p.id}
                href={`/pacientes/${p.id}`}
                className={cn(
                  "flex items-center gap-3 border-b px-3 py-2.5 transition-colors last:border-b-0",
                  active ? "bg-secondary" : "hover:bg-secondary/60"
                )}
              >
                <Avatar size="sm">
                  <AvatarFallback>{initials(p.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                  <p className="truncate font-mono text-xs tabular-nums text-muted-foreground">
                    {p.birthDate ? `${calculateAge(p.birthDate)} anos` : p.phone}
                  </p>
                </div>
                {next && (
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-primary">
                    {formatDate(next.startsAt)}
                  </span>
                )}
              </Link>
            );
          })
        )}
      </div>

      <PatientSheet open={newOpen} onOpenChange={setNewOpen} />
    </aside>
  );
}
