import { describe, it, expect } from "vitest";
import { deriveToothActivity, buildQuoteLines } from "../lib/patients/odontogram";

describe("deriveToothActivity", () => {
  it("realizado gana a planejado en la misma pieza", () => {
    const r = deriveToothActivity([
      { toothFdi: "21", status: "done" },
      { toothFdi: "21", status: "planned" },
      { toothFdi: "11", status: "planned" },
    ]);
    expect(r.done).toEqual(["21"]);
    expect(r.planned).toEqual(["11"]);
  });

  it("sin tratamientos → listas vacías", () => {
    expect(deriveToothActivity([])).toEqual({ done: [], planned: [] });
  });
});

describe("buildQuoteLines", () => {
  it("formatea la descripción con el diente y mapea el precio snapshot", () => {
    const lines = buildQuoteLines([
      { toothFdi: "46", catalogItemId: "c1", description: "Implante", priceCents: 150000 },
      { toothFdi: "11", catalogItemId: null, description: "Coroa", priceCents: 80000 },
    ]);
    expect(lines).toEqual([
      { catalogItemId: "c1", description: "Dente 46 — Implante", quantity: 1, unitPriceCents: 150000 },
      { catalogItemId: null, description: "Dente 11 — Coroa", quantity: 1, unitPriceCents: 80000 },
    ]);
  });
});
