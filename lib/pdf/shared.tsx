import { Text, View } from "@react-pdf/renderer";
import type { ClinicProfile } from "@prisma/client";
import { pdfStyles } from "./styles";

export function PdfHeader({ clinic, title }: { clinic: ClinicProfile; title: string }) {
  return (
    <View style={pdfStyles.header}>
      <View>
        <Text style={pdfStyles.brand}>{clinic.name}</Text>
        <Text style={pdfStyles.subtitle}>{clinic.subtitle}</Text>
      </View>
      <Text style={pdfStyles.title}>{title}</Text>
    </View>
  );
}

export function PdfFooter({ clinic, mission }: { clinic: ClinicProfile; mission: string }) {
  return (
    <Text style={pdfStyles.footer}>
      {clinic.phone} · {clinic.address} · {clinic.cityLine} · {clinic.website}
      {"\n"}
      {mission}
    </Text>
  );
}

export function SignatureBox({ clinic }: { clinic: ClinicProfile }) {
  return (
    <View style={[pdfStyles.box, { marginTop: 20, width: 230, alignSelf: "flex-end" }]}>
      <Text style={[pdfStyles.text, { color: "#D32F2F", fontWeight: 700 }]}>{clinic.name}</Text>
      <Text style={pdfStyles.text}>{clinic.specialty}</Text>
      <Text style={pdfStyles.text}>{clinic.cro}</Text>
      <Text style={[pdfStyles.text, { marginTop: 36, textAlign: "center" }]}>Assinatura</Text>
    </View>
  );
}
