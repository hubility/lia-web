import { describe, expect, it } from "vitest";
import { createElement as h } from "react";
import { Document, Page } from "@react-pdf/renderer";
import "@/lib/pdf/fonts";
import { renderPdfToBuffer } from "@/lib/pdf/render";
import { PdfHeader } from "@/lib/pdf/header";
import { PatientBox } from "@/lib/pdf/patient-box";
import { SignatureBox } from "@/lib/pdf/signature-box";
import { PdfFooter } from "@/lib/pdf/footer";
import { IconUser } from "@/lib/pdf/icons";

const clinic = {
  id: "default", name: "Dr. Darcy Mavignier", subtitle: "odontologia integrada",
  specialty: "Cirurgião-Dentista", cro: "CRO-CE 4157", phone: "(85) 99999-9999",
  address: "Rua das Flores, 123 - Centro", cityLine: "Fortaleza - CE - CEP 60000-000",
  website: "www.darcymavignier.com.br", createdAt: new Date(), updatedAt: new Date(),
} as any;

describe("pdf chrome", () => {
  it("renderiza header + patient box + signature + footer", async () => {
    const doc = h(
      Document, null,
      h(Page, { size: "A4", style: { paddingBottom: 96 } },
        h(PdfHeader, { title: "ORÇAMENTO ODONTOLÓGICO", lines: [{ label: "Data:", value: "01/07/2026" }] }),
        h(PatientBox, { fields: [{ icon: h(IconUser, {}), label: "Paciente:", value: "Maria" }] }),
        h(SignatureBox, { clinic }),
        h(PdfFooter, { clinic, tagline: "PLANEJAMENTO CLARO PARA O SEU TRATAMENTO" }),
      ),
    );
    const buf = await renderPdfToBuffer(doc);
    expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });
});
