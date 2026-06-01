import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { ClinicProfile, MedicalCertificate, Patient } from "@/app/generated/prisma/client";
import { formatDate } from "./utils";
import { PdfHeader, SignatureBox } from "./shared";
import { pdfStyles } from "./styles";

export function CertificateDocument({
  clinic,
  certificate,
}: {
  clinic: ClinicProfile;
  certificate: MedicalCertificate & { patient: Patient };
}) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader clinic={clinic} title="ATESTADO ODONTOLÓGICO" />
        <View style={{ marginTop: 40 }}>
          <Text style={[pdfStyles.text, { fontSize: 18, lineHeight: 1.8 }]}>
            Atesto, para fins trabalhistas, que o Sr(a). {certificate.patient.name} deverá
            afastar-se de suas atividades laborais durante o período de {formatDate(certificate.absenceStartDate)}
            {" "}a {formatDate(certificate.absenceEndDate)}.
          </Text>
          <Text style={[pdfStyles.text, { fontSize: 18, lineHeight: 1.8, marginTop: 24 }]}>
            O mesmo encontra-se sob meus cuidados odontológicos.
          </Text>
          <Text style={[pdfStyles.text, { fontSize: 16, marginTop: 24 }]}>CID: {certificate.cid}</Text>
          {certificate.notes && <Text style={[pdfStyles.text, { marginTop: 12 }]}>{certificate.notes}</Text>}
          <Text style={[pdfStyles.text, { fontSize: 16, marginTop: 36 }]}>
            {certificate.city}, {formatDate(certificate.issueDate)}.
          </Text>
        </View>
        <SignatureBox clinic={clinic} />
      </Page>
    </Document>
  );
}
