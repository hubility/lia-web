"use client";

import { useState } from "react";
import type { CatalogItem } from "@prisma/client";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, DentalToothIcon, Tick02Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/money";

export interface PanelTreatment {
  id: string;
  description: string;
  status: "planned" | "done";
  date: string;
}

interface Props {
  fdi: string | null;
  toothType: string | null;
  treatments: PanelTreatment[];
  catalog: CatalogItem[];
  pending: boolean;
  onAdd: (catalogItemId: string) => void;
  onMarkDone: (id: string) => void;
  onRemove: (id: string) => void;
}

const STATUS: Record<PanelTreatment["status"], { label: string; className: string }> = {
  done: { label: "Realizado", className: "bg-success/10 text-success" },
  planned: { label: "Planejado", className: "bg-info/10 text-info" },
};

export function ToothPanel({
  fdi,
  toothType,
  treatments,
  catalog,
  pending,
  onAdd,
  onMarkDone,
  onRemove,
}: Props) {
  const [picking, setPicking] = useState(false);

  if (!fdi) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <HugeiconsIcon icon={DentalToothIcon} size={20} strokeWidth={1.75} className="text-muted-foreground" />
        <p className="font-mono text-xs text-muted-foreground">Selecione um dente no odontograma</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b pb-2.5">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Dente
          </span>
          <span className="font-mono text-sm font-semibold tabular-nums text-foreground">{fdi}</span>
          {toothType && <span className="text-xs text-muted-foreground">· {toothType}</span>}
        </div>
        <button
          type="button"
          onClick={() => setPicking((v) => !v)}
          className="inline-flex h-7 items-center gap-1 rounded-md bg-secondary px-2.5 text-[11px] font-semibold text-secondary-foreground transition-colors hover:bg-secondary/70"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={13} strokeWidth={2} />
          Tratamento
        </button>
      </div>

      {picking && (
        <div className="border-b py-1.5">
          {catalog.length === 0 ? (
            <p className="py-2 font-mono text-xs text-muted-foreground">Catálogo vazio.</p>
          ) : (
            <ul className="max-h-56 overflow-y-auto">
              {catalog.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      onAdd(item.id);
                      setPicking(false);
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-sm px-1.5 py-2 text-left transition-colors hover:bg-secondary disabled:opacity-50"
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

      {treatments.length === 0 ? (
        <p className="py-4 font-mono text-xs text-muted-foreground">Sem tratamentos neste dente.</p>
      ) : (
        <ul>
          {treatments.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-3 border-b py-2.5 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{t.description}</p>
                <p className="font-mono text-xs tabular-nums text-muted-foreground">{t.date}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span
                  className={cn(
                    "rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider",
                    STATUS[t.status].className
                  )}
                >
                  {STATUS[t.status].label}
                </span>
                {t.status === "planned" && (
                  <>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => onMarkDone(t.id)}
                      aria-label="Concluir tratamento"
                      className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-success disabled:opacity-50"
                    >
                      <HugeiconsIcon icon={Tick02Icon} size={14} strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => onRemove(t.id)}
                      aria-label="Remover tratamento"
                      className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive disabled:opacity-50"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} />
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
