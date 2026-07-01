import type { ClinicProfile } from "@prisma/client";
import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { brand } from "./brand";
import { IconTooth } from "./icons";

export function SignatureBox({ clinic }: { clinic: ClinicProfile }) {
  return (
    <View style={s.box}>
      <View style={s.top}>
        <View style={s.toothCircle}>
          <IconTooth size={18} color={brand.red} />
        </View>
        <View>
          <Text style={s.name}>{clinic.name}</Text>
          <Text style={s.line}>{clinic.specialty}</Text>
          <Text style={s.line}>{clinic.cro}</Text>
        </View>
      </View>
      <View style={s.sigLine} />
      <Text style={s.assinatura}>Assinatura</Text>
    </View>
  );
}

const s = StyleSheet.create({
  box: {
    width: 230,
    alignSelf: "flex-end",
    backgroundColor: brand.boxBg,
    borderRadius: 10,
    padding: 16,
  },
  top: { flexDirection: "row", alignItems: "center", marginBottom: 22 },
  toothCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: brand.red,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  name: { fontFamily: brand.font, fontWeight: 700, fontSize: 12, color: brand.red },
  line: { fontFamily: brand.font, fontSize: 10, color: brand.ink, marginTop: 2 },
  sigLine: { borderTopWidth: 1, borderTopColor: brand.ink, marginTop: 6 },
  assinatura: { fontFamily: brand.font, fontSize: 10, color: brand.muted, textAlign: "center", marginTop: 4 },
});
