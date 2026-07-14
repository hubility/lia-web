import { describe, expect, it } from "vitest";
import { createElement as h } from "react";
import type { Patient, Quote, QuoteLine } from "@prisma/client";
import { renderPdfToBuffer } from "@/lib/pdf/render";
import { QuoteDocument, computeQuoteTotals } from "@/lib/pdf/quote-document";
import { clinic, makePatient } from "./fixtures";

function quoteWith(nLines: number): Quote & { patient: Patient; lines: QuoteLine[] } {
  return {
    id: "q1",
    patientId: "p1",
    number: "000123",
    issueDate: new Date("2026-07-01"),
    paymentMethod: "Cartão",
    validityDays: 30,
    discountCents: 5000,
    notes: "Sem observações",
    createdAt: new Date("2026-07-01"),
    updatedAt: new Date("2026-07-01"),
    patient: makePatient(),
    lines: Array.from({ length: nLines }, (_, i) => ({
      id: `l${i}`,
      quoteId: "q1",
      catalogItemId: null,
      description: `Procedimento ${i + 1}`,
      quantity: 1,
      unitPriceCents: 10000,
      totalPriceCents: 10000,
    })),
  };
}

describe("QuoteDocument", () => {
  it("computeQuoteTotals resta el descuento", () => {
    expect(computeQuoteTotals([{ totalPriceCents: 10000 }, { totalPriceCents: 5000 }], 3000))
      .toEqual({ subtotal: 15000, total: 12000 });
  });

  it("renderiza con 1 línea", async () => {
    const buf = await renderPdfToBuffer(h(QuoteDocument, { clinic, quote: quoteWith(1) }));
    expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("renderiza y pagina con 15 líneas", async () => {
    const buf = await renderPdfToBuffer(h(QuoteDocument, { clinic, quote: quoteWith(15) }));
    expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(buf.length).toBeGreaterThan(1000);
  });
});
