import { describe, expect, it } from "vitest";
import { createElement as h } from "react";
import type { MedicalCertificate, Patient } from "@prisma/client";
import { renderPdfToBuffer } from "@/lib/pdf/render";
import { CertificateDocument } from "@/lib/pdf/certificate-document";
import { clinic, makePatient } from "./fixtures";

function makeCertificate(
  overrides: Partial<MedicalCertificate> = {}
): MedicalCertificate & { patient: Patient } {
  return {
    id: "c1",
    patientId: "p1",
    issueDate: new Date("2026-07-01"),
    absenceStartDate: new Date("2026-07-01"),
    absenceEndDate: new Date("2026-07-03"),
    cidCodeId: "cid1",
    cid: "K04.0",
    cidDescription: "Pulpite",
    city: "Fortaleza",
    notes: null,
    createdAt: new Date("2026-07-01"),
    updatedAt: new Date("2026-07-01"),
    ...overrides,
    patient: makePatient({ name: "Ana Lima", cpf: "111.222.333-44", recordNumber: "C-3" }),
  };
}

describe("CertificateDocument", () => {
  it("renderiza um atestado com código e descrição do CID", async () => {
    const buf = await renderPdfToBuffer(
      h(CertificateDocument, { clinic, certificate: makeCertificate() })
    );
    expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  // Los atestados emitidos antes del catálogo no tienen descripción: deben seguir saliendo.
  it("renderiza um atestado antigo, sem descrição do CID", async () => {
    const certificate = makeCertificate({ cidCodeId: null, cid: "J06", cidDescription: null });
    const buf = await renderPdfToBuffer(h(CertificateDocument, { clinic, certificate }));
    expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });
});
