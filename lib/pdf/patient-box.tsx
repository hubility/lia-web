import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { brand } from "./brand";

export type PatientField = { icon: React.ReactNode; label: string; value: string };

export function PatientBox({ fields }: { fields: PatientField[] }) {
  return (
    <View style={s.box}>
      {fields.map((f) => (
        <View key={f.label} style={s.row}>
          <View style={s.icon}>{f.icon}</View>
          <Text style={s.label}>{f.label}</Text>
          <Text style={s.value}>{f.value}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  box: { backgroundColor: brand.boxBg, borderRadius: 10, padding: 14, marginBottom: 18 },
  row: { flexDirection: "row", alignItems: "center", marginVertical: 4 },
  icon: { width: 16, marginRight: 8 },
  label: { fontFamily: brand.font, fontSize: 10.5, color: brand.muted, marginRight: 6 },
  value: { fontFamily: brand.font, fontSize: 10.5, color: brand.ink, fontWeight: 500 },
});
