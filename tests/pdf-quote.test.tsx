import { describe, expect, it } from "vitest";
import { createElement as h } from "react";
import { renderPdfToBuffer } from "@/lib/pdf/render";
import { QuoteDocument, computeQuoteTotals } from "@/lib/pdf/quote-document";

const clinic = {
  id: "default", name: "Dr. Darcy Mavignier", subtitle: "odontologia integrada",
  specialty: "Cirurgião-Dentista", cro: "CRO-CE 4157", phone: "(85) 99999-9999",
  address: "Rua das Flores, 123", cityLine: "Fortaleza - CE", website: "www.darcymavignier.com.br",
  createdAt: new Date(), updatedAt: new Date(),
} as any;

function quoteWith(nLines: number) {
  return {
    id: "q1", patientId: "p1", number: "000123", issueDate: new Date("2026-07-01"),
    paymentMethod: "Cartão", validityDays: 30, discountCents: 5000, notes: "Sem observações",
    createdAt: new Date(), updatedAt: new Date(),
    patient: { name: "Maria Silva", phone: "(85) 98888-7777", cpf: "123.456.789-00", recordNumber: "A-12" },
    lines: Array.from({ length: nLines }, (_, i) => ({
      id: `l${i}`, quoteId: "q1", catalogItemId: null,
      description: `Procedimento ${i + 1}`, quantity: 1, unitPriceCents: 10000, totalPriceCents: 10000,
    })),
  } as any;
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
