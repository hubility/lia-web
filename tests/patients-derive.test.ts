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
