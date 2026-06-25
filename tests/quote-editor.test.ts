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
