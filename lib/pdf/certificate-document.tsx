import type { ClinicProfile, MedicalCertificate, Patient } from "@prisma/client";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import "@/lib/pdf/fonts";
import { brand } from "./brand";
import { formatDate } from "./utils";
import { PdfHeader } from "./header";
import { PatientBox } from "./patient-box";
import { SignatureBox } from "./signature-box";
import { PdfFooter } from "./footer";
import { IconFolder, IconIdCard, IconUser } from "./icons";

export function CertificateDocument({
  clinic,
  certificate,
}: {
  clinic: ClinicProfile;
  certificate: MedicalCertificate & { patient: Patient };
}) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PdfHeader
          title="ATESTADO ODONTOLÓGICO"
          lines={[{ label: "Data:", value: formatDate(certificate.issueDate) }]}
        />

        <PatientBox
          fields={[
            { icon: <IconUser />, label: "Paciente:", value: certificate.patient.name },
            { icon: <IconIdCard />, label: "CPF:", value: certificate.patient.cpf ?? "—" },
            { icon: <IconFolder />, label: "Prontuário:", value: certificate.patient.recordNumber ?? "—" },
          ]}
        />

        <View style={s.body}>
          <Text style={s.paragraph}>
            Atesto, para os devidos fins, que o(a) Sr(a). {certificate.patient.name} esteve sob meus
            cuidados odontológicos e deverá afastar-se de suas atividades laborais no período de{" "}
            {formatDate(certificate.absenceStartDate)} a {formatDate(certificate.absenceEndDate)}.
          </Text>
          <Text style={s.cid}>CID: {certificate.cid}</Text>
          {certificate.notes ? <Text style={s.notes}>{certificate.notes}</Text> : null}
          <Text style={s.place}>
            {certificate.city}, {formatDate(certificate.issueDate)}.
          </Text>
        </View>

        <View style={s.signWrap}>
          <SignatureBox clinic={clinic} />
        </View>

        <PdfFooter clinic={clinic} />
      </Page>
    </Document>
  );
}

const s = StyleSheet.create({
  page: {
    paddingHorizontal: brand.page.paddingX,
    paddingTop: brand.page.paddingTop,
    paddingBottom: brand.page.paddingBottom,
    fontFamily: brand.font,
    color: brand.ink,
    fontSize: 11,
  },
  body: { marginTop: 28 },
  paragraph: { fontFamily: brand.font, fontSize: 12, lineHeight: 1.7, textAlign: "justify" },
  cid: { fontFamily: brand.font, fontWeight: 600, fontSize: 12, color: brand.red, marginTop: 22 },
  notes: { fontFamily: brand.font, fontSize: 11, color: brand.ink, marginTop: 12, lineHeight: 1.5 },
  place: { fontFamily: brand.font, fontSize: 12, marginTop: 28 },
  signWrap: { marginTop: 36 },
});
