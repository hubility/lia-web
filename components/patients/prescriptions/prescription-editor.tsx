"use client";

import { useState, useTransition } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { savePrescriptionAction } from "@/app/(dashboard)/pacientes/[id]/actions";

export type PrescriptionEditorPatient = {
  id: string;
  name: string;
  phone: string;
  cpf: string | null;
  recordNumber: string | null;
};

export type PrescriptionEditorPrescription = {
  id: string;
  issueDate: Date;
  notes: string | null;
  items: { medicine: string; instructions: string }[];
};

type EditorItem = { key: string; medicine: string; instructions: string };

let keySeq = 0;
const nextKey = () => `i${keySeq++}`;

const inputClass = "w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm";
const labelClass = "font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";

function toEditorItems(prescription?: PrescriptionEditorPrescription): EditorItem[] {
  if (!prescription || prescription.items.length === 0) {
    return [{ key: nextKey(), medicine: "", instructions: "" }];
  }
  return prescription.items.map((i) => ({ key: nextKey(), ...i }));
}

export function PrescriptionEditor({
  patient,
  prescription,
  onCancel,
  onSaved,
}: {
  patient: PrescriptionEditorPatient;
  prescription?: PrescriptionEditorPrescription;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [issueDate, setIssueDate] = useState(
    (prescription?.issueDate ?? new Date()).toISOString().slice(0, 10)
  );
  const [items, setItems] = useState<EditorItem[]>(() => toEditorItems(prescription));
  const [notes, setNotes] = useState(prescription?.notes ?? "");

  function updateItem(key: string, patch: Partial<EditorItem>) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }
  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }
  function addItem() {
    setItems((prev) => [...prev, { key: nextKey(), medicine: "", instructions: "" }]);
  }

  function handleSave() {
    const normalized = items
      .map((i) => ({ medicine: i.medicine.trim(), instructions: i.instructions.trim() }))
      .filter((i) => i.medicine.length > 0)
      .map((i, position) => ({ ...i, position }));
    if (normalized.length === 0) {
      setError("Adicione ao menos um medicamento.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await savePrescriptionAction({
          prescriptionId: prescription?.id,
          patientId: patient.id,
          issueDate,
          notes: notes.trim() || null,
          items: normalized,
        });
        onSaved();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao salvar receita");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b pb-3">
        <div>
          <h1 className="text-base font-semibold text-foreground">
            {prescription ? "Editar receita" : "Nova receita"}
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
        <div className="grid grid-cols-[1fr_1.5fr_2rem] items-center gap-2 border-b px-3 py-2">
          <span className={labelClass}>Medicamento</span>
          <span className={labelClass}>Instruções</span>
          <span />
        </div>
        {items.map((item) => (
          <div key={item.key} className="grid grid-cols-[1fr_1.5fr_2rem] items-center gap-2 border-b px-3 py-2 last:border-b-0">
            <input
              value={item.medicine}
              onChange={(e) => updateItem(item.key, { medicine: e.target.value })}
              placeholder="Nome do medicamento"
              className={inputClass}
            />
            <input
              value={item.instructions}
              onChange={(e) => updateItem(item.key, { instructions: e.target.value })}
              placeholder="Posologia / instruções de uso"
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => removeItem(item.key)}
              aria-label="Remover item"
              className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} />
            </button>
          </div>
        ))}

        <div className="flex items-center gap-2 p-2">
          <button
            type="button"
            onClick={addItem}
            className="inline-flex h-8 items-center gap-1 rounded-md bg-secondary px-2.5 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/70"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={13} strokeWidth={2} />
            Adicionar medicamento
          </button>
        </div>
      </section>

      <section className="grid gap-3">
        <label className="flex flex-col gap-1">
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
