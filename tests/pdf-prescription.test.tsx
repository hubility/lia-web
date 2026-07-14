import { describe, expect, it } from "vitest";
import { createElement as h } from "react";
import type { Patient, Prescription, PrescriptionItem } from "@prisma/client";
import { renderPdfToBuffer } from "@/lib/pdf/render";
import { PrescriptionDocument } from "@/lib/pdf/prescription-document";
import { clinic, makePatient } from "./fixtures";

function makePrescription(
  patient: Patient = makePatient({ name: "João Souza", recordNumber: "B-9" })
): Prescription & { patient: Patient; items: PrescriptionItem[] } {
  return {
    id: "r1",
    patientId: "p1",
    issueDate: new Date("2026-07-01"),
    notes: "Retorno em 7 dias",
    createdAt: new Date("2026-07-01"),
    updatedAt: new Date("2026-07-01"),
    patient,
    items: [
      {
        id: "i1",
        prescriptionId: "r1",
        medicationId: "m1",
        medicine: "Amoxicilina 500mg",
        instructions: "Tomar 1 cápsula de 8/8h, por 7 dias.",
        position: 0,
      },
      {
        id: "i2",
        prescriptionId: "r1",
        medicationId: null,
        medicine: "Nimesulida 100mg",
        instructions: "Tomar 1 comprimido de 12/12h, por 3 dias.",
        position: 1,
      },
    ],
  };
}

describe("PrescriptionDocument", () => {
  it("renderiza una receita con varios ítems", async () => {
    const buf = await renderPdfToBuffer(
      h(PrescriptionDocument, { clinic, prescription: makePrescription() })
    );
    expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("renderiza sin fecha de nacimiento (Idade —)", async () => {
    const prescription = makePrescription(makePatient({ name: "João Souza", birthDate: null }));
    const buf = await renderPdfToBuffer(h(PrescriptionDocument, { clinic, prescription }));
    expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });
});
