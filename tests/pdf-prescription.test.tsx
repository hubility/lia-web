import { describe, expect, it } from "vitest";
import { createElement as h } from "react";
import { renderPdfToBuffer } from "@/lib/pdf/render";
import { PrescriptionDocument } from "@/lib/pdf/prescription-document";

const clinic = {
  id: "default", name: "Dr. Darcy Mavignier", subtitle: "odontologia integrada",
  specialty: "Cirurgião-Dentista", cro: "CRO-CE 4157", phone: "(85) 99999-9999",
  address: "Rua das Flores, 123", cityLine: "Fortaleza - CE", website: "www.darcymavignier.com.br",
  createdAt: new Date(), updatedAt: new Date(),
} as any;

const prescription = {
  id: "r1", patientId: "p1", issueDate: new Date("2026-07-01"), notes: "Retorno em 7 dias",
  createdAt: new Date(), updatedAt: new Date(),
  patient: { name: "João Souza", birthDate: new Date("1990-01-10"), recordNumber: "B-9" },
  items: [
    { id: "i1", prescriptionId: "r1", medicine: "Amoxicilina 500mg", instructions: "Tomar 1 cápsula de 8/8h, por 7 dias.", position: 0 },
    { id: "i2", prescriptionId: "r1", medicine: "Nimesulida 100mg", instructions: "Tomar 1 comprimido de 12/12h, por 3 dias.", position: 1 },
  ],
} as any;

describe("PrescriptionDocument", () => {
  it("renderiza una receita con varios ítems", async () => {
    const buf = await renderPdfToBuffer(h(PrescriptionDocument, { clinic, prescription }));
    expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("renderiza sin fecha de nacimiento (Idade —)", async () => {
    const p = { ...prescription, patient: { ...prescription.patient, birthDate: null } };
    const buf = await renderPdfToBuffer(h(PrescriptionDocument, { clinic, prescription: p }));
    expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });
});
