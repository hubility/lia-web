"use client";

import { useMemo, useState, useTransition } from "react";
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
  onCancel,
  onSaved,
}: {
  patient: QuoteEditorPatient;
  catalog: CatalogItem[];
  quote?: QuoteEditorQuote;
  onCancel: () => void;
  onSaved: () => void;
}) {
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
        onSaved();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao salvar orçamento");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
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
          onClick={onCancel}
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
