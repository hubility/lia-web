import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { ClinicProfile, Patient, Prescription, PrescriptionItem } from "@/app/generated/prisma/client";
import { formatDate } from "./utils";
import { PdfFooter, PdfHeader, SignatureBox } from "./shared";
import { pdfStyles } from "./styles";

export function PrescriptionDocument({
  clinic,
  prescription,
}: {
  clinic: ClinicProfile;
  prescription: Prescription & { patient: Patient; items: PrescriptionItem[] };
}) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader clinic={clinic} title="RECEITA ODONTOLÓGICA" />
        <View style={pdfStyles.box}>
          <Text style={pdfStyles.text}>Data: {formatDate(prescription.issueDate)}</Text>
          <Text style={pdfStyles.text}>Paciente: {prescription.patient.name}</Text>
          <Text style={pdfStyles.text}>Prontuário: {prescription.patient.recordNumber ?? "-"}</Text>
        </View>
        <Text style={[pdfStyles.title, { fontSize: 16, marginBottom: 12 }]}>℞ Prescrevo:</Text>
        {prescription.items.map((item, index) => (
          <View key={item.id} style={{ marginBottom: 14 }}>
            <Text style={[pdfStyles.text, { fontWeight: 700 }]}>{index + 1}. {item.medicine}</Text>
            <Text style={pdfStyles.text}>{item.instructions}</Text>
          </View>
        ))}
        <Text style={pdfStyles.text}>Observações: {prescription.notes ?? "-"}</Text>
        <SignatureBox clinic={clinic} />
        <PdfFooter clinic={clinic} mission="CUIDAR DO SEU SORRISO É A NOSSA MISSÃO" />
      </Page>
    </Document>
  );
}
