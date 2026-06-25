# Editor profesional de orçamento — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el formulario de orçamento de 1 línea por un editor profesional multi-línea con edición inline, conexión al catálogo y cálculo de totales en vivo, dentro del contexto del paciente.

**Architecture:** Lógica de totales/normalización como funciones puras testeables (`lib/quotes/editor.ts`). Componente cliente (`QuoteEditor`) que mantiene las líneas en estado y llama a una server action scoped al paciente. Rutas dedicadas para crear/editar bajo `/pacientes/[id]/orcamentos/`. La lista de orçamentos pasa a la pestaña del paciente con acciones PDF/Editar/Excluir. El backend reutiliza `createQuote` y añade `updateQuote`.

**Tech Stack:** Next.js 16 (App Router, RSC + server actions), React 19, Prisma 6, Tailwind 4, Vitest 4, Hugeicons.

## Global Constraints

- Texto de UI en **português** (es la lengua de la app: "Orçamento", "Excluir", "Salvar", "Novo orçamento").
- Usar el **design system**, NO los estilos viejos: tokens `bg-card`, `bg-primary`, `text-muted-foreground`, `border`, `font-mono` para labels/números. Prohibido `bg-white`, `bg-red-700`, `text-zinc-*`.
- Dinero **siempre en centavos** internamente (`Int`); mostrar con `formatBRL` (pt-BR). Parsear con `parseCents`.
- Permisos: acciones de escritura requieren `requirePermission("quotes", "create" | "update" | "delete")`; lectura `"read"`.
- Server actions que mutan datos del paciente hacen `revalidatePath('/pacientes/[id]')`.
- Tests viven en `tests/*.test.ts`, entorno node, sin DB (solo lógica pura). Comando: `npm test`.

---

### Task 1: Lógica pura del editor (totales + normalización)

**Files:**
- Create: `lib/quotes/editor.ts`
- Test: `tests/quote-editor.test.ts`

**Interfaces:**
- Consumes: `QuoteLineInput` desde `@/lib/modules/quotes/service` (`{ catalogItemId?: string | null; description: string; quantity: number; unitPriceCents: number }`).
- Produces:
  - `EditorLine` = `{ key: string; catalogItemId: string | null; description: string; quantity: number; unitPriceCents: number }`
  - `lineTotalCents(line: Pick<EditorLine, "quantity" | "unitPriceCents">): number`
  - `subtotalCents(lines: EditorLine[]): number`
  - `normalizeLines(lines: EditorLine[]): QuoteLineInput[]`

- [ ] **Step 1: Write the failing test**

Create `tests/quote-editor.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { lineTotalCents, subtotalCents, normalizeLines } from "@/lib/quotes/editor";

function line(over: Partial<Parameters<typeof normalizeLines>[0][number]> = {}) {
  return { key: "k", catalogItemId: null, description: "Item", quantity: 1, unitPriceCents: 1000, ...over };
}

describe("lineTotalCents", () => {
  it("multiplica cantidad por valor unitario", () => {
    expect(lineTotalCents({ quantity: 3, unitPriceCents: 1500 })).toBe(4500);
  });
});

describe("subtotalCents", () => {
  it("suma los totales de todas las líneas", () => {
    expect(subtotalCents([line({ quantity: 2, unitPriceCents: 1000 }), line({ quantity: 1, unitPriceCents: 500 })])).toBe(2500);
  });
  it("vale cero sin líneas", () => {
    expect(subtotalCents([])).toBe(0);
  });
});

describe("normalizeLines", () => {
  it("descarta líneas con descripción vacía", () => {
    const out = normalizeLines([line({ description: "Resina" }), line({ description: "   " })]);
    expect(out).toHaveLength(1);
    expect(out[0].description).toBe("Resina");
  });
  it("fuerza cantidad mínima de 1 y no expone la key", () => {
    const out = normalizeLines([line({ quantity: 0 })]);
    expect(out[0].quantity).toBe(1);
    expect(out[0]).not.toHaveProperty("key");
    expect(out[0]).toMatchObject({ catalogItemId: null, description: "Item", unitPriceCents: 1000 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- quote-editor`
Expected: FAIL — `Cannot find module '@/lib/quotes/editor'`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/quotes/editor.ts`:

```ts
import type { QuoteLineInput } from "@/lib/modules/quotes/service";

export interface EditorLine {
  key: string;
  catalogItemId: string | null;
  description: string;
  quantity: number;
  unitPriceCents: number;
}

export function lineTotalCents(line: Pick<EditorLine, "quantity" | "unitPriceCents">): number {
  return Math.max(0, line.quantity) * Math.max(0, line.unitPriceCents);
}

export function subtotalCents(lines: EditorLine[]): number {
  return lines.reduce((sum, line) => sum + lineTotalCents(line), 0);
}

export function normalizeLines(lines: EditorLine[]): QuoteLineInput[] {
  return lines
    .filter((line) => line.description.trim().length > 0)
    .map((line) => ({
      catalogItemId: line.catalogItemId,
      description: line.description.trim(),
      quantity: Math.max(1, Math.floor(line.quantity) || 1),
      unitPriceCents: Math.max(0, line.unitPriceCents),
    }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- quote-editor`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/quotes/editor.ts tests/quote-editor.test.ts
git commit -m "feat(orcamento): lógica pura de totales y normalización de líneas"
```

---

### Task 2: Backend — `updateQuote` + server actions scoped al paciente

**Files:**
- Modify: `lib/modules/quotes/service.ts` (añadir `updateQuote`)
- Modify: `app/(dashboard)/pacientes/[id]/actions.ts` (añadir `saveQuoteAction`, `deleteQuoteAction` + tipo `SaveQuoteInput`)

**Interfaces:**
- Consumes: `createQuote`, `deleteQuote`, `QuoteInput`, `QuoteLineInput` desde `@/lib/modules/quotes/service`; `parseDate` desde `@/lib/dates`; `requirePermission` desde `@/lib/auth/guards`.
- Produces:
  - `updateQuote(id: string, input: QuoteInput)` — actualiza campos escalares y reemplaza todas las líneas.
  - `SaveQuoteInput` = `{ quoteId?: string; patientId: string; issueDate: string; paymentMethod: string | null; validityDays: number | null; discountCents: number; notes: string | null; lines: QuoteLineInput[] }`
  - `saveQuoteAction(input: SaveQuoteInput): Promise<string>` — devuelve el id del quote (creado o editado).
  - `deleteQuoteAction(quoteId: string, patientId: string): Promise<void>`

- [ ] **Step 1: Añadir `updateQuote` al servicio**

En `lib/modules/quotes/service.ts`, después de `createQuote` (antes de `deleteQuote`), añadir:

```ts
export async function updateQuote(id: string, input: QuoteInput) {
  if (!input.lines.length) throw new Error("Orçamento requer ao menos um item.");
  return prisma.quote.update({
    where: { id },
    data: {
      issueDate: input.issueDate,
      paymentMethod: input.paymentMethod,
      validityDays: input.validityDays,
      discountCents: input.discountCents,
      notes: input.notes,
      lines: { deleteMany: {}, create: lineData(input.lines) },
    },
  });
}
```

> Nota: `lineData` ya existe en el archivo y calcula `totalPriceCents`. `deleteMany: {}` borra las líneas previas del quote antes de recrear.

- [ ] **Step 2: Añadir las server actions del paciente**

En `app/(dashboard)/pacientes/[id]/actions.ts`, añadir imports y acciones. El archivo ya tiene `"use server"`, `revalidatePath` y `requirePermission`. Añadir al inicio el import de quotes y `parseDate`:

```ts
import { parseDate } from "@/lib/dates";
import {
  createQuote,
  updateQuote,
  deleteQuote,
  type QuoteLineInput,
} from "@/lib/modules/quotes/service";
```

Y al final del archivo:

```ts
export type SaveQuoteInput = {
  quoteId?: string;
  patientId: string;
  issueDate: string;
  paymentMethod: string | null;
  validityDays: number | null;
  discountCents: number;
  notes: string | null;
  lines: QuoteLineInput[];
};

export async function saveQuoteAction(input: SaveQuoteInput): Promise<string> {
  await requirePermission("quotes", input.quoteId ? "update" : "create");
  const data = {
    patientId: input.patientId,
    issueDate: parseDate(input.issueDate),
    paymentMethod: input.paymentMethod,
    validityDays: input.validityDays,
    discountCents: input.discountCents,
    notes: input.notes,
    lines: input.lines,
  };
  const quote = input.quoteId
    ? await updateQuote(input.quoteId, data)
    : await createQuote(data);
  revalidatePath(`/pacientes/${input.patientId}`);
  return quote.id;
}

export async function deleteQuoteAction(quoteId: string, patientId: string): Promise<void> {
  await requirePermission("quotes", "delete");
  await deleteQuote(quoteId);
  revalidatePath(`/pacientes/${patientId}`);
}
```

- [ ] **Step 3: Verificar tipos y build**

Run: `npm run lint && npx tsc --noEmit`
Expected: sin errores. (Si `tsc` no está configurado para correr así, usar `npm run build` y confirmar que compila.)

- [ ] **Step 4: Commit**

```bash
git add lib/modules/quotes/service.ts "app/(dashboard)/pacientes/[id]/actions.ts"
git commit -m "feat(orcamento): updateQuote + server actions scoped al paciente"
```

---

### Task 3: Componente `QuoteEditor` (cliente)

**Files:**
- Create: `components/patients/quotes/quote-editor.tsx`

**Interfaces:**
- Consumes: `EditorLine`, `lineTotalCents`, `subtotalCents`, `normalizeLines` de `@/lib/quotes/editor`; `quoteValueCents` de `@/lib/patients/derive`; `formatBRL`, `parseCents` de `@/lib/money`; `saveQuoteAction`, `type SaveQuoteInput` de `@/app/(dashboard)/pacientes/[id]/actions`; `CatalogItem` de `@prisma/client`.
- Produces:
  - `QuoteEditorPatient` = `{ id: string; name: string; phone: string; cpf: string | null; recordNumber: string | null }`
  - `QuoteEditorQuote` = `{ id: string; number: string; issueDate: Date; paymentMethod: string | null; validityDays: number | null; discountCents: number; notes: string | null; lines: { catalogItemId: string | null; description: string; quantity: number; unitPriceCents: number }[] }`
  - `QuoteEditor({ patient, catalog, quote }: { patient: QuoteEditorPatient; catalog: CatalogItem[]; quote?: QuoteEditorQuote })`

- [ ] **Step 1: Crear el componente**

Create `components/patients/quotes/quote-editor.tsx`:

```tsx
"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CatalogItem } from "@prisma/client";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { formatBRL, parseCents } from "@/lib/money";
import { quoteValueCents } from "@/lib/patients/derive";
import {
  type EditorLine,
  lineTotalCents,
  subtotalCents,
  normalizeLines,
} from "@/lib/quotes/editor";
import { saveQuoteAction } from "@/app/(dashboard)/pacientes/[id]/actions";

export type QuoteEditorPatient = {
  id: string;
  name: string;
  phone: string;
  cpf: string | null;
  recordNumber: string | null;
};

export type QuoteEditorQuote = {
  id: string;
  number: string;
  issueDate: Date;
  paymentMethod: string | null;
  validityDays: number | null;
  discountCents: number;
  notes: string | null;
  lines: { catalogItemId: string | null; description: string; quantity: number; unitPriceCents: number }[];
};

let keySeq = 0;
const nextKey = () => `l${keySeq++}`;

const inputClass = "w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm";
const labelClass = "font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";

function toEditorLines(quote?: QuoteEditorQuote): EditorLine[] {
  if (!quote || quote.lines.length === 0) {
    return [{ key: nextKey(), catalogItemId: null, description: "", quantity: 1, unitPriceCents: 0 }];
  }
  return quote.lines.map((l) => ({ key: nextKey(), ...l }));
}

export function QuoteEditor({
  patient,
  catalog,
  quote,
}: {
  patient: QuoteEditorPatient;
  catalog: CatalogItem[];
  quote?: QuoteEditorQuote;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [issueDate, setIssueDate] = useState(
    (quote?.issueDate ?? new Date()).toISOString().slice(0, 10)
  );
  const [lines, setLines] = useState<EditorLine[]>(() => toEditorLines(quote));
  const [discountCents, setDiscountCents] = useState(quote?.discountCents ?? 0);
  const [paymentMethod, setPaymentMethod] = useState(quote?.paymentMethod ?? "");
  const [validityDays, setValidityDays] = useState(quote?.validityDays ?? 30);
  const [notes, setNotes] = useState(quote?.notes ?? "");
  const [picking, setPicking] = useState(false);
  const [search, setSearch] = useState("");

  const subtotal = useMemo(() => subtotalCents(lines), [lines]);
  const total = useMemo(
    () => quoteValueCents({ discountCents, lines: lines.map((l) => ({ totalPriceCents: lineTotalCents(l) })) }),
    [lines, discountCents]
  );

  const filteredCatalog = useMemo(
    () => catalog.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [catalog, search]
  );

  function updateLine(key: string, patch: Partial<EditorLine>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }
  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }
  function addFreeLine() {
    setLines((prev) => [...prev, { key: nextKey(), catalogItemId: null, description: "", quantity: 1, unitPriceCents: 0 }]);
  }
  function addCatalogLine(item: CatalogItem) {
    setLines((prev) => [
      ...prev,
      { key: nextKey(), catalogItemId: item.id, description: item.name, quantity: 1, unitPriceCents: item.priceCents },
    ]);
    setPicking(false);
    setSearch("");
  }

  function handleSave() {
    const normalized = normalizeLines(lines);
    if (normalized.length === 0) {
      setError("Adicione ao menos um item com descrição.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await saveQuoteAction({
          quoteId: quote?.id,
          patientId: patient.id,
          issueDate,
          paymentMethod: paymentMethod.trim() || null,
          validityDays: Number.isFinite(validityDays) ? validityDays : null,
          discountCents,
          notes: notes.trim() || null,
          lines: normalized,
        });
        router.push(`/pacientes/${patient.id}`);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao salvar orçamento");
      }
    });
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b pb-3">
        <div>
          <h1 className="text-base font-semibold text-foreground">
            {quote ? `Orçamento ${quote.number}` : "Novo orçamento"}
          </h1>
          <p className="font-mono text-xs text-muted-foreground">{patient.name}</p>
        </div>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Data</span>
          <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className={inputClass} />
        </label>
      </header>

      <section className="grid grid-cols-2 gap-x-6 gap-y-1 rounded-md border bg-card p-3 text-sm md:grid-cols-4">
        <Info label="Paciente" value={patient.name} />
        <Info label="Telefone" value={patient.phone} />
        <Info label="CPF" value={patient.cpf ?? "—"} />
        <Info label="Prontuário" value={patient.recordNumber ?? "—"} />
      </section>

      <section className="rounded-md border bg-card">
        <div className="grid grid-cols-[1fr_4rem_7rem_7rem_2rem] items-center gap-2 border-b px-3 py-2">
          <span className={labelClass}>Descrição</span>
          <span className={`${labelClass} text-right`}>Qtd.</span>
          <span className={`${labelClass} text-right`}>Valor unit.</span>
          <span className={`${labelClass} text-right`}>Total</span>
          <span />
        </div>
        {lines.map((line) => (
          <div key={line.key} className="grid grid-cols-[1fr_4rem_7rem_7rem_2rem] items-center gap-2 border-b px-3 py-2 last:border-b-0">
            <input
              value={line.description}
              onChange={(e) => updateLine(line.key, { description: e.target.value, catalogItemId: null })}
              placeholder="Descrição do item"
              className={inputClass}
            />
            <input
              type="number"
              min={1}
              value={line.quantity}
              onChange={(e) => updateLine(line.key, { quantity: Number(e.target.value) || 1 })}
              className={`${inputClass} text-right tabular-nums`}
            />
            <input
              defaultValue={(line.unitPriceCents / 100).toFixed(2)}
              onChange={(e) => updateLine(line.key, { unitPriceCents: parseCents(e.target.value) })}
              className={`${inputClass} text-right tabular-nums`}
            />
            <span className="text-right font-mono text-sm tabular-nums text-foreground">
              {formatBRL(lineTotalCents(line))}
            </span>
            <button
              type="button"
              onClick={() => removeLine(line.key)}
              aria-label="Remover linha"
              className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} />
            </button>
          </div>
        ))}

        <div className="relative flex items-center gap-2 p-2">
          <button
            type="button"
            onClick={() => setPicking((v) => !v)}
            className="inline-flex h-8 items-center gap-1 rounded-md bg-secondary px-2.5 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/70"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={13} strokeWidth={2} />
            Do catálogo
          </button>
          <button
            type="button"
            onClick={addFreeLine}
            className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={13} strokeWidth={2} />
            Linha livre
          </button>

          {picking && (
            <div className="absolute left-2 top-12 z-10 w-80 rounded-md border bg-popover p-1.5 shadow-md">
              <div className="mb-1 flex items-center gap-1.5 rounded-md border px-2">
                <HugeiconsIcon icon={Search01Icon} size={14} strokeWidth={1.75} className="text-muted-foreground" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar procedimento"
                  className="w-full bg-transparent py-1.5 text-sm outline-none"
                />
              </div>
              {filteredCatalog.length === 0 ? (
                <p className="px-2 py-2 font-mono text-xs text-muted-foreground">Nenhum item.</p>
              ) : (
                <ul className="max-h-56 overflow-y-auto">
                  {filteredCatalog.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => addCatalogLine(item)}
                        className="flex w-full items-center justify-between gap-3 rounded-sm px-1.5 py-2 text-left transition-colors hover:bg-secondary"
                      >
                        <span className="truncate text-sm text-foreground">{item.name}</span>
                        <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                          {formatBRL(item.priceCents)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-col items-end gap-1.5">
        <Total label="Subtotal" value={formatBRL(subtotal)} />
        <label className="flex items-center gap-2">
          <span className={labelClass}>Desconto</span>
          <input
            defaultValue={(discountCents / 100).toFixed(2)}
            onChange={(e) => setDiscountCents(parseCents(e.target.value))}
            className={`${inputClass} w-28 text-right tabular-nums`}
          />
        </label>
        <Total label="Total" value={formatBRL(total)} strong />
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Forma de pagamento</span>
          <input value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Validade (dias)</span>
          <input
            type="number"
            min={0}
            value={validityDays}
            onChange={(e) => setValidityDays(Number(e.target.value))}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 md:col-span-2">
          <span className={labelClass}>Observações</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputClass} />
        </label>
      </section>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 border-t pt-3">
        <button
          type="button"
          onClick={() => router.push(`/pacientes/${patient.id}`)}
          className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className={labelClass}>{label}</span>
      <span className="truncate text-sm text-foreground">{value}</span>
    </div>
  );
}

function Total({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex w-48 items-center justify-between">
      <span className={strong ? "text-sm font-semibold text-foreground" : labelClass}>{label}</span>
      <span className={`font-mono tabular-nums ${strong ? "text-base font-semibold text-foreground" : "text-sm text-muted-foreground"}`}>
        {value}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Verificar lint y build**

Run: `npm run lint`
Expected: sin errores en `quote-editor.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/patients/quotes/quote-editor.tsx
git commit -m "feat(orcamento): componente QuoteEditor multi-línea con catálogo y totales en vivo"
```

---

### Task 4: Rutas del editor (novo + [quoteId])

**Files:**
- Create: `app/(dashboard)/pacientes/[id]/orcamentos/novo/page.tsx`
- Create: `app/(dashboard)/pacientes/[id]/orcamentos/[quoteId]/page.tsx`

**Interfaces:**
- Consumes: `QuoteEditor` y `getPatientDetail`, `getQuote`, `listCatalogItems`, `requirePermission`.
- Produces: rutas navegables `/pacientes/[id]/orcamentos/novo` y `/pacientes/[id]/orcamentos/[quoteId]`.

- [ ] **Step 1: Página "novo"**

Create `app/(dashboard)/pacientes/[id]/orcamentos/novo/page.tsx`:

```tsx
import { requirePermission } from "@/lib/auth/guards";
import { getPatientDetail } from "@/lib/modules/patients/service";
import { listCatalogItems } from "@/lib/modules/catalog/service";
import { QuoteEditor } from "@/components/patients/quotes/quote-editor";

export default async function NewQuotePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("quotes", "create");
  const { id } = await params;
  const [patient, catalog] = await Promise.all([getPatientDetail(id), listCatalogItems(false)]);
  return (
    <QuoteEditor
      patient={{ id: patient.id, name: patient.name, phone: patient.phone, cpf: patient.cpf, recordNumber: patient.recordNumber }}
      catalog={catalog}
    />
  );
}
```

- [ ] **Step 2: Página de edición**

Create `app/(dashboard)/pacientes/[id]/orcamentos/[quoteId]/page.tsx`:

```tsx
import { requirePermission } from "@/lib/auth/guards";
import { getPatientDetail } from "@/lib/modules/patients/service";
import { listCatalogItems } from "@/lib/modules/catalog/service";
import { getQuote } from "@/lib/modules/quotes/service";
import { QuoteEditor } from "@/components/patients/quotes/quote-editor";

export default async function EditQuotePage({ params }: { params: Promise<{ id: string; quoteId: string }> }) {
  await requirePermission("quotes", "update");
  const { id, quoteId } = await params;
  const [patient, catalog, quote] = await Promise.all([
    getPatientDetail(id),
    listCatalogItems(false),
    getQuote(quoteId),
  ]);
  return (
    <QuoteEditor
      patient={{ id: patient.id, name: patient.name, phone: patient.phone, cpf: patient.cpf, recordNumber: patient.recordNumber }}
      catalog={catalog}
      quote={{
        id: quote.id,
        number: quote.number,
        issueDate: quote.issueDate,
        paymentMethod: quote.paymentMethod,
        validityDays: quote.validityDays,
        discountCents: quote.discountCents,
        notes: quote.notes,
        lines: quote.lines.map((l) => ({
          catalogItemId: l.catalogItemId,
          description: l.description,
          quantity: l.quantity,
          unitPriceCents: l.unitPriceCents,
        })),
      }}
    />
  );
}
```

- [ ] **Step 3: Verificar build + navegación manual**

Run: `npm run build`
Expected: compila; aparecen las rutas `/pacientes/[id]/orcamentos/novo` y `/pacientes/[id]/orcamentos/[quoteId]` en el output. Con `npm run dev`, navegar a `/pacientes/<un-id>/orcamentos/novo` y confirmar que el editor carga con los datos del paciente.

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/pacientes/[id]/orcamentos"
git commit -m "feat(orcamento): rutas de crear y editar orçamento en contexto del paciente"
```

---

### Task 5: Pestaña Orçamentos del paciente — lista con acciones + fix de tabs

**Files:**
- Modify: `components/patients/patient-detail.tsx`

**Interfaces:**
- Consumes: `deleteQuoteAction` de `@/app/(dashboard)/pacientes/[id]/actions`; `useRouter`, `useTransition`; iconos Hugeicons.
- Produces: pestaña Orçamentos con lista (PDF/Editar/Excluir), botón "Novo orçamento" y estado vacío con CTA; navegación de pestañas con `<button>` (sin recarga).

- [ ] **Step 1: Arreglar el bug de las pestañas (`<Link href="">` → `<button>`)**

En `components/patients/patient-detail.tsx`, reemplazar el bloque de navegación de pestañas (actualmente `TABS.map` con `<Link ... href="">`) por botones reales:

```tsx
      <div className="flex w-fit items-center gap-0.5 rounded-md bg-secondary p-0.5">
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
```

- [ ] **Step 2: Añadir imports y hooks de router/transition**

En el bloque de imports de `patient-detail.tsx`, añadir (junto a los `@hugeicons/core-free-icons` ya importados, agregar `Add01Icon`, `File01Icon`, `Delete02Icon`):

```tsx
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { WhatsappIcon, Calendar01Icon, PencilEdit01Icon, Add01Icon, File01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { deleteQuoteAction } from "@/app/(dashboard)/pacientes/[id]/actions";
```

> Nota: `useState` ya se importa de `react`; añadir `useTransition` al mismo import existente en vez de duplicar. El import de `@hugeicons/core-free-icons` ya existe — extenderlo, no duplicarlo.

Dentro de `PatientDetail`, junto a los `useState` existentes, añadir:

```tsx
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDeleteQuote(quoteId: string) {
    if (!confirm("Excluir orçamento?")) return;
    startTransition(async () => {
      await deleteQuoteAction(quoteId, patient.id);
      router.refresh();
    });
  }
```

- [ ] **Step 3: Reemplazar la pestaña Orçamentos read-only por la lista con acciones**

Reemplazar el bloque actual `{tab === "orcamentos" && ( <Section ...> ... </Section> )}` por:

```tsx
      {tab === "orcamentos" && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.push(`/pacientes/${patient.id}/orcamentos/novo`)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
              Novo orçamento
            </button>
          </div>
          <div className="rounded-md border bg-card">
            {patient.quotes.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-6 text-center">
                <p className="font-mono text-xs text-muted-foreground">Sem orçamentos.</p>
                <button
                  type="button"
                  onClick={() => router.push(`/pacientes/${patient.id}/orcamentos/novo`)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Criar o primeiro orçamento
                </button>
              </div>
            ) : (
              patient.quotes.map((q) => (
                <div key={q.id} className="flex items-center justify-between gap-3 border-b px-3 py-2.5 last:border-b-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">Orçamento {q.number}</p>
                    <p className="font-mono text-xs tabular-nums text-muted-foreground">{formatDate(q.issueDate)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">{formatBRL(quoteValueCents(q))}</span>
                    <a
                      href={`/api/pdf/orcamentos/${q.id}`}
                      aria-label="PDF"
                      className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <HugeiconsIcon icon={File01Icon} size={14} strokeWidth={1.75} />
                    </a>
                    <button
                      type="button"
                      onClick={() => router.push(`/pacientes/${patient.id}/orcamentos/${q.id}`)}
                      aria-label="Editar"
                      className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <HugeiconsIcon icon={PencilEdit01Icon} size={14} strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDeleteQuote(q.id)}
                      aria-label="Excluir"
                      className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive disabled:opacity-50"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
```

> Nota: `formatDate`, `formatBRL` y `quoteValueCents` ya están importados en el archivo y se usan en otras pestañas.

- [ ] **Step 4: Verificar lint, build y flujo manual**

Run: `npm run lint && npm run build`
Expected: compila sin errores.

Verificación manual (`npm run dev`):
1. Abrir un paciente → cambiar de pestaña NO recarga la página.
2. Pestaña Orçamentos vacía → muestra "Criar o primeiro orçamento".
3. "Novo orçamento" → editor → añadir 2 líneas (1 del catálogo, 1 libre) → ajustar qtd/precio/desconto → totales correctos → Salvar → vuelve a la ficha y el orçamento aparece con su total.
4. PDF abre el documento institucional. Editar carga el editor con los datos. Excluir lo borra tras confirmar.

- [ ] **Step 5: Commit**

```bash
git add components/patients/patient-detail.tsx
git commit -m "feat(orcamento): lista de orçamentos en la ficha (PDF/editar/excluir) + fix navegación de pestañas"
```

---

## Notas de verificación final

- `npm test` → todos los tests pasan (incluye los nuevos de `quote-editor`).
- `npm run build` → compila.
- Flujo end-to-end verificado en navegador (crear/editar/borrar/PDF) según los pasos de la Task 5.
- Las páginas top-level (`/orcamentos`, etc.) y el sidebar NO se tocan en esta entrega (siguiente conversación).
