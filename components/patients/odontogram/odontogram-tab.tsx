"use client";

import { useMemo, useState, useTransition } from "react";
import type { CatalogItem, ToothTreatment } from "@prisma/client";
import type { ToothConditionGroup, ToothDetail } from "react-odontogram";
import { HugeiconsIcon } from "@hugeicons/react";
import { Invoice01Icon } from "@hugeicons/core-free-icons";
import { OdontogramChart } from "@/components/patients/odontogram/odontogram-chart";
import { ToothPanel } from "@/components/patients/odontogram/tooth-panel";
import { toothTypePt } from "@/lib/patients/tooth";
import { deriveToothActivity } from "@/lib/patients/odontogram";
import { formatDate } from "@/lib/dates";
import {
  addToothTreatmentAction,
  markToothTreatmentDoneAction,
  removeToothTreatmentAction,
  generateQuoteFromPlannedAction,
} from "@/app/(dashboard)/pacientes/[id]/actions";

interface Props {
  patientId: string;
  treatments: ToothTreatment[];
  catalog: CatalogItem[];
}

export function OdontogramTab({ patientId, treatments, catalog }: Props) {
  const [selected, setSelected] = useState<ToothDetail | null>(null);
  const [pending, startTransition] = useTransition();

  const conditions = useMemo<ToothConditionGroup[]>(() => {
    const { done, planned } = deriveToothActivity(treatments);
    return [
      {
        label: "Realizado",
        teeth: done.map((f) => `teeth-${f}`),
        outlineColor: "var(--success)",
        fillColor: "color-mix(in srgb, var(--success) 16%, transparent)",
      },
      {
        label: "Planejado",
        teeth: planned.map((f) => `teeth-${f}`),
        outlineColor: "var(--info)",
        fillColor: "color-mix(in srgb, var(--info) 16%, transparent)",
      },
    ];
  }, [treatments]);

  const fdi = selected?.notations.fdi ?? null;
  const toothTreatments = fdi
    ? treatments
        .filter((t) => t.toothFdi === fdi)
        .map((t) => ({
          id: t.id,
          description: t.description,
          status: t.status,
          date: t.status === "done" && t.completedAt ? formatDate(t.completedAt) : "—",
        }))
    : [];
  const plannedPending = treatments.filter((t) => t.status === "planned" && t.quoteId === null).length;

  return (
    <div className="grid w-full max-w-5xl gap-x-8 gap-y-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="flex flex-col">
        <OdontogramChart conditions={conditions} onSelect={setSelected} />
        <Legend />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Plano de tratamento
          </h2>
          <button
            type="button"
            disabled={plannedPending === 0 || pending}
            onClick={() => startTransition(() => generateQuoteFromPlannedAction(patientId))}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <HugeiconsIcon icon={Invoice01Icon} size={14} strokeWidth={2} />
            Gerar orçamento
            {plannedPending > 0 && <span className="font-mono tabular-nums opacity-80">· {plannedPending}</span>}
          </button>
        </div>

        <ToothPanel
          fdi={fdi}
          toothType={selected ? toothTypePt(selected.type) : null}
          treatments={toothTreatments}
          catalog={catalog}
          pending={pending}
          onAdd={(catalogItemId) => {
            if (fdi) startTransition(() => addToothTreatmentAction({ patientId, toothFdi: fdi, catalogItemId }));
          }}
          onMarkDone={(id) => startTransition(() => markToothTreatmentDoneAction(id, patientId))}
          onRemove={(id) => startTransition(() => removeToothTreatmentAction(id, patientId))}
        />
      </div>
    </div>
  );
}

const LEGEND = [
  { label: "Realizado", color: "var(--success)" },
  { label: "Planejado", color: "var(--info)" },
  { label: "Selecionado", color: "var(--primary)" },
];

function Legend() {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
      {LEGEND.map((l) => (
        <span key={l.label} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} aria-hidden />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {l.label}
          </span>
        </span>
      ))}
    </div>
  );
}
