# Vista de pacientes (Fase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir el CRUD plano de pacientes en una vista master-detail (lista buscable + ficha con cabecera fija y pestañas) que reutiliza el lenguaje visual de la agenda.

**Architecture:** Layout anidado de App Router: `pacientes/layout.tsx` renderiza la lista a la izquierda (carga server, filtra en cliente) y `{children}` a la derecha. El paciente está en la URL (`/pacientes/[id]`); las pestañas de la ficha son estado de cliente. El valor de los orçamentos se calcula con un helper puro testeado.

**Tech Stack:** Next 16 (App Router), React 19, Prisma, Tailwind v4 (tokens en `globals.css`), Hugeicons, Radix (`ui/sheet`, `ui/avatar`), Vitest.

**Referencia:** spec en `docs/superpowers/specs/2026-06-08-vista-pacientes-fase1-design.md`.

---

### Task 1: Helpers puros (`quoteValueCents`, `calculateAge`)

**Files:**
- Create: `lib/patients/derive.ts`
- Test: `tests/patients-derive.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/patients-derive.test.ts
import { describe, expect, it } from "vitest";
import { calculateAge, quoteValueCents } from "@/lib/patients/derive";

describe("quoteValueCents", () => {
  it("suma las líneas y resta el descuento", () => {
    expect(
      quoteValueCents({ discountCents: 500, lines: [{ totalPriceCents: 3000 }, { totalPriceCents: 2000 }] })
    ).toBe(4500);
  });
  it("no baja de cero", () => {
    expect(quoteValueCents({ discountCents: 9999, lines: [{ totalPriceCents: 1000 }] })).toBe(0);
  });
  it("vale cero sin líneas", () => {
    expect(quoteValueCents({ discountCents: 0, lines: [] })).toBe(0);
  });
});

describe("calculateAge", () => {
  it("cuenta años cumplidos", () => {
    expect(calculateAge(new Date("1990-06-15"), new Date("2026-06-15"))).toBe(36);
  });
  it("resta un año si aún no cumplió este año", () => {
    expect(calculateAge(new Date("1990-12-31"), new Date("2026-06-15"))).toBe(35);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/patients-derive.test.ts`
Expected: FAIL — no se resuelve `@/lib/patients/derive`.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/patients/derive.ts

type QuoteValue = { discountCents: number; lines: { totalPriceCents: number }[] };

/** Valor de un orçamento en centavos: suma de líneas menos descuento (mínimo 0). */
export function quoteValueCents(quote: QuoteValue): number {
  const linesTotal = quote.lines.reduce((sum, line) => sum + line.totalPriceCents, 0);
  return Math.max(linesTotal - quote.discountCents, 0);
}

/** Edad en años cumplidos a partir de la fecha de nacimiento. */
export function calculateAge(birthDate: Date, now: Date = new Date()): number {
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/patients-derive.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/patients/derive.ts tests/patients-derive.test.ts
git commit -m "feat(pacientes): helpers puros de valor de orçamento y edad"
```

---

### Task 2: Cambios en el servicio (`getPatientDetail` + `listPatientDirectory`)

**Files:**
- Modify: `lib/modules/patients/service.ts`

- [ ] **Step 1: Añadir las líneas al include de `getPatientDetail`**

Reemplazar la función `getPatientDetail` existente por:

```ts
export async function getPatientDetail(id: string) {
  return prisma.patient.findUniqueOrThrow({
    where: { id },
    include: {
      appointments: { orderBy: { startsAt: "desc" } },
      quotes: { orderBy: { issueDate: "desc" }, include: { lines: true } },
      prescriptions: { orderBy: { issueDate: "desc" } },
      certificates: { orderBy: { issueDate: "desc" } },
    },
  });
}
```

- [ ] **Step 2: Añadir `listPatientDirectory` y los tipos exportados**

Añadir al final del archivo:

```ts
// Lista para el directorio master-detail: pacientes + su próxima consulta
// (futura y no cancelada). Separada de `listPatients` para no inflar el
// payload que consume la agenda.
export async function listPatientDirectory() {
  const now = new Date();
  return prisma.patient.findMany({
    orderBy: { name: "asc" },
    include: {
      appointments: {
        where: { startsAt: { gt: now }, status: { not: "cancelled" } },
        orderBy: { startsAt: "asc" },
        take: 1,
      },
    },
  });
}

export type PatientDirectoryEntry = Awaited<ReturnType<typeof listPatientDirectory>>[number];
export type PatientDetailData = Awaited<ReturnType<typeof getPatientDetail>>;
```

- [ ] **Step 3: Verify types compile**

Run: `pnpm tsc --noEmit`
Expected: sin errores nuevos en `lib/modules/patients/service.ts`.

- [ ] **Step 4: Commit**

```bash
git add lib/modules/patients/service.ts
git commit -m "feat(pacientes): include de líneas en detalle + listPatientDirectory"
```

---

### Task 3: Restyle de `PatientForm` a tokens + `PatientSheet` (alta)

**Files:**
- Modify: `app/(dashboard)/pacientes/patient-form.tsx`
- Create: `components/patients/patient-sheet.tsx`

- [ ] **Step 1: Restyle de `PatientForm` a los tokens del sistema**

El formulario actual usa clases off-brand (`border-zinc-200 bg-white`, `bg-red-700`). Se reutiliza en el `Sheet` y en la pestaña Dados, así que debe usar los tokens. Reemplazar el contenido completo de `patient-form.tsx` por:

```tsx
import type { Patient } from "@prisma/client";

const fieldClass =
  "rounded-md border bg-card p-2 text-sm outline-none focus:ring-2 focus:ring-ring";

export function PatientForm({
  patient,
  action,
}: {
  patient?: Patient;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="grid gap-3 rounded-lg border bg-card p-5 md:grid-cols-2">
      <input name="name" defaultValue={patient?.name} placeholder="Nome" required className={fieldClass} />
      <input name="phone" defaultValue={patient?.phone} placeholder="Telefone" required className={fieldClass} />
      <input name="email" defaultValue={patient?.email ?? ""} placeholder="Email" className={fieldClass} />
      <input name="cpf" defaultValue={patient?.cpf ?? ""} placeholder="CPF" className={fieldClass} />
      <input name="birthDate" type="date" defaultValue={patient?.birthDate?.toISOString().slice(0, 10) ?? ""} className={fieldClass} />
      <input name="recordNumber" defaultValue={patient?.recordNumber ?? ""} placeholder="Prontuário" className={fieldClass} />
      <textarea name="notes" defaultValue={patient?.notes ?? ""} placeholder="Observações" className={`${fieldClass} md:col-span-2`} />
      <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 md:col-span-2">
        Salvar paciente
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Crear `PatientSheet`**

```tsx
// components/patients/patient-sheet.tsx
"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PatientForm } from "@/app/(dashboard)/pacientes/patient-form";
import { createPatientAction } from "@/app/(dashboard)/pacientes/actions";

export function PatientSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const openedAt = useRef(pathname);

  // Registra la ruta al abrir; al crear, el server action redirige a
  // /pacientes/[id] -> cambia el pathname -> cerramos el Sheet.
  useEffect(() => {
    if (open) openedAt.current = pathname;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open && pathname !== openedAt.current) onOpenChange(false);
  }, [pathname, open, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Novo paciente</SheetTitle>
          <SheetDescription>Cadastre os dados básicos. Você poderá completar depois.</SheetDescription>
        </SheetHeader>
        <div className="overflow-y-auto px-4 pb-4">
          <PatientForm action={createPatientAction} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 3: Verify types compile**

Run: `pnpm tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add app/(dashboard)/pacientes/patient-form.tsx components/patients/patient-sheet.tsx
git commit -m "feat(pacientes): PatientForm con tokens + Sheet de alta"
```

---

### Task 4: Cáscara master-detail (layout + lista + estado vacío)

**Files:**
- Create: `app/(dashboard)/pacientes/layout.tsx`
- Create: `components/patients/patient-list.tsx`
- Modify (reemplazo total): `app/(dashboard)/pacientes/page.tsx`

- [ ] **Step 1: Crear el layout master-detail**

```tsx
// app/(dashboard)/pacientes/layout.tsx
import { requirePermission } from "@/lib/auth/guards";
import { listPatientDirectory } from "@/lib/modules/patients/service";
import { PatientList } from "@/components/patients/patient-list";

export default async function PatientsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("patients", "read");
  const patients = await listPatientDirectory();

  return (
    <div className="flex gap-6">
      <PatientList patients={patients} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Crear `PatientList`**

```tsx
// components/patients/patient-list.tsx
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
```

- [ ] **Step 3: Reemplazar `page.tsx` por el estado vacío**

```tsx
// app/(dashboard)/pacientes/page.tsx
import { requirePermission } from "@/lib/auth/guards";

export default async function PatientsIndexPage() {
  await requirePermission("patients", "read");
  return (
    <div className="grid min-h-[60vh] place-items-center rounded-lg border border-dashed bg-card/40">
      <p className="text-sm text-muted-foreground">Selecione um paciente.</p>
    </div>
  );
}
```

- [ ] **Step 4: Verify types compile**

Run: `pnpm tsc --noEmit`
Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add "app/(dashboard)/pacientes/layout.tsx" "app/(dashboard)/pacientes/page.tsx" components/patients/patient-list.tsx
git commit -m "feat(pacientes): cascara master-detail con lista buscable"
```

---

### Task 5: Ficha del paciente (detalle + pestañas)

**Files:**
- Create: `components/patients/patient-detail.tsx`
- Modify (reemplazo total): `app/(dashboard)/pacientes/[id]/page.tsx`

- [ ] **Step 1: Crear `PatientDetail`**

```tsx
// components/patients/patient-detail.tsx
"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { WhatsappIcon, Calendar01Icon, PencilEdit01Icon } from "@hugeicons/core-free-icons";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { calculateAge, quoteValueCents } from "@/lib/patients/derive";
import type { PatientDetailData } from "@/lib/modules/patients/service";
import { PatientForm } from "@/app/(dashboard)/pacientes/patient-form";
import { deletePatientAction, updatePatientAction } from "@/app/(dashboard)/pacientes/actions";

type Tab = "resumo" | "consultas" | "orcamentos" | "receitas" | "atestados" | "dados";

const TABS: { id: Tab; label: string }[] = [
  { id: "resumo", label: "Resumo" },
  { id: "consultas", label: "Consultas" },
  { id: "orcamentos", label: "Orçamentos" },
  { id: "receitas", label: "Receitas" },
  { id: "atestados", label: "Atestados" },
  { id: "dados", label: "Dados" },
];

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Agendada",
  confirmed: "Confirmada",
  completed: "Concluída",
  cancelled: "Cancelada",
};

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

function onlyDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function PatientDetail({ patient }: { patient: PatientDetailData }) {
  const [tab, setTab] = useState<Tab>("resumo");

  const now = Date.now();
  const upcoming = patient.appointments.filter(
    (a) => a.startsAt.getTime() > now && a.status !== "cancelled"
  );
  const past = patient.appointments.filter((a) => a.startsAt.getTime() <= now);
  // appointments vienen en orden desc: el más próximo futuro es el último del tramo futuro.
  const nextAppt = upcoming[upcoming.length - 1];
  const lastVisit = past[0];
  const totalQuoted = patient.quotes.reduce((sum, q) => sum + quoteValueCents(q), 0);

  return (
    <div className="flex flex-col gap-4">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b bg-background/95 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback>{initials(patient.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{patient.name}</h1>
            <p className="font-mono text-xs tabular-nums text-muted-foreground">
              {patient.birthDate ? `${calculateAge(patient.birthDate)} anos · ` : ""}
              {patient.recordNumber ? `Prontuário ${patient.recordNumber} · ` : ""}
              {patient.phone}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <a
            href={`https://wa.me/${onlyDigits(patient.phone)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <HugeiconsIcon icon={WhatsappIcon} size={18} strokeWidth={1.75} />
          </a>
          <Link
            href="/agenda"
            aria-label="Agendar"
            className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <HugeiconsIcon icon={Calendar01Icon} size={18} strokeWidth={1.75} />
          </Link>
          <button
            type="button"
            onClick={() => setTab("dados")}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <HugeiconsIcon icon={PencilEdit01Icon} size={16} strokeWidth={2} />
            Editar
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-0.5 rounded-md bg-secondary p-0.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-sm px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider transition-colors",
              tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "resumo" && (
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Próxima consulta" value={nextAppt ? formatDateTime(nextAppt.startsAt) : "—"} />
          <SummaryCard label="Última visita" value={lastVisit ? formatDate(lastVisit.startsAt) : "—"} />
          <SummaryCard label="Total orçado" value={formatBRL(totalQuoted)} />
          <div className="rounded-lg border bg-card p-4 sm:col-span-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Documentos</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Orçamentos {patient.quotes.length} · Receitas {patient.prescriptions.length} · Atestados {patient.certificates.length}
            </p>
          </div>
        </div>
      )}

      {tab === "consultas" && (
        <Section items={patient.appointments} empty="Sem consultas.">
          {(a) => (
            <Row
              key={a.id}
              left={a.title}
              meta={formatDateTime(a.startsAt)}
              right={STATUS_LABEL[a.status]}
              muted={a.status === "cancelled"}
            />
          )}
        </Section>
      )}

      {tab === "orcamentos" && (
        <Section items={patient.quotes} empty="Sem orçamentos.">
          {(q) => (
            <Row key={q.id} left={`Orçamento ${q.number}`} meta={formatDate(q.issueDate)} right={formatBRL(quoteValueCents(q))} />
          )}
        </Section>
      )}

      {tab === "receitas" && (
        <Section items={patient.prescriptions} empty="Sem receitas.">
          {(p) => <Row key={p.id} left="Receita" meta={formatDate(p.issueDate)} />}
        </Section>
      )}

      {tab === "atestados" && (
        <Section items={patient.certificates} empty="Sem atestados.">
          {(c) => (
            <Row key={c.id} left={`CID ${c.cid}`} meta={`${formatDate(c.absenceStartDate)} – ${formatDate(c.absenceEndDate)}`} />
          )}
        </Section>
      )}

      {tab === "dados" && (
        <div className="flex flex-col gap-4">
          <PatientForm patient={patient} action={updatePatientAction.bind(null, patient.id)} />
          <form action={deletePatientAction.bind(null, patient.id)}>
            <button className="rounded-md border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
              Excluir paciente
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg font-medium tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function Section<T>({
  items,
  empty,
  children,
}: {
  items: T[];
  empty: string;
  children: (item: T) => ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card">
      {items.length === 0 ? <p className="p-4 text-sm text-muted-foreground">{empty}</p> : items.map(children)}
    </div>
  );
}

function Row({
  left,
  meta,
  right,
  muted,
}: {
  left: string;
  meta: string;
  right?: string;
  muted?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3 border-b px-4 py-2.5 last:border-b-0", muted && "opacity-50")}>
      <div className="min-w-0">
        <p className={cn("truncate text-sm font-medium text-foreground", muted && "line-through")}>{left}</p>
        <p className="font-mono text-xs tabular-nums text-muted-foreground">{meta}</p>
      </div>
      {right && <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{right}</span>}
    </div>
  );
}
```

- [ ] **Step 2: Reemplazar `[id]/page.tsx`**

```tsx
// app/(dashboard)/pacientes/[id]/page.tsx
import { requirePermission } from "@/lib/auth/guards";
import { getPatientDetail } from "@/lib/modules/patients/service";
import { PatientDetail } from "@/components/patients/patient-detail";

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("patients", "read");
  const { id } = await params;
  const patient = await getPatientDetail(id);
  return <PatientDetail patient={patient} />;
}
```

- [ ] **Step 3: Verify types compile**

Run: `pnpm tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add components/patients/patient-detail.tsx "app/(dashboard)/pacientes/[id]/page.tsx"
git commit -m "feat(pacientes): ficha con cabecera fija y pestanas"
```

---

### Task 6: Verificación final (build + revisión manual)

**Files:** ninguno (solo verificación).

- [ ] **Step 1: Lint + tipos + tests**

Run: `pnpm tsc --noEmit && pnpm test`
Expected: tipos limpios y los 5 tests de Task 1 en verde.

- [ ] **Step 2: Build de producción**

Run: `pnpm build`
Expected: build sin errores (incluye `prisma generate` + `next build`).

- [ ] **Step 3: Revisión manual en `pnpm dev`**

Verificar en el navegador (tema claro y oscuro):
- `/pacientes`: lista buscable a la izquierda, panel derecho con "Selecione um paciente".
- Buscar filtra en vivo; al pulsar una fila se abre la ficha y la fila queda resaltada.
- Ficha: cabecera fija con avatar/edad/prontuário/teléfono y acciones (WhatsApp abre `wa.me`, Agendar va a `/agenda`, Editar salta a Dados).
- Pestañas Resumo/Consultas/Orçamentos/Receitas/Atestados/Dados muestran datos; Orçamentos muestra el valor en R$.
- "Novo paciente" abre el Sheet, crea el paciente, navega a su ficha y cierra el Sheet.

- [ ] **Step 4: Commit (si hubo ajustes visuales)**

```bash
git add -A
git commit -m "chore(pacientes): ajustes visuales tras revision manual"
```

---

## Self-Review

- **Cobertura de la spec:**
  - Layout master-detail → Task 4. Ficha cabecera+pestañas → Task 5. Orçamento con valor → Tasks 1+5. Alta por Sheet → Task 3. Filas enriquecidas (avatar/edad/próxima consulta) → Tasks 2+4. Estilo calcado de la agenda → todas (tokens). Manejo de errores (`findUniqueOrThrow`, validación server) → sin cambios, documentado. Fuera de alcance respetado (sin pagos/anamnese/odontograma).
- **Placeholders:** ninguno; todo el código está completo.
- **Consistencia de tipos:** `PatientDirectoryEntry` y `PatientDetailData` se definen en Task 2 y se consumen en Tasks 4 y 5. `quoteValueCents`/`calculateAge` se definen en Task 1 y se usan en 4 y 5. `createPatientAction`/`updatePatientAction`/`deletePatientAction` existen en `actions.ts`. Iconos verificados en `@hugeicons/core-free-icons`.
- **Nota:** Fase 1 es UI; solo se testean los helpers puros (Task 1). El resto se verifica con `tsc`/`build`/revisión manual, declarado explícitamente para no aparentar cobertura inexistente.
