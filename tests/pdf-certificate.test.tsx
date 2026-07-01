import { describe, expect, it } from "vitest";
import { createElement as h } from "react";
import { renderPdfToBuffer } from "@/lib/pdf/render";
import { CertificateDocument } from "@/lib/pdf/certificate-document";

const clinic = {
  id: "default", name: "Dr. Darcy Mavignier", subtitle: "odontologia integrada",
  specialty: "Cirurgião-Dentista", cro: "CRO-CE 4157", phone: "(85) 99999-9999",
  address: "Rua das Flores, 123", cityLine: "Fortaleza - CE", website: "www.darcymavignier.com.br",
  createdAt: new Date(), updatedAt: new Date(),
} as any;

const certificate = {
  id: "c1", patientId: "p1", issueDate: new Date("2026-07-01"),
  absenceStartDate: new Date("2026-07-01"), absenceEndDate: new Date("2026-07-03"),
  cid: "K04.7", city: "Fortaleza", notes: null, createdAt: new Date(), updatedAt: new Date(),
  patient: { name: "Ana Lima", cpf: "111.222.333-44", recordNumber: "C-3" },
} as any;

describe("CertificateDocument", () => {
  it("renderiza un atestado", async () => {
    const buf = await renderPdfToBuffer(h(CertificateDocument, { clinic, certificate }));
    expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });
});
