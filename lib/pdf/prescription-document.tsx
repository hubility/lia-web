import type { ClinicProfile, Patient, Prescription, PrescriptionItem } from "@prisma/client";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import "@/lib/pdf/fonts";
import { brand } from "./brand";
import { calcAge, formatDate } from "./utils";
import { PdfHeader } from "./header";
import { PatientBox } from "./patient-box";
import { SignatureBox } from "./signature-box";
import { PdfFooter } from "./footer";
import { IconCalendar, IconFolder, IconUser } from "./icons";

export function PrescriptionDocument({
  clinic,
  prescription,
}: {
  clinic: ClinicProfile;
  prescription: Prescription & { patient: Patient; items: PrescriptionItem[] };
}) {
  const age = calcAge(prescription.patient.birthDate);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PdfHeader
          title="RECEITA ODONTOLÓGICA"
          lines={[{ label: "Data:", value: formatDate(prescription.issueDate) }]}
        />

        <PatientBox
          fields={[
            { icon: <IconUser />, label: "Paciente:", value: prescription.patient.name },
            { icon: <IconCalendar />, label: "Idade:", value: age !== null ? `${age} anos` : "—" },
            { icon: <IconFolder />, label: "Prontuário:", value: prescription.patient.recordNumber ?? "—" },
          ]}
        />

        <View style={s.rxRow}>
          {/* Times-Roman (WinAnsi) no trae el glifo U+211E: se compone R + x. */}
          <View style={s.rxMark}>
            <Text style={s.rxR}>R</Text>
            <Text style={s.rxX}>x</Text>
          </View>
          <Text style={s.rxTitle}>Prescrevo:</Text>
        </View>

        {prescription.items.map((item, i) => (
          <View key={item.id} style={s.item} wrap={false}>
            <View style={s.numCircle}>
              <Text style={s.num}>{i + 1}</Text>
            </View>
            <View style={s.itemBody}>
              <Text style={s.medicine}>{item.medicine}</Text>
              <Text style={s.instructions}>{item.instructions}</Text>
            </View>
          </View>
        ))}

        <View style={s.bottom}>
          <View style={s.obs}>
            <View style={s.obsSep} />
            <Text style={s.obsLabel}>Observações:</Text>
            <Text style={s.obsText}>{prescription.notes ?? "—"}</Text>
          </View>
          <SignatureBox clinic={clinic} />
        </View>

        <PdfFooter clinic={clinic} tagline="CUIDAR DO SEU SORRISO É A NOSSA MISSÃO" />
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
    fontSize: 10.5,
  },
  rxRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  rxMark: { flexDirection: "row", alignItems: "flex-end" },
  rxR: { fontFamily: "Times-Roman", fontSize: 26, color: brand.red },
  rxX: { fontFamily: "Times-Roman", fontSize: 14, color: brand.red, marginLeft: -5, marginBottom: -3 },
  rxTitle: { fontFamily: brand.font, fontWeight: 700, fontSize: 14, color: brand.red },
  item: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 16 },
  numCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: brand.red, alignItems: "center", justifyContent: "center", marginTop: 1 },
  num: { fontFamily: brand.font, fontSize: 9, color: brand.red },
  itemBody: { flex: 1 },
  medicine: { fontFamily: brand.font, fontWeight: 700, fontSize: 11.5, color: brand.ink },
  instructions: { fontFamily: brand.font, fontSize: 10.5, color: brand.ink, marginTop: 2, lineHeight: 1.4 },
  bottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 20 },
  obs: { width: 260 },
  obsSep: { borderTopWidth: 1, borderTopColor: brand.red, marginBottom: 8 },
  obsLabel: { fontFamily: brand.font, fontWeight: 500, fontSize: 10, color: brand.red, marginBottom: 4 },
  obsText: { fontFamily: brand.font, fontSize: 10, color: brand.ink, lineHeight: 1.4 },
});
