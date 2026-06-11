import type { QuoteLineInput } from "../modules/quotes/service";

export type ToothStatus = "planned" | "done";

export interface ToothActivityInput {
  toothFdi: string;
  status: ToothStatus;
}

export interface ToothActivity {
  done: string[];
  planned: string[];
}

/** Estado de actividad por pieza para colorear el odontograma: realizado gana a planejado. */
export function deriveToothActivity(treatments: ToothActivityInput[]): ToothActivity {
  const byTooth = new Map<string, Set<ToothStatus>>();
  for (const t of treatments) {
    const set = byTooth.get(t.toothFdi) ?? new Set<ToothStatus>();
    set.add(t.status);
    byTooth.set(t.toothFdi, set);
  }
  const done: string[] = [];
  const planned: string[] = [];
  for (const [fdi, statuses] of byTooth) {
    if (statuses.has("done")) done.push(fdi);
    else if (statuses.has("planned")) planned.push(fdi);
  }
  return { done, planned };
}

export interface PlannedTreatment {
  toothFdi: string;
  catalogItemId: string | null;
  description: string;
  priceCents: number;
}

/** Convierte los tratamentos planejados en líneas de orçamento ("Dente NN — descrição"). */
export function buildQuoteLines(treatments: PlannedTreatment[]): QuoteLineInput[] {
  return treatments.map((t) => ({
    catalogItemId: t.catalogItemId,
    description: `Dente ${t.toothFdi} — ${t.description}`,
    quantity: 1,
    unitPriceCents: t.priceCents,
  }));
}
