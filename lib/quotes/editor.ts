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
